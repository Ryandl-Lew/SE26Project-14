import type { NavItem } from '@/types';

export const STATUS_LABELS: Record<string, string> = {
  active: '进行中',
  completed: '已完成',
  pending_review: '待审核',
  rejected: '退回修改',
  paused: '暂停',
  draft: '草稿',
};

export const STATUS_COLORS: Record<string, 'blue' | 'green' | 'amber' | 'red' | 'gray' | 'violet'> = {
  active: 'blue',
  completed: 'green',
  pending_review: 'amber',
  rejected: 'red',
  paused: 'amber',
  draft: 'gray',
};

export const ROLE_LABELS: Record<string, string> = {
  owner: '项目负责人',
  member: '项目成员',
  reviewer: '审核者',
  observer: '观察者',
};

export const ROLE_COLORS: Record<string, 'blue' | 'green' | 'amber' | 'gray'> = {
  owner: 'blue',
  member: 'green',
  reviewer: 'amber',
  observer: 'gray',
};

export const EXPERIMENT_TYPES = [
  'PCR', 'qPCR', 'Western blot', '电泳', '质粒提取',
  '酶切', '连接', '转化', '测序', '细胞传代', '其他',
] as const;

export const NAV_ITEMS: NavItem[] = [
  { section: '项目工作区', key: 'dashboard', label: '工作台', icon: '⌂', route: '/' },
  { section: '项目工作区', key: 'projects', label: '项目管理', icon: '▣', route: '/projects' },
  { section: '项目工作区', key: 'records', label: '实验记录', icon: '✎', route: '/records' },
  { section: '项目工作区', key: 'templates', label: '模板中心', icon: '▤', route: '/templates' },
  { section: '协作', key: 'search', label: '搜索中心', icon: '⌕', route: '/search' },
  { section: '协作', key: 'team', label: '团队管理', icon: '☷', route: '/team' },
  { section: '协作', key: 'ai', label: 'AI 助手', icon: 'AI', route: '/ai' },
];

/** Maps sub-pages to their parent nav key for sidebar highlighting */
export const PAGE_NAV_MAP: Record<string, string> = {
  'current-project': 'projects',
  detail: 'records',
  editor: 'records',
};

/** Parent page for back-navigation */
export const PAGE_PARENT_MAP: Record<string, string> = {
  'current-project': 'projects',
  detail: 'records',
  editor: 'records',
};
