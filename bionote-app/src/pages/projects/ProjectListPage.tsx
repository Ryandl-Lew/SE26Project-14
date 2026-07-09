import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select, Row, Col, Space } from 'antd';
import PageHeader from '@/components/common/PageHeader';
import PageNavControls from '@/layouts/components/PageNavControls';
import StatusBadge from '@/components/common/StatusBadge';
import ProgressBar from '@/components/common/ProgressBar';
import { useAppStore } from '@/stores/useAppStore';
import { STATUS_COLORS, STATUS_LABELS } from '@/utils/constants';
import type { Project } from '@/types';

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
  const navigate = useNavigate();
  const setCurrentProject = useAppStore((s) => s.setCurrentProjectByName);

  return (
    <div
      style={{
        display: 'grid',
        gap: 9,
        padding: 16,
        border: '1px solid #d5dbe3',
        borderRadius: 6,
        background: '#fff',
        boxShadow: '0 1px 2px rgba(20,30,40,0.04)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(15,107,88,0.35)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(20,30,40,0.07)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#d5dbe3';
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(20,30,40,0.04)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{project.name}</h3>
          <div style={{ color: '#6b7885', fontSize: 12, marginTop: 2 }}>{project.description}</div>
        </div>
        <StatusBadge color={STATUS_COLORS[project.status]}>{STATUS_LABELS[project.status]}</StatusBadge>
      </div>
      <ProgressBar percent={project.progress} />
      <div style={{ color: '#6b7885', fontSize: 12 }}>
        项目编号：{project.projectNo} · 负责人：{project.owner} · 成员 {project.memberCount} · 实验 {project.experimentCount} · 最近更新 {project.updatedAt}
      </div>
      <Space wrap>
        <Button type="primary" size="small" onClick={() => navigate(`/projects/${project.id === 'proj-1' ? '1' : project.id === 'proj-2' ? '2' : '3'}`)}>
          进入项目
        </Button>
        <Button size="small" onClick={() => setCurrentProject(project.name)}>
          {useAppStore.getState().currentProjectName === project.name ? '已设为当前' : '设为当前项目'}
        </Button>
        <Button size="small">编辑</Button>
        {project.status === 'completed' ? (
          <Button size="small">导出报告</Button>
        ) : (
          <Button size="small">归档</Button>
        )}
      </Space>
    </div>
  );
};

const ProjectListPage: React.FC = () => {
  const projectList = useAppStore((s) => s.projectList);

  return (
    <div>
      <PageNavControls />
      <PageHeader
        eyebrow="项目管理"
        title="项目列表与进度"
        description="查看、新建、搜索、编辑和归档项目；进入项目后在项目管理内查看当前项目概览、时间线和成员。"
        extra={<Button type="primary">＋ 新建项目</Button>}
      />

      <Space wrap style={{ marginBottom: 14 }}>
        <Input placeholder="搜索项目" defaultValue="GFP" style={{ minWidth: 280 }} />
        <Select defaultValue="all" options={[{ label: '全部状态', value: 'all' }, { label: '进行中', value: 'active' }, { label: '已完成', value: 'completed' }, { label: '暂停', value: 'paused' }]} style={{ minWidth: 140 }} />
        <Select defaultValue="all" options={[{ label: '全部负责人', value: 'all' }, { label: '李同学', value: 'li' }, { label: '张老师', value: 'zhang' }]} style={{ minWidth: 140 }} />
      </Space>

      <Row gutter={[12, 12]}>
        {projectList.map((p) => (
          <Col xs={24} md={12} lg={8} key={p.id}>
            <ProjectCard project={p} />
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default ProjectListPage;
