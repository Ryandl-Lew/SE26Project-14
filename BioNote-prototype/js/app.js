/* BioNote Prototype - Main Application */

const state = {
  page: 'dashboard',
  currentProjectId: 'p1',
  currentProjectTab: 'overview',
  currentExperimentId: null,
  searchTab: 'all',
  aiFunction: 'generate',
  newExperimentStep: 'choose',
  selectedTemplateId: null,
  projectFilter: '',
  experimentFilter: '',
};

function getProject(id) {
  return PROJECTS.find(p => p.id === id);
}

function getExperiment(id) {
  return EXPERIMENTS.find(e => e.id === id);
}

function getProjectExperiments(projectId) {
  return EXPERIMENTS.filter(e => e.projectId === projectId);
}

function tagHtml(status, map) {
  const cls = map[status] || 'status-gray';
  return `<span class="tag ${cls}">${status}</span>`;
}

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 2500);
}

function navigate(page, params = {}) {
  state.page = page;
  if (params.projectId) state.currentProjectId = params.projectId;
  if (params.tab) state.currentProjectTab = params.tab;
  if (params.experimentId) state.currentExperimentId = params.experimentId;
  if (params.searchTab) state.searchTab = params.searchTab;
  if (params.step) state.newExperimentStep = params.step;
  if (params.templateId) state.selectedTemplateId = params.templateId;
  render();
}

function setCurrentProject(id) {
  state.currentProjectId = id;
  document.getElementById('current-project-label').textContent = getProject(id).name;
}

function openModal(html, large) {
  const overlay = document.getElementById('modal-overlay');
  const container = document.getElementById('modal-container');
  container.className = large ? 'modal modal-lg' : 'modal';
  container.innerHTML = html;
  overlay.classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

/* ========== Page Renderers ========== */

function renderDashboard() {
  const project = getProject(state.currentProjectId);
  return `
    <div class="page-header"><h1 class="page-title">工作台</h1></div>
    <div class="welcome-banner">
      <div>
        <h2>早上好，${CURRENT_USER.name}</h2>
        <p>今天是 2026-07-07 · 你最近正在处理：${project.name} 项目</p>
      </div>
      <div class="welcome-actions">
        <button class="btn" onclick="navigate('current-project',{tab:'overview'})">进入当前项目</button>
        <button class="btn" onclick="navigate('projects')">查看全部项目</button>
      </div>
    </div>
    <div class="grid-4 section">
      <div class="stat-card" onclick="navigate('projects')">
        <div class="stat-value">6</div><div class="stat-label">我参与的项目</div>
      </div>
      <div class="stat-card" onclick="navigate('projects')">
        <div class="stat-value">3</div><div class="stat-label">进行中的项目</div>
      </div>
      <div class="stat-card" onclick="navigate('search')">
        <div class="stat-value">12</div><div class="stat-label">本周新增实验</div>
      </div>
      <div class="stat-card" onclick="navigate('current-project',{tab:'experiments'})">
        <div class="stat-value">2</div><div class="stat-label">待处理记录</div>
      </div>
    </div>
    <div class="grid-2 section">
      <div class="card">
        <div class="card-title">最近访问项目</div>
        <div class="table-wrap"><table>
          <thead><tr><th>项目名称</th><th>状态</th><th>负责人</th><th>成员</th><th>最近更新</th><th>操作</th></tr></thead>
          <tbody>${PROJECTS.slice(0, 3).map(p => `
            <tr>
              <td>${p.name}</td><td>${tagHtml(p.status, PROJECT_STATUS)}</td>
              <td>${p.leader}</td><td>${p.members}</td><td>${p.updated}</td>
              <td><button class="btn-link" onclick="enterProject('${p.id}')">进入项目</button></td>
            </tr>`).join('')}
          </tbody>
        </table></div>
      </div>
      <div class="card">
        <div class="card-title">最近实验记录</div>
        <div class="table-wrap"><table>
          <thead><tr><th>实验名称</th><th>所属项目</th><th>类型</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>${EXPERIMENTS.slice(0, 4).map(e => `
            <tr>
              <td>${e.name}</td><td>${getProject(e.projectId).name}</td>
              <td>${e.type}</td><td>${tagHtml(e.status, EXPERIMENT_STATUS)}</td>
              <td><button class="btn-link" onclick="viewExperiment('${e.id}')">查看</button></td>
            </tr>`).join('')}
          </tbody>
        </table></div>
      </div>
    </div>
    <div class="grid-2 section">
      <div class="card">
        <div class="card-title">待处理事项</div>
        <div class="table-wrap"><table>
          <thead><tr><th>类型</th><th>标题</th><th>所属项目</th><th>时间</th><th>操作</th></tr></thead>
          <tbody>${TODOS.map(t => `
            <tr>
              <td>${t.type}</td><td>${t.title}</td><td>${t.project}</td><td>${t.time}</td>
              <td><button class="btn-link" onclick="navigate('${t.target}',{experimentId:'${t.targetId}'})">${t.action}</button></td>
            </tr>`).join('')}
          </tbody>
        </table></div>
      </div>
      <div class="card">
        <div class="card-title">AI 助手快捷入口</div>
        <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px">快速整理实验记录、生成记录初稿、检查记录完整性。</p>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" onclick="navigate('ai')">打开 AI 助手</button>
          <button class="btn" onclick="navigate('ai')">从描述生成实验记录</button>
        </div>
      </div>
    </div>`;
}

function renderProjects() {
  const filtered = PROJECTS.filter(p =>
    !state.projectFilter || p.name.includes(state.projectFilter) || p.code.includes(state.projectFilter) || p.leader.includes(state.projectFilter)
  );
  return `
    <div class="page-header"><h1 class="page-title">项目管理</h1><p class="page-desc">查看、新建、搜索、编辑、归档项目</p></div>
    <div class="toolbar">
      <input type="search" placeholder="搜索项目名称、项目编号、负责人、关键词" value="${state.projectFilter}"
        oninput="state.projectFilter=this.value;render()" />
      <select><option>全部状态</option><option>进行中</option><option>未开始</option><option>暂停</option><option>已完成</option><option>已归档</option></select>
      <select><option>我负责的 / 我参与的</option><option>我负责的</option><option>我参与的</option></select>
      <button class="btn btn-primary" onclick="openNewProjectModal()">新建项目</button>
    </div>
    <div class="card">
      <div class="table-wrap"><table>
        <thead><tr>
          <th>项目名称</th><th>项目编号</th><th>状态</th><th>负责人</th><th>成员数</th><th>实验记录数</th><th>最近更新</th><th>操作</th>
        </tr></thead>
        <tbody>${filtered.map(p => `
          <tr>
            <td><strong>${p.name}</strong></td><td>${p.code}</td>
            <td>${tagHtml(p.status, PROJECT_STATUS)}</td>
            <td>${p.leader}</td><td>${p.members}</td><td>${p.experiments}</td><td>${p.updated}</td>
            <td class="td-actions">
              <button class="btn-link" onclick="enterProject('${p.id}')">进入项目</button>
              <button class="btn-link" onclick="openEditProjectModal('${p.id}')">编辑</button>
              <button class="btn-link" onclick="showToast('项目已归档')">归档</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table></div>
    </div>`;
}

function renderCurrentProject() {
  if (!state.currentProjectId) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">📂</div>
        <h3>当前未选择项目</h3>
        <p>你需要先选择一个项目，才能查看项目概览、时间线和实验记录。</p>
        <button class="btn btn-primary" onclick="navigate('projects')">前往项目管理</button>
        <div style="margin-top:32px;text-align:left;max-width:400px;margin-left:auto;margin-right:auto">
          <div class="card-title">最近访问项目</div>
          <ul style="list-style:none">${PROJECTS.slice(0,3).map(p =>
            `<li style="padding:8px 0;border-bottom:1px solid var(--border)">
              <button class="btn-link" onclick="enterProject('${p.id}')">${p.name}</button>
            </li>`).join('')}
          </ul>
        </div>
      </div>`;
  }
  const p = getProject(state.currentProjectId);
  const exps = getProjectExperiments(state.currentProjectId);
  const tabs = [
    { id: 'overview', label: '概览' },
    { id: 'timeline', label: '时间线' },
    { id: 'experiments', label: '实验记录' },
    { id: 'members', label: '成员' },
  ];
  let tabContent = '';
  switch (state.currentProjectTab) {
    case 'overview': tabContent = renderProjectOverview(p, exps); break;
    case 'timeline': tabContent = renderProjectTimeline(exps); break;
    case 'experiments': tabContent = renderProjectExperiments(exps); break;
    case 'members': tabContent = renderProjectMembers(); break;
  }
  return `
    <div class="project-header">
      <div class="project-header-top">
        <div>
          <h2>${p.name} ${tagHtml(p.status, PROJECT_STATUS)}</h2>
          <div class="project-meta" style="margin-top:8px">
            <span>负责人：${p.leader}</span><span>成员：${p.members} 人</span>
            <span>项目编号：${p.code}</span><span>最近更新：${p.updated} 14:30</span>
          </div>
        </div>
        <div class="project-actions">
          <button class="btn" onclick="openProjectSwitcher()">切换项目</button>
          <button class="btn" onclick="openEditProjectModal('${p.id}')">编辑项目</button>
          <button class="btn btn-primary" onclick="startNewExperiment()">新建实验</button>
        </div>
      </div>
    </div>
    <div class="tabs">${tabs.map(t =>
      `<button class="tab ${state.currentProjectTab === t.id ? 'active' : ''}"
        onclick="navigate('current-project',{tab:'${t.id}'})">${t.label}</button>`).join('')}
    </div>
    ${tabContent}`;
}

