// ── Common generic types ───────────────────────────────────

export type Status = 'active' | 'completed' | 'pending_review' | 'rejected' | 'paused' | 'draft';

export type ProjectRole = 'owner' | 'member' | 'reviewer' | 'observer';

export type ExperimentType = 'PCR' | 'qPCR' | 'Western blot' | '电泳' | '质粒提取' | '酶切' | '连接' | '转化' | '测序' | '细胞传代' | '其他';

export type TemplateCategory = '分子生物学' | '细胞生物学' | '蛋白实验' | '免疫实验' | '我的模板';

export interface PageInfo {
  page: number;
  pageSize: number;
  total: number;
}

export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

export interface NavItem {
  key: string;
  label: string;
  icon: string;
  route: string;
  section?: string;
}
