import styles from './App.module.css';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar/Sidebar.tsx';
import { ChatArea } from './components/layout/chat/ChatArea/ChatArea';

function AppLayout() {
  return (
    <div className={styles.appLayout}>
      <Sidebar />
      <Outlet />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<ChatArea />} />
          <Route path="/generations/new" element={<ChatArea />} />
          <Route path="/generations/:id" element={<ChatArea />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;