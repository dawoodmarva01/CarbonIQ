import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-void">
      <Sidebar />
      <main className="flex-1 px-10 py-8 max-w-[1100px]">
        <Outlet />
      </main>
    </div>
  );
}
