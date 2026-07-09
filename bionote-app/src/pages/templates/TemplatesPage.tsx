import React from 'react';
import { Button, Row, Col, Space } from 'antd';
import PageHeader from '@/components/common/PageHeader';
import Surface from '@/components/common/Surface';
import StatusBadge from '@/components/common/StatusBadge';
import TableWrap from '@/components/common/TableWrap';
import { templates, pcrTemplateFields } from '@/utils/mockData';

const TemplatesPage: React.FC = () => {
  const tabs = ['分子生物学', '细胞生物学', '蛋白实验', '免疫实验', '我的模板'];
  const [activeTab, setActiveTab] = React.useState('分子生物学');

  return (
    <div>
      <PageHeader
        eyebrow="模板中心"
        title="实验模板"
        description="用模板字段沉淀 PCR、qPCR、细胞实验等常用记录结构。"
        extra={<Button type="primary">＋ 新建模板</Button>}
      />
      <Space style={{ marginBottom: 14 }}>
        {tabs.map((t) => (
          <Button key={t} type={t === activeTab ? 'primary' : 'default'} ghost={t === activeTab} onClick={() => setActiveTab(t)} size="small">
            {t}
          </Button>
        ))}
      </Space>
      <Row gutter={[12, 12]}>
        {templates.map((tpl) => (
          <Col xs={24} md={12} lg={8} key={tpl.id}>
            <div style={{ padding: 16, border: '1px solid #d5dbe3', borderRadius: 6, background: '#fff', display: 'grid', gap: 9 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0, fontSize: 15 }}>{tpl.name}</h3>
                <StatusBadge color={tpl.badgeColor}>{tpl.badge}</StatusBadge>
              </div>
              <div style={{ color: '#6b7885', fontSize: 12 }}>{tpl.description}</div>
              <Space>
                <Button type="primary" size="small">使用模板</Button>
                <Button size="small">预览</Button>
                <Button size="small">复制</Button>
              </Space>
            </div>
          </Col>
        ))}
      </Row>
      <Surface title="PCR 模板字段结构" extra={<Button size="small">编辑字段</Button>} style={{ marginTop: 18 }}>
        <TableWrap
          dataSource={pcrTemplateFields}
          rowKey="name"
          pagination={false}
          columns={[
            { title: '字段名称', dataIndex: 'name' },
            { title: '字段类型', dataIndex: 'type' },
            { title: '是否必填', dataIndex: 'required', render: (v: boolean) => v ? '是' : '否' },
            { title: '单位', dataIndex: 'unit' },
            { title: '参与搜索', dataIndex: 'searchable', render: (v: boolean) => v ? '是' : '否' },
          ]}
        />
      </Surface>
    </div>
  );
};

export default TemplatesPage;
