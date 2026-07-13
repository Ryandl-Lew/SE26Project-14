import React from 'react';
import { Button } from 'antd';
import PageHeader from '@/components/common/PageHeader';
import Surface from '@/components/common/Surface';
import EmptyState from '@/components/common/EmptyState';

const RemindersPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        eyebrow="提醒设置"
        title="数据采集提醒"
        description="设置实验数据采集的时间计划，系统会在预设时间前推送提醒通知。"
        extra={<Button type="primary">＋ 添加提醒</Button>}
      />
      <Surface title="提醒列表">
        <EmptyState description="暂未设置提醒计划" actionLabel="添加第一个提醒" onAction={() => {}} />
      </Surface>
    </div>
  );
};

export default RemindersPage;
