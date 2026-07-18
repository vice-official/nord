import { create } from 'zustand';
import { apiService, APIError } from '@/shared/api';
import type {
  GenerationListItem,
  FieldError,
  UploadPurpose,
  GenerationStatusResponse,
  ArtifactMeta,
  ArtifactPreviewResponse,
  GenerationDetail,
  GenerationStatus
} from '@/shared/api';

interface IMessage {
  id: string;
  message: string;
  sender: 'user' | 'ai';
  generationId?: string;
}

interface IChatStore {
  chats: GenerationListItem[];
  messages: Record<string, IMessage[]>;
  currentChatId: string | null;
  isNewChatMode: boolean;
  isLoading: boolean;

  currentStatus: GenerationStatusResponse | null;
  currentDetail: GenerationDetail | null;
  pollingIntervalId: number | null;

  artifacts: Record<string, ArtifactMeta[]>;
  artifactPreviews: Record<string, ArtifactPreviewResponse>;

  localChatTitles: Record<string, string>;
  deletedChatIds: string[];
  generationChatMap: Record<string, string>;
  activeGenerationByChatId: Record<string, string>;

  form: {
    projectDescription: string;
    attachedFileId: string | null;
    attachedFileName: string | null;
    attachedFilePurpose: UploadPurpose | null;
    isUploading: boolean;
    fieldErrors: FieldError[];
  };

  globalError: { code: string; message: string; request_id?: string } | null;

  renameChat: (chatId: string, title: string) => void;
  deleteChat: (chatId: string) => void;
  fetchGenerations: () => Promise<void>;
  createNewChat: () => string;
  switchChat: (chatId: string) => void;
  openChat: (chatId: string) => void;
  uploadFile: (file: File, purpose: UploadPurpose) => Promise<void>;
  removeFile: () => void;
  sendMessage: (message: string, modelProfile: string) => Promise<void>;
  clearForm: () => void;
  startPolling: (generationId: string, chatId?: string, resultMessageId?: string) => void;
  stopPolling: () => void;
  loadGenerationResult: (generationId: string, chatId?: string, resultMessageId?: string) => Promise<void>;
  previewArtifact: (artifactId: string) => Promise<void>;
  downloadArtifact: (artifactId: string, fileName?: string) => Promise<void>;
  setAssistantMessage: (chatId: string, message: string, id?: string, generationId?: string) => void;
}

const terminalStatuses: GenerationStatus[] = ['completed', 'failed', 'cancelled', 'timeout'];

const createMessageId = () => {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
};

const getPreviewContent = (preview: ArtifactPreviewResponse) => {
  if ('content' in preview) {
    return preview.content;
  }

  if ('columns' in preview) {
    const header = `| ${preview.columns.join(' | ')} |`;
    const separator = `| ${preview.columns.map(() => '---').join(' | ')} |`;
    const rows = preview.rows.map((row) => `| ${row.join(' | ')} |`).join('\n');

    return `${header}\n${separator}\n${rows}`;
  }

  if ('image_url' in preview) {
    return `![${preview.artifact_id}](${preview.image_url})`;
  }

  return '';
};

const getMainPreview = (
  artifacts: ArtifactMeta[],
  previews: Record<string, ArtifactPreviewResponse>
) => {
  const mainArtifact =
    artifacts.find((artifact) => artifact.kind === 'tz_final') ||
    artifacts.find((artifact) => artifact.kind === 'tth_final') ||
    artifacts.find((artifact) => artifact.format === 'markdown') ||
    artifacts.find((artifact) => artifact.preview_available);

  if (!mainArtifact) {
    return '';
  }

  const preview = previews[mainArtifact.artifact_id];

  if (!preview) {
    return '';
  }

  return getPreviewContent(preview);
};

