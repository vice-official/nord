import styles from './ChatHeader.module.css'

interface ChatHeaderProps {
  isEmpty: boolean;
  username?: string;
}

export const ChatHeader = ({ isEmpty, username }: ChatHeaderProps) => {

  if (!isEmpty) {
    return null;
  }

  return (
    <div className={styles.chatHeader}>
      <h1 className={styles.chatHeaderHeading}> Привет{username ? `, ${username}` : ``}! С чего начнем?</h1>
    </div>
  );
};