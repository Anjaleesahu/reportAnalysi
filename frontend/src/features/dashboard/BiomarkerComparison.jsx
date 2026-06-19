import React, { useState, useEffect } from "react";
import { GitCompare, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getHistoryUnprefixed, getReportUnprefixed } from "../../api/reportsApi";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";

const BiomarkerComparison = () => {
  const [reports, setReports] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);
  const [previousReport, setPreviousReport] = useState(null);
  const [comparisonData, setComparisonData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await getHistoryUnprefixed();
        if (data && data.length > 0) {
          const sortedReports = data.sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          );
          setReports(sortedReports);
          if (sortedReports.length > 0) {
            setCurrentReport(sortedReports[0]);
          }
          if (sortedReports.length > 1) {
            setPreviousReport(sortedReports[1]);
          }
        }
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  useEffect(() => {
    const generateComparison = async () => {
      if (!currentReport || !previousReport) return;

      try {
        const [current, previous] = await Promise.all([
          getReportUnprefixed(currentReport.id),
          getReportUnprefixed(previousReport.id),
        ]);

        const currentLabs = (current.lab_values || []).reduce((acc, lab) => {
          acc[lab.test_name] = lab;
          return acc;
        }, {});

        const previousLabs = (previous.lab_values || []).reduce((acc, lab) => {
          acc[lab.test_name] = lab;
          return acc;
        }, {});

        // Create comparison data
        const comparison = [];
        const allTests = new Set([
          ...Object.keys(currentLabs),
          ...Object.keys(previousLabs),
        ]);

        allTests.forEach((testName) => {
          const curr = currentLabs[testName];
          const prev = previousLabs[testName];

          if (curr || prev) {
            const currentVal = curr?.value || "—";
            const previousVal = prev?.value || "—";
            let change = null;
            let changePercent = null;
            let trend = null;

            if (curr && prev && typeof curr.value === "number" && typeof prev.value === "number") {
              change = curr.value - prev.value;
              changePercent = ((change / prev.value) * 100).toFixed(1);
              trend = change > 0 ? "increase" : change < 0 ? "decrease" : "stable";
            }

            comparison.push({
              testName,
              currentValue: currentVal,
              currentUnit: curr?.unit || "",
              currentStatus: curr?.status || "—",
              previousValue: previousVal,
              previousUnit: prev?.unit || "",
              previousStatus: prev?.status || "—",
              change,
              changePercent,
              trend,
            });
          }
        });

        setComparisonData(comparison.sort((a, b) => {
          // Sort abnormal values first
          if (a.currentStatus !== "Normal" && b.currentStatus === "Normal") return -1;
          if (a.currentStatus === "Normal" && b.currentStatus !== "Normal") return 1;
          return 0;
        }));
      } catch (error) {
        console.error("Error generating comparison:", error);
      }
    };

    generateComparison();
  }, [currentReport, previousReport]);

  if (loading) {
    return (
      <Card className="p-6 w-full">
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-500 border-t-indigo-400 mr-2" />
          <span className="text-slate-400 text-sm">Loading reports...</span>
        </div>
      </Card>
    );
  }

  if (reports.length < 2) {
    return (
      <Card className="p-6 w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 items-center justify-center flex rounded-lg bg-blue-500/10 text-blue-400">
            <GitCompare className="h-4.5 w-4.5" />
          </div>
          <div>
            <h4 className="font-display font-bold text-white text-sm">Biomarker Comparison</h4>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
              Compare trends between your reports
            </p>
          </div>
        </div>
        <EmptyState
          icon={<GitCompare className="h-8 w-8 text-slate-600 mb-2" />}
          title="Need at least 2 reports to compare"
          description="Upload another health report to enable comparison."
        />
      </Card>
    );
  }

  return (
    <Card className="p-6 w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-8 items-center justify-center flex rounded-lg bg-blue-500/10 text-blue-400">
          <GitCompare className="h-4.5 w-4.5" />
        </div>
        <div>
          <h4 className="font-display font-bold text-white text-sm">Biomarker Comparison</h4>
          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
            Track changes between your latest reports
          </p>
        </div>
      </div>

      {/* Report Selection */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-[10px] text-slate-500 font-semibold block mb-2">
            Current Report
          </label>
          <select
            value={currentReport?.id || ""}
            onChange={(e) => {
              const report = reports.find((r) => r.id === parseInt(e.target.value));
              setCurrentReport(report);
            }}
            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          >
            {reports.map((report) => (
              <option key={report.id} value={report.id}>
                {new Date(report.created_at).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-slate-500 font-semibold block mb-2">
            Previous Report
          </label>
          <select
            value={previousReport?.id || ""}
            onChange={(e) => {
              const report = reports.find((r) => r.id === parseInt(e.target.value));
              setPreviousReport(report);
            }}
            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="">Select a report</option>
            {reports.filter((r) => r.id !== currentReport?.id).map((report) => (
              <option key={report.id} value={report.id}>
                {new Date(report.created_at).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Table */}
      {comparisonData.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left py-3 px-3 text-slate-500 font-semibold">
                  Test Name
                </th>
                <th className="text-center py-3 px-3 text-slate-500 font-semibold">
                  Previous
                </th>
                <th className="text-center py-3 px-3 text-slate-500 font-semibold">
                  Current
                </th>
                <th className="text-center py-3 px-3 text-slate-500 font-semibold">
                  Change
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b border-slate-800/30 hover:bg-slate-900/20 transition-colors"
                >
                  <td className="py-3 px-3">
                    <div>
                      <p className="text-white font-medium">{row.testName}</p>
                      <p className="text-[9px] text-slate-500 mt-1">
                        {row.currentStatus !== "Normal" && (
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold border ${
                              row.currentStatus === "High"
                                ? "bg-red-500/20 text-red-400 border-red-500/30"
                                : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            }`}
                          >
                            {row.currentStatus}
                          </span>
                        )}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center text-slate-300 font-mono">
                    {row.previousValue}
                    {row.previousUnit && <span className="text-slate-500 ml-1">{row.previousUnit}</span>}
                  </td>
                  <td className="py-3 px-3 text-center text-white font-mono font-semibold">
                    {row.currentValue}
                    {row.currentUnit && <span className="text-slate-500 ml-1">{row.currentUnit}</span>}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.trend === "increase" && (
                      <div className="flex items-center justify-center gap-1">
                        <TrendingUp className="h-4 w-4 text-green-400" />
                        <span className="text-green-400 font-semibold">
                          +{row.changePercent}%
                        </span>
                      </div>
                    )}
                    {row.trend === "decrease" && (
                      <div className="flex items-center justify-center gap-1">
                        <TrendingDown className="h-4 w-4 text-red-400" />
                        <span className="text-red-400 font-semibold">
                          {row.changePercent}%
                        </span>
                      </div>
                    )}
                    {row.trend === "stable" && (
                      <div className="flex items-center justify-center gap-1">
                        <Minus className="h-4 w-4 text-slate-500" />
                        <span className="text-slate-500 font-semibold">Stable</span>
                      </div>
                    )}
                    {!row.trend && <span className="text-slate-500">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={<GitCompare className="h-8 w-8 text-slate-600 mb-2" />}
          title="No data available to compare"
          description="Please select two reports with biomarkers to compare."
        />
      )}
    </Card>
  );
};

export default BiomarkerComparison;
