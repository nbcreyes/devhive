import { Routes, Route } from 'react-router-dom';
import ServerSidebar from '@/components/ServerSidebar';
import ChannelSidebar from '@/components/ChannelSidebar';
import UserPanel from '@/components/UserPanel';
import HomePage from '@/pages/HomePage';
import ServerPage from '@/pages/ServerPage';
import ChannelPage from '@/pages/ChannelPage';
import DMPage from '@/pages/DMPage';
import ProfilePage from '@/pages/ProfilePage';
import SettingsPage from '@/pages/SettingsPage';
import KanbanPage from '@/pages/KanbanPage';
import ServerSettingsPage from '@/pages/ServerSettingsPage';

function AppLayout() {
  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <ServerSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/servers/:serverId/*"
              element={
                <div className="flex flex-1 overflow-hidden">
                  <ChannelSidebar />
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <Routes>
                      <Route index element={<ServerPage />} />
                      <Route path="channels/:channelId" element={<ChannelPage />} />
                      <Route path="kanban" element={<KanbanPage />} />
                      <Route path="settings" element={<ServerSettingsPage />} />
                    </Routes>
                  </div>
                </div>
              }
            />
            <Route path="/dms" element={<DMPage />} />
            <Route path="/dms/:userId" element={<DMPage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
        <UserPanel />
      </div>
    </div>
  );
}

export default AppLayout;