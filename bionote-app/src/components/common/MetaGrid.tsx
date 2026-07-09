import React from 'react';
import { Row, Col } from 'antd';

interface MetaItem {
  label: string;
  value: React.ReactNode;
}

interface MetaGridProps {
  items: MetaItem[];
  columns?: number;
}

const MetaGrid: React.FC<MetaGridProps> = ({ items, columns = 4 }) => {
  return (
    <Row gutter={[8, 8]} style={{ marginTop: 12 }}>
      {items.map((item, i) => (
        <Col span={24 / columns} key={i}>
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 4,
              background: '#f8f9fb',
              border: '1px solid #e4e8ee',
            }}
          >
            <span
              style={{
                display: 'block',
                color: '#6b7885',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.3,
              }}
            >
              {item.label}
            </span>
            <strong style={{ display: 'block', marginTop: 3, fontSize: 14 }}>
              {item.value}
            </strong>
          </div>
        </Col>
      ))}
    </Row>
  );
};

export default MetaGrid;
