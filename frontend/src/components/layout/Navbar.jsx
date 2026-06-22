import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { HeartPulse, LogOut, User, Settings, Shield } from "lucide-react";
import Button from "../ui/Button";

const Navbar = () => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Get user initials for the avatar
  const getInitials = () => {
    if (!user) return "";
    if (user.full_name) {
      const parts = user.full_name.split(" ");
      if (parts.length > 1) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return user.full_name.substring(0, 2).toUpperCase();
    }
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <nav className="glass-panel sticky top-0 z-50 flex items-center justify-between border-x-0 border-t-0 border-b rounded-none px-6 py-3.5 bg-slate-950/60 backdrop-blur-md">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/10 border border-indigo-400/20 glow-active">
          <HeartPulse className="h-5 w-5" />
        </div>
        <div>
          <span className="font-display text-xl font-extrabold tracking-tight text-white">
            Aura<span className="text-indigo-400">Health</span>
          </span>
          <span className="ml-2 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[9px] font-bold text-indigo-300 border border-indigo-500/20">
            AI COMPANION
          </span>
        </div>
      </div>

      {/* User Area */}
      {user && (
        <div className="relative flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-100">
              {user.full_name || "Valued User"}
            </span>
            <span className="text-[10px] font-semibold text-slate-400">{user.email}</span>
          </div>

          {/* Interactive Profile Avatar Button */}
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 text-white font-display text-xs font-bold border-2 border-slate-900 shadow-md hover:scale-105 hover:border-indigo-500/50 transition-all duration-200 cursor-pointer"
            id="profile-dropdown-btn"
          >
            {getInitials()}
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <>
              {/* Overlay to close dropdown */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />

              <div className="absolute right-0 top-12 z-20 w-56 glass-panel p-2 shadow-2xl bg-slate-900/95 border border-slate-800/80 mt-1 flex flex-col gap-0.5">
                <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                  <p className="text-xs font-bold text-white truncate">{user.full_name || "Valued User"}</p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{user.email}</p>
                </div>

                <Button
                  variant="ghost"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-left w-full"
                  icon={<User className="h-4 w-4 text-indigo-400" />}
                >
                  <span>View Profile</span>
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-left w-full"
                  icon={<Settings className="h-4 w-4 text-cyan-400" />}
                >
                  <span>Account Settings</span>
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-left w-full"
                  icon={<Shield className="h-4 w-4 text-emerald-400" />}
                >
                  <span>Privacy Log</span>
                </Button>

                <div className="border-t border-slate-800/80 my-1" />

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/10 transition duration-150 text-left w-full cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
