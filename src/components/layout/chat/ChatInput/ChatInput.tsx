import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ChatInput.module.css';
import { PlusIcon } from '../../../../assets/icons/PlusIcon.tsx';
import { MicrophoneIcon } from '../../../../assets/icons/MicrophoneIcon.tsx';
import { SendIcon } from '../../../../assets/icons/SendIcon.tsx';
import { useChatStore } from '../../../../store/useChatStore.ts';
import { apiService } from '../../../../api/client.ts';
import { Dropdown } from '../../../ui/Dropdown/Dropdown';

interface ChatInputProps {
  className?: string;
}

type ProfileItem = string | { id?: string; name?: string; label?: string };

type ExtendedSettings = {
  llm_profiles?: ProfileItem[];
  profiles?: ProfileItem[];
};

export const ChatInput = ({ className }: ChatInputProps) => {
  const navigate = useNavigate();

  const inputRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const hasExpandedOnceRef = useRef(false);

  const [dropdownOptions, setDropdownOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [hasText, setHasText] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [attachedFilePreview, setAttachedFilePreview] = useState<string | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const {
    uploadFile,
    removeFile,
    sendMessage,
    form,
    globalError,
    isLoading
  } = useChatStore();

  useEffect(() => {
    apiService
      .getSettings()
      .then((settings) => {
        const defaultProfile =
          (settings.defaults?.llm_profile as string) || 'qwen_36_27b_q4_xl';

        const extendedSettings = settings as typeof settings & ExtendedSettings;

        const profiles = Array.isArray(extendedSettings.llm_profiles)
          ? extendedSettings.llm_profiles
          : Array.isArray(extendedSettings.profiles)
            ? extendedSettings.profiles
            : [];

        const options =
          profiles.length > 0
            ? profiles.map((profile) => {
              if (typeof profile === 'string') {
                return { value: profile, label: profile };
              }

              const value = profile.id || profile.name || profile.label || defaultProfile;

              return {
                value,
                label: profile.label || profile.name || value,
              };
            })
            : [{ value: defaultProfile, label: 'Vice (qwen_36_27b_q4_xl)' }];

        setSelectedModel(defaultProfile);
        setDropdownOptions(options);
      })
      .catch(() => {
        const fallbackProfile = 'qwen_36_27b_q4_xl';

        setSelectedModel(fallbackProfile);
        setDropdownOptions([{ value: fallbackProfile, label: 'Vice (qwen_36_27b_q4_xl)' }]);
      });
  }, []);

  useEffect(() => {
    return () => {
      if (attachedFilePreview) {
        URL.revokeObjectURL(attachedFilePreview);
      }

      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [attachedFilePreview]);

  const updateInputState = () => {
    const element = inputRef.current;

    if (!element) {
      return;
    }

    const text = element.innerText || '';
    const hasValue = text.trim().length > 0;

    setHasText(hasValue);

    if (!hasValue) {
      hasExpandedOnceRef.current = false;
      setIsExpanded(false);
      return;
    }

    if (hasExpandedOnceRef.current) {
      setIsExpanded(true);
      return;
    }

    const computedStyle = window.getComputedStyle(element);
    const lineHeight = Number.parseFloat(computedStyle.lineHeight);
    const paddingTop = Number.parseFloat(computedStyle.paddingTop);
    const paddingBottom = Number.parseFloat(computedStyle.paddingBottom);

    const oneLineHeight = lineHeight + paddingTop + paddingBottom;
    const hasLineBreak = text.includes('\n');
    const isTextWrapped = element.scrollHeight > oneLineHeight + 2;

    if (hasLineBreak || isTextWrapped) {
      hasExpandedOnceRef.current = true;
      setIsExpanded(true);
    }
  };

  const insertText = (value: string) => {
    const selection = window.getSelection();

    if (!selection || !inputRef.current) {
      return;
    }

    if (!inputRef.current.contains(selection.anchorNode)) {
      inputRef.current.focus();
    }

    document.execCommand('insertText', false, value);

    requestAnimationFrame(updateInputState);
  };

  const updateInputText = (value: string) => {
    if (!inputRef.current) {
      return;
    }

    inputRef.current.innerText = value;
    inputRef.current.focus();

    const range = document.createRange();
    const selection = window.getSelection();

    range.selectNodeContents(inputRef.current);
    range.collapse(false);

    selection?.removeAllRanges();
    selection?.addRange(range);

    requestAnimationFrame(updateInputState);
  };

  const appendInputText = (value: string) => {
    const currentText = inputRef.current?.innerText || '';
    const separator = currentText.trim() ? ' ' : '';

    updateInputText(`${currentText}${separator}${value}`);
  };

  const attachFile = async (file: File) => {
    if (attachedFilePreview) {
      URL.revokeObjectURL(attachedFilePreview);
      setAttachedFilePreview(null);
    }

    const isImage = file.type.startsWith('image/');

    if (isImage) {
      setAttachedFilePreview(URL.createObjectURL(file));
    }

    await uploadFile(file, isImage ? 'image_input' : 'project_description');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    await attachFile(file);
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((item) => item.type.startsWith('image/'));

    if (imageItem) {
      e.preventDefault();

      const file = imageItem.getAsFile();

      if (!file) {
        return;
      }

      const imageFile = new File(
        [file],
        `clipboard-image-${Date.now()}.${file.type.split('/')[1] || 'png'}`,
        { type: file.type }
      );

      await attachFile(imageFile);

      return;
    }

    const text = e.clipboardData.getData('text/plain');

    if (text) {
      e.preventDefault();
      insertText(text);
    }
  };

  const handleRemoveFile = () => {
    if (attachedFilePreview) {
      URL.revokeObjectURL(attachedFilePreview);
      setAttachedFilePreview(null);
    }

    removeFile();
  };

  const handleInput = () => {
    requestAnimationFrame(updateInputState);
  };

  const handleVoiceInput = () => {
    setVoiceError(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError('Браузер не поддерживает голосовой ввод');
      return;
    }

    if (isVoiceActive && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsVoiceActive(false);
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = 'ru-RU';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsVoiceActive(true);
    };

    recognition.onend = () => {
      setIsVoiceActive(false);
    };

    recognition.onerror = () => {
      setIsVoiceActive(false);
      setVoiceError('Не удалось распознать голос');
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join(' ')
        .trim();

      if (transcript) {
        appendInputText(transcript);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const description = inputRef.current?.innerText || '';

    if ((!description.trim() && !form.attachedFileId) || form.isUploading || isLoading) {
      return;
    }

    await sendMessage(description, selectedModel);

    if (inputRef.current) {
      inputRef.current.innerText = '';
    }

    if (attachedFilePreview) {
      URL.revokeObjectURL(attachedFilePreview);
      setAttachedFilePreview(null);
    }

    setHasText(false);
    setIsExpanded(false);
    hasExpandedOnceRef.current = false;

    const newChatId = useChatStore.getState().currentChatId;

    if (newChatId) {
      navigate(`/generations/${newChatId}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      const formElement = inputRef.current?.closest('form');

      if (formElement) {
        formElement.requestSubmit();
      }
    }
  };

  const canSend = (hasText || !!form.attachedFileId) && !form.isUploading && !isLoading;

  return (
    <div className={`${styles.containerWrapper} ${className || ''}`}>
      {(globalError || voiceError || form.fieldErrors.length > 0) && (
        <div className={styles.errorArea}>
          {globalError && <span className={styles.errorText}>{globalError.message}</span>}
          {voiceError && <span className={styles.errorText}>{voiceError}</span>}

          {form.fieldErrors.map((error) => (
            <span key={`${error.field}-${error.code}`} className={styles.errorText}>
              {error.message}
            </span>
          ))}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className={`${styles.inputContainer} ${isExpanded ? styles.expandedInput : ''}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          className={styles.fileInput}
          onChange={handleFileChange}
          accept=".md,.txt,.json,.pdf,.docx,image/*"
        />

        {(form.isUploading || form.attachedFileName) && (
          <div className={styles.filePreviewArea}>
            {form.isUploading && (
              <div className={styles.fileUploading}>
                Загрузка файла...
              </div>
            )}

            {form.attachedFileName && (
              <div className={styles.fileCard}>
                {attachedFilePreview ? (
                  <img
                    className={styles.fileImage}
                    src={attachedFilePreview}
                    alt={form.attachedFileName}
                  />
                ) : (
                  <div className={styles.fileIcon}>📎</div>
                )}

                <div className={styles.fileInfo}>
                  <span className={styles.fileName}>{form.attachedFileName}</span>
                  <span className={styles.fileType}>
                    {attachedFilePreview ? 'Фото' : 'Файл'}
                  </span>
                </div>

                <button
                  type="button"
                  className={styles.removeFileButton}
                  onClick={handleRemoveFile}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        )}

        <div className={styles.inputBody}>
          <div className={styles.leftActions}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => fileInputRef.current?.click()}
              disabled={form.isUploading || isLoading}
            >
              <PlusIcon />
            </button>
          </div>

          <div className={styles.inputWrapper}>
            <div
              className={styles.inputField}
              ref={inputRef}
              data-placeholder="Опишите ваш проект для генерации ТЗ..."
              contentEditable={!isLoading}
              role="textbox"
              onInput={handleInput}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className={styles.rightActions}>
            <Dropdown
              className={styles.modelDropdown}
              options={dropdownOptions}
              value={selectedModel}
              onChange={setSelectedModel}
              placeholder="Модель"
            />

            {canSend ? (
              <button type="submit" className={styles.sendButton}>
                <SendIcon />
              </button>
            ) : (
              <button
                type="button"
                className={`${styles.iconButton} ${isVoiceActive ? styles.voiceActive : ''}`}
                onClick={handleVoiceInput}
                disabled={isLoading}
              >
                <MicrophoneIcon />
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};