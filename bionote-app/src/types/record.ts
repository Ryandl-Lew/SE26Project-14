import type { Status, ExperimentType } from './common';

export interface ExperimentRecord {
  id: string;
  expNo: string;
  title: string;
  type: ExperimentType;
  status: Status;
  projectId: string;
  projectName: string;
  owner: string;
  date: string;
  updatedAt: string;
  purpose: string;
  keyResult: string;
}

export interface RecordTreeNode {
  id: string;
  title: string;
  type: string;
  status: Status;
  date: string;
  pageJump: 'detail' | 'editor';
}

export interface RecordTreeGroup {
  label: string;
  count: number;
  records: RecordTreeNode[];
}

export interface ReactionComponent {
  name: string;
  code: string;
  volume: string;
  notes: string;
}

export interface RecordComment {
  author: string;
  time: string;
  content: string;
  type: '审核意见' | '版本历史' | '评论';
}

export interface RecordAttachment {
  name: string;
  type: '样品' | '试剂' | '图片' | '仪器数据';
  badge: Status | 'expiring';
}
