import React from 'react';
import { Typography, Space } from 'antd';

const { Title, Text } = Typography;

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  extra?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ eyebrow, title, description, extra }) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 20,
        marginBottom: 20,
        flexWrap: 'wrap',
      }}
    >
      <div>
        {eyebrow && (
          <div
            style={{
              color: '#0f6b58',
              fontSize: 11.5,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              marginBottom: 3,
            }}
          >
            {eyebrow}
          </div>
        )}
        <Title level={1} style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: -0.3 }}>
          {title}
        </Title>
        {description && (
          <Text type="secondary" style={{ fontSize: 13.5, marginTop: 4, display: 'block' }}>
            {description}
          </Text>
        )}
      </div>
      {extra && <Space wrap>{extra}</Space>}
    </div>
  );
};

export default PageHeader;
