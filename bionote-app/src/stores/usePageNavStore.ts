import { create } from 'zustand';

interface PageNavStore {
  /** Stack of page routes for back navigation */
  history: string[];
  /** Record the last child visited per parent route for forward nav */
  lastChildByPage: Record<string, string>;
  push: (route: string) => void;
  /** Get parent route for back button */
  getParent: (route: string) => string | null;
  /** Get last child for forward button */
  getChild: (route: string) => string | null;
}

const PAGE_PARENT_MAP: Record<string, string> = {
  '/projects/1': '/projects',
  '/projects/2': '/projects',
  '/projects/3': '/projects',
  '/records/1': '/records',
  '/records/1/edit': '/records',
};

export const usePageNavStore = create<PageNavStore>((set, get) => ({
  history: ['/'],
  lastChildByPage: {},
  push: (route) =>
    set((s) => {
      const prev = s.history[s.history.length - 1];
      // Track child relationship
      const parent = PAGE_PARENT_MAP[route];
      if (parent === prev) {
        return {
          history: [...s.history, route],
          lastChildByPage: { ...s.lastChildByPage, [parent]: route },
        };
      }
      return { history: [...s.history, route] };
    }),
  getParent: (route) => {
    return PAGE_PARENT_MAP[route] || null;
  },
  getChild: (route) => {
    return get().lastChildByPage[route] || null;
  },
}));
