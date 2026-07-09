import React from 'react';
import { Input, Select, Space } from 'antd';

interface FilterOption {
  placeholder?: string;
  value?: string;
  options: { label: string; value: string }[];
}

interface FiltersBarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: FilterOption[];
  style?: React.CSSProperties;
}

const FiltersBar: React.FC<FiltersBarProps> = ({ searchPlaceholder, searchValue, onSearchChange, filters, style }) => {
  return (
    <Space wrap style={{ marginBottom: 14, ...style }}>
      {searchPlaceholder && (
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          style={{ minWidth: 280, flex: 1 }}
        />
      )}
      {filters?.map((f, i) => (
        <Select
          key={i}
          placeholder={f.placeholder}
          value={f.value || undefined}
          options={f.options}
          style={{ minWidth: 140 }}
        />
      ))}
    </Space>
  );
};

export default FiltersBar;
