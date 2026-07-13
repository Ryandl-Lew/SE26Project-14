import React from 'react';
import { Input, Select, Space } from 'antd';
import PageHeader from '@/components/common/PageHeader';
import Surface from '@/components/common/Surface';
import EmptyState from '@/components/common/EmptyState';

const PublicDataPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        eyebrow="公开数据"
        title="公开实验数据查询"
        description="搜索和浏览其他研究者公开发布的实验流程与数据，支持导入到自己的项目中作为参考。"
      />
      <Surface>
        <Space wrap style={{ marginBottom: 14 }}>
          <Input placeholder="搜索关键词（实验名称、方法、试剂等）" style={{ minWidth: 320 }} />
          <Select defaultValue="all" options={[{ label: '全部学科', value: 'all' }, { label: '分子生物学', value: 'molbio' }, { label: '细胞生物学', value: 'cellbio' }]} style={{ minWidth: 140 }} />
          <Select defaultValue="all" options={[{ label: '全部时间', value: 'all' }, { label: '最近一年', value: '1y' }, { label: '最近一月', value: '1m' }]} style={{ minWidth: 140 }} />
        </Space>
        <EmptyState description="输入关键词搜索公开实验数据" />
      </Surface>
    </div>
  );
};

export default PublicDataPage;
