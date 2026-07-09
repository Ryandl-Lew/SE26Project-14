import React from 'react';
import PageHeader from '@/components/common/PageHeader';
import Surface from '@/components/common/Surface';
import EmptyState from '@/components/common/EmptyState';

const AnalysisPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        eyebrow="数据分析"
        title="Agent 数据分析"
        description="选择数据条目和数学模型，调用 AI Agent 进行模型优化、相关性分析和趋势解读。"
      />
      <Surface title="分析结果">
        <EmptyState description="请先选择项目和数据条目，然后点击开始分析" />
      </Surface>
    </div>
  );
};

export default AnalysisPage;