function renderProjectOverview(p, exps) {
  const completed = exps.filter(e => e.status === '已完成').length;
  const ongoing = exps.filter(e => e.status === '进行中').length;
  const pending = exps.filter(e => e.status === '待处理').length;
  return `
    <div class="grid-2 section">
      <div class="card">
        <div class="card-title">项目基本信息</div>
        <div style="font-size:13px;line-height:2">
          <div><strong>项目名称：</strong>${p.name}</div>
          <div><strong>项目编号：</strong>${p.code}</div>
          <div><strong>项目描述：</strong>${p.description}</div>
          <div><strong>项目状态：</strong>${tagHtml(p.status, PROJECT_STATUS)}</div>
          <div><strong>负责人：</strong>${p.leader}</div>
          <div><strong>成员：</strong>${p.members} 人</div>
          <div><strong>开始日期：</strong>${p.startDate}</div>
          <div><strong>预计结束：</strong>${p.endDate}</div>
          <div><strong>标签：</strong>${p.tags.map(t => `<span class="tag status-blue">${t}</span>`).join(' ')}</div>
        </div>
      </div>
      <div class="card">
        <div class="card-title">项目进度统计</div>
        <div class="grid-3" style="gap:12px">
          <div class="stat-card" style="cursor:default"><div class="stat-value">${exps.length}</div><div class="stat-label">实验记录总数</div></div>
          <div class="stat-card" style="cursor:default"><div class="stat-value">${completed}</div><div class="stat-label">已完成实验</div></div>
          <div class="stat-card" style="cursor:default"><div class="stat-value">${ongoing}</div><div class="stat-label">进行中实验</div></div>
          <div class="stat-card" style="cursor:default"><div class="stat-value">${pending}</div><div class="stat-label">待处理实验</div></div>
          <div class="stat-card" style="cursor:default"><div class="stat-value">${p.members}</div><div class="stat-label">项目成员</div></div>
          <div class="stat-card" style="cursor:default"><div class="stat-value">${PROJECT_ATTACHMENTS.length}</div><div class="stat-label">项目附件</div></div>
        </div>
      </div>
    </div>
    <div class="grid-2 section">
      <div class="card">
        <div class="section-header"><div class="card-title" style="margin:0">最近实验记录</div></div>
        <div class="table-wrap"><table>
          <thead><tr><th>实验名称</th><th>类型</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>${exps.slice(0, 5).map(e => `
            <tr><td>${e.name}</td><td>${e.type}</td><td>${tagHtml(e.status, EXPERIMENT_STATUS)}</td>
            <td><button class="btn-link" onclick="viewExperiment('${e.id}')">${e.status === '进行中' ? '继续编辑' : '查看'}</button></td></tr>`).join('')}
          </tbody>
        </table></div>
      </div>
      <div class="card">
        <div class="section-header">
          <div class="card-title" style="margin:0">项目附件</div>
          <button class="btn btn-sm">上传附件</button>
        </div>
        <div class="table-wrap"><table>
          <thead><tr><th>文件名</th><th>类型</th><th>大小</th><th>操作</th></tr></thead>
          <tbody>${PROJECT_ATTACHMENTS.map(a => `
            <tr><td>${a.name}</td><td>${a.type}</td><td>${a.size}</td>
            <td class="td-actions"><button class="btn-link">预览</button><button class="btn-link">下载</button></td></tr>`).join('')}
          </tbody>
        </table></div>
      </div>
    </div>
    <div class="card section">
      <div class="card-title">最近动态</div>
      <ul class="activity-list">${ACTIVITIES.map(a =>
        `<li class="activity-item"><strong>${a.user}</strong> ${a.action}「${a.target}」<span class="activity-time"> · ${a.time}</span></li>`).join('')}
      </ul>
    </div>`;
}

