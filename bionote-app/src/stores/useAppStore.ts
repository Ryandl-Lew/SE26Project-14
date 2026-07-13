import { create } from 'zustand';
import type { Project } from '@/types';
import { projects } from '@/utils/mockData';

interface AppStore {
  /** Currently selected project in the topbar switcher */
  currentProjectId: string;
  currentProjectName: string;
  projectList: Project[];
  setCurrentProject: (id: string) => void;
  setCurrentProjectByName: (name: string) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  currentProjectId: 'proj-1',
  currentProjectName: 'GFP 融合蛋白表达项目',
  projectList: projects,
  setCurrentProject: (id) => {
    const p = projects.find((pr) => pr.id === id);
    if (p) set({ currentProjectId: id, currentProjectName: p.name });
  },
  setCurrentProjectByName: (name) => {
    const p = projects.find((pr) => pr.name === name);
    if (p) set({ currentProjectId: p.id, currentProjectName: p.name });
  },
}));
