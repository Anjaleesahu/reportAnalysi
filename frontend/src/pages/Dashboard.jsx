import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import ReportUpload from "../features/reports/ReportUpload";
import LabValuesChart from "../features/dashboard/LabValuesChart";
import BiomarkerComparison from "../features/dashboard/BiomarkerComparison";
import { getLabTrends } from "../api/reportsApi";
import { getSummary } from "../api/trackingApi";
import { exportDashboardPdf } from "../utils/pdf";
import { ShieldAlert, Activity, Heart, Sparkles, PlusCircle, Droplet, AlertTriangle, FileDown, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuth();
  const [trends, setTrends] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [trendsData, summaryData] = await Promise.all([
        getLabTrends(),
        getSummary(),
      ]);
      setTrends(trendsData);
      setSummary(summaryData);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Match biomarker keys case-insensitively and across naming variants. The
  // stored test_name casing/label depends on the extractor (e.g. "Hemoglobin"
  // vs "hemoglobin", "Total Cholesterol", "Fasting Blood Sugar"), so an exact
  // key lookup would often miss. Prefer an exact (case-insensitive) match, then
  // fall back to the shortest key that contains an alias (so the primary
  // "Hemoglobin" wins over "Mean Corpuscular Hemoglobin").
  const getLatestBiomarker = (aliases) => {
    if (!trends) return null;
    const keys = Object.keys(trends);
    const lower = aliases.map((a) => a.toLowerCase());
    let key = keys.find((k) => lower.includes(k.toLowerCase()));
    if (!key) {
      key = keys
        .filter((k) => lower.some((a) => k.toLowerCase().includes(a)))
        .sort((a, b) => a.length - b.length)[0];
    }
    const list = key ? trends[key] : [];
    return list && list.length ? list[list.length - 1] : null;
  };

  const glucose = getLatestBiomarker(["glucose", "blood sugar", "fasting blood sugar"]);
  const hemoglobin = getLatestBiomarker(["hemoglobin", "haemoglobin"]);
  const cholesterol = getLatestBiomarker(["cholesterol", "total cholesterol"]);

  // Trend insights: flag biomarkers that changed notably between the last two readings
  const insights = [];
  if (trends) {
    Object.entries(trends).forEach(([name, series]) => {
      if (!Array.isArray(series) || series.length < 2) return;
      const last = series[series.length - 1];
      const prev = series[series.length - 2];
      const a = Number(prev.value);
      const b = Number(last.value);
      if (Number.isNaN(a) || Number.isNaN(b) || a === b) return;
      const pct = a !== 0 ? ((b - a) / a) * 100 : 0;
      const abnormal = last.status === "High" || last.status === "Low";
      if (Math.abs(pct) >= 5 || abnormal) {
        insights.push({ name, up: b > a, pct: Math.abs(pct), status: last.status, value: last.value, unit: last.unit });
      }
    });
  }
  insights.sort((x, y) => y.pct - x.pct);

  const handleExportPdf = () => {
    exportDashboardPdf({
      userName: user?.full_name || user?.email || "",
      biomarkers: [
        { label: "Glucose", value: glucose?.value, unit: glucose?.unit, status: glucose?.status },
        { label: "Hemoglobin", value: hemoglobin?.value, unit: hemoglobin?.unit, status: hemoglobin?.status },
        { label: "Cholesterol", value: cholesterol?.value, unit: cholesterol?.unit, status: cholesterol?.status },
      ],
      alerts: summary?.alerts || [],
    });
  };

  const statusColors = {
    Normal: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/5",
    High: "bg-red-500/10 text-red-400 border border-red-500/20 shadow-sm shadow-red-500/5",
    Low: "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm shadow-amber-500/5",
  };

  // Loading skeletons for visual premium feel
  const DashboardSkeleton = () => (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((n) => (
          <div key={n} className="glass-panel p-6 h-36 shimmer-loading border-white/5" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-panel p-6 h-80 shimmer-loading border-white/5" />
          <div className="glass-panel p-6 h-64 shimmer-loading border-white/5" />
        </div>
        <div className="glass-panel p-6 h-96 shimmer-loading border-white/5" />
      </div>
    </div>
  );

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Hero Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-indigo-900/15 via-indigo-950/20 to-slate-900/10 border border-white/5 rounded-2xl p-6 md:p-8 glass-panel relative overflow-hidden group hover:border-indigo-500/15 transition-all duration-300">
        <div className="absolute top-0 right-0 w-[30%] h-[150%] bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
        <div className="space-y-2">
          <h1 className="font-display text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
            Welcome, <span className="bg-gradient-to-r from-indigo-200 to-indigo-400 bg-clip-text text-transparent">{user?.full_name || "Valued User"}</span> 
            <Sparkles className="h-6 w-6 text-indigo-400 animate-pulse shrink-0" />
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Your AuraHealth workspace is fully sync’d. Upload health documents to generate instant structured analysis and chat with your medical AI companion.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportPdf}
            className="flex items-center gap-2 bg-slate-800/60 hover:bg-slate-700/60 text-slate-200 font-bold text-xs px-4 py-3 rounded-xl transition duration-200 border border-slate-700/60 hover:-translate-y-0.5 cursor-pointer"
            title="Export health snapshot as PDF"
          >
            <FileDown className="h-4 w-4" />
            Export PDF
          </button>
          <Link
            to="/tracker"
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs px-4.5 py-3 rounded-xl transition duration-200 shadow-md hover:shadow-indigo-500/25 hover:-translate-y-0.5 cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            Log Daily Habits
          </Link>
        </div>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Biomarkers Highlights Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Glucose Card */}
            <div className="glass-panel p-6 border-l-4 border-l-indigo-500 glass-panel-hover relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Droplet className="h-4 w-4 text-indigo-400" />
                  Glucose (Blood Sugar)
                </span>
                {glucose && (
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusColors[glucose.status]}`}>
                    {glucose.status}
                  </span>
                )}
              </div>
              {glucose ? (
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-display font-black text-white tracking-tight">{glucose.value}</span>
                    <span className="text-xs text-slate-500 font-semibold">{glucose.unit}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-4 border-t border-slate-800/80 pt-3 flex justify-between font-semibold">
                    <span>Reference Range:</span>
                    <span className="text-slate-300">{glucose.reference_range}</span>
                  </p>
                </div>
              ) : (
                <div className="py-4 text-slate-500 text-xs font-bold">No data. Upload a report to extract.</div>
              )}
            </div>

            {/* Hemoglobin Card */}
            <div className="glass-panel p-6 border-l-4 border-l-purple-500 glass-panel-hover relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Heart className="h-4 w-4 text-purple-400" />
                  Hemoglobin
                </span>
                {hemoglobin && (
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusColors[hemoglobin.status]}`}>
                    {hemoglobin.status}
                  </span>
                )}
              </div>
              {hemoglobin ? (
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-display font-black text-white tracking-tight">{hemoglobin.value}</span>
                    <span className="text-xs text-slate-500 font-semibold">{hemoglobin.unit}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-4 border-t border-slate-800/80 pt-3 flex justify-between font-semibold">
                    <span>Reference Range:</span>
                    <span className="text-slate-300">{hemoglobin.reference_range}</span>
                  </p>
                </div>
              ) : (
                <div className="py-4 text-slate-500 text-xs font-bold">No data. Upload a report to extract.</div>
              )}
            </div>

            {/* Cholesterol Card */}
            <div className="glass-panel p-6 border-l-4 border-l-cyan-500 glass-panel-hover relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-cyan-400" />
                  Total Cholesterol
                </span>
                {cholesterol && (
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusColors[cholesterol.status]}`}>
                    {cholesterol.status}
                  </span>
                )}
              </div>
              {cholesterol ? (
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-display font-black text-white tracking-tight">{cholesterol.value}</span>
                    <span className="text-xs text-slate-500 font-semibold">{cholesterol.unit}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-4 border-t border-slate-800/80 pt-3 flex justify-between font-semibold">
                    <span>Reference Range:</span>
                    <span className="text-slate-300">{cholesterol.reference_range}</span>
                  </p>
                </div>
              ) : (
                <div className="py-4 text-slate-500 text-xs font-bold">No data. Upload a report to extract.</div>
              )}
            </div>
          </div>

          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column (Charts and Uploader) */}
            <div className="lg:col-span-2 space-y-8">
              <LabValuesChart trends={trends} />

              <BiomarkerComparison />

              <div className="glass-panel p-6">
                <h4 className="font-display font-bold text-white text-sm mb-4 flex items-center gap-2 border-b border-slate-800/80 pb-3">
                  <Activity className="h-4.5 w-4.5 text-indigo-400" />
                  Analyze Lab Report
                </h4>
                <ReportUpload onUploadSuccess={fetchData} />
              </div>
            </div>

            {/* Right Column (Averages & Health Alerts) */}
            <div className="space-y-8">
              {/* Trend Insights */}
              {insights.length > 0 && (
                <div className="glass-panel p-6">
                  <h4 className="font-display font-bold text-white text-sm mb-4 flex items-center gap-2 border-b border-slate-800/80 pb-3">
                    <TrendingUp className="h-4.5 w-4.5 text-indigo-400" />
                    Trend Insights
                  </h4>
                  <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
                    {insights.map((ins, i) => {
                      const concerning = ins.status === "High" || ins.status === "Low";
                      return (
                        <div key={i} className="flex items-center justify-between text-xs p-3 rounded-xl border border-slate-800/80 bg-[#0f172a]/40">
                          <span className="font-bold text-slate-300 truncate pr-2">{ins.name}</span>
                          <span className={`flex items-center gap-1 font-bold shrink-0 ${concerning ? (ins.up ? "text-red-400" : "text-amber-400") : "text-slate-400"}`}>
                            {ins.up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                            {ins.up ? "+" : "−"}{ins.pct.toFixed(0)}%
                            {concerning && <span className="text-[9px] uppercase ml-1">{ins.status}</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Monthly Alerts */}
              <div className="glass-panel p-6 bg-slate-900/10 border-indigo-500/5 hover:border-indigo-500/10 transition-all duration-300">
                <h4 className="font-display font-bold text-white text-sm mb-4 flex items-center gap-2 border-b border-slate-800/80 pb-3">
                  <ShieldAlert className="h-4.5 w-4.5 text-indigo-400" />
                  Medical Alerts
                </h4>

                <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
                  {summary?.alerts?.map((alert, index) => (
                    <div
                      key={index}
                      className="text-xs p-3.5 rounded-xl border border-slate-800/80 bg-[#0f172a]/40 text-slate-300 flex items-start gap-3 leading-relaxed transition-all duration-200 hover:border-slate-700/80"
                    >
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>{alert}</span>
                    </div>
                  ))}
                  {(!summary || summary.alerts?.length === 0) && (
                    <p className="text-xs text-slate-500">All trackers look normal. Good health!</p>
                  )}
                </div>
              </div>

              {/* Habit Metrics */}
              <div className="glass-panel p-6">
                <h4 className="font-display font-bold text-white text-sm mb-4 border-b border-slate-800/80 pb-3">
                  Habit Summary (30 Days)
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 text-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Avg Sleep
                    </span>
                    <span className="text-2xl font-display font-black text-indigo-400">
                      {summary?.sleep_average || 0}
                    </span>
                    <span className="text-[9px] text-slate-500 block font-semibold mt-0.5">hours / night</span>
                  </div>

                  <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 text-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Avg Hydration
                    </span>
                    <span className="text-2xl font-display font-black text-cyan-400">
                      {summary?.water_average || 0}
                    </span>
                    <span className="text-[9px] text-slate-500 block font-semibold mt-0.5">ml / day</span>
                  </div>
                </div>

                <div className="mt-4 bg-slate-900/20 border border-slate-800/60 rounded-xl p-4">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-2.5">
                    Frequent Symptoms
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {summary?.frequent_symptoms?.map((sym, i) => (
                      <span
                        key={i}
                        className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/50 text-slate-300"
                      >
                        {sym}
                      </span>
                    ))}
                    {(!summary || summary.frequent_symptoms?.length === 0) && (
                      <span className="text-xs text-slate-500 font-semibold pl-0.5">No symptoms logged.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
