import React from 'react';
import { Input, Select, Button, Space } from 'antd';
import PageHeader from '@/components/common/PageHeader';
import Surface from '@/components/common/Surface';
import StatusBadge from '@/components/common/StatusBadge';
import { searchResults } from '@/utils/mockData';

const SearchPage: React.FC = () => {
  const tabs = ['全部 18', '项目 2', '实验记录 7', '模板 3', '成员 2', '附件 4'];
  const [activeTab, setActiveTab] = React.useState('全部 18');

  return (
    <div>
      <PageHeader
        eyebrow="搜索中心"
        title="全局搜索结果"
        description="跨项目、实验记录、模板、成员和附件检索 GFP 相关内容。"
      />
      <div style={{ display: 'grid', gridTemplateColumns: '270px minmax(0, 1fr)', gap: 16 }}>
        <Surface title="高级筛选">
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              { label: '关键词', type: 'input', defaultValue: 'GFP' },
              { label: '对象类型', type: 'select', options: ['全部', '项目', '实验记录', '模板', '成员', '附件'] },
              { label: '负责人', type: 'select', options: ['全部', '李同学', '王同学'] },
              { label: '项目', type: 'select', options: ['GFP 质粒构建项目', '全部项目'] },
              { label: '状态', type: 'select', options: ['全部状态', '待审核', '已完成'] },
            ].map((f, i) => (
              <div key={i} style={{ display: 'grid', gap: 5 }}>
                <label style={{ color: '#6b7885', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase' }}>{f.label}</label>
                {f.type === 'input' ? <Input defaultValue={f.defaultValue} /> : <Select defaultValue={(f.options || [])[0]} options={(f.options || []).map((o) => ({ label: o, value: o }))} />}
              </div>
            ))}
            <Button type="primary" block>搜索</Button>
          </div>
        </Surface>
        <Surface>
          <Space wrap style={{ marginBottom: 12 }}>
            {tabs.map((t) => (
              <Button key={t} type={t === activeTab ? 'primary' : 'default'} ghost={t === activeTab} onClick={() => setActiveTab(t)} size="small">
                {t}
              </Button>
            ))}
          </Space>
          <div style={{ display: 'grid', gap: 10 }}>
            {searchResults.map((r, i) => (
              <div key={i} style={{ padding: '11px 13px', border: '1px solid #e4e8ee', borderRadius: 6, background: '#fff', display: 'grid', gap: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>{r.title}</span>
                  <StatusBadge color={r.badgeColor}>{r.badge}</StatusBadge>
                </div>
                <div style={{ color: '#6b7885', fontSize: 12 }}>{r.detail}</div>
              </div>
            ))}
          </div>
        </Surface>
      </div>
    </div>
  );
};

export default SearchPage;