const buildResultMessage = (
  detail: GenerationDetail,
  artifacts: ArtifactMeta[],
  previews: Record<string, ArtifactPreviewResponse>
) => {
  const parts: string[] = [];
  const mainPreview = getMainPreview(artifacts, previews);

  parts.push(`### ${detail.title || 'Результат генерации'}`);
  parts.push(`Статус: **${detail.status}**`);

  if (detail.current_stage) {
    parts.push(`Этап: **${detail.current_stage}**`);
  }

  if (detail.audit_summary) {
    parts.push(
      [
        `Проверок: **${detail.audit_summary.total}**`,
        `Пройдено: **${detail.audit_summary.approved}**`,
        `На доработку: **${detail.audit_summary.requires_revision}**`,
        `Критичных проблем: **${detail.audit_summary.critical_issues}**`,
      ].join('\n')
    );
  }

  if (detail.errors.length > 0) {
    parts.push(`Ошибки:\n${detail.errors.map((error) => `- ${error}`).join('\n')}`);
  }

  if (detail.warnings.length > 0) {
    parts.push(`Предупреждения:\n${detail.warnings.map((warning) => `- ${warning}`).join('\n')}`);
  }

  if (artifacts.length > 0) {
    parts.push(`Артефакты:\n${artifacts.map((artifact) => `- ${artifact.title} (${artifact.format})`).join('\n')}`);
  }

  if (mainPreview) {
    parts.push(mainPreview);
  }

  return parts.join('\n\n');
};

const mergeArtifacts = (currentArtifacts: ArtifactMeta[], nextArtifacts: ArtifactMeta[]) => {
  const map = new Map<string, ArtifactMeta>();

  currentArtifacts.forEach((artifact) => {
    map.set(artifact.artifact_id, artifact);
  });

  nextArtifacts.forEach((artifact) => {
    map.set(artifact.artifact_id, artifact);
  });

  return Array.from(map.values());
};

