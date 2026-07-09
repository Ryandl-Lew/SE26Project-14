import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Select, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';
import CreateMenu from './CreateMenu';

const Topbar: React.FC = () => {
  const navigate = useNavigate();
  const { currentProjectName, projectList, setCurrentProject } = useAppStore();
  const user = useAuthStore((s) => s.user);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        minHeight: 64,
        display: 'grid',
        gridTemplateColumns: 'minmax(220px, 1fr) auto',
        gap: 16,
        alignItems: 'center',
        padding: '10px 24px',
        background: 'rgba(242,244,246,0.92)',
        borderBottom: '1px solid #d5dbe3',
        backdropFilter: 'blur(14px)',
      }}
    >
      {/* Search */}
      <div style={{ maxWidth: 640 }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#94a1af' }} />}
          placeholder="搜索项目、实验记录、模板、成员、附件"
          defaultValue="GFP"
          onPressEnter={() => navigate('/search')}
          style={{ height: 40 }}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Select
          value={currentProjectName}
          onChange={(val) => setCurrentProject(projectList.find((p) => p.name === val)?.id || '')}
          options={projectList.map((p) => ({ label: `当前项目：${p.name}`, value: p.name }))}
          style={{ minWidth: 220 }}
        />
        <CreateMenu />
        {/* Avatar */}
        <div
          title={user?.name}
          style={{
            width: 36,
            height: 36,
            display: 'grid',
            placeItems: 'center',
            borderRadius: '50%',
            color: '#fff',
            background: '#2a6b96',
            fontWeight: 700,
            fontSize: 13,
            flexShrink: 0,
            border: '2px solid rgba(255,255,255,0.8)',
            boxShadow: '0 1px 2px rgba(20,30,40,0.04)',
          }}
        >
          {user?.avatar || '李'}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
