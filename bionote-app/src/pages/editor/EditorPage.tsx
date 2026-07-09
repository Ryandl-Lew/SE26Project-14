import React, { useState } from 'react';
import { Button, Input, Select, Space, Typography } from 'antd';
import PageNavControls from '@/layouts/components/PageNavControls';
import PageHeader from '@/components/common/PageHeader';
import Surface from '@/components/common/Surface';
import StatusBadge from '@/components/common/StatusBadge';
import TableWrap from '@/components/common/TableWrap';
import { editorDefaults, pcrReactionComponents } from '@/utils/mockData';

const { Text } = Typography;

const outlineSections = [
  '基础信息', '实验目的', '材料与试剂', '实验步骤', '实验参数', '实验结果', '结论与讨论', '附件', '修改历史',
];

const toolbarButtons = [
  { label: 'H', title: '标题' },
  { label: 'B', title: '加粗' },
  { label: 'I', title: '斜体' },
  { label: '▦', title: '表格' },
  { label: '▧', title: '图片' },
  { label: 'Σ', title: '公式' },
  { label: '{}', title: '代码块' },
  { label: '◎', title: '插入样品' },
  { label: '◈', title: '插入试剂' },
];

const EditorPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('基础信息');

  return (
    <div>
      <PageNavControls />
      <PageHeader
        eyebrow="新建 / 编辑实验记录"
        title="PCR 扩增 GFP 片段"
        description="实验编号 EXP-20260707-001，当前状态为进行中。"
        extra={
          <Space>
            <Button>保存草稿</Button>
            <Button type="primary">提交审核</Button>
          </Space>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '210px minmax(0, 1fr) 310px', gap: 14 }}>
        {/* Outline Nav */}
        <Surface title="目录" bodyStyle={{ padding: '12px 14px' }}>
          <div style={{ display: 'grid', gap: 4 }}>
            {outlineSections.map((s) => {
              const isActive = s === activeSection;
              return (
                <button
                  key={s}
                  onClick={() => setActiveSection(s)}
                  style={{
                    minHeight: 33,
                    padding: '0 10px',
                    border: isActive ? '1px solid rgba(15,107,88,0.18)' : '1px solid transparent',
                    borderRadius: 4,
                    color: isActive ? '#0f6b58' : '#6b7885',
                    background: isActive ? '#e6f4f0' : 'transparent',
                    fontWeight: isActive ? 600 : 400,
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: 13,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#1a2128';
                      e.currentTarget.style.background = '#f8f9fb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#6b7885';
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </Surface>

        {/* Editor Main */}
        <Surface bodyStyle={{ padding: '14px 18px' }}>
          {/* Toolbar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 5,
              paddingBottom: 10,
              marginBottom: 12,
              borderBottom: '1px solid #e4e8ee',
            }}
          >
            {toolbarButtons.map((btn, i) => (
              <button
                key={i}
                title={btn.title}
                style={{
                  width: 32,
                  height: 32,
                  display: 'grid',
                  placeItems: 'center',
                  border: '1px solid #d5dbe3',
                  borderRadius: 4,
                  background: '#fff',
                  color: '#3e4b56',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#0f6b58';
                  e.currentTarget.style.borderColor = 'rgba(15,107,88,0.3)';
                  e.currentTarget.style.background = '#f0f8f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#3e4b56';
                  e.currentTarget.style.borderColor = '#d5dbe3';
                  e.currentTarget.style.background = '#fff';
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Document */}
          <div
            style={{
              minHeight: 560,
              padding: '18px 20px',
              border: '1px solid #e4e8ee',
              borderRadius: 6,
              background: '#fdfdfd',
              boxShadow: 'inset 0 1px 3px rgba(20,30,40,0.03)',
            }}
          >
            {/* Basic Info Form */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 11, marginBottom: 16 }}>
              {[
                { label: '实验标题', value: editorDefaults.title, type: 'input' },
                { label: '实验类型', value: editorDefaults.type, type: 'select', options: ['PCR', 'qPCR', 'Western blot'] },
                { label: '所属项目', value: editorDefaults.project, type: 'input' },
                { label: '实验日期', value: editorDefaults.date, type: 'date' },
                { label: '负责人', value: editorDefaults.owner, type: 'input' },
                { label: '实验地点', value: editorDefaults.location, type: 'input' },
              ].map((field, i) => (
                <div key={i} style={{ display: 'grid', gap: 5 }}>
                  <label style={{ color: '#6b7885', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                    {field.label}
                  </label>
                  {field.type === 'select' ? (
                    <Select defaultValue={field.value} options={(field.options || []).map((o) => ({ label: o, value: o }))} />
                  ) : field.type === 'date' ? (
                    <Input type="date" defaultValue={field.value} />
                  ) : (
                    <Input defaultValue={field.value} />
                  )}
                </div>
              ))}
            </div>

            <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10 }}>实验目的</h2>
            <Text type="secondary">{editorDefaults.purpose}</Text>

            <h2 style={{ fontSize: 17, fontWeight: 600, margin: '18px 0 10px' }}>材料与试剂</h2>
            <TableWrap
              dataSource={pcrReactionComponents}
              rowKey="code"
              pagination={false}
              columns={[
                { title: '对象', dataIndex: 'name' },
                { title: '编号 / 批号', dataIndex: 'code' },
                { title: '用量', dataIndex: 'volume' },
                { title: '备注', dataIndex: 'notes' },
              ]}
            />

            <h2 style={{ fontSize: 17, fontWeight: 600, margin: '18px 0 10px' }}>实验参数</h2>
            <Text type="secondary">退火温度 58℃，循环 35 次，延伸时间 45 s。电泳检测观察到约 750 bp 条带。</Text>
          </div>
        </Surface>

        {/* Editor Sidebar */}
        <Surface title="关联信息" bodyStyle={{ padding: '14px 16px' }}>
          <div style={{ display: 'grid', gap: 5 }}>
            <label style={{ color: '#6b7885', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>状态</label>
            <Select
              defaultValue="active"
              options={[
                { label: '进行中', value: 'active' },
                { label: '待审核', value: 'pending_review' },
                { label: '已完成', value: 'completed' },
              ]}
            />
          </div>

          <div style={{ display: 'grid', gap: 7, marginTop: 12 }}>
            {[
              { name: 'Sample-001', badge: '样品', badgeColor: 'green' as const },
              { name: 'Taq DNA Polymerase', badge: '即将过期', badgeColor: 'amber' as const },
              { name: 'GFP_gel_0707.png', badge: '附件', badgeColor: 'blue' as const },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', border: '1px solid #e4e8ee', borderRadius: 6, background: '#fff' }}>
                <span style={{ fontSize: 13 }}>{item.name}</span>
                <StatusBadge color={item.badgeColor}>{item.badge}</StatusBadge>
              </div>
            ))}
          </div>

          <h3 style={{ margin: '18px 0 8px', fontSize: 15 }}>审核评论</h3>
          <div style={{ padding: '11px 13px', border: '1px solid #e4e8ee', borderRadius: 6, background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginBottom: 4 }}>
              <span>张老师</span>
              <StatusBadge color="amber">待处理</StatusBadge>
            </div>
            <div style={{ color: '#6b7885', fontSize: 12 }}>电泳图中 Marker 标注不清楚，请补充说明。</div>
          </div>

          <h3 style={{ margin: '18px 0 8px', fontSize: 15 }}>操作</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            <Button type="primary" block>提交审核</Button>
            <Button block>导出 PDF</Button>
            <Button block>复制为新实验</Button>
          </div>
        </Surface>
      </div>
    </div>
  );
};

export default EditorPage;
