import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Space } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { PAGE_PARENT_MAP } from '@/utils/constants';
import { usePageNavStore } from '@/stores/usePageNavStore';

const PageNavControls: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const getParent = usePageNavStore((s) => s.getParent);
  const getChild = usePageNavStore((s) => s.getChild);

  const path = location.pathname;
  const parentRoute = getParent(path);
  const childRoute = getChild(path);

  return (
    <Space style={{ marginBottom: 10 }}>
      <Button
        size="small"
        icon={<LeftOutlined />}
        disabled={!parentRoute}
        onClick={() => parentRoute && navigate(parentRoute)}
      />
      <Button
        size="small"
        icon={<RightOutlined />}
        disabled={!childRoute}
        onClick={() => childRoute && navigate(childRoute)}
      />
    </Space>
  );
};

export default PageNavControls;
