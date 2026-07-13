import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

const AppLayout: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '248px minmax(0, 1fr)' }}>
      <Sidebar />
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Topbar />
        <main style={{ padding: '24px 26px 42px', flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
