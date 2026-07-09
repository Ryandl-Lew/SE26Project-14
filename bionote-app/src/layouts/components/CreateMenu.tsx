import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const CreateMenu: React.FC = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const jump = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(!open)}>
        新建
      </Button>
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 6px)',
            zIndex: 50,
            width: 186,
            padding: 5,
            border: '1px solid #d5dbe3',
            borderRadius: 6,
            background: '#fff',
            boxShadow: '0 4px 16px rgba(20,30,40,0.09)',
            display: 'grid',
            gap: 2,
          }}
        >
          {[
            { label: '新建项目', path: '/projects' },
            { label: '新建实验记录', path: '/records/1/edit' },
            { label: '新建模板', path: '/templates' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => jump(item.path)}
              style={{
                width: '100%',
                minHeight: 34,
                padding: '0 10px',
                border: 0,
                borderRadius: 4,
                color: '#1a2128',
                background: 'transparent',
                textAlign: 'left',
                fontSize: 13,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#0f6b58';
                e.currentTarget.style.background = '#e6f4f0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#1a2128';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CreateMenu;
