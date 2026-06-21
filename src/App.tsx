import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { FeaturePage } from "@/pages/FeaturePage";
import { MyPage } from "@/pages/MyPage";
import { ParticipantManagePage } from "@/pages/professor/ParticipantManagePage";
import { TeamManagePage } from "@/pages/professor/TeamManagePage";
import { AdminUserManagePage } from "@/pages/professor/AdminUserManagePage";
import { HomeQrCard } from "@/components/HomeQrCard";
import { StudentTeamPage } from "@/pages/student/StudentTeamPage";
import { ProjectPlanPage } from "@/pages/student/ProjectPlanPage";
import { WeeklyReportsPage } from "@/pages/student/WeeklyReportsPage";
import { MonitoringPage } from "@/pages/shared/MonitoringPage";
import { ArtifactsPage } from "@/pages/shared/ArtifactsPage";
import { AnnouncementsPage } from "@/pages/shared/AnnouncementsPage";
import { TeamDetailPage } from "@/pages/shared/TeamDetailPage";
import { LoginActivityPage } from "@/pages/manager/LoginActivityPage";
import { ReportDetailPage } from "@/pages/shared/ReportDetailPage";

export function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <LandingPage />
            <HomeQrCard />
          </>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/unauthorized"
        element={
          <FeaturePage
            title="접근 권한이 없습니다"
            description="현재 계정의 역할로 열 수 없는 메뉴입니다."
          />
        }
      />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route
            path="/professor/participants"
            element={<ParticipantManagePage />}
          />
          <Route
            path="/professor/admin-users"
            element={<AdminUserManagePage />}
          />
          <Route path="/professor/activity-logs" element={<LoginActivityPage />} />
          <Route path="/professor/teams" element={<TeamManagePage />} />
          <Route
            path="/professor/projects"
            element={<MonitoringPage mode="projects" />}
          />
          <Route
            path="/professor/projects/:teamId"
            element={<TeamDetailPage />}
          />
          <Route
            path="/professor/reports"
            element={<MonitoringPage mode="reports" />}
          />
          <Route
            path="/professor/reports/:teamId"
            element={<TeamDetailPage />}
          />
          <Route
            path="/professor/reports/:teamId/:reportId"
            element={<ReportDetailPage />}
          />
          <Route path="/professor/artifacts" element={<ArtifactsPage />} />
          <Route path="/student/team" element={<StudentTeamPage />} />
          <Route path="/student/project-plan" element={<ProjectPlanPage />} />
          <Route
            path="/student/weekly-reports"
            element={<WeeklyReportsPage />}
          />
          <Route path="/student/artifacts" element={<ArtifactsPage />} />
          <Route
            path="/researcher/participants"
            element={<ParticipantManagePage />}
          />
          <Route
            path="/researcher/admin-users"
            element={<AdminUserManagePage />}
          />
          <Route path="/researcher/activity-logs" element={<LoginActivityPage />} />
          <Route path="/researcher/teams" element={<TeamManagePage />} />
          <Route
            path="/researcher/projects"
            element={<MonitoringPage mode="projects" />}
          />
          <Route
            path="/researcher/projects/:teamId"
            element={<TeamDetailPage />}
          />
          <Route path="/researcher/monitoring" element={<MonitoringPage />} />
          <Route
            path="/researcher/monitoring/:teamId"
            element={<TeamDetailPage />}
          />
          <Route
            path="/researcher/reports"
            element={<MonitoringPage mode="reports" />}
          />
          <Route
            path="/researcher/reports/:teamId"
            element={<TeamDetailPage />}
          />
          <Route
            path="/researcher/reports/:teamId/:reportId"
            element={<ReportDetailPage />}
          />
          <Route path="/researcher/artifacts" element={<ArtifactsPage />} />
          <Route path="/:role" element={<DashboardPage />} />
          <Route path="/:role/:feature" element={<FeaturePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
