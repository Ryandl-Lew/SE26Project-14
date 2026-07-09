import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Row, Col, Space, Select, Input, Typography } from 'antd';
import PageNavControls from '@/layouts/components/PageNavControls';
import PageHeader from '@/components/common/PageHeader';
import StatCard from '@/components/common/StatCard';
import Surface from '@/components/common/Surface';
import StatusBadge from '@/components/common/StatusBadge';
import TableWrap from '@/components/common/TableWrap';
import MetaGrid from '@/components/common/MetaGrid';
import { gfpProjectMembers, gfpProjectAttachments, gfpProjectActivities, gfpTimeline } from '@/utils/mockData';
import { STATUS_COLORS, STATUS_LABELS, ROLE_COLORS, ROLE_LABELS } from '@/utils/constants';

const { Text } = Typography;

const ProjectDetailPage: React.FC = () => {
  const navigate = useNavigate();

  const metaItems = [
    { label: '项目编号', value: <span style={{ fontFamily: 'monospace' }}>PRJ-2026-001</span> },
    { label: '负责人', value: '李同学' },
    { label: '成员', value: '5 人' },
    { label: '最近更新', value: '2026-07-07 14:30' },
  ];

  return (
    <div>
      <PageNavControls />

      {/* Detail Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 18,
          marginBottom: 18,
          padding: '18px 20px',
          border: '1px solid #d5dbe3',
          borderRadius: 6,
          background: '#fff',
          boxShadow: '0 1px 2px rgba(20,30,40,0.04)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ color: '#0f6b58', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>
            项目管理 / 项目详情
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 4px' }}>
            GFP 融合蛋白表达项目 <StatusBadge color="blue">进行中</StatusBadge>
          </h1>
          <Text type="secondary">项目管理 / 项目详情：集中展示项目概览、时间线、成员和附件。</Text>
          <MetaGrid items={metaItems} />
        </div>
        <Space wrap style={{ alignSelf: 'start' }}>
          <Button onClick={() => navigate('/projects')}>切换项目</Button>
          <Button>编辑项目</Button>
          <Button onClick={() => navigate('/records')}>查看实验记录</Button>
          <Button type="primary" onClick={() => navigate('/records/1/edit')}>新建实验</Button>
        </Space>
      </div>

      {/* Stats */}
      <Row gutter={[12, 12]} style={{ marginBottom: 18 }}>
        <Col xs={24} sm={12} lg={6}><StatCard label="实验记录总数" value={12} note="本周新增 2 条" icon="✎" accentColor="#0f6b58" /></Col>
        <Col xs={24} sm={12} lg={6}><StatCard label="已完成实验" value={8} note="完成率 67%" icon="✓" accentColor="#1e7e4c" /></Col>
        <Col xs={24} sm={12} lg={6}><StatCard label="进行中实验" value={3} note="含 1 条编辑中" icon="↗" accentColor="#2a6b96" /></Col>
        <Col xs={24} sm={12} lg={6}><StatCard label="项目附件" value={4} note="项目方案、参考文献、汇总表" icon="▧" accentColor="#5d4db3" /></Col>
      </Row>

      {/* Overview + Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 330px', gap: 16 }}>
        <Surface
          title="概览与最近实验"
          extra={<Button type="link" onClick={() => navigate('/records')}>查看实验记录</Button>}
        >
          <Text type="secondary">项目目标：构建 GFP 融合蛋白表达载体，验证 PCR 扩增、连接转化和表达检测流程。项目标签：GFP、PCR、蛋白表达。</Text>
          <TableWrap
            dataSource={[
              { name: 'PCR 扩增 GFP 片段', type: 'PCR', owner: '李同学', status: 'completed', updatedAt: '2026-07-07 16:00', id: 'rec-1' },
              { name: '琼脂糖凝胶电泳验证', type: '电泳', owner: '王同学', status: 'completed', updatedAt: '2026-07-07 13:20', id: 'rec-5' },
              { name: '质粒小提', type: '质粒提取', owner: '王同学', status: 'active', updatedAt: '2026-07-06 18:20', id: 'rec-3' },
            ] as { name: string; type: string; owner: string; status: string; updatedAt: string; id: string }[]}
            rowKey="id"
            pagination={false}
            style={{ marginTop: 14 }}
            columns={[
              { title: '实验名称', dataIndex: 'name' },
              { title: '类型', dataIndex: 'type' },
              { title: '负责人', dataIndex: 'owner' },
              { title: '状态', dataIndex: 'status', render: (s: string) => <StatusBadge color={STATUS_COLORS[s]}>{STATUS_LABELS[s]}</StatusBadge> },
              { title: '更新时间', dataIndex: 'updatedAt' },
              { title: '操作', render: (_: unknown, r: { id: string; status: string }) => (
                <Button type="link" size="small" onClick={() => navigate(r.status === 'active' ? `/records/${r.id}/edit` : `/records/${r.id}`)}>
                  {r.status === 'active' ? '继续编辑' : '查看'}
                </Button>
              )},
            ]}
          />
        </Surface>

        <Surface title="项目附件" extra={<Button size="small">上传附件</Button>}>
          <div style={{ display: 'grid', gap: 7 }}>
            {gfpProjectAttachments.map((a, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', border: '1px solid #e4e8ee', borderRadius: 6, background: '#fff' }}>
                <span>{a.name}</span>
                <StatusBadge color={a.type === 'PDF' ? 'blue' : a.type === '图片' ? 'green' : a.type === 'ZIP' ? 'gray' : 'violet'}>{a.type}</StatusBadge>
              </div>
            ))}
          </div>
          <h3 style={{ margin: '18px 0 8px', fontSize: 15 }}>最近动态</h3>
          <div style={{ display: 'grid', gap: 10 }}>
            {gfpProjectActivities.map((a, i) => (
              <div key={i} style={{ padding: '11px 13px', border: '1px solid #e4e8ee', borderRadius: 6, background: '#fff' }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{a.actor}{a.action}</div>
                <div style={{ color: '#6b7885', fontSize: 12 }}>{a.target}</div>
              </div>
            ))}
          </div>
        </Surface>
      </div>

      {/* Timeline */}
      <Surface title="项目时间线" extra={<Button size="small">按更新时间排序</Button>} style={{ marginTop: 18 }}>
        <Space wrap style={{ marginBottom: 14 }}>
          <Select defaultValue="30d" options={[{ label: '最近 30 天', value: '30d' }, { label: '全部时间', value: 'all' }]} style={{ minWidth: 140 }} />
          <Select defaultValue="all" options={[{ label: '全部实验类型', value: 'all' }, { label: 'PCR', value: 'PCR' }, { label: '电泳', value: '电泳' }]} style={{ minWidth: 140 }} />
          <Select defaultValue="all" options={[{ label: '全部状态', value: 'all' }, { label: '已完成', value: 'completed' }, { label: '进行中', value: 'active' }]} style={{ minWidth: 140 }} />
          <Input placeholder="搜索时间线节点" style={{ minWidth: 200 }} />
        </Space>
        <div style={{ display: 'grid', gap: 10 }}>
          {gfpTimeline.map((t, i) => (
            <div
              key={i}
              style={{
                padding: '11px 13px',
                border: '1px solid #e4e8ee',
                borderLeft: '3px solid #0f6b58',
                borderRadius: '0 6px 6px 0',
                background: '#fff',
              }}
            >
              <strong>{t.date} · {t.title}</strong>
              <div style={{ color: '#6b7885', fontSize: 12, marginTop: 2 }}>
                类型：{t.type} · 负责人：{t.owner} · 状态：{STATUS_LABELS[t.status]} · {t.summary}
                {t.attachmentCount > 0 && ` · 附件 ${t.attachmentCount}`}
                {t.commentCount > 0 && ` · 评论 ${t.commentCount}`}
              </div>
            </div>
          ))}
        </div>
      </Surface>

      {/* Members */}
      <Surface title="项目成员" extra={<Button type="primary" size="small">邀请成员</Button>} style={{ marginTop: 18 }}>
        <TableWrap
          dataSource={gfpProjectMembers}
          rowKey="email"
          pagination={false}
          columns={[
            { title: '姓名', dataIndex: 'name' },
            { title: '邮箱', dataIndex: 'email' },
            { title: '项目角色', dataIndex: 'role', render: (r: string) => <StatusBadge color={ROLE_COLORS[r] as 'blue' | 'green' | 'amber' | 'gray'}>{ROLE_LABELS[r]}</StatusBadge> },
            { title: '权限摘要', dataIndex: 'permissions' },
            { title: '加入时间', dataIndex: 'joinedAt' },
            { title: '最近活跃', dataIndex: 'lastActive' },
            { title: '操作', render: () => <Button type="link" size="small" onClick={() => navigate('/team')}>查看权限</Button> },
          ]}
        />
      </Surface>
    </div>
  );
};

export default ProjectDetailPage;
