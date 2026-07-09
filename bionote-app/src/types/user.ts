import type { ProjectRole } from './common';

export interface User {
  name: string;
  email: string;
  avatar: string;
  role: ProjectRole;
  lab: string;
}

export interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  token: string | null;
}
