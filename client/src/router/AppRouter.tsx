import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import LandingPage from '@/pages/Landing';
import { LoginPage } from '@/pages/auth/Login';
import { RegisterPage } from '@/pages/auth/Register';
import { CandidateDashboard } from '@/pages/candidate/Dashboard';
import { UploadResumePage } from '@/pages/candidate/UploadResume';
import { AssessmentsPage } from '@/pages/candidate/Assessments';
import { TakeAssessmentPage } from '@/pages/candidate/TakeAssessment';
import ReportsPage from '@/pages/candidate/Reports';
import ResumeReportPage from '@/pages/candidate/ResumeReport';
import { RecruiterDashboard } from '@/pages/recruiter/Dashboard';
import CandidatesPage from '@/pages/recruiter/Candidates';
import CandidateDetailsPage from '@/pages/recruiter/CandidateDetails';
import ShortlistPage from '@/pages/recruiter/Shortlist';
import { CreateRoomPage } from '@/pages/recruiter/CreateRoom';
import { RoomDashboardPage } from '@/pages/recruiter/RoomDashboard';
import CompareCandidatesPage from '@/pages/recruiter/Compare';
import QuestionBankPage from '@/pages/recruiter/QuestionBank';
import { JoinRoomPage } from '@/pages/candidate/JoinRoom';
import UserManagementPage from '@/pages/admin/Users';
import QuestionsManagementPage from '@/pages/admin/Questions';
import { AdminDashboard } from '@/pages/admin/Dashboard';
import SkillCategoriesPage from '@/pages/admin/SkillCategories';
import AnalyticsPage from '@/pages/admin/Analytics';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      // Candidate routes
      { path: 'candidate/dashboard', element: <ProtectedRoute allowedRoles={['CANDIDATE', 'ADMIN']}><CandidateDashboard /></ProtectedRoute> },
      { path: 'candidate/upload', element: <ProtectedRoute allowedRoles={['CANDIDATE', 'ADMIN']}><UploadResumePage /></ProtectedRoute> },
      { path: 'candidate/assessments', element: <ProtectedRoute allowedRoles={['CANDIDATE', 'ADMIN']}><AssessmentsPage /></ProtectedRoute> },
      { path: 'candidate/assessments/:id', element: <ProtectedRoute allowedRoles={['CANDIDATE', 'ADMIN']}><TakeAssessmentPage /></ProtectedRoute> },
      { path: 'candidate/assessments/:id/result', element: <ProtectedRoute allowedRoles={['CANDIDATE', 'ADMIN']}><ResumeReportPage /></ProtectedRoute> },
      { path: 'candidate/reports', element: <ProtectedRoute allowedRoles={['CANDIDATE', 'ADMIN']}><ReportsPage /></ProtectedRoute> },
      { path: 'candidate/reports/:id', element: <ProtectedRoute allowedRoles={['CANDIDATE', 'ADMIN']}><ResumeReportPage /></ProtectedRoute> },
      { path: 'candidate/join-room', element: <ProtectedRoute allowedRoles={['CANDIDATE', 'ADMIN']}><JoinRoomPage /></ProtectedRoute> },
      // Recruiter routes
      { path: 'recruiter/dashboard', element: <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}><RecruiterDashboard /></ProtectedRoute> },
      { path: 'recruiter/candidates', element: <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}><CandidatesPage /></ProtectedRoute> },
      { path: 'recruiter/candidates/:id', element: <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}><CandidateDetailsPage /></ProtectedRoute> },
      { path: 'recruiter/shortlist', element: <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}><ShortlistPage /></ProtectedRoute> },
      { path: 'recruiter/rooms/create', element: <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}><CreateRoomPage /></ProtectedRoute> },
      { path: 'recruiter/rooms/:id', element: <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}><RoomDashboardPage /></ProtectedRoute> },
      { path: 'recruiter/rooms/:roomId/questions', element: <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}><QuestionBankPage /></ProtectedRoute> },
      { path: 'recruiter/compare', element: <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}><CompareCandidatesPage /></ProtectedRoute> },
      // Admin routes
      { path: 'admin/dashboard', element: <ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute> },
      { path: 'admin/users', element: <ProtectedRoute allowedRoles={['ADMIN']}><UserManagementPage /></ProtectedRoute> },
      { path: 'admin/questions', element: <ProtectedRoute allowedRoles={['ADMIN']}><QuestionsManagementPage /></ProtectedRoute> },
      { path: 'admin/skills', element: <ProtectedRoute allowedRoles={['ADMIN']}><SkillCategoriesPage /></ProtectedRoute> },
      { path: 'admin/analytics', element: <ProtectedRoute allowedRoles={['ADMIN']}><AnalyticsPage /></ProtectedRoute> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '*',
    element: (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">404</h1>
          <p className="text-gray-600 mt-2">Page not found</p>
        </div>
      </div>
    ),
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  } as any
});
