import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Button, Typography } from 'antd';
import StatCard from '@/components/common/StatCard';
import Surface from '@/components/common/Surface';
import StatusBadge from '@/components/common/StatusBadge';
import TableWrap from '@/components/common/TableWrap';
import { recentProjects, recentRecords, todos, notices } from '@/utils/mockData';
import { STATUS_COLORS, STATUS_LABELS } from '@/utils/constants';

const { Text } = Typography;

// ── Sub-components ──────────────────────────────────────────

const HeroStrip: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.2fr) minmax(280px, 0.8fr)',
        gap: 18,
        marginBottom: 18,
        padding: '22px 24px',
        border: '1px solid #d5dbe3',
        borderRadius: 10,
        background: 'linear-gradient(135deg, rgba(15,107,88,0.035) 0%, rgba(42,107,150,0.025) 100%), #fff',
        boxShadow: '0 1px 3px rgba(20,30,40,0.06)',
      }}
    >
      <div>
        <div style={{ color: '#0f6b58', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>
          今日工作台
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 4px' }}>早上好，李同学</h1>
        <Text type="secondary">今天是 2026-07-07。你最近正在处理：GFP 融合蛋白表达项目。</Text>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
          <Button type="primary" onClick={() => navigate('/projects/1')}>进入项目管理</Button>
          <Button onClick={() => navigate('/projects')}>查看全部项目</Button>
          <Button onClick={() => navigate('/ai')}>打开 AI 助手</Button>
        </div>
      </div>

      {/* Lab Visual */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, minHeight: 178 }}>
        {/* Gel preview */}
        <div
          style={{
            position: 'relative',
            borderRadius: 6,
            background: '#0c181f',
            border: '1px solid rgba(60,201,158,0.18)',
            overflow: 'hidden',
            minHeight: 178,
          }}
        >
          <div style={{ position: 'absolute', left: 18, top: 14, color: 'rgba(255,255,255,0.85)', fontSize: 11, fontFamily: 'monospace' }}>
            <span style={{ color: 'rgba(77,232,178,0.6)', fontWeight: 700 }}>IMG </span>
            GFP_gel_0707.png
          </div>
          {[20, 54, 88, 122].map((left, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                bottom: 22,
                left,
                width: 16,
                height: [132, 120, 126, 114][i],
                borderRadius: '999px 999px 2px 2px',
                background: 'rgba(255,255,255,0.06)',
              }}
            >
              <div style={{ position: 'absolute', left: 3, right: 3, top: '32%', height: 5, borderRadius: 3, background: '#4de8b2', boxShadow: '0 0 12px rgba(77,232,178,0.7)' }} />
              <div style={{ position: 'absolute', left: 3, right: 3, top: '62%', height: 5, borderRadius: 3, background: '#4de8b2', opacity: 0.55, boxShadow: '0 0 12px rgba(77,232,178,0.7)' }} />
            </div>
          ))}
        </div>
        {/* Freezer box preview */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gridAutoRows: '1fr',
            gap: 4,
            padding: 10,
            background: '#eaf2ef',
            border: '1px solid rgba(15,107,88,0.12)',
            borderRadius: 6,
          }}
        >
          {[
            'filled', '', 'filled', '', '', 'filled',
            '', 'warn', '', 'filled', '', '',
            '', 'filled', '', '', 'filled', '',
            '', '', 'filled', '', '', '',
            'filled', '', '', 'filled', '', '',
            '', '', 'filled', '', 'warn', '',
          ].map((state, i) => (
            <div
              key={i}
              style={{
                borderRadius: 3,
                border: state === 'filled' ? '1px solid #6aaf92' : state === 'warn' ? '1px solid #c4a84e' : '1px solid #d0dcd6',
                background: state === 'filled' ? '#8cc9ae' : state === 'warn' ? '#e0c97e' : '#fff',
                boxShadow: state ? 'inset 0 1px 0 rgba(255,255,255,0.3)' : undefined,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Dashboard Page ──────────────────────────────────────────

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const statCards = [
    { label: '我参与的项目', value: 6, note: '点击后进入项目管理', icon: '▣', accent: '#0f6b58' },
    { label: '进行中的项目', value: 3, note: 'GFP 项目本周更新 4 次', icon: '↗', accent: '#2a6b96' },
    { label: '本周新增实验', value: 12, note: '8 条来自当前项目', icon: '✎', accent: '#1e7e4c' },
    { label: '待处理记录', value: 2, note: '含 1 条待审核记录', icon: '!', accent: '#a16612' },
  ];

  return (
    <div>
      <HeroStrip />

      {/* Stats */}
      <Row gutter={[12, 12]} style={{ marginBottom: 18 }}>
        {statCards.map((s, i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            <StatCard {...s} />
          </Col>
        ))}
      </Row>

      {/* Recent Projects */}
      <Surface
        title="最近访问项目"
        extra={<Button type="link" onClick={() => navigate('/projects')}>全部项目</Button>}
        style={{ marginBottom: 18 }}
      >
        <TableWrap
          dataSource={recentProjects}
          rowKey="id"
          pagination={false}
          columns={[
            { title: '项目名称', dataIndex: 'name', key: 'name' },
            {
              title: '状态', dataIndex: 'status', key: 'status',
              render: (s: string) => <StatusBadge color={STATUS_COLORS[s]}>{STATUS_LABELS[s]}</StatusBadge>,
            },
            { title: '负责人', dataIndex: 'owner', key: 'owner' },
            { title: '成员数', dataIndex: 'memberCount', key: 'memberCount' },
            { title: '最近更新', dataIndex: 'updatedAt', key: 'updatedAt' },
            {
              title: '操作', key: 'action',
              render: (_: unknown, r: typeof recentProjects[0]) => (
                <Button type="link" size="small" onClick={() => navigate(`/projects/${r.id === 'proj-1' ? '1' : '2'}`)}>
                  进入项目
                </Button>
              ),
            },
          ]}
        />
      </Surface>

      {/* Recent Records + Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.45fr) minmax(310px, 0.55fr)', gap: 16 }}>
        <Surface
          title="最近实验记录"
          extra={<Button type="link" onClick={() => navigate('/records')}>查看全部</Button>}
        >
          <TableWrap
            dataSource={recentRecords}
            rowKey="id"
            pagination={false}
            columns={[
              { title: '实验名称', dataIndex: 'title', key: 'title' },
              { title: '类型', dataIndex: 'type', key: 'type' },
              {
                title: '状态', dataIndex: 'status', key: 'status',
                render: (s: string) => <StatusBadge color={STATUS_COLORS[s]}>{STATUS_LABELS[s]}</StatusBadge>,
              },
              { title: '最近修改', dataIndex: 'updatedAt', key: 'updatedAt', render: (v: string) => v.replace('T', ' ') },
              { title: '负责人', dataIndex: 'owner', key: 'owner' },
              {
                title: '操作', key: 'action',
                render: (_: unknown, r: typeof recentRecords[0]) => (
                  <span>
                    <Button type="link" size="small" onClick={() => navigate(`/records/${r.id}`)}>查看</Button>
                    {r.status !== 'completed' && (
                      <Button type="link" size="small" onClick={() => navigate(`/records/${r.id}/edit`)}>编辑</Button>
                    )}
                  </span>
                ),
              },
            ]}
          />
        </Surface>

        <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
          {/* Todos */}
          <Surface
            title="我的待办"
            extra={<StatusBadge color="red">5</StatusBadge>}
            showHeaderBorder
          >
            <div style={{ display: 'grid', gap: 10 }}>
              {todos.map((t, i) => (
                <div
                  key={i}
                  style={{
                    padding: '11px 13px',
                    border: '1px solid #e4e8ee',
                    borderRadius: 6,
                    background: '#fff',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginBottom: 4 }}>
                    <span>{t.title}</span>
                    <StatusBadge color={t.badgeColor}>{t.badge}</StatusBadge>
                  </div>
                  <div style={{ color: '#6b7885', fontSize: 12 }}>{t.detail}</div>
                </div>
              ))}
            </div>
          </Surface>

          {/* Notices */}
          <Surface title="提醒" showHeaderBorder>
            <div style={{ display: 'grid', gap: 10 }}>
              {notices.map((n, i) => (
                <div
                  key={i}
                  style={{
                    padding: '11px 13px',
                    border: '1px solid #e4e8ee',
                    borderRadius: 6,
                    background: '#fff',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginBottom: 4 }}>
                    <span>{n.title}</span>
                    <StatusBadge color={n.badgeColor}>{n.badge}</StatusBadge>
                  </div>
                  <div style={{ color: '#6b7885', fontSize: 12 }}>{n.detail}</div>
                </div>
              ))}
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
