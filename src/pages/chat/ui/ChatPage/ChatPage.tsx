import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ChatHeader } from '@/widgets/chat-window/ui/ChatHeader/ChatHeader.tsx';
import { MessageList } from '@/widgets/chat-window/ui/MessageList/MessageList.tsx';
import { ChatInput } from '@/features/create-generation/ui/ChatInput/ChatInput.tsx';
import styles from './ChatPage.module.css';
import { useChatStore } from '@/entities/generation';

export const ChatPage = () => {
  const { id } = useParams<{ id: string }>();

  const {
    currentChatId,
    currentStatus,
    globalError,
    artifacts,
    createNewChat,
    openChat,
    stopPolling,
    previewArtifact,
    downloadArtifact
  } = useChatStore();

  const isNewChatPage = !id || id === 'new';

  const progress = currentStatus?.progress.percent ?? 0;
  const currentArtifacts = currentChatId ? artifacts[currentChatId] ?? [] : [];

  useEffect(() => {
    if (isNewChatPage) {
      createNewChat();
      return;
    }

    openChat(id);

    return () => {
      stopPolling();
    };
  }, [id, isNewChatPage, createNewChat, openChat, stopPolling]);

  if (isNewChatPage) {
    return (
      <main className={styles.chatAreaEmpty}>
        <div className={styles.contentContainer}>
          <ChatHeader isEmpty={true} username={'Vice'} />
          <ChatInput className={styles.chatInput} />
          <p className={styles.chatHeaderSubheading}>Индустрия 5.0</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.chatAreaActive}>
      <div className={styles.contentContainer}>
        <div className={styles.topPanel}>
          {currentStatus && (
            <div className={styles.statusCard}>
              <div className={styles.statusHeader}>
                <span className={styles.statusTitle}>Генерация</span>
                <span className={styles.statusValue}>{currentStatus.status}</span>
              </div>

              <div className={styles.statusMeta}>
                <span>{currentStatus.current_stage || 'Инициализация'}</span>
                <span>{progress}%</span>
              </div>

              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {globalError && (
            <div className={styles.errorCard}>
              {globalError.message}
            </div>
          )}

          {currentArtifacts.length > 0 && (
            <div className={styles.artifactsCard}>
              <div className={styles.artifactsTitle}>Артефакты</div>

              <div className={styles.artifactsList}>
                {currentArtifacts.map((artifact) => (
                  <div key={artifact.artifact_id} className={styles.artifactItem}>
                    <div className={styles.artifactInfo}>
                      <span className={styles.artifactName}>{artifact.title}</span>
                      <span className={styles.artifactFormat}>{artifact.format}</span>
                    </div>

                    <div className={styles.artifactActions}>
                      {artifact.preview_available && (
                        <button
                          type="button"
                          className={styles.artifactButton}
                          onClick={() => previewArtifact(artifact.artifact_id)}
                        >
                          Открыть
                        </button>
                      )}

                      {artifact.download_available && (
                        <button
                          type="button"
                          className={styles.artifactButton}
                          onClick={() => downloadArtifact(artifact.artifact_id, artifact.title)}
                        >
                          Скачать
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <MessageList />
        <ChatInput />
      </div>
    </main>
  );
};