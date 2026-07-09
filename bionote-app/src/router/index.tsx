import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';
import AuthLayout from '@/layouts/AuthLayout';
import LoginPage from '@/pages/auth/LoginPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import ProjectListPage from '@/pages/projects/ProjectListPage';
import ProjectDetailPage from '@/pages/projects/ProjectDetailPage';
import RecordsPage from '@/pages/records/RecordsPage';
import RecordDetailPage from '@/pages/records/RecordDetailPage';
import EditorPage from '@/pages/editor/EditorPage';
import TemplatesPage from '@/pages/templates/TemplatesPage';
import SearchPage from '@/pages/search/SearchPage';
import TeamPage from '@/pages/team/TeamPage';
import AIPage from '@/pages/ai/AIPage';
import RemindersPage from '@/pages/reminders/RemindersPage';
import AnalysisPage from '@/pages/analysis/AnalysisPage';
import PublicDataPage from '@/pages/public-data/PublicDataPage';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <AuthLayout />,
    children: [
      { index: true, element: <LoginPage /> },
    ],
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      {
        path: 'projects',
        children: [
          { index: true, element: <ProjectListPage /> },
          { path: ':id', element: <ProjectDetailPage /> },
        ],
      },
      {
        path: 'records',
        children: [
          { index: true, element: <RecordsPage /> },
          { path: ':id', element: <RecordDetailPage /> },
          { path: ':id/edit', element: <EditorPage /> },
        ],
      },
      { path: 'templates', element: <TemplatesPage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'team', element: <TeamPage /> },
      { path: 'ai', element: <AIPage /> },
      { path: 'reminders', element: <RemindersPage /> },
      { path: 'analysis/:projectId', element: <AnalysisPage /> },
      { path: 'public-data', element: <PublicDataPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

export default router;
