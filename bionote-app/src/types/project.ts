import type { Status, ProjectRole } from './common';

export interface Project {
  id: string;
  projectNo: string;
  name: string;
  description: string;
  status: Status;
  progress: number;
  owner: string;
  memberCount: number;
  experimentCount: number;
  updatedAt: string;
  tags: string[];
}

export interface ProjectMember {
  name: string;
  email: string;
  role: ProjectRole;
  permissions: string;
  joinedAt: string;
  lastActive: string;
}

export interface ProjectAttachment {
  name: string;
  type: 'PDF' | '图片' | 'ZIP' | 'Excel';
}

export interface ProjectActivity {
  actor: string;
  action: string;
  target: string;
  time: string;
}

export interface TimelineEntry {
  date: string;
  title: string;
  type: string;
  owner: string;
  status: Status;
  summary: string;
  attachmentCount: number;
  commentCount: number;
}
