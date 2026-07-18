import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { Sidebar } from '@/widgets/sidebar/ui/Sidebar/Sidebar.tsx';
import { ChatPage } from '@/pages/chat/ui/ChatPage/ChatPage.tsx';
import { RagPage } from '@/pages/rag';
import { SettingsPage } from '@/pages/settings';
import styles from '../styles/App.module.css';

const AppLayout = () => {
  return (
    <div className={styles.appLayout}>
      <Sidebar />
      <Outlet />
    </div>
  );
};

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: '/',
        element: <ChatPage />,
      },
      {
        path: '/generations/:id',
        element: <ChatPage />,
      },
      {
        path: '/rag/search',
        element: <RagPage />,
      },
      {
        path: '/settings',
        element: <SettingsPage />,
      },
    ],
  },
]);

export const AppRouter = () => <RouterProvider router={router} />;