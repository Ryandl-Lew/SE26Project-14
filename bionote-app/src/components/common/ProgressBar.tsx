import React from 'react';

interface ProgressBarProps {
  percent: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percent }) => {
  return (
    <div style={{ height: 6, overflow: 'hidden', borderRadius: 999, background: '#e4e9ec' }}>
      <div
        style={{
          height: '100%',
          width: `${percent}%`,
          borderRadius: 'inherit',
          background: 'linear-gradient(90deg, #0f6b58, #1a9e7e)',
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  );
};

export default ProgressBar;
