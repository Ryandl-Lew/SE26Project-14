import React from 'react';

type BadgeColor = 'blue' | 'green' | 'amber' | 'red' | 'gray' | 'violet';

interface StatusBadgeProps {
  color?: BadgeColor;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const colorMap: Record<BadgeColor, { color: string; borderColor: string; bg: string }> = {
  gray:   { color: '#5d6b7a', borderColor: '#d5dbe2', bg: '#fafbfc' },
  blue:   { color: '#2f5f8f', borderColor: '#c8d7e6', bg: '#fafbfc' },
  green:  { color: '#23745a', borderColor: '#c5dbd2', bg: '#fafbfc' },
  amber:  { color: '#7a5a18', borderColor: '#dbd3c0', bg: '#fafbfc' },
  red:    { color: '#8f3f3f', borderColor: '#decaca', bg: '#fafbfc' },
  violet: { color: '#59577a', borderColor: '#d2d1df', bg: '#fafbfc' },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ color = 'gray', children, style }) => {
  const c = colorMap[color];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        minHeight: 22,
        padding: '2px 8px',
        borderRadius: 999,
        border: `1px solid ${c.borderColor}`,
        background: c.bg,
        color: c.color,
        fontSize: 11.5,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        letterSpacing: 0.2,
        boxShadow: 'none',
        ...style,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: c.color,
          opacity: 0.82,
          flexShrink: 0,
        }}
      />
      {children}
    </span>
  );
};

export default StatusBadge;