function renderProjectTimeline(exps) {
  const sorted = [...exps].sort((a, b) => b.date.localeCompare(a.date));
  const grouped = {};
  sorted.forEach(e => { (grouped[e.date] = grouped[e.date] || []).push(e); });
  return `
    <div class="toolbar">
      <select><option>时间范围</option></select>
      <select><option>实验类型</option></select>
      <select><option>实验状态</option></select>
      <select><option>负责人</option></select>
      <input type="search" placeholder="关键词" />
      <select style="margin-left:auto"><option>按实验日期倒序</option><option>按实验日期正序</option><option>按更新时间</option></select>
    </div>
    <div class="timeline">${Object.entries(grouped).map(([date, items]) => `
      <div class="timeline-date">${date}</div>
      ${items.map(e => `
        <div class="timeline-item">
          <h4>${e.name}</h4>
          <div class="timeline-meta">
            <span>类型：${e.type}</span><span>负责人：${e.leader}</span>
            <span>状态：${tagHtml(e.status, EXPERIMENT_STATUS)}</span>
            <span>附件：${e.attachments}</span><span>评论：${e.comments}</span>
          </div>
          <div class="timeline-summary">${e.summary}</div>
          <div class="td-actions">
            <button class="btn btn-sm" onclick="viewExperiment('${e.id}')">查看详情</button>
            <button class="btn btn-sm" onclick="navigate('experiment-edit',{experimentId:'${e.id}'})">继续编辑</button>
            <button class="btn btn-sm" onclick="showToast('已复制为新实验草稿')">复制为新实验</button>
          </div>
        </div>`).join('')}
    `).join('')}</div>`;
}

function renderProjectExperiments(exps) {
  const filtered = exps.filter(e =>
    !state.experimentFilter || e.name.includes(state.experimentFilter) || e.type.includes(state.experimentFilter)
  );
  return `
    <div class="toolbar">
      <input type="search" placeholder="搜索实验名称、实验内容、标签、附件名" value="${state.experimentFilter}"
        oninput="state.experimentFilter=this.value;render()" />
      <select><option>实验类型</option></select>
      <select><option>状态</option></select>
      <select><option>负责人</option></select>
      <button class="btn btn-primary" onclick="startNewExperiment()">新建实验记录</button>
    </div>
    <div class="card">
      <div class="table-wrap"><table>
        <thead><tr>
          <th>实验名称</th><th>实验类型</th><th>状态</th><th>负责人</th><th>实验日期</th><th>模板来源</th><th>附件数</th><th>最近修改</th><th>操作</th>
        </tr></thead>
        <tbody>${filtered.map(e => `
          <tr>
            <td><strong>${e.name}</strong></td><td>${e.type}</td>
            <td>${tagHtml(e.status, EXPERIMENT_STATUS)}</td>
            <td>${e.leader}</td><td>${e.date}</td><td>${e.template}</td>
            <td>${e.attachments}</td><td>${e.updated}</td>
            <td class="td-actions">
              <button class="btn-link" onclick="viewExperiment('${e.id}')">查看</button>
              <button class="btn-link" onclick="navigate('experiment-edit',{experimentId:'${e.id}'})">编辑</button>
              <button class="btn-link" onclick="showToast('已复制为新草稿')">复制</button>
              <button class="btn-link btn-danger" onclick="showToast('记录已删除')">删除</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table></div>
    </div>`;
}

function renderProjectMembers() {
  return `
    <div class="toolbar">
      <button class="btn btn-primary" onclick="openInviteModal()">邀请成员</button>
      <span style="color:var(--text-secondary);font-size:13px;margin-left:auto">完整权限配置请前往 <button class="btn-link" onclick="navigate('team')">团队管理</button></span>
    </div>
    <div class="card">
      <div class="table-wrap"><table>
        <thead><tr><th>姓名</th><th>邮箱</th><th>项目角色</th><th>权限摘要</th><th>加入时间</th><th>最近活跃</th><th>操作</th></tr></thead>
        <tbody>${TEAM_MEMBERS.map(m => `
          <tr>
            <td>${m.name}</td><td>${m.email}</td><td>${m.role}</td><td>${m.permissions}</td>
            <td>${m.joined}</td><td>${m.active}</td>
            <td><button class="btn-link" onclick="navigate('team')">查看权限</button></td>
          </tr>`).join('')}
        </tbody>
      </table></div>
    </div>`;
}

function renderNewExperiment() {
  if (!state.currentProjectId) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3>请先选择一个项目</h3>
        <p>请先选择一个项目后再新建实验记录。</p>
        <button class="btn btn-primary" onclick="navigate('projects')">前往项目管理</button>
      </div>`;
  }
  const p = getProject(state.currentProjectId);
  if (state.newExperimentStep === 'choose') {
    return `
      <div class="breadcrumb"><a onclick="navigate('current-project',{tab:'experiments'})">当前项目</a> / ${p.name} / 新建实验记录</div>
      <div class="page-header" style="text-align:center"><h1 class="page-title">新建实验记录</h1><p class="page-desc">请选择创建方式 · 所属项目：${p.name}</p></div>
      <div class="choice-cards">
        <div class="choice-card" onclick="navigate('experiment-new',{step:'blank'})">
          <div class="choice-card-icon">📝</div>
          <h3>空白记录</h3>
          <p>不使用模板，自由填写实验内容。适合临时实验、探索性实验或非标准化记录。</p>
          <button class="btn btn-primary">使用空白记录</button>
        </div>
        <div class="choice-card" onclick="navigate('experiment-new',{step:'template'})">
          <div class="choice-card-icon">📋</div>
          <h3>已有模板</h3>
          <p>从模板中心选择已有实验模板，快速生成结构化实验记录。适合 PCR、qPCR、Western blot 等标准化实验。</p>
          <button class="btn btn-primary">选择模板</button>
        </div>
      </div>`;
  }
  if (state.newExperimentStep === 'template') {
    return `
      <div class="breadcrumb"><a onclick="navigate('experiment-new',{step:'choose'})">新建实验记录</a> / 选择模板</div>
      <div class="page-header"><h1 class="page-title">选择实验模板</h1></div>
      <div class="toolbar">
        <input type="search" placeholder="搜索模板名称、实验类型" />
        <select><option>模板分类</option></select>
        <select><option>实验类型</option></select>
        <select><option>我的模板 / 实验室模板</option></select>
      </div>
      <div class="template-grid">${TEMPLATES.map(t => `
        <div class="template-card">
          <h4>${t.name}</h4>
          <p>${t.description}</p>
          <div class="template-card-meta">${t.type} · ${t.category} · ${t.creator} · 使用 ${t.uses} 次</div>
          <div class="td-actions">
            <button class="btn btn-sm">预览</button>
            <button class="btn btn-sm btn-primary" onclick="useTemplate('${t.id}')">使用</button>
          </div>
        </div>`).join('')}
      </div>`;
  }
  return renderExperimentEdit(true);
}

