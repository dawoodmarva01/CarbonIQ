import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuthStore } from "./lib/authStore";
import { AppShell } from "./components/layout/AppShell";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LogActivityPage } from "./pages/LogActivityPage";
import { ReceiptScanPage } from "./pages/ReceiptScanPage";
import { CoachChatPage } from "./pages/CoachChatPage";
import { SimulatorPage } from "./pages/SimulatorPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { ReportCardPage } from "./pages/ReportCardPage";
import { test, expect } from "vitest";

test("basic test", () => {
  expect(true).toBe(true);
});

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/log" element={<LogActivityPage />} />
            <Route path="/scan" element={<ReceiptScanPage />} />
            <Route path="/coach" element={<CoachChatPage />} />
            <Route path="/simulator" element={<SimulatorPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/report" element={<ReportCardPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
