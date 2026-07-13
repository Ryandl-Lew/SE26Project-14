import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#f2f4f6',
      }}
    >
      <Outlet />
    </div>
  );
};

export default AuthLayout;
