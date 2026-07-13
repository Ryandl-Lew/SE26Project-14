import React from 'react';
import { Card } from 'antd';

interface StatCardProps {
  label: string;
  value: string | number;
  note?: string;
  icon?: string;
  accentColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, note, icon, accentColor = '#0f6b58' }) => {
  return (
    <Card
      size="small"
      style={{
        border: '1px solid #d5dbe3',
        borderRadius: 6,
        boxShadow: '0 1px 2px rgba(20,30,40,0.04)',
        position: 'relative',
        overflow: 'hidden',
      }}
      bodyStyle={{ padding: '15px 16px' }}
    >
      {/* Top accent bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: accentColor,
          opacity: 0.5,
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ color: '#6b7885', fontSize: 12.5 }}>{label}</span>
        {icon && (
          <span
            style={{
              width: 30,
              height: 30,
              display: 'inline-grid',
              placeItems: 'center',
              borderRadius: 4,
              background: '#f0f8f5',
              color: '#0f6b58',
              fontSize: 14,
            }}
          >
            {icon}
          </span>
        )}
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1, color: '#1a2128', lineHeight: 1, marginTop: 6 }}>
        {value}
      </div>
      {note && <div style={{ color: '#6b7885', fontSize: 11.5, marginTop: 6 }}>{note}</div>}
    </Card>
  );
};

export default StatCard;
