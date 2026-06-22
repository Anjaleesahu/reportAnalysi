import { useState, useEffect } from "react";
import { Heart, AlertTriangle, CheckCircle, TrendingUp, Loader } from "lucide-react";
import Card from "../../components/ui/Card";

const HealthSummary = ({ labValues, reportId }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const generateSummary = async () => {
      try {
        setLoading(true);

        // Group lab values by status
        const abnormalValues = labValues.filter(v => v.status !== "Normal");
        const normalValues = labValues.filter(v => v.status === "Normal");

        // Prepare summary data
        const summaryData = {
          totalTests: labValues.length,
          normalCount: normalValues.length,
          abnormalCount: abnormalValues.length,
          abnormalTests: abnormalValues.map(v => ({
            name: v.test_name,
            value: v.value,
            status: v.status,
            unit: v.unit,
            reference: v.reference_range
          })),
          normalTests: normalValues.slice(0, 5).map(v => ({
            name: v.test_name,
            value: v.value,
            unit: v.unit
          }))
        };

        setSummary(summaryData);
      } catch (err) {
        console.error("Error generating summary:", err);
        setError("Unable to generate health summary");
      } finally {
        setLoading(false);
      }
    };

    if (labValues && labValues.length > 0) {
      generateSummary();
    }
  }, [labValues, reportId]);

  if (loading) {
    return (
      <Card className="p-6 w-full">
        <div className="flex items-center justify-center py-8">
          <Loader className="h-5 w-5 animate-spin text-indigo-400 mr-2" />
          <span className="text-slate-400 text-sm">Generating health insights...</span>
        </div>
      </Card>
    );
  }

  if (error || !summary) {
    return null;
  }

  return (
    <Card className="p-6 w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-8 items-center justify-center flex rounded-lg bg-rose-500/10 text-rose-400">
          <Heart className="h-4.5 w-4.5" />
        </div>
        <div>
          <h4 className="font-display font-bold text-white text-sm">Health Summary</h4>
          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
            Key findings and medical insights from your latest report
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-800/50 text-center">
          <p className="text-2xl font-bold text-white">{summary.totalTests}</p>
          <p className="text-[10px] text-slate-500 mt-1">Tests Analyzed</p>
        </div>
        <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20 text-center">
          <p className="text-2xl font-bold text-emerald-400">{summary.normalCount}</p>
          <p className="text-[10px] text-emerald-600 mt-1">Normal Values</p>
        </div>
        <div
          className={`rounded-lg p-3 border text-center ${
            summary.abnormalCount > 0
              ? "bg-red-500/10 border-red-500/20"
              : "bg-slate-900/30 border-slate-800/50"
          }`}
        >
          <p className={`text-2xl font-bold ${summary.abnormalCount > 0 ? "text-red-400" : "text-slate-400"}`}>
            {summary.abnormalCount}
          </p>
          <p className={`text-[10px] mt-1 ${summary.abnormalCount > 0 ? "text-red-600" : "text-slate-500"}`}>
            {summary.abnormalCount > 0 ? "Abnormal Values" : "No Concerns"}
          </p>
        </div>
      </div>

      {/* Abnormal Values Alert */}
      {summary.abnormalCount > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h5 className="font-semibold text-red-300 mb-3">⚠ Abnormal Values Detected</h5>
              <div className="space-y-2">
                {summary.abnormalTests.map((test, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-white">{test.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {test.value} {test.unit}
                        {test.reference && ` (Ref: ${test.reference})`}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-[9px] font-bold border ${
                        test.status === "High"
                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                          : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {test.status}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-3 pt-3 border-t border-red-500/20">
                💡 Consider consulting with your healthcare provider about these values.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Normal Values Highlight */}
      {summary.normalTests.length > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <h5 className="font-semibold text-emerald-300 mb-3">✓ Positive Observations</h5>
              <div className="space-y-1.5 text-[10px]">
                {summary.normalTests.map((test, idx) => (
                  <p key={idx} className="text-slate-300">
                    • <span className="font-medium">{test.name}</span>: {test.value} {test.unit} (Normal)
                  </p>
                ))}
                {summary.normalCount > 5 && (
                  <p className="text-slate-400 italic">
                    + {summary.normalCount - 5} more normal values
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Medical Recommendations */}
      <div className="mt-6 pt-6 border-t border-slate-800">
        <h5 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-indigo-400" />
          Recommendations
        </h5>
        <ul className="text-[10px] text-slate-400 space-y-2">
          <li>
            ✓ Upload your next report in <span className="text-slate-300 font-medium">30 days</span> to track trends
          </li>
          <li>
            ✓ Maintain detailed records of your symptoms and health habits
          </li>
          {summary.abnormalCount > 0 && (
            <li>
              ⚠ Schedule a follow-up consultation with your healthcare provider
            </li>
          )}
        </ul>
      </div>
    </Card>
  );
};

export default HealthSummary;
