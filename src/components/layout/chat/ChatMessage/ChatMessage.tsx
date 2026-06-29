import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import styles from './ChatMessage.module.css';

interface ChatMessageProps {
  message: string;
  role: 'user' | 'ai';
}

export const ChatMessage = ({ message, role }: ChatMessageProps) => {
  const isUser = role === 'user';

  return (
    <div className={`${styles.messageRow} ${isUser ? styles.userRow : styles.aiRow}`}>
      <div className={`${styles.messageBubble} ${isUser ? styles.userBubble : styles.aiBubble}`}>
        {isUser ? (
          <p className={styles.pureText}>{message}</p>
        ) : (
          <Markdown
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');

                return !inline && match ? (
                  <div className={styles.codeBlockContainer}>
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <code className={styles.inlineCode} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {message}
          </Markdown>
        )}
      </div>
    </div>
  );
};