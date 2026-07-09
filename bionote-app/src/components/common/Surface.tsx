import React from 'react';
import { Card } from 'antd';

interface SurfaceProps {
  title?: React.ReactNode;
  extra?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
  /** Show a bottom border below the title area */
  showHeaderBorder?: boolean;
}

const Surface: React.FC<SurfaceProps> = ({ title, extra, children, style, bodyStyle, showHeaderBorder = true }) => {
  return (
    <Card
      size="small"
      title={
        title ? (
          <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.1 }}>{title}</span>
        ) : undefined
      }
      extra={extra}
      style={{
        border: '1px solid #d5dbe3',
        borderRadius: 6,
        boxShadow: '0 1px 2px rgba(20,30,40,0.04)',
        ...style,
      }}
      headStyle={
        showHeaderBorder && title
          ? { borderBottom: '1px solid #e4e8ee', padding: '12px 18px', minHeight: 'auto' }
          : { borderBottom: 'none', padding: '12px 18px', minHeight: 'auto' }
      }
      bodyStyle={{ padding: '16px 18px', ...bodyStyle }}
    >
      {children}
    </Card>
  );
};

export default Surface;
