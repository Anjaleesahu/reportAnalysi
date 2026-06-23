import { useState, useEffect } from "react";
import DailyTracker from "../features/tracker/DailyTracker";
import { getHistory, getSummary } from "../api/trackingApi";
import { Link } from "react-router-dom";
import { Calendar, Moon, Droplets, AlertCircle, TrendingUp, Flame, Target } from "lucide-react";
import Spinner from "../components/ui/Spinner";
import Alert from "../components/ui/Alert";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const GoalBar = ({ label, value, goal, unit, color }) => {
  const pct = goal ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
        <span className="text-[10px] font-bold text-slate-300">
          {value || 0}{goal ? ` / ${goal}` : ""} {unit}
        </span>
      </div>
      <div className="h-2 bg-[#050816] rounded-full overflow-hidden border border-slate-800">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const Tracker = () => {
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrackingData = async () => {
    try {
      const [historyData, summaryData] = await Promise.all([
        getHistory(15),
        getSummary(),
      ]);
      setHistory(historyData.reverse());
      setSummary(summaryData);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch logs history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingData();
  }, []);

  const handleLogSuccess = () => {
    fetchTrackingData();
  };

  // history is stored oldest-first, so the last item is the most recent log
  const latest = history.length ? history[history.length - 1] : null;

  const chartData = history.map((item) => ({
    dateLabel: new Date(item.date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    sleep: item.sleep_hours,
    water: item.water_ml,
    symptoms: item.symptoms,
  }));

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-9 w-9 items-center justify-center flex rounded-lg bg-indigo-500/10 text-indigo-400">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-extrabold text-white">Wellness Tracker</h1>
          <p className="text-xs text-slate-500 font-medium">Log your sleep hours, fluid intake, and symptoms to analyze health correlations.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="md" />
        </div>
      ) : error ? (
        <Alert variant="errorPage" icon={<AlertCircle className="h-5 w-5" />}>
          {error}
        </Alert>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Goals/Streak + Log Form */}
          <div className="space-y-6">
            {/* Streak + Goals */}
            <div className="glass-panel p-5">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
                <h4 className="font-display font-bold text-white text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-indigo-400" />
                  Goals & Streak
                </h4>
                <div className="flex items-center gap-1.5 text-amber-400" title="Consecutive logged days">
                  <Flame className="h-4.5 w-4.5" />
                  <span className="text-sm font-display font-black">{summary?.current_streak || 0}</span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase">day streak</span>
                </div>
              </div>

              {summary?.sleep_goal || summary?.water_goal ? (
                <div className="space-y-4">
                  <GoalBar label="Sleep (latest)" value={latest?.sleep_hours} goal={summary?.sleep_goal} unit="hrs" color="bg-indigo-500" />
                  <GoalBar label="Water (latest)" value={latest?.water_ml} goal={summary?.water_goal} unit="ml" color="bg-cyan-500" />
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Set daily sleep & water goals in your{" "}
                  <Link to="/profile" className="text-indigo-400 font-bold hover:underline">profile</Link>{" "}
                  to track progress here.
                </p>
              )}
            </div>

            <DailyTracker onLogSuccess={handleLogSuccess} />
          </div>

          {/* Right Columns - Charts & Log Cards */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Sleep Area Chart */}
              <div className="glass-panel p-5">
                <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Moon className="h-4 w-4 text-indigo-400" />
                  Sleep Duration (15 Days)
                </h4>
                {chartData.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-xs text-slate-650 font-bold border border-dashed border-slate-800 rounded-xl">No logs yet.</div>
                ) : (
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="sleepColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="dateLabel" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} dy={5} />
                        <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} dx={-5} />
                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "10px", fontSize: "11px", color: "#f8fafc" }} />
                        <Area type="monotone" dataKey="sleep" name="Hours" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#sleepColor)" activeDot={{ r: 4 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Water Area Chart */}
              <div className="glass-panel p-5">
                <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-cyan-400" />
                  Water Intake (15 Days)
                </h4>
                {chartData.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-xs text-slate-650 font-bold border border-dashed border-slate-800 rounded-xl">No logs yet.</div>
                ) : (
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="waterColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="dateLabel" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} dy={5} />
                        <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} dx={-5} />
                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "10px", fontSize: "11px", color: "#f8fafc" }} />
                        <Area type="monotone" dataKey="water" name="ml" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#waterColor)" activeDot={{ r: 4 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* History Cards */}
            <div className="glass-panel p-6">
              <h4 className="font-display font-bold text-white text-sm mb-4 flex items-center gap-2 border-b border-slate-800/80 pb-3">
                <TrendingUp className="h-4.5 w-4.5 text-indigo-400" />
                Logged History
              </h4>
              
              {history.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center font-semibold">No health entries logged yet. Complete the form to add one.</p>
              ) : (
                <div className="flex flex-col gap-3.5 max-h-96 overflow-y-auto pr-1">
                  {[...history].reverse().map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#0f172a]/45 border border-slate-800/80 hover:border-slate-850 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300"
                    >
                      <div>
                        <span className="text-xs font-bold text-white">
                          {new Date(item.date).toLocaleDateString(undefined, {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {item.symptoms ? (
                            item.symptoms.split(",").map((sym, i) => (
                              <span
                                key={i}
                                className="text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 text-slate-300 flex items-center gap-1"
                              >
                                <Flame className="h-3 w-3 text-emerald-400" />
                                {sym}
                              </span>
                            ))
                          ) : (
                            <span className="text-[8.5px] font-bold px-2 py-0.5 rounded-full bg-[#050816] border border-slate-850 text-slate-650">
                              No symptoms logged
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-6 shrink-0 border-t sm:border-0 border-slate-900 pt-2.5 sm:pt-0">
                        <div className="flex items-center gap-1.5">
                          <Moon className="h-4 w-4 text-indigo-400" />
                          <div className="flex flex-col">
                            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Sleep</span>
                            <span className="text-xs font-bold text-slate-200">{item.sleep_hours} hrs</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Droplets className="h-4 w-4 text-cyan-400" />
                          <div className="flex flex-col">
                            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Water</span>
                            <span className="text-xs font-bold text-slate-200">{item.water_ml} ml</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Tracker;
