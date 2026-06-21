import { NavLink } from "react-router-dom";
import { LayoutDashboard, PenLine, ScanLine, MessageCircle, SlidersHorizontal, Trophy, FileImage, LogOut } from "lucide-react";
import { useAuthStore } from "../../lib/authStore";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/log", label: "Log activity", icon: PenLine },
  { to: "/scan", label: "Scan receipt", icon: ScanLine },
  { to: "/coach", label: "AI coach", icon: MessageCircle },
  { to: "/simulator", label: "What-if", icon: SlidersHorizontal },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/report", label: "Report card", icon: FileImage },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 border-r border-line bg-panel flex flex-col">
      <div className="px-6 py-7">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-lime/10 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-lime" />
          </div>
          <span className="font-display font-semibold text-[17px] tracking-tight text-cream">CarbonIQ</span>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors ${
                isActive ? "bg-lime/10 text-lime" : "text-sage hover:bg-panel2 hover:text-cream"
              }`
            }
          >
            <Icon size={17} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-line">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-panel2 flex items-center justify-center font-display text-[12px] font-semibold text-sage">
            {user?.name?.charAt(0) ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-cream truncate">{user?.name ?? "Guest"}</p>
          </div>
          <button
            onClick={logout}
            aria-label="Log out"
            className="text-sage hover:text-coral transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
