import type { TemplateCategory } from './common';

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  usageCount: number;
  badge: string;
  badgeColor: 'blue' | 'green' | 'gray';
}

export interface TemplateField {
  name: string;
  type: string;
  required: boolean;
  unit: string;
  searchable: boolean;
}
