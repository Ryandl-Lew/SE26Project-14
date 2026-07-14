/**
 * 实验记录 Records
 * 左侧记录目录树 + 右侧选中记录预览；以当前项目为上下文。
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader, StatusBadge, Surface } from '@/components/ui'
import RecordTree from '@/components/record/RecordTree'
import { fetchRecords } from '@/api'
import { mockProjects } from '@/mocks/data'
import { useAppStore } from '@/store/appStore'
import './records.css'

export default function RecordsPage() {
  const navigate = useNavigate()
  const { currentProjectId, setCurrentProject } = useAppStore()
  const [records, setRecords] = useState([])
  const [activeId, setActiveId] = useState(null)

  useEffect(() => {
    fetchRecords(currentProjectId).then((list) => {
      setRecords(list)
      setActiveId(list[0]?.id ?? null)
    })
  }, [currentProjectId])

  const active = records.find((r) => r.id === activeId)

  return (
    <section>
      <PageHeader
        eyebrow="实验记录"
        title="当前项目实验记录"
        description="以当前项目为上下文管理实验记录；可切换项目，并按目录结构查看、编辑具体记录。"
        actions={
          <button className="primary-btn" onClick={() => navigate('/records/new')}>
            ＋ 新建实验记录
          </button>
        }
      />

      <div className="surface record-project-bar">
        <div className="field">
          <label>切换项目</label>
          <select
            value={currentProjectId}
            onChange={(e) => setCurrentProject(e.target.value)}
            aria-label="切换实验记录所属项目"
          >
            {mockProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="card-actions">
          <button
            className="secondary-btn"
            onClick={() => navigate(`/projects/${currentProjectId}`)}
          >
            项目概览
          </button>
          <button className="secondary-btn">导出目录</button>
        </div>
      </div>

      <div className="records-workspace">
        <aside className="surface">
          <div className="surface-head">
            <h2>记录目录</h2>
            <span className="badge blue">{records.length}</span>
          </div>
          {/* TODO: 接入目录搜索 / 状态筛选 */}
          <div className="filters">
            <input type="search" placeholder="搜索记录" aria-label="实验记录目录搜索" />
            <select>
              <option>全部状态</option>
              <option>草稿</option>
              <option>进行中</option>
              <option>待审核</option>
              <option>已完成</option>
            </select>
          </div>
          <RecordTree records={records} activeId={activeId} onSelect={(r) => setActiveId(r.id)} />
        </aside>

        <Surface>
          {active ? (
            <>
              <div className="surface-head">
                <div>
                  <h2>{active.title}</h2>
                  <div className="muted small">
                    所属项目：{active.projectName} · {active.code} · 最近修改 {active.updatedAt}
                  </div>
                </div>
                <div className="card-actions">
                  <button className="secondary-btn" onClick={() => navigate(`/records/${active.id}`)}>
                    查看
                  </button>
                  <button
                    className="primary-btn"
                    onClick={() => navigate(`/records/${active.id}/edit`)}
                  >
                    编辑
                  </button>
                </div>
              </div>

              <div className="record-summary-grid">
                <div className="record-summary-item">
                  <div className="muted small">实验类型</div>
                  <strong>{active.experimentType}</strong>
                </div>
                <div className="record-summary-item">
                  <div className="muted small">状态</div>
                  <strong>
                    <StatusBadge kind="record" status={active.status} />
                  </strong>
                </div>
                <div className="record-summary-item">
                  <div className="muted small">负责人</div>
                  <strong>{active.ownerName}</strong>
                </div>
              </div>

              {/* 预览区占位，真实内容来自记录详情接口 */}
              <div className="stack">
                <div className="list-item">
                  <h3>实验目的</h3>
                  <p className="muted">
                    以 Sample-001 为模板扩增 GFP 目标片段，为后续酶切连接和融合蛋白表达验证提供片段。
                  </p>
                </div>
                <div className="list-item">
                  <h3>关键结果</h3>
                  <p className="muted">
                    退火温度 58℃，循环 35 次，电泳检测观察到约 750 bp 条带；附件包含凝胶图和原始仪器截图。
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="muted">当前项目暂无实验记录。</p>
          )}
        </Surface>
      </div>
    </section>
  )
}
