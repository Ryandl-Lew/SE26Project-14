import React from 'react';
import { Button, Select, Input, Space } from 'antd';
import PageHeader from '@/components/common/PageHeader';
import Surface from '@/components/common/Surface';
import StatusBadge from '@/components/common/StatusBadge';
import TableWrap from '@/components/common/TableWrap';
import { teamMembers, permissionMatrix } from '@/utils/mockData';
import { ROLE_COLORS, ROLE_LABELS } from '@/utils/constants';

const TeamPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        eyebrow="团队管理"
        title="按项目管理成员权限"
        description="团队权限不做独立全员列表，而是围绕具体项目配置成员角色与操作范围。"
        extra={<Button type="primary">＋ 邀请成员</Button>}
      />
      <Surface>
        <Space wrap style={{ marginBottom: 14 }}>
          <Select defaultValue="GFP 融合蛋白表达项目" options={[
            { label: '选择项目：GFP 融合蛋白表达项目', value: 'GFP 融合蛋白表达项目' },
            { label: '细胞转染条件优化', value: '细胞转染条件优化' },
          ]} style={{ minWidth: 280 }} />
          <Input placeholder="搜索当前项目成员" style={{ minWidth: 200 }} />
          <Button>修改权限</Button>
        </Space>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { label: '项目编号', value: 'PRJ-2026-001' },
            { label: '项目状态', value: '进行中' },
            { label: '成员数', value: '5 人' },
            { label: '审核者', value: '1 人' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '10px 12px', borderRadius: 4, background: '#f8f9fb', border: '1px solid #e4e8ee' }}>
              <span style={{ display: 'block', color: '#6b7885', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{m.label}</span>
              <strong style={{ fontSize: 14 }}>{m.value}</strong>
            </div>
          ))}
        </div>
      </Surface>

      <Surface title="项目成员列表" extra={<Button type="primary" size="small">邀请成员</Button>} style={{ marginTop: 18 }}>
        <TableWrap
          dataSource={teamMembers}
          rowKey="email"
          pagination={false}
          columns={[
            { title: '姓名', dataIndex: 'name' },
            { title: '邮箱', dataIndex: 'email' },
            { title: '项目角色', dataIndex: 'role', render: (r: string) => <StatusBadge color={ROLE_COLORS[r] as 'blue' | 'green' | 'amber' | 'gray'}>{ROLE_LABELS[r]}</StatusBadge> },
            { title: '权限', dataIndex: 'permissions' },
            { title: '加入时间', dataIndex: 'joinedAt' },
            { title: '最近活跃', dataIndex: 'lastActive' },
            { title: '操作', render: () => <Button type="link" size="small">修改权限</Button> },
          ]}
        />
      </Surface>

      <Surface title="角色权限矩阵" extra={<Button size="small">编辑权限</Button>} style={{ marginTop: 18 }}>
        <TableWrap
          dataSource={permissionMatrix}
          rowKey="permission"
          pagination={false}
          columns={[
            { title: '权限项', dataIndex: 'permission' },
            { title: '项目负责人', dataIndex: 'owner', render: (v: boolean | string) => typeof v === 'boolean' ? <StatusBadge color={v ? 'green' : 'red'}>{v ? '是' : '否'}</StatusBadge> : <StatusBadge color="amber">{v}</StatusBadge> },
            { title: '项目成员', dataIndex: 'member', render: (v: boolean | string) => typeof v === 'boolean' ? <StatusBadge color={v ? 'green' : 'red'}>{v ? '是' : '否'}</StatusBadge> : <StatusBadge color="amber">{v}</StatusBadge> },
            { title: '审核者', dataIndex: 'reviewer', render: (v: boolean | string) => typeof v === 'boolean' ? <StatusBadge color={v ? 'green' : 'red'}>{v ? '是' : '否'}</StatusBadge> : <StatusBadge color="amber">{v}</StatusBadge> },
            { title: '观察者', dataIndex: 'observer', render: (v: boolean | string) => typeof v === 'boolean' ? <StatusBadge color={v ? 'green' : 'red'}>{v ? '是' : '否'}</StatusBadge> : <StatusBadge color="amber">{v}</StatusBadge> },
          ]}
        />
      </Surface>
    </div>
  );
};

export default TeamPage;
