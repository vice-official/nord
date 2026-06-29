import { useChatStore } from '../../../../store/useChatStore.ts';
import styles from './MessageList.module.css';
import { ChatMessage } from '../ChatMessage/ChatMessage.tsx';

export const MessageList = () => {
  const currentChatId = useChatStore((state) => state.currentChatId);
  const messages = useChatStore((state) => state.messages);
  const isLoading = useChatStore((state) => state.isLoading);

  const currentMessages = currentChatId ? messages[currentChatId] ?? [] : [];

  return (
    <div className={styles.messagesListContainer}>
      {currentMessages.map((message) => {
        const isUser = message.sender === 'user';

        return (
          <div
            key={message.id}
            className={`${styles.messageWrapper} ${isUser ? styles.userWrapper : styles.aiWrapper}`}
          >
            <ChatMessage
              message={message.message}
              role={message.sender}
            />
          </div>
        );
      })}

      {isLoading && (
        <div className={styles.loadingBubble}>
          <p className={styles.chatGptLoaderText}>
            Nord думает
          </p>
        </div>
      )}
    </div>
  );
};