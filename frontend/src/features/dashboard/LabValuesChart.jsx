import React, { useState, useMemo, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Area,
} from "recharts";
import { TrendingUp, TrendingDown, Search, Info, CheckCircle, AlertCircle } from "lucide-react";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";

const LabValuesChart = ({ trends }) => {
  const [selectedBiomarker, setSelectedBiomarker] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Get all available biomarkers from trends
  const biomarkers = useMemo(() => {
    return Object.keys(trends || {}).sort();
  }, [trends]);

  // Set initial biomarker
  useEffect(() => {
    if (biomarkers.length > 0 && !selectedBiomarker) {
      setSelectedBiomarker(biomarkers[0]);
    }
  }, [biomarkers, selectedBiomarker]);

  // Filter biomarkers based on search
  const filteredBiomarkers = useMemo(() => {
    return biomarkers.filter((marker) =>
      marker.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [biomarkers, searchQuery]);

  // Get current biomarker data
  const activeTrends = useMemo(() => {
    return trends?.[selectedBiomarker] || [];
  }, [trends, selectedBiomarker]);

  // Calculate trend analysis
  const trendAnalysis = useMemo(() => {
    if (activeTrends.length < 2) return { trend: "neutral", change: 0 };

    const firstValue = activeTrends[0].value;
    const lastValue = activeTrends[activeTrends.length - 1].value;
    const change = lastValue - firstValue;
    const percentChange = ((change / firstValue) * 100).toFixed(1);

    let trend = "neutral";
    if (change > 0) trend = "increasing";
    else if (change < 0) trend = "decreasing";

    return { trend, change: parseFloat(percentChange) };
  }, [activeTrends]);

  // Get reference range and current status
  const currentData = useMemo(() => {
    if (activeTrends.length === 0) return null;
    return activeTrends[activeTrends.length - 1];
  }, [activeTrends]);

  // Format data for chart
  const formattedData = useMemo(() => {
    return activeTrends.map((item) => ({
      ...item,
      dateLabel: new Date(item.tested_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      fullDate: new Date(item.tested_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    }));
  }, [activeTrends]);

  // Color scheme for each biomarker
  const getColorForBiomarker = (index) => {
    const colors = [
      "#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b",
      "#ef4444", "#ec4899", "#14b8a6", "#f97316", "#06b6d4",
    ];
    return colors[index % colors.length];
  };

  const currentColor = getColorForBiomarker(biomarkers.indexOf(selectedBiomarker));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-panel p-3 border border-slate-800 bg-[#0f172a]/98 text-[11px] shadow-2xl rounded-lg">
          <p className="text-slate-400 mb-2 font-bold">{data.fullDate}</p>
          <div className="flex gap-1.5 items-baseline mb-2">
            <span className="text-lg font-display font-extrabold text-white">
              {data.value}
            </span>
            <span className="text-slate-500 font-bold">{data.unit}</span>
          </div>
          {data.reference_range && (
            <p className="text-slate-400 text-[9px] mb-2">
              Ref: {data.reference_range}
            </p>
          )}
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold border ${
              data.status === "Normal"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : data.status === "High"
                ? "bg-red-500/10 text-red-400 border-red-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}
          >
            {data.status}
          </span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <Card className="p-6 w-full">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 items-center justify-center flex rounded-lg bg-indigo-500/10 text-indigo-400">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-white text-sm">
                Biomarker Analytics
              </h4>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                Dynamic time-series tracking of all extracted health biomarkers
              </p>
            </div>
          </div>

          {/* Searchable Dropdown */}
          <div className="relative">
            <div
              className="flex items-center gap-2 px-3 py-2.5 bg-slate-900/50 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700 transition-colors"
              onClick={() => setIsOpen(!isOpen)}
            >
              <Search className="h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search biomarker..."
                value={searchQuery || selectedBiomarker}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-slate-600"
              />
              <span className="text-slate-500 text-xs font-semibold">
                {biomarkers.length}
              </span>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-950 border border-slate-800 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                {filteredBiomarkers.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-sm">
                    No biomarkers found
                  </div>
                ) : (
                  filteredBiomarkers.map((marker, idx) => (
                    <button
                      key={marker}
                      onClick={() => {
                        setSelectedBiomarker(marker);
                        setSearchQuery("");
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                        selectedBiomarker === marker
                          ? "bg-indigo-500/20 text-indigo-300 border-l-2 border-indigo-500"
                          : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-300"
                      }`}
                    >
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: getColorForBiomarker(idx) }}
                      />
                      <span className="font-medium">{marker}</span>
                      {trends?.[marker]?.length > 0 && (
                        <span className="text-[10px] text-slate-500 ml-auto">
                          {trends[marker].length} points
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Current Value Card */}
        {currentData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-800/50">
              <p className="text-[10px] text-slate-500 font-semibold mb-1">
                Current Value
              </p>
              <p className="text-xl font-bold text-white">
                {currentData.value}
                <span className="text-sm text-slate-500 ml-1">
                  {currentData.unit}
                </span>
              </p>
            </div>

            <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-800/50">
              <p className="text-[10px] text-slate-500 font-semibold mb-1">
                Status
              </p>
              <div className="flex items-center gap-1">
                {currentData.status === "Normal" && (
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                )}
                {currentData.status === "High" && (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                )}
                {currentData.status === "Low" && (
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                )}
                <span
                  className={`text-sm font-semibold ${
                    currentData.status === "Normal"
                      ? "text-emerald-400"
                      : currentData.status === "High"
                      ? "text-red-400"
                      : "text-amber-400"
                  }`}
                >
                  {currentData.status}
                </span>
              </div>
            </div>

            <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-800/50">
              <p className="text-[10px] text-slate-500 font-semibold mb-1">
                Trend
              </p>
              <div className="flex items-center gap-1">
                {trendAnalysis.trend === "increasing" && (
                  <TrendingUp className="h-4 w-4 text-green-400" />
                )}
                {trendAnalysis.trend === "decreasing" && (
                  <TrendingDown className="h-4 w-4 text-red-400" />
                )}
                {trendAnalysis.trend === "neutral" && (
                  <Info className="h-4 w-4 text-slate-400" />
                )}
                <span
                  className={`text-sm font-semibold ${
                    trendAnalysis.trend === "increasing"
                      ? "text-green-400"
                      : trendAnalysis.trend === "decreasing"
                      ? "text-red-400"
                      : "text-slate-400"
                  }`}
                >
                  {trendAnalysis.change > 0 ? "+" : ""}
                  {trendAnalysis.change}%
                </span>
              </div>
            </div>

            <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-800/50">
              <p className="text-[10px] text-slate-500 font-semibold mb-1">
                Reference
              </p>
              <p className="text-xs font-mono text-slate-300">
                {currentData.reference_range || "N/A"}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Chart */}
      <Card className="p-6 w-full">
        {formattedData.length === 0 ? (
          <EmptyState
            className="flex flex-col items-center justify-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl"
            icon={<AlertCircle className="h-8 w-8 text-slate-600 mb-2" />}
            title={`No data available for ${selectedBiomarker}.`}
            description="Upload reports to start tracking this biomarker."
          />
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={formattedData}
                margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={currentColor} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={currentColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                  opacity={0.2}
                  vertical={false}
                />
                <XAxis
                  dataKey="dateLabel"
                  stroke="#64748b"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  dx={-8}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={currentColor}
                  strokeWidth={2.5}
                  fill="url(#colorArea)"
                  dot={{ fill: currentColor, r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: currentColor }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Data Points Table */}
      {formattedData.length > 0 && (
        <Card className="p-6 w-full">
          <h5 className="font-semibold text-white text-sm mb-4">
            Historical Data Points
          </h5>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-2 px-3 text-slate-500 font-semibold">
                    Date
                  </th>
                  <th className="text-left py-2 px-3 text-slate-500 font-semibold">
                    Value
                  </th>
                  <th className="text-left py-2 px-3 text-slate-500 font-semibold">
                    Status
                  </th>
                  <th className="text-left py-2 px-3 text-slate-500 font-semibold">
                    Reference Range
                  </th>
                </tr>
              </thead>
              <tbody>
                {formattedData.map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-slate-800/30 hover:bg-slate-900/20 transition-colors"
                  >
                    <td className="py-2.5 px-3 text-slate-300">{row.fullDate}</td>
                    <td className="py-2.5 px-3 text-white font-semibold">
                      {row.value} {row.unit}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block rounded px-2 py-1 text-[9px] font-bold border ${
                          row.status === "Normal"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : row.status === "High"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {row.reference_range || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default LabValuesChart;