function renderExperimentEdit(isNew) {
  const e = state.currentExperimentId ? getExperiment(state.currentExperimentId) : null;
  const p = getProject(state.currentProjectId);
  const isPCR = state.selectedTemplateId === 't1' || e?.template === 'PCR 模板';
  const sections = isPCR
    ? ['基础信息', '反应体系', 'PCR 程序', '电泳结果', '实验结论', '附件']
    : ['基础信息', '实验目的', '实验步骤', '实验结果', '实验结论', '附件'];
  return `
    <div class="breadcrumb">
      <a onclick="navigate('current-project',{tab:'experiments'})">当前项目</a> /
      ${p.name} / 实验记录 / ${isNew ? '新建实验记录' : '编辑实验记录'}
    </div>
    <div class="edit-layout">
      <div class="edit-nav">${sections.map((s, i) =>
        `<button class="edit-nav-item ${i === 0 ? 'active' : ''}">${s}</button>`).join('')}</div>
      <div class="edit-main">
        <h3 style="margin-bottom:20px">${isNew ? '新建' : '编辑'}实验记录</h3>
        <div class="form-group"><label>实验名称 *</label><input value="${e?.name || ''}" placeholder="请输入实验名称" /></div>
        <div class="grid-2">
          <div class="form-group"><label>实验编号</label><input value="${e?.code || 'EXP-2026-自动'}" readonly /></div>
          <div class="form-group"><label>实验类型 *</label>
            <select><option ${e?.type === 'PCR' ? 'selected' : ''}>PCR</option><option>qPCR</option><option>Western blot</option><option>细胞实验</option><option>其他</option></select>
          </div>
        </div>
        <div class="grid-2">
          <div class="form-group"><label>实验日期</label><input type="date" value="${e?.date || '2026-07-07'}" /></div>
          <div class="form-group"><label>负责人</label><input value="${CURRENT_USER.name}" /></div>
        </div>
        <div class="form-group"><label>实验目的</label><textarea placeholder="描述实验目的...">${isPCR ? '扩增 GFP 片段用于后续克隆' : ''}</textarea></div>
        ${isPCR ? `
          <div class="form-group"><label>反应体系</label>
            <div class="table-wrap"><table>
              <thead><tr><th>组分</th><th>体积</th></tr></thead>
              <tbody>
                <tr><td>Template DNA</td><td>1 μL</td></tr>
                <tr><td>Forward Primer</td><td>1 μL</td></tr>
                <tr><td>Reverse Primer</td><td>1 μL</td></tr>
                <tr><td>2x Master Mix</td><td>25 μL</td></tr>
                <tr><td>ddH2O</td><td>22 μL</td></tr>
                <tr><td><strong>Total</strong></td><td><strong>50 μL</strong></td></tr>
              </tbody>
            </table></div>
          </div>
          <div class="form-group"><label>PCR 程序</label><textarea>95℃ 5min → (95℃ 30s, 58℃ 30s, 72℃ 45s) × 35 → 72℃ 10min</textarea></div>
          <div class="form-group"><label>电泳结果</label><textarea>观察到约 750 bp 条带，条带清晰</textarea></div>
        ` : `
          <div class="form-group"><label>实验步骤</label><textarea placeholder="记录实验步骤..."></textarea></div>
          <div class="form-group"><label>实验结果</label><textarea placeholder="记录实验结果..."></textarea></div>
        `}
        <div class="form-group"><label>实验结论</label><textarea placeholder="总结实验结论...">${isPCR ? 'PCR 扩增成功，产物大小符合预期' : ''}</textarea></div>
        <div style="display:flex;gap:10px;margin-top:20px">
          <button class="btn" onclick="showToast('草稿已保存')">保存草稿</button>
          <button class="btn" onclick="showToast('已保存')">保存并继续</button>
          <button class="btn btn-primary" onclick="showToast('记录已完成');navigate('current-project',{tab:'experiments'})">完成记录</button>
          <button class="btn" onclick="navigate('current-project',{tab:'experiments'})">取消</button>
        </div>
      </div>
      <div class="edit-sidebar">
        <h4 style="margin-bottom:16px">记录属性</h4>
        <div style="font-size:13px;line-height:2;margin-bottom:20px">
          <div>状态：${tagHtml('草稿', EXPERIMENT_STATUS)}</div>
          <div>所属项目：${p.name}</div>
          <div>负责人：${CURRENT_USER.name}</div>
          <div>实验日期：2026-07-07</div>
          <div>模板来源：${state.selectedTemplateId ? TEMPLATES.find(t=>t.id===state.selectedTemplateId)?.name || '空白记录' : e?.template || '空白记录'}</div>
        </div>
        <h4 style="margin-bottom:12px">实验附件</h4>
        <button class="btn btn-sm" style="margin-bottom:12px;width:100%">上传附件</button>
        <div style="font-size:12px;color:var(--text-secondary)">支持图片、PDF、Excel、CSV、ZIP 等实验相关文件</div>
      </div>
    </div>`;
}

