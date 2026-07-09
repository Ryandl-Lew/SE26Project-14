import React from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

interface SearchInputProps {
  value?: string;
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPressEnter?: () => void;
  style?: React.CSSProperties;
}

const SearchInput: React.FC<SearchInputProps> = ({ value, placeholder = '搜索...', onChange, onPressEnter, style }) => {
  return (
    <Input
      prefix={<SearchOutlined style={{ color: '#94a1af' }} />}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onPressEnter={onPressEnter}
      style={style}
    />
  );
};

export default SearchInput;
