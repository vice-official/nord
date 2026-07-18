import styles from './ChatHeader.module.css'

interface ChatHeaderProps {
  isEmpty: boolean;
  username?: string;
}

export const ChatHeader = ({ isEmpty }: ChatHeaderProps) => {

  if (!isEmpty) {
    return null;
  }

  return (
    <div className={styles.chatHeader}>
      <h1 className={styles.chatHeaderHeading}> Zамысел </h1>
      <p className={styles.chatHeaderSubheading}>Мультиагентная система промышленного проектирования.</p>
      <p className={styles.chatHeaderSubheading}>Ваш цифровой промышленный инженер</p>
    </div>
  );
};