function renderExperimentDetail() {
  const e = getExperiment(state.currentExperimentId);
  if (!e) return '<div class="empty-state"><h3>实验记录不存在</h3></div>';
  const p = getProject(e.projectId);
  const isPCR = e.template === 'PCR 模板';
  return `
    <div class="breadcrumb">
      <a onclick="navigate('current-project',{tab:'experiments'})">当前项目</a> /
      ${p.name} / 实验记录 / ${e.name}
    </div>
    <div class="detail-header">
      <h2>${e.name} ${tagHtml(e.status, EXPERIMENT_STATUS)}</h2>
      <div class="detail-meta">
        <span>实验类型：${e.type}</span><span>所属项目：${p.name}</span>
        <span>负责人：${e.leader}</span><span>实验日期：${e.date}</span>
      </div>
      <div class="td-actions">
        <button class="btn btn-primary" onclick="navigate('experiment-edit',{experimentId:'${e.id}'})">编辑</button>
        <button class="btn" onclick="showToast('已复制为新记录')">复制为新记录</button>
        <button class="btn" onclick="showToast('导出中...')">导出</button>
        <button class="btn btn-danger" onclick="showToast('记录已删除')">删除</button>
        <button class="btn" onclick="navigate('current-project',{tab:'experiments'})">返回列表</button>
      </div>
    </div>
    <div class="grid-2 section">
      <div class="card">
        <div class="card-title">基本信息</div>
        <div style="font-size:13px;line-height:2">
          <div><strong>实验编号：</strong>${e.code}</div>
          <div><strong>实验类型：</strong>${e.type}</div>
          <div><strong>负责人：</strong>${e.leader}</div>
          <div><strong>实验日期：</strong>${e.date}</div>
          <div><strong>模板来源：</strong>${e.template}</div>
          <div><strong>最近修改：</strong>${e.updated}</div>
        </div>
      </div>
      <div class="card">
        <div class="card-title">实验附件</div>
        <div class="table-wrap"><table>
          <thead><tr><th>文件名</th><th>类型</th><th>上传者</th><th>操作</th></tr></thead>
          <tbody>
            <tr><td>电泳图.jpg</td><td>图片</td><td>李同学</td><td><button class="btn-link">预览</button><button class="btn-link">下载</button></td></tr>
            <tr><td>原始数据.csv</td><td>CSV</td><td>李同学</td><td><button class="btn-link">预览</button><button class="btn-link">下载</button></td></tr>
          </tbody>
        </table></div>
      </div>
    </div>
    <div class="card section">
      <div class="card-title">实验正文</div>
      ${isPCR ? `
        <div class="detail-section"><h3>实验目的</h3><div class="detail-content">扩增 GFP 片段用于后续克隆实验</div></div>
        <div class="detail-section"><h3>反应体系</h3><div class="detail-content">Template DNA 1μL, Forward/Reverse Primer 各 1μL, 2x Master Mix 25μL, ddH2O 22μL, Total 50μL</div></div>
        <div class="detail-section"><h3>PCR 程序</h3><div class="detail-content">95℃ 5min → (95℃ 30s, 58℃ 30s, 72℃ 45s) × 35 → 72℃ 10min</div></div>
        <div class="detail-section"><h3>电泳结果</h3><div class="detail-content">${e.summary}</div></div>
        <div class="detail-section"><h3>实验结论</h3><div class="detail-content">PCR 扩增成功，产物大小约 750 bp，符合预期</div></div>
      ` : `
        <div class="detail-section"><h3>实验目的</h3><div class="detail-content">验证实验结果</div></div>
        <div class="detail-section"><h3>实验步骤</h3><div class="detail-content">按标准操作流程进行实验</div></div>
        <div class="detail-section"><h3>实验结果</h3><div class="detail-content">${e.summary}</div></div>
        <div class="detail-section"><h3>实验结论</h3><div class="detail-content">实验完成，结果符合预期</div></div>
      `}
    </div>
    <div class="card">
      <div class="card-title">评论区</div>
      <div class="comment">
        <div class="comment-header"><span>张老师</span><span>2026-07-07 11:00</span></div>
        <div class="comment-body">条带清晰，建议补充 Marker 说明。</div>
      </div>
      <div style="margin-top:12px">
        <textarea placeholder="发表评论..." style="width:100%;padding:10px;border:1px solid var(--border);border-radius:var(--radius);min-height:60px;font-family:inherit"></textarea>
        <button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="showToast('评论已发表')">发表评论</button>
      </div>
    </div>`;
}

