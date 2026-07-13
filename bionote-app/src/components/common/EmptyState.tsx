import React from 'react';
import { Empty, Button } from 'antd';

interface EmptyStateProps {
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ description = '暂无数据', actionLabel, onAction }) => {
  return (
    <Empty
      description={<span style={{ color: '#6b7885' }}>{description}</span>}
      style={{ padding: '40px 0' }}
    >
      {actionLabel && onAction && (
        <Button type="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Empty>
  );
};

export default EmptyState;
