import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Space, Typography } from 'antd';
import PageNavControls from '@/layouts/components/PageNavControls';
import Surface from '@/components/common/Surface';
import StatusBadge from '@/components/common/StatusBadge';
import TableWrap from '@/components/common/TableWrap';
import { pcrReactionTable, pcrComments, pcrAttachments } from '@/utils/mockData';

const { Text } = Typography;

const RecordDetailPage: React.FC = () => {
  const navigate = useNavigate();

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
            实验详情
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 4px' }}>
            PCR 扩增 GFP 片段 <StatusBadge color="amber">待审核</StatusBadge>
          </h1>
          <Text type="secondary">只读查看实验正文、元数据、附件、评论和版本历史。</Text>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 12 }}>
            {[
              { label: '实验编号', value: 'EXP-20260707-001' },
              { label: '所属项目', value: 'GFP 质粒构建' },
              { label: '负责人', value: '李同学' },
              { label: '实验日期', value: '2026-07-07' },
            ].map((m, i) => (
              <div key={i} style={{ padding: '10px 12px', borderRadius: 4, background: '#f8f9fb', border: '1px solid #e4e8ee' }}>
                <span style={{ display: 'block', color: '#6b7885', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>{m.label}</span>
                <strong style={{ fontSize: 14, fontFamily: 'monospace' }}>{m.value}</strong>
              </div>
            ))}
          </div>
        </div>
        <Space wrap style={{ alignSelf: 'start' }}>
          <Button onClick={() => navigate('/records/1/edit')}>编辑</Button>
          <Button>复制为新实验</Button>
          <Button type="primary">审核通过</Button>
          <Button danger>退回修改</Button>
        </Space>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 330px', gap: 16 }}>
        {/* Main Content */}
        <Surface title="实验内容">
          <Text type="secondary">本次 PCR 使用 Sample-001 作为模板，GFP-F / GFP-R 作为引物。反应体系总体积 50 μL，退火温度 58℃，循环 35 次。</Text>
          <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>电泳检测结果显示约 750 bp 条带，阴性对照未见明显扩增条带，初步判断 GFP 片段扩增成功。</Text>

          <h2 style={{ fontSize: 17, fontWeight: 600, margin: '18px 0 10px' }}>反应体系</h2>
          <TableWrap
            dataSource={pcrReactionTable}
            rowKey="component"
            pagination={false}
            columns={[
              { title: '组分', dataIndex: 'component' },
              { title: '体积', dataIndex: 'volume' },
            ]}
          />

          <h2 style={{ fontSize: 17, fontWeight: 600, margin: '18px 0 10px' }}>评论与版本</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {pcrComments.map((c, i) => (
              <div key={i} style={{ padding: '11px 13px', border: '1px solid #e4e8ee', borderRadius: 6, background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginBottom: 4 }}>
                  <span>{c.author}{c.time ? ` · ${c.time}` : ''}</span>
                  <StatusBadge color={c.type === '审核意见' ? 'amber' : 'gray'}>{c.type}</StatusBadge>
                </div>
                <div style={{ color: '#6b7885', fontSize: 12 }}>{c.content}</div>
              </div>
            ))}
          </div>
        </Surface>

        {/* Sidebar */}
        <Surface title="元数据与附件">
          <div style={{ display: 'grid', gap: 7 }}>
            {pcrAttachments.map((a, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', border: '1px solid #e4e8ee', borderRadius: 6, background: '#fff' }}>
                <span style={{ fontSize: 13 }}>{a.name}</span>
                <StatusBadge color={a.type === '图片' ? 'blue' : a.type === '仪器数据' ? 'violet' : a.type === '试剂' ? 'amber' : 'green'}>{a.type}</StatusBadge>
              </div>
            ))}
          </div>
          {/* Gel preview */}
          <div
            style={{
              position: 'relative',
              marginTop: 16,
              borderRadius: 6,
              background: '#0c181f',
              border: '1px solid rgba(60,201,158,0.18)',
              minHeight: 178,
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', left: 18, top: 14, color: 'rgba(255,255,255,0.85)', fontSize: 11, fontFamily: 'monospace' }}>
              <span style={{ color: 'rgba(77,232,178,0.6)', fontWeight: 700 }}>IMG </span>
              结果图预览
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
                <div style={{ position: 'absolute', left: 3, right: 3, top: '62%', height: 5, borderRadius: 3, background: '#4de8b2', opacity: 0.55 }} />
              </div>
            ))}
          </div>
        </Surface>
      </div>
    </div>
  );
};

export default RecordDetailPage;