function renderTemplates() {
  return `
    <div class="page-header"><h1 class="page-title">模板中心</h1><p class="page-desc">管理实验记录模板</p></div>
    <div class="toolbar">
      <input type="search" placeholder="搜索模板名称、实验类型、创建者" />
      <select><option>模板分类</option><option>分子生物学</option><option>细胞实验</option><option>蛋白实验</option></select>
      <select><option>实验类型</option></select>
      <select><option>我的模板 / 实验室模板</option></select>
      <button class="btn btn-primary" onclick="showToast('新建模板功能')">新建模板</button>
    </div>
    <div class="card">
      <div class="table-wrap"><table>
        <thead><tr><th>模板名称</th><th>实验类型</th><th>分类</th><th>创建者</th><th>使用次数</th><th>最近更新</th><th>操作</th></tr></thead>
        <tbody>${TEMPLATES.map(t => `
          <tr>
            <td><strong>${t.name}</strong></td><td>${t.type}</td><td>${t.category}</td>
            <td>${t.creator}</td><td>${t.uses}</td><td>${t.updated}</td>
            <td class="td-actions">
              <button class="btn-link" onclick="openTemplatePreview('${t.id}')">预览</button>
              <button class="btn-link">编辑</button>
              <button class="btn-link" onclick="useTemplateFromCenter('${t.id}')">使用</button>
              <button class="btn-link btn-danger">删除</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table></div>
    </div>`;
}

function renderSearch() {
  const tabs = ['all', 'projects', 'experiments', 'templates', 'members', 'attachments'];
  const tabLabels = { all: '全部', projects: '项目', experiments: '实验记录', templates: '模板', members: '成员', attachments: '附件' };
  const tab = state.searchTab;
  let results = '';
  if (tab === 'all' || tab === 'projects') {
    results += `<div class="section"><h3 style="margin-bottom:12px">项目</h3><div class="table-wrap"><table>
      <thead><tr><th>项目名称</th><th>编号</th><th>负责人</th><th>状态</th><th>操作</th></tr></thead>
      <tbody>${SEARCH_RESULTS.projects.map(p => `
        <tr><td>${p.name}</td><td>${p.code}</td><td>${p.leader}</td><td>${tagHtml(p.status, PROJECT_STATUS)}</td>
        <td><button class="btn-link" onclick="enterProject('${p.id}')">进入项目</button></td></tr>`).join('')}
      </tbody></table></div></div>`;
  }
  if (tab === 'all' || tab === 'experiments') {
    results += `<div class="section"><h3 style="margin-bottom:12px">实验记录</h3><div class="table-wrap"><table>
      <thead><tr><th>实验名称</th><th>所属项目</th><th>类型</th><th>状态</th><th>操作</th></tr></thead>
      <tbody>${SEARCH_RESULTS.experiments.map(e => `
        <tr><td>${e.name}</td><td>${getProject(e.projectId).name}</td><td>${e.type}</td>
        <td>${tagHtml(e.status, EXPERIMENT_STATUS)}</td>
        <td><button class="btn-link" onclick="viewExperiment('${e.id}')">查看</button></td></tr>`).join('')}
      </tbody></table></div></div>`;
  }
  if (tab === 'all' || tab === 'templates') {
    results += `<div class="section"><h3 style="margin-bottom:12px">模板</h3><div class="table-wrap"><table>
      <thead><tr><th>模板名称</th><th>类型</th><th>创建者</th><th>操作</th></tr></thead>
      <tbody>${SEARCH_RESULTS.templates.map(t => `
        <tr><td>${t.name}</td><td>${t.type}</td><td>${t.creator}</td>
        <td><button class="btn-link" onclick="openTemplatePreview('${t.id}')">预览</button>
        <button class="btn-link" onclick="useTemplateFromCenter('${t.id}')">使用</button></td></tr>`).join('')}
      </tbody></table></div></div>`;
  }
  if (tab === 'all' || tab === 'members') {
    results += `<div class="section"><h3 style="margin-bottom:12px">成员</h3><div class="table-wrap"><table>
      <thead><tr><th>姓名</th><th>邮箱</th><th>角色</th><th>操作</th></tr></thead>
      <tbody>${SEARCH_RESULTS.members.map(m => `
        <tr><td>${m.name}</td><td>${m.email}</td><td>${m.role}</td>
        <td><button class="btn-link" onclick="navigate('team')">查看项目权限</button></td></tr>`).join('')}
      </tbody></table></div></div>`;
  }
  if (tab === 'all' || tab === 'attachments') {
    results += `<div class="section"><h3 style="margin-bottom:12px">附件</h3><div class="table-wrap"><table>
      <thead><tr><th>文件名</th><th>类型</th><th>所属位置</th><th>操作</th></tr></thead>
      <tbody>${SEARCH_RESULTS.attachments.map(a => `
        <tr><td>${a.name}</td><td>${a.type}</td><td>${a.location}</td>
        <td><button class="btn-link">预览</button><button class="btn-link">下载</button>
        <button class="btn-link" onclick="navigate('current-project',{tab:'overview'})">定位</button></td></tr>`).join('')}
      </tbody></table></div></div>`;
  }
  return `
    <div class="page-header"><h1 class="page-title">搜索中心</h1><p class="page-desc">全局搜索项目、实验记录、模板、成员、附件</p></div>
    <div class="toolbar">
      <input type="search" placeholder="输入关键词搜索项目、实验记录、模板、成员、附件" style="flex:1;max-width:500px" value="GFP" />
      <select><option>对象类型</option></select>
      <select><option>所属项目</option></select>
      <select><option>日期范围</option></select>
    </div>
    <div class="tabs search-tabs">${tabs.map(t =>
      `<button class="tab ${tab === t ? 'active' : ''}" onclick="navigate('search',{searchTab:'${t}'})">${tabLabels[t]}</button>`).join('')}
    </div>
    ${results}`;
}

function renderTeam() {
  const p = getProject(state.currentProjectId);
  const reviewers = TEAM_MEMBERS.filter(m => m.role === '审核者').length;
  const observers = TEAM_MEMBERS.filter(m => m.role === '观察者').length;
  return `
    <div class="page-header"><h1 class="page-title">团队管理</h1><p class="page-desc">按项目展示和管理成员权限</p></div>
    <div class="toolbar">
      <label>选择项目：</label>
      <select onchange="setCurrentProject(this.value);render()">${PROJECTS.map(pr =>
        `<option value="${pr.id}" ${pr.id === state.currentProjectId ? 'selected' : ''}>${pr.name}</option>`).join('')}
      </select>
      <button class="btn btn-primary" onclick="openInviteModal()">邀请成员</button>
    </div>
    <div class="card section">
      <div class="card-title">项目权限概览 · ${p.name}</div>
      <div style="display:flex;gap:24px;flex-wrap:wrap;font-size:13px">
        <span>项目编号：${p.code}</span><span>状态：${tagHtml(p.status, PROJECT_STATUS)}</span>
        <span>负责人：${p.leader}</span><span>成员数：${p.members}</span>
        <span>审核者：${reviewers}</span><span>观察者：${observers}</span>
      </div>
    </div>
    <div class="card section">
      <div class="card-title">项目成员</div>
      <div class="table-wrap"><table>
        <thead><tr><th>姓名</th><th>邮箱</th><th>项目角色</th><th>权限</th><th>加入时间</th><th>最近活跃</th><th>操作</th></tr></thead>
        <tbody>${TEAM_MEMBERS.map(m => `
          <tr>
            <td>${m.name}</td><td>${m.email}</td><td>${m.role}</td><td>${m.permissions}</td>
            <td>${m.joined}</td><td>${m.active}</td>
            <td class="td-actions">
              <button class="btn-link" onclick="openPermModal('${m.name}')">修改权限</button>
              <button class="btn-link btn-danger">移除</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table></div>
    </div>
    <div class="card">
      <div class="card-title">权限矩阵</div>
      <div class="table-wrap"><table class="perm-table">
        <thead><tr><th>权限项</th><th>项目负责人</th><th>项目成员</th><th>审核者</th><th>观察者</th></tr></thead>
        <tbody>
          <tr><td>查看项目</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>
          <tr><td>编辑项目信息</td><td>✓</td><td>—</td><td>—</td><td>—</td></tr>
          <tr><td>新建实验记录</td><td>✓</td><td>✓</td><td>可选</td><td>—</td></tr>
          <tr><td>编辑自己的实验记录</td><td>✓</td><td>✓</td><td>—</td><td>—</td></tr>
          <tr><td>完成/审核实验记录</td><td>✓</td><td>—</td><td>✓</td><td>—</td></tr>
          <tr><td>管理项目成员</td><td>✓</td><td>—</td><td>—</td><td>—</td></tr>
        </tbody>
      </table></div>
    </div>`;
}

function renderAI() {
  const p = getProject(state.currentProjectId);
  const funcs = [
    { id: 'generate', label: '生成实验记录' },
    { id: 'format', label: '整理实验记录' },
    { id: 'summary', label: '生成实验摘要' },
    { id: 'check', label: '检查记录完整性' },
    { id: 'analyze', label: '分析实验问题' },
  ];
  const outputs = {
    generate: `实验类型：PCR\n实验目的：扩增 GFP 片段\n模板：Sample-001\n引物：GFP-F / GFP-R\n退火温度：58℃\n循环数：35\n实验结果：观察到约 750 bp 条带\n实验结论：PCR 扩增成功`,
    format: `实验目的\n扩增目标基因片段\n\n实验材料\n模板 DNA、引物、Master Mix\n\n实验步骤\n1. 配制反应体系\n2. 上机 PCR\n3. 琼脂糖凝胶电泳\n\n实验结果\n750 bp 条带清晰\n\n实验结论\n扩增成功`,
    summary: `实验目的：验证 GFP 片段扩增\n关键条件：58℃ 退火，35 循环\n主要结果：750 bp 条带\n结论：扩增成功\n后续建议：进行克隆连接`,
    check: `完整性评分：82/100\n\n建议补充：\n1. 未上传电泳结果图片\n2. 实验结论较简略\n3. PCR 循环条件缺少延伸时间`,
    analyze: `可能问题：\n1. 非特异性条带可能由引物二聚体引起\n2. 建议降低 Mg²⁺ 浓度或提高退火温度\n3. 建议增加阴性对照`,
  };
  return `
    <div class="page-header"><h1 class="page-title">AI 助手</h1><p class="page-desc">辅助生成、整理、检查实验记录</p></div>
    <div class="toolbar">
      <label>关联项目：</label>
      <select onchange="setCurrentProject(this.value)">${PROJECTS.map(pr =>
        `<option value="${pr.id}" ${pr.id === state.currentProjectId ? 'selected' : ''}>${pr.name}</option>`).join('')}
      </select>
    </div>
    <div class="ai-layout">
      <div class="ai-func-list">${funcs.map(f =>
        `<button class="ai-func-item ${state.aiFunction === f.id ? 'active' : ''}"
          onclick="state.aiFunction='${f.id}';render()">${f.label}</button>`).join('')}
      </div>
      <div class="ai-input">
        <h4 style="margin-bottom:12px">输入</h4>
        <textarea placeholder="输入自然语言实验描述，或粘贴实验记录...">今天做了 PCR，用 Sample-001 做模板，引物是 GFP-F 和 GFP-R，退火温度 58℃，循环 35 次，跑胶后有一条约 750 bp 的条带。</textarea>
        <button class="btn btn-primary" style="margin-top:12px;align-self:flex-start" onclick="showToast('AI 正在生成...');render()">生成</button>
      </div>
      <div class="ai-output">
        <h4 style="margin-bottom:12px">输出</h4>
        <pre>${outputs[state.aiFunction]}</pre>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn btn-primary" onclick="navigate('experiment-new',{step:'blank'})">生成实验记录草稿</button>
          <button class="btn" onclick="showToast('已复制')">复制内容</button>
          <button class="btn" onclick="showToast('重新生成中...')">重新生成</button>
        </div>
      </div>
    </div>`;
}

/* ========== Modals ========== */

function openNewProjectModal() {
  openModal(`
    <div class="modal-header"><h3>新建项目</h3><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div class="form-group"><label>项目名称 *</label><input placeholder="请输入项目名称" /></div>
      <div class="form-group"><label>项目编号</label><input value="PRJ-2026-自动" readonly /></div>
      <div class="form-group"><label>项目描述</label><textarea placeholder="项目描述"></textarea></div>
      <div class="grid-2">
        <div class="form-group"><label>项目状态</label><select><option selected>进行中</option><option>未开始</option></select></div>
        <div class="form-group"><label>负责人</label><input value="${CURRENT_USER.name}" /></div>
      </div>
      <div class="grid-2">
        <div class="form-group"><label>开始日期</label><input type="date" value="2026-07-07" /></div>
        <div class="form-group"><label>预计结束日期</label><input type="date" /></div>
      </div>
      <div class="form-group"><label>项目标签</label><input placeholder="多个标签用逗号分隔" /></div>
      <div class="form-group"><label>项目附件</label><button class="btn btn-sm">上传附件</button></div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">取消</button>
      <button class="btn" onclick="showToast('项目已保存');closeModal()">保存</button>
      <button class="btn btn-primary" onclick="showToast('项目已创建');closeModal()">保存并进入项目</button>
    </div>`, true);
}

function openEditProjectModal(id) {
  const p = getProject(id);
  openModal(`
    <div class="modal-header"><h3>编辑项目</h3><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div class="form-group"><label>项目名称</label><input value="${p.name}" /></div>
      <div class="form-group"><label>项目编号</label><input value="${p.code}" readonly /></div>
      <div class="form-group"><label>项目描述</label><textarea>${p.description}</textarea></div>
      <div class="grid-2">
        <div class="form-group"><label>项目状态</label><select><option selected>${p.status}</option></select></div>
        <div class="form-group"><label>负责人</label><input value="${p.leader}" /></div>
      </div>
      <div class="form-group"><label>项目附件</label>
        <div class="table-wrap"><table><tbody>
          ${PROJECT_ATTACHMENTS.slice(0,2).map(a => `<tr><td>${a.name}</td><td><button class="btn-link">删除</button></td></tr>`).join('')}
        </tbody></table></div>
        <button class="btn btn-sm" style="margin-top:8px">上传附件</button>
      </div>
      <div style="font-size:12px;color:var(--text-secondary);margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
        创建人：${p.leader} · 创建时间：${p.startDate} · 最近修改：${p.updated}
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">取消</button>
      <button class="btn btn-primary" onclick="showToast('项目已更新');closeModal()">保存</button>
    </div>`, true);
}

function openProjectSwitcher() {
  openModal(`
    <div class="modal-header"><h3>切换项目</h3><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <input type="search" placeholder="搜索项目" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);margin-bottom:16px" />
      <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px">最近访问项目</div>
      ${PROJECTS.map(p => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;border:1px solid var(--border);border-radius:var(--radius);margin-bottom:8px">
          <div>
            <strong>${p.name}</strong> ${tagHtml(p.status, PROJECT_STATUS)}
            <div style="font-size:12px;color:var(--text-secondary);margin-top:4px">${p.leader} · 更新 ${p.updated}</div>
          </div>
          <button class="btn btn-sm btn-primary" onclick="enterProject('${p.id}');closeModal()">切换</button>
        </div>`).join('')}
    </div>`, true);
}

function openInviteModal() {
  openModal(`
    <div class="modal-header"><h3>邀请成员</h3><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div class="form-group"><label>成员邮箱</label><input placeholder="example@lab.com" /></div>
      <div class="form-group"><label>项目角色</label>
        <select><option>项目成员</option><option>审核者</option><option>观察者</option></select>
      </div>
      <div class="form-group"><label>邀请说明</label><textarea placeholder="可选"></textarea></div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">取消</button>
      <button class="btn btn-primary" onclick="showToast('邀请已发送');closeModal()">发送邀请</button>
    </div>`);
}

function openPermModal(name) {
  openModal(`
    <div class="modal-header"><h3>修改权限 · ${name}</h3><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div class="form-group"><label>当前角色</label><input value="项目成员" readonly /></div>
      <div class="form-group"><label>新角色</label>
        <select><option>项目成员</option><option>审核者</option><option>观察者</option><option>项目负责人</option></select>
      </div>
      <div class="form-group"><label>备注</label><textarea></textarea></div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">取消</button>
      <button class="btn btn-primary" onclick="showToast('权限已更新');closeModal()">保存</button>
    </div>`);
}

function openTemplatePreview(id) {
  const t = TEMPLATES.find(x => x.id === id);
  openModal(`
    <div class="modal-header"><h3>${t.name}</h3><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div style="font-size:13px;line-height:2">
        <div><strong>实验类型：</strong>${t.type}</div>
        <div><strong>分类：</strong>${t.category}</div>
        <div><strong>描述：</strong>${t.description}</div>
        <div><strong>创建者：</strong>${t.creator}</div>
        <div><strong>使用次数：</strong>${t.uses}</div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">返回</button>
      <button class="btn btn-primary" onclick="closeModal();useTemplateFromCenter('${id}')">使用模板</button>
    </div>`, true);
}

/* ========== Actions ========== */

function enterProject(id) {
  setCurrentProject(id);
  navigate('current-project', { tab: 'overview' });
}

function viewExperiment(id) {
  const e = getExperiment(id);
  setCurrentProject(e.projectId);
  navigate('experiment-detail', { experimentId: id });
}

function startNewExperiment() {
  if (!state.currentProjectId) {
    showToast('请先选择一个项目');
    navigate('projects');
    return;
  }
  state.newExperimentStep = 'choose';
  state.selectedTemplateId = null;
  navigate('experiment-new');
}

function useTemplate(id) {
  state.selectedTemplateId = id;
  navigate('experiment-new', { step: 'blank' });
  showToast('已应用模板');
}

function useTemplateFromCenter(id) {
  if (!state.currentProjectId) {
    showToast('请先选择当前项目');
    navigate('projects');
    return;
  }
  state.selectedTemplateId = id;
  navigate('experiment-new', { step: 'blank' });
}

/* ========== Main Render ========== */

function renderSidebar() {
  const nav = document.getElementById('sidebar-nav');
  nav.innerHTML = NAV_ITEMS.map(item => `
    <button class="nav-item ${state.page === item.id || (item.id === 'current-project' && ['experiment-new','experiment-edit','experiment-detail'].includes(state.page)) ? 'active' : ''}"
      onclick="navigate('${item.id}')">
      <span class="nav-icon">${item.icon}</span>${item.label}
    </button>`).join('');
}

function renderContent() {
  const main = document.getElementById('main-content');
  const pages = {
    'dashboard': renderDashboard,
    'projects': renderProjects,
    'current-project': renderCurrentProject,
    'templates': renderTemplates,
    'search': renderSearch,
    'team': renderTeam,
    'ai': renderAI,
    'experiment-new': renderNewExperiment,
    'experiment-edit': () => renderExperimentEdit(false),
    'experiment-detail': renderExperimentDetail,
  };
  const renderer = pages[state.page] || renderDashboard;
  main.innerHTML = renderer();
  renderSidebar();
}

function render() {
  renderContent();
}

function init() {
  document.getElementById('btn-project-switch').addEventListener('click', openProjectSwitcher);

  document.getElementById('btn-new').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('new-menu').classList.toggle('hidden');
  });

  document.getElementById('new-menu').addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    document.getElementById('new-menu').classList.add('hidden');
    if (action === 'new-project') openNewProjectModal();
    else if (action === 'new-experiment') startNewExperiment();
    else if (action === 'new-template') { navigate('templates'); showToast('请在此新建模板'); }
  });

  document.getElementById('global-search').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') navigate('search');
  });

  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  });

  document.addEventListener('click', () => {
    document.getElementById('new-menu').classList.add('hidden');
  });

  render();
}

document.addEventListener('DOMContentLoaded', init);

// Expose globals for inline handlers
window.navigate = navigate;
window.render = render;
window.enterProject = enterProject;
window.viewExperiment = viewExperiment;
window.startNewExperiment = startNewExperiment;
window.useTemplate = useTemplate;
window.useTemplateFromCenter = useTemplateFromCenter;
window.openNewProjectModal = openNewProjectModal;
window.openEditProjectModal = openEditProjectModal;
window.openProjectSwitcher = openProjectSwitcher;
window.openInviteModal = openInviteModal;
window.openPermModal = openPermModal;
window.openTemplatePreview = openTemplatePreview;
window.closeModal = closeModal;
window.showToast = showToast;
window.setCurrentProject = setCurrentProject;
window.state = state;