export const useChatStore = create<IChatStore>((set, get) => ({
  chats: [],
  messages: {},
  currentChatId: null,
  isNewChatMode: true,
  isLoading: false,

  currentStatus: null,
  currentDetail: null,
  pollingIntervalId: null,

  artifacts: {},
  artifactPreviews: {},

  localChatTitles: {},
  deletedChatIds: [],
  generationChatMap: {},
  activeGenerationByChatId: {},

  form: {
    projectDescription: '',
    attachedFileId: null,
    attachedFileName: null,
    attachedFilePurpose: null,
    isUploading: false,
    fieldErrors: [],
  },

  globalError: null,

  renameChat: (chatId: string, title: string) => {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    set((state) => ({
      localChatTitles: {
        ...state.localChatTitles,
        [chatId]: trimmedTitle
      },
      chats: state.chats.map((chat) =>
        chat.generation_id === chatId
          ? { ...chat, title: trimmedTitle }
          : chat
      )
    }));
  },

  deleteChat: (chatId: string) => {
    const isCurrentChat = get().currentChatId === chatId;

    if (isCurrentChat) {
      get().stopPolling();
    }

    set((state) => {
      const nextMessages = { ...state.messages };
      const nextArtifacts = { ...state.artifacts };
      const nextArtifactPreviews = { ...state.artifactPreviews };
      const nextLocalChatTitles = { ...state.localChatTitles };
      const nextActiveGenerationByChatId = { ...state.activeGenerationByChatId };
      const nextGenerationChatMap = { ...state.generationChatMap };

      const chatArtifacts = state.artifacts[chatId] ?? [];

      chatArtifacts.forEach((artifact) => {
        delete nextArtifactPreviews[artifact.artifact_id];
      });

      Object.entries(nextGenerationChatMap).forEach(([generationId, mappedChatId]) => {
        if (mappedChatId === chatId) {
          delete nextGenerationChatMap[generationId];
        }
      });

      delete nextMessages[chatId];
      delete nextArtifacts[chatId];
      delete nextLocalChatTitles[chatId];
      delete nextActiveGenerationByChatId[chatId];

      return {
        chats: state.chats.filter((chat) => chat.generation_id !== chatId),
        messages: nextMessages,
        artifacts: nextArtifacts,
        artifactPreviews: nextArtifactPreviews,
        localChatTitles: nextLocalChatTitles,
        generationChatMap: nextGenerationChatMap,
        activeGenerationByChatId: nextActiveGenerationByChatId,
        deletedChatIds: [...state.deletedChatIds, chatId],
        currentChatId: isCurrentChat ? null : state.currentChatId,
        isNewChatMode: isCurrentChat ? true : state.isNewChatMode,
        currentStatus: isCurrentChat ? null : state.currentStatus,
        currentDetail: isCurrentChat ? null : state.currentDetail,
        globalError: null
      };
    });
  },

  fetchGenerations: async () => {
    try {
      const data = await apiService.getGenerations();
      const { localChatTitles, deletedChatIds, generationChatMap } = get();

      const nextChats = data.items
        .filter((chat) => !deletedChatIds.includes(chat.generation_id))
        .filter((chat) => {
          const mappedChatId = generationChatMap[chat.generation_id];

          return !mappedChatId || mappedChatId === chat.generation_id;
        })
        .map((chat) => ({
          ...chat,
          title: localChatTitles[chat.generation_id] || chat.title
        }));

      set((state) => {
        const localChats = state.chats.filter((chat) =>
          !nextChats.some((nextChat) => nextChat.generation_id === chat.generation_id)
        );

        return {
          chats: [...nextChats, ...localChats]
        };
      });
    } catch {
      set({
        globalError: {
          code: 'GENERATIONS_LOAD_ERROR',
          message: 'Не удалось загрузить список генераций'
        }
      });
    }
  },

  createNewChat: () => {
    get().stopPolling();
    get().clearForm();

    set({
      currentChatId: null,
      isNewChatMode: true,
      currentStatus: null,
      currentDetail: null,
      globalError: null
    });

    return 'new';
  },

  switchChat: (chatId: string) => {
    get().openChat(chatId);
  },

  openChat: (chatId: string) => {
    get().stopPolling();

    set((state) => ({
      currentChatId: chatId,
      isNewChatMode: false,
      currentStatus: null,
      currentDetail: null,
      globalError: null,
      messages: {
        ...state.messages,
        [chatId]: state.messages[chatId] ?? []
      }
    }));

    const activeGenerationId = get().activeGenerationByChatId[chatId];
    const currentMessages = get().messages[chatId] ?? [];

    if (activeGenerationId) {
      get().startPolling(activeGenerationId, chatId, `result-${activeGenerationId}`);
      return;
    }

    if (currentMessages.length === 0) {
      void get().loadGenerationResult(chatId, chatId, `result-${chatId}`);
    }
  },

  startPolling: (generationId: string, chatId = generationId, resultMessageId = `result-${generationId}`) => {
    get().stopPolling();

    set((state) => ({
      currentChatId: chatId,
      isNewChatMode: false,
      activeGenerationByChatId: {
        ...state.activeGenerationByChatId,
        [chatId]: generationId
      },
      generationChatMap: {
        ...state.generationChatMap,
        [generationId]: chatId
      },
      messages: {
        ...state.messages,
        [chatId]: state.messages[chatId] ?? []
      }
    }));

    const poll = async () => {
      if (!get().pollingIntervalId) return;

      try {
        const statusData = await apiService.getGenerationStatus(generationId);

        if (!get().pollingIntervalId) return;

        set((state) => ({
          currentStatus: state.currentChatId === chatId ? statusData : state.currentStatus,
          chats: state.chats.map((chat) =>
            chat.generation_id === chatId
              ? {
                ...chat,
                status: statusData.status,
                current_stage: statusData.current_stage,
                updated_at: statusData.updated_at
              }
              : chat
          )
        }));

        if (terminalStatuses.includes(statusData.status)) {
          get().stopPolling();

          set((state) => {
            const nextActiveGenerationByChatId = { ...state.activeGenerationByChatId };
            delete nextActiveGenerationByChatId[chatId];

            return {
              activeGenerationByChatId: nextActiveGenerationByChatId
            };
          });

          await get().loadGenerationResult(generationId, chatId, resultMessageId);
          await get().fetchGenerations();
        } else {
          const nextTimeoutId = window.setTimeout(poll, 3000);
          set({ pollingIntervalId: nextTimeoutId });
        }
      } catch {
        get().stopPolling();

        set({
          globalError: {
            code: 'POLLING_ERROR',
            message: 'Не удалось получить статус генерации'
          }
        });
      }
    };

    const initialTimeoutId = window.setTimeout(poll, 0);
    set({ pollingIntervalId: initialTimeoutId });
  },

  stopPolling: () => {
    const { pollingIntervalId } = get();

    if (pollingIntervalId) {
      window.clearTimeout(pollingIntervalId);
      set({ pollingIntervalId: null });
    }
  },

  uploadFile: async (file, purpose) => {
    set((state) => ({
      form: {
        ...state.form,
        isUploading: true,
        fieldErrors: []
      },
      globalError: null
    }));

    try {
      const res = await apiService.uploadFile(file, purpose);

      set((state) => ({
        form: {
          ...state.form,
          attachedFileId: res.file_id,
          attachedFileName: file.name,
          attachedFilePurpose: purpose,
          isUploading: false,
        },
      }));
    } catch (error) {
      let finalErrors: FieldError[] = [];

      if (error instanceof APIError && error.response?.field_errors) {
        finalErrors = error.response.field_errors;
      }

      set((state) => ({
        form: {
          ...state.form,
          isUploading: false,
          fieldErrors: finalErrors
        },
        globalError: finalErrors.length > 0
          ? null
          : {
            code: 'UPLOAD_ERROR',
            message: 'Не удалось загрузить файл'
          }
      }));
    }
  },

  removeFile: () => {
    set((state) => ({
      form: {
        ...state.form,
        attachedFileId: null,
        attachedFileName: null,
        attachedFilePurpose: null,
        fieldErrors: [],
      }
    }));
  },

  clearForm: () => set({
    form: {
      projectDescription: '',
      attachedFileId: null,
      attachedFileName: null,
      attachedFilePurpose: null,
      isUploading: false,
      fieldErrors: [],
    },
    globalError: null
  }),

  sendMessage: async (text: string, modelProfile: string) => {
    const trimmedText = text.trim();
    const attachedFileName = get().form.attachedFileName;
    const attachedFileId = get().form.attachedFileId;
    const attachedFilePurpose = get().form.attachedFilePurpose;
    const currentChatId = get().currentChatId;
    const isNewChatMode = get().isNewChatMode;

    set({
      globalError: null,
      isLoading: true
    });

    const requestData = {
      project_description: trimmedText || null,
      project_description_file_id: attachedFilePurpose === 'project_description' ? attachedFileId : null,
      image_input_file_id: attachedFilePurpose === 'image_input' ? attachedFileId : null,
      llm_profile: modelProfile,
      image_enabled: attachedFilePurpose === 'image_input',
      client_metadata: {
        title: trimmedText.slice(0, 80) || attachedFileName || 'Новая генерация'
      }
    };

    try {
      const response = await apiService.createGeneration(requestData);
      const generationId = response.generation_id;
      const chatId = isNewChatMode ? generationId : currentChatId || generationId;
      const resultMessageId = `result-${generationId}`;

      const userMessage = trimmedText || `${attachedFilePurpose === 'image_input' ? 'Фото' : 'Файл'}: ${attachedFileName}`;
      const aiMessage = 'Генерация запущена. Ожидаю результат...';

      set((state) => {
        const previousMessages = state.messages[chatId] ?? [];
        const currentChat = state.chats.find((chat) => chat.generation_id === chatId);
        const isNewChat = !currentChat;

        const newChat: GenerationListItem = {
          generation_id: chatId,
          run_id: response.run_id,
          title: trimmedText.slice(0, 80) || attachedFileName || 'Новая генерация',
          status: response.status,
          current_stage: 'created',
          created_at: response.created_at,
          updated_at: response.created_at,
          duration_seconds: null,
          artifacts_count: 0,
          errors_count: 0,
          warnings_count: 0,
          image_success: null
        };

        return {
          currentChatId: chatId,
          isNewChatMode: false,
          isLoading: false,
          currentStatus: {
            generation_id: generationId,
            status: response.status,
            current_stage: 'created',
            progress: {
              percent: 0,
              completed_steps: 0,
              total_steps: null
            },
            updated_at: response.created_at,
            errors: [],
            warnings: []
          },
          generationChatMap: {
            ...state.generationChatMap,
            [generationId]: chatId
          },
          activeGenerationByChatId: {
            ...state.activeGenerationByChatId,
            [chatId]: generationId
          },
          chats: isNewChat
            ? [newChat, ...state.chats]
            : state.chats.map((chat) =>
              chat.generation_id === chatId
                ? {
                  ...chat,
                  status: response.status,
                  current_stage: 'created',
                  updated_at: response.created_at
                }
                : chat
            ),
          messages: {
            ...state.messages,
            [chatId]: [
              ...previousMessages,
              {
                id: createMessageId(),
                message: userMessage,
                sender: 'user',
                generationId
              },
              {
                id: resultMessageId,
                message: aiMessage,
                sender: 'ai',
                generationId
              }
            ]
          }
        };
      });

      get().clearForm();
      get().startPolling(generationId, chatId, resultMessageId);
    } catch (error) {
      set({ isLoading: false });

      if (error instanceof APIError) {
        if (error.response?.field_errors) {
          set((state) => ({
            form: {
              ...state.form,
              fieldErrors: error.response?.field_errors || []
            }
          }));
        } else {
          set({
            globalError: {
              code: error.response?.code || 'SERVER_ERROR',
              message: error.response?.message || 'Ошибка запуска генерации',
              request_id: error.response?.request_id
            }
          });
        }
      } else {
        set({
          globalError: {
            code: 'UNKNOWN_ERROR',
            message: 'Произошла непредвиденная ошибка при отправке'
          }
        });
      }

      throw error;
    }
  },

  loadGenerationResult: async (
    generationId: string,
    chatId = generationId,
    resultMessageId = `result-${generationId}`
  ) => {
    try {
      const [detail, artifactsData] = await Promise.all([
        apiService.getGenerationDetails(generationId),
        apiService.getGenerationArtifacts(generationId)
      ]);

      const previewResults = await Promise.all(
        artifactsData.items
          .filter((artifact) => artifact.preview_available)
          .map(async (artifact) => {
            try {
              const preview = await apiService.getArtifactPreview(artifact.artifact_id);
              return [artifact.artifact_id, preview] as const;
            } catch {
              return null;
            }
          })
      );

      const previews = previewResults.reduce<Record<string, ArtifactPreviewResponse>>((acc, item) => {
        if (item) {
          acc[item[0]] = item[1];
        }

        return acc;
      }, {});

      set((state) => {
        const currentMessages = state.messages[chatId] ?? [];
        const hasUserMessage = currentMessages.some((message) => message.sender === 'user');
        const currentChatArtifacts = state.artifacts[chatId] ?? [];
        const mergedArtifacts = mergeArtifacts(currentChatArtifacts, artifactsData.items);

        return {
          currentDetail: state.currentChatId === chatId ? detail : state.currentDetail,
          artifacts: {
            ...state.artifacts,
            [chatId]: mergedArtifacts
          },
          artifactPreviews: {
            ...state.artifactPreviews,
            ...previews
          },
          chats: state.chats.map((chat) =>
            chat.generation_id === chatId
              ? {
                ...chat,
                status: detail.status,
                current_stage: detail.current_stage,
                updated_at: detail.finished_at || detail.created_at,
                artifacts_count: mergedArtifacts.length,
                errors_count: detail.errors.length,
                warnings_count: detail.warnings.length
              }
              : chat
          ),
          messages: {
            ...state.messages,
            [chatId]: hasUserMessage
              ? currentMessages
              : [
                {
                  id: `user-${generationId}`,
                  message: detail.project_description_preview || detail.title || 'Открытая генерация',
                  sender: 'user',
                  generationId
                },
                ...currentMessages
              ]
          }
        };
      });

      get().setAssistantMessage(
        chatId,
        buildResultMessage(detail, artifactsData.items, previews),
        resultMessageId,
        generationId
      );
    } catch {
      set({
        globalError: {
          code: 'GENERATION_RESULT_ERROR',
          message: 'Не удалось загрузить результат генерации'
        }
      });
    }
  },

  previewArtifact: async (artifactId: string) => {
    const currentChatId = get().currentChatId;

    if (!currentChatId) {
      return;
    }

    try {
      const preview = await apiService.getArtifactPreview(artifactId);
      const content = getPreviewContent(preview);

      set((state) => ({
        artifactPreviews: {
          ...state.artifactPreviews,
          [artifactId]: preview
        }
      }));

      if (content) {
        get().setAssistantMessage(currentChatId, content, `preview-${artifactId}`);
      }
    } catch {
      set({
        globalError: {
          code: 'ARTIFACT_PREVIEW_ERROR',
          message: 'Не удалось открыть предпросмотр артефакта'
        }
      });
    }
  },

  downloadArtifact: async (artifactId: string, fileName?: string) => {
    try {
      const blob = await apiService.downloadArtifact(artifactId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = fileName || artifactId;
      link.click();

      URL.revokeObjectURL(url);
    } catch {
      set({
        globalError: {
          code: 'ARTIFACT_DOWNLOAD_ERROR',
          message: 'Не удалось скачать артефакт'
        }
      });
    }
  },

  setAssistantMessage: (
    chatId: string,
    message: string,
    id = `result-${chatId}`,
    generationId?: string
  ) => {
    set((state) => {
      const currentMessages = state.messages[chatId] ?? [];
      const hasMessage = currentMessages.some((item) => item.id === id);

      return {
        messages: {
          ...state.messages,
          [chatId]: hasMessage
            ? currentMessages.map((item) =>
              item.id === id
                ? { ...item, message, generationId: generationId || item.generationId }
                : item
            )
            : [
              ...currentMessages,
              {
                id,
                message,
                sender: 'ai',
                generationId
              }
            ]
        }
      };
    });
  },
}));