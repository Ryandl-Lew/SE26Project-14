import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Select, Space, Typography } from 'antd';
import PageHeader from '@/components/common/PageHeader';
import Surface from '@/components/common/Surface';
import StatCard from '@/components/common/StatCard';
import { aiStructuredResult, aiDefaultInput } from '@/utils/mockData';
import { useAppStore } from '@/stores/useAppStore';

const { Text } = Typography;

const AIPage: React.FC = () => {
  const navigate = useNavigate();
  const projectList = useAppStore((s) => s.projectList);
  const [activeFn, setActiveFn] = React.useState('生成实验记录');

  const functions = ['生成实验记录', '整理实验记录', '生成实验摘要', '检查记录完整性', '分析实验问题'];

  return (
    <div>
      <PageHeader
        eyebrow="AI 助手"
        title="自然语言转实验记录"
        description="轻量辅助录入、完整性检查和实验摘要，不替代核心记录流程。"
      />
      <div style={{ display: 'grid', gridTemplateColumns: '210px minmax(0, 1fr) 310px', gap: 14 }}>
        <Surface title="功能选择" bodyStyle={{ padding: '12px 14px' }}>
          <div style={{ display: 'grid', gap: 4 }}>
            {functions.map((f) => {
              const isActive = f === activeFn;
              return (
                <button
                  key={f}
                  onClick={() => setActiveFn(f)}
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
                  }}
                >
                  {f}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'grid', gap: 5, marginTop: 16 }}>
            <label style={{ color: '#6b7885', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>关联项目</label>
            <Select defaultValue={projectList[0].name} options={projectList.map((p) => ({ label: p.name, value: p.name }))} />
          </div>
        </Surface>

        <Surface title="输入实验描述">
          <div style={{ display: 'grid', gap: 5 }}>
            <label style={{ color: '#6b7885', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>自然语言记录</label>
            <textarea
              defaultValue={aiDefaultInput}
              rows={6}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #d5dbe3',
                borderRadius: 6,
                background: '#fff',
                color: '#1a2128',
                fontFamily: 'inherit',
                fontSize: 13.5,
                resize: 'vertical',
              }}
            />
          </div>
          <Space style={{ marginTop: 12 }}>
            <Button type="primary" onClick={() => navigate('/records/1/edit')}>生成实验记录草稿</Button>
            <Button>插入当前记录</Button>
            <Button>重新生成</Button>
            <Button>复制</Button>
          </Space>
        </Surface>

        <Surface title="结构化结果" bodyStyle={{ padding: '14px 16px' }}>
          <div style={{ display: 'grid', gap: 7 }}>
            {aiStructuredResult.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', border: '1px solid #e4e8ee', borderRadius: 6, background: '#fff' }}>
                <span style={{ fontSize: 13 }}>{item.label}</span>
                <strong style={{ fontFamily: 'monospace', fontSize: 13 }}>{item.value}</strong>
              </div>
            ))}
          </div>
          <h3 style={{ margin: '18px 0 8px', fontSize: 15 }}>完整性评分</h3>
          <div style={{ padding: '15px 16px', border: '1px solid #d5dbe3', borderRadius: 6, background: '#fff', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#0f6b58', opacity: 0.5 }} />
            <div style={{ fontSize: 32, fontWeight: 700, color: '#1a2128', lineHeight: 1 }}>78/100</div>
            <div style={{ color: '#6b7885', fontSize: 11.5, marginTop: 6 }}>建议补充 Taq 酶批号、电泳结果图片和最终结论。</div>
          </div>
        </Surface>
      </div>
    </div>
  );
};

export default AIPage;
