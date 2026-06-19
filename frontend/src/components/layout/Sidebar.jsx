import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, FileText, Calendar, MessageSquare, ShieldAlert } from "lucide-react";

const Sidebar = () => {
  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/reports", label: "Medical Reports", icon: FileText },
    { path: "/tracker", label: "Daily Tracker", icon: Calendar },
    { path: "/chat", label: "AI Advisor Chat", icon: MessageSquare },
  ];

  return (
    <aside className="w-full md:w-64 glass-panel border-y-0 border-l-0 border-r rounded-none p-4 flex flex-col gap-2 min-h-[calc(100vh-73px)] bg-slate-950/20 backdrop-blur-md">
      <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase px-3.5 mb-2 mt-2">
        Core Navigation
      </div>

      <div className="flex md:flex-col flex-wrap gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 w-full md:w-auto relative group ${
                  isActive
                    ? "bg-indigo-600/10 text-white font-extrabold border-l-3 border-indigo-500 shadow-sm shadow-indigo-500/5"
                    : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-100"
                }`
              }
            >
              <Icon className="h-4.5 w-4.5 transition-transform duration-300 group-hover:scale-110" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="mt-auto hidden md:flex flex-col gap-4 border-t border-slate-900 pt-5 px-3.5">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
          <ShieldAlert className="h-4 w-4 text-emerald-400" />
          <span>Local Data Shield</span>
        </div>
        <div className="text-[10.5px] leading-relaxed text-slate-600 font-medium">
          <p>© 2026 AuraHealth</p>
          <p className="mt-0.5">All files and metrics are processed securely on-device.</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
