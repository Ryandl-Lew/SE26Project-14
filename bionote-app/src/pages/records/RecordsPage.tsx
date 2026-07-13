import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select, Space } from 'antd';
import PageNavControls from '@/layouts/components/PageNavControls';
import PageHeader from '@/components/common/PageHeader';
import Surface from '@/components/common/Surface';
import StatusBadge from '@/components/common/StatusBadge';
import { recordTreeGroups } from '@/utils/mockData';
import { STATUS_COLORS, STATUS_LABELS } from '@/utils/constants';
import { useAppStore } from '@/stores/useAppStore';
import type { RecordTreeNode } from '@/types';

const RecordTree: React.FC<{ activeId: string; onSelect: (r: RecordTreeNode) => void }> = ({ activeId, onSelect }) => {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {recordTreeGroups.map((group, gi) => (
        <div key={gi} style={{ display: 'grid', gap: 6, paddingBottom: 10, borderBottom: gi < recordTreeGroups.length - 1 ? '1px solid #e4e8ee' : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7885', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            <span>{group.label}</span>
            <span>{group.count}</span>
          </div>
          {group.records.map((rec) => {
            const isActive = rec.id === activeId;
            return (
              <button
                key={rec.id}
                onClick={() => onSelect(rec)}
                style={{
                  width: '100%',
                  display: 'grid',
                  gap: 2,
                  padding: '8px 10px 8px 16px',
                  border: isActive ? '1px solid rgba(15,107,88,0.16)' : '1px solid transparent',
                  borderLeft: isActive ? '2px solid #0f6b58' : '2px solid transparent',
                  borderRadius: '0 4px 4px 0',
                  color: '#1a2128',
                  background: isActive ? '#e6f4f0' : 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = '#e4e8ee';
                    e.currentTarget.style.background = '#f8f9fb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <strong style={{ fontSize: 13.5 }}>{rec.title}</strong>
                <span style={{ color: '#6b7885', fontSize: 12 }}>{rec.type} · {STATUS_LABELS[rec.status]} · {rec.date}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const RecordsPage: React.FC = () => {
  const navigate = useNavigate();
  const projectList = useAppStore((s) => s.projectList);
  const [activeRecordId, setActiveRecordId] = useState('rec-1');

  const activeRecord = recordTreeGroups.flatMap((g) => g.records).find((r) => r.id === activeRecordId);

  return (
    <div>
      <PageNavControls />
      <PageHeader
        eyebrow="实验记录"
        title="当前项目实验记录"
        description="以当前项目为上下文管理实验记录；可切换项目，并按目录结构查看、编辑具体记录。"
        extra={<Button type="primary" onClick={() => navigate('/records/1/edit')}>＋ 新建实验记录</Button>}
      />

      {/* Project Bar */}
      <Surface style={{ marginBottom: 16 }} bodyStyle={{ padding: '14px 18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 14, alignItems: 'end' }}>
          <div>
            <label style={{ color: '#6b7885', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3, display: 'block', marginBottom: 5 }}>切换项目</label>
            <Select
              defaultValue={projectList[0].name}
              options={projectList.map((p) => ({ label: p.name, value: p.name }))}
              style={{ minWidth: 280 }}
            />
          </div>
          <Space>
            <Button onClick={() => navigate('/projects/1')}>项目概览</Button>
            <Button>导出目录</Button>
          </Space>
        </div>
      </Surface>

      <div style={{ display: 'grid', gridTemplateColumns: '300px minmax(0, 1fr)', gap: 16 }}>
        {/* Record Tree */}
        <Surface
          title="记录目录"
          extra={<StatusBadge color="blue">12</StatusBadge>}
          bodyStyle={{ padding: '12px 14px' }}
        >
          <Space wrap style={{ marginBottom: 12 }}>
            <Input placeholder="搜索记录" defaultValue="GFP" style={{ minWidth: 160 }} />
            <Select
              defaultValue="all"
              options={[{ label: '全部状态', value: 'all' }, { label: '草稿', value: 'draft' }, { label: '进行中', value: 'active' }, { label: '待审核', value: 'pending_review' }, { label: '已完成', value: 'completed' }]}
              style={{ minWidth: 120 }}
            />
          </Space>
          <RecordTree activeId={activeRecordId} onSelect={(r) => setActiveRecordId(r.id)} />
        </Surface>

        {/* Record Preview */}
        <Surface
          title={
            <div>
              <div style={{ fontSize: 17, fontWeight: 600 }}>{activeRecord?.title || 'PCR 扩增 GFP 片段'}</div>
              <div style={{ color: '#6b7885', fontSize: 12, fontWeight: 400, marginTop: 2 }}>
                所属项目：GFP 融合蛋白表达项目 · EXP-20260707-001 · 最近修改 2026-07-07 16:00
              </div>
            </div>
          }
          extra={
            <Space>
              <Button onClick={() => navigate(`/records/${activeRecordId}`)}>查看</Button>
              <Button type="primary" onClick={() => navigate(`/records/${activeRecordId}/edit`)}>编辑</Button>
            </Space>
          }
        >
          {/* Summary Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
            {[
              { label: '实验类型', value: 'PCR' },
              { label: '状态', value: <StatusBadge color="green">已完成</StatusBadge> },
              { label: '负责人', value: '李同学' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '11px 13px', border: '1px solid #e4e8ee', borderRadius: 6, background: '#fff' }}>
                <div style={{ fontSize: 11, color: '#6b7885', textTransform: 'uppercase', letterSpacing: 0.3 }}>{item.label}</div>
                <strong style={{ marginTop: 2, display: 'block' }}>{item.value}</strong>
              </div>
            ))}
          </div>

          {/* Record Sections */}
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ padding: '12px 14px', border: '1px solid #e4e8ee', borderRadius: 6, background: '#fff' }}>
              <h3 style={{ margin: '0 0 6px', fontSize: 15 }}>实验目的</h3>
              <div style={{ color: '#6b7885' }}>以 Sample-001 为模板扩增 GFP 目标片段，为后续酶切连接和融合蛋白表达验证提供片段。</div>
            </div>
            <div style={{ padding: '12px 14px', border: '1px solid #e4e8ee', borderRadius: 6, background: '#fff' }}>
              <h3 style={{ margin: '0 0 6px', fontSize: 15 }}>关键结果</h3>
              <div style={{ color: '#6b7885' }}>退火温度 58℃，循环 35 次，电泳检测观察到约 750 bp 条带；附件包含凝胶图和原始仪器截图。</div>
            </div>
          </div>
        </Surface>
      </div>
    </div>
  );
};

export default RecordsPage;
