import { useEffect, useRef, useState } from 'react';
import styles from './SidebarItem.module.css';
import { EditIcon } from '../../../../assets/icons/EditIcon.tsx';
import { DeleteIcon } from '../../../../assets/icons/DeleteIcon.tsx';

interface SidebarItemProps {
  label: string;
  icon?: React.ReactNode;
  isActive: boolean;
  isGenerating?: boolean;
  canEdit?: boolean;
  onClick?: () => void;
  onRename?: (title: string) => void;
  onDelete?: () => void;
  disabled?: boolean;
}

export const SidebarItem = ({
                              label,
                              icon,
                              isActive,
                              isGenerating,
                              canEdit,
                              onClick,
                              onRename,
                              onDelete,
                              disabled
                            }: SidebarItemProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(label);

  useEffect(() => {
    setTitleValue(label);
  }, [label]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleEditClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onDelete?.();
  };

  const finishEditing = () => {
    const trimmedTitle = titleValue.trim();

    if (trimmedTitle && trimmedTitle !== label) {
      onRename?.(trimmedTitle);
    }

    if (!trimmedTitle) {
      setTitleValue(label);
    }

    setIsEditing(false);
  };

  const cancelEditing = () => {
    setTitleValue(label);
    setIsEditing(false);
  };

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      finishEditing();
    }

    if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  return (
    <div
      className={`
        ${styles.sidebarItem}
        ${isActive ? styles.active : ''}
        ${isGenerating ? styles.generating : ''}
        ${disabled ? styles.disabled : ''}
      `}
    >
      <button
        className={styles.sidebarItemButton}
        onClick={onClick}
        disabled={disabled || isEditing}
      >
        {icon && <span className={styles.icon}>{icon}</span>}

        {isEditing ? (
          <input
            ref={inputRef}
            className={styles.editInput}
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onClick={handleInputClick}
            onBlur={finishEditing}
            onKeyDown={handleInputKeyDown}
          />
        ) : (
          <p className={styles.sidebarItemButtonLabel}>{label}</p>
        )}

        {isGenerating && <span className={styles.generatingDot} />}
      </button>

      {canEdit && !isEditing && (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.actionButton}
            onClick={handleEditClick}
            aria-label="Редактировать чат"
          >
            <EditIcon />
          </button>

          <button
            type="button"
            className={styles.actionButton}
            onClick={handleDeleteClick}
            aria-label="Удалить чат"
          >
            <DeleteIcon />
          </button>
        </div>
      )}
    </div>
  );
};

export default SidebarItem;