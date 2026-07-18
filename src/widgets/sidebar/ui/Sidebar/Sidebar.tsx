import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.css';
import { AppIcon } from '@/shared/assets/icons/AppIcon.tsx';
import { ExpandIcon } from '@/shared/assets/icons/ExpandIcon.tsx';
import { AddNewChatIcon } from '@/shared/assets/icons/AddNewChatIcon.tsx';
import { SidebarItem } from '@/entities/generation/ui/SidebarItem/SidebarItem.tsx';
import { useSidebarStore } from '../../../../entities/generation/model/useSidebarStore.ts';
import { useChatStore } from '../../../../entities/generation/model/useChatStore.ts';
import { SearchIcon } from '@/shared/assets/icons/SearchIcon.tsx';
import { SettingsIcon } from '@/shared/assets/icons/SettingsIcon.tsx'; // Предполагаем наличие иконки настроек

const generatingStatuses = ['queued', 'running', 'cancelling'];

export const Sidebar = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { pathname } = useLocation(); // Отслеживаем текущий URL для подсветки активных разделов

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const isSidebarOpen = useSidebarStore((state) => state.isSidebarOpen);
  const toggleSidebar = useSidebarStore((state) => state.toggleSidebar);

  const chats = useChatStore((state) => state.chats);
  const currentChatId = useChatStore((state) => state.currentChatId);
  const currentStatus = useChatStore((state) => state.currentStatus);
  const createNewChat = useChatStore((state) => state.createNewChat);
  const switchChat = useChatStore((state) => state.switchChat);
  const fetchGenerations = useChatStore((state) => state.fetchGenerations);
  const renameChat = useChatStore((state) => state.renameChat);
  const deleteChat = useChatStore((state) => state.deleteChat);

  const filteredChats = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return chats;

    return chats.filter((chat) => {
      const title = chat.title || `Проект ${chat.generation_id.slice(0, 8)}`;
      return title.toLowerCase().includes(query);
    });
  }, [chats, searchValue]);

  useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  useEffect(() => {
    if (!id || id === 'new') return;
    if (id !== currentChatId) {
      switchChat(id);
    }
  }, [id, currentChatId, switchChat]);

  const handleNewChatClick = () => {
    createNewChat();
    setSearchValue('');
    navigate('/generations/new');
  };

  const handleSearchClick = () => {
    if (!isSidebarOpen) toggleSidebar();
    setIsSearchOpen((value) => !value);
  };

  const handleChatSelect = (generationId: string) => {
    switchChat(generationId);
    navigate(`/generations/${generationId}`);
  };

  const handleChatDelete = (generationId: string) => {
    deleteChat(generationId);
    if (generationId === id) {
      navigate('/generations/new');
    }
  };

  const isChatGenerating = (generationId: string, chatStatus: string) => {
    if (generationId === currentChatId && currentStatus) {
      return generatingStatuses.includes(currentStatus.status);
    }
    return generatingStatuses.includes(chatStatus);
  };

  return (
    <aside className={`${styles.sidebar} ${!isSidebarOpen ? styles.closedSidebar : ''}`}>
      <div className={styles.sidebarToggleContainer}>
        <a
          href="/generations/new"
          className={styles.logoLink}
          onClick={(e) => {
            e.preventDefault();
            handleNewChatClick();
          }}
        >
          <AppIcon className={styles.logoIcon} />
        </a>

        <button className={styles.sidebarToggleButton} onClick={toggleSidebar}>
          <ExpandIcon className={styles.sidebarToggleButtonIcon} />
        </button>
      </div>

      {/* Быстрые действия чата */}
      <ul className={styles.sidebarTopActions}>
        <li className={styles.sidebarTopActionsItem}>
          <SidebarItem
            label="New chat"
            icon={<AddNewChatIcon className={styles.addNewChatIcon} />}
            isActive={pathname === '/' || pathname === '/generations/new' || (!!id && pathname.includes('/generations/'))}
            onClick={handleNewChatClick}
          />

          <SidebarItem
            label="Search"
            icon={<SearchIcon className={styles.addNewChatIcon} />}
            isActive={isSearchOpen}
            onClick={handleSearchClick}
          />

          {isSearchOpen && isSidebarOpen && (
            <div className={styles.searchBox}>
              <SearchIcon className={styles.searchBoxIcon} />
              <input
                className={styles.searchInput}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search chats"
                autoFocus
              />
              {searchValue && (
                <button
                  type="button"
                  className={styles.searchClearButton}
                  onClick={() => setSearchValue('')}
                >
                  ×
                </button>
              )}
            </div>
          )}
        </li>
      </ul>

      <div className={styles.recentChats}>
        <button className={styles.recentChatsButton}>
          <p className={styles.recentChatsButtonLabel}>Recents</p>
        </button>

        <ul className={styles.recentChatsList}>
          {filteredChats.map((chat) => {
            const title = chat.title || `Проект ${chat.generation_id.slice(0, 8)}`;

            return (
              <li key={chat.generation_id} className={styles.recentChatsListItem}>
                <SidebarItem
                  label={title}
                  isActive={chat.generation_id === id}
                  isGenerating={isChatGenerating(chat.generation_id, chat.status)}
                  canEdit={isSidebarOpen}
                  onClick={() => handleChatSelect(chat.generation_id)}
                  onRename={(newTitle) => renameChat(chat.generation_id, newTitle)}
                  onDelete={() => handleChatDelete(chat.generation_id)}
                />
              </li>
            );
          })}
        </ul>
      </div>

      <div className={styles.sidebarBottomActions}>
        <SidebarItem
          label="RAG Поиск"
          icon={<SearchIcon className={styles.addNewChatIcon} />}
          isActive={pathname === '/rag/search'}
          onClick={() => navigate('/rag/search')}
        />
        <SidebarItem
          label="Настройки"
          icon={<SettingsIcon className={styles.addNewChatIcon} />}
          isActive={pathname === '/settings'}
          onClick={() => navigate('/settings')}
        />
      </div>
    </aside>
  );
};