import React from 'react';
import { Table } from 'antd';
import type { TableProps } from 'antd';

function TableWrap<T extends object>(props: TableProps<T>) {
  return (
    <Table<T>
      size="small"
      bordered={false}
      {...props}
      style={{
        border: '1px solid #e4e8ee',
        borderRadius: 6,
        overflow: 'hidden',
        ...props.style,
      }}
    />
  );
}

export default TableWrap;
