import React, { useState, useRef } from "react";
import { Upload, FileUp, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { uploadReport } from "../../api/reportsApi";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

const ReportUpload = ({ onUploadSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const uploadFile = async (file) => {
    setLoading(true);
    setError(null);
    setExtractedData(null);

    try {
      const data = await uploadReport(file);
      setExtractedData(data);
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      console.error("Report upload failed:", err.response?.data || err);
      let detail =
        err.response?.data?.detail ||
        err.response?.data ||
        err.message ||
        "An unexpected error occurred while parsing the file.";

      if (!err.response) {
        detail =
          "Network Error: could not connect to the backend. " +
          "Please ensure the API server is running and the API URL is correct.";
      }

      setError(typeof detail === "string" ? detail : JSON.stringify(detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Upload Zone */}
      <div
        className={`glass-panel p-8 text-center flex flex-col items-center justify-center border-2 border-dashed transition-all duration-300 relative ${
          dragActive
            ? "border-indigo-500 bg-indigo-500/5 shadow-inner"
            : "border-slate-800 hover:border-indigo-500/30"
        } ${loading ? "opacity-75 pointer-events-none" : ""}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleChange}
        />

        {loading ? (
          <div className="flex flex-col items-center py-6 w-full max-w-sm">
            <RefreshCw className="h-10 w-10 text-indigo-400 animate-spin mb-4" />
            <h3 className="font-display text-sm font-bold text-white mb-2">Analyzing Lab Report</h3>
            <p className="text-[10px] text-slate-500 font-semibold text-center mb-4 leading-normal">
              Reading file contents and fetching AI biomarkers...
            </p>
            {/* Custom Animated Progress Bar */}
            <div className="w-full h-1.5 bg-[#050816] rounded-full overflow-hidden border border-slate-800">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full animate-[shimmer_1.5s_infinite_linear] w-[70%]" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-4">
            <div className="h-14 w-14 items-center justify-center flex rounded-2xl bg-[#050816]/60 border border-slate-800 text-indigo-400 mb-4 transition-transform duration-300 hover:scale-105 shadow-md">
              <Upload className="h-6 w-6 text-indigo-400" />
            </div>
            <h3 className="font-display text-sm font-extrabold text-white mb-1">
              Upload Medical Report
            </h3>
            <p className="text-[10.5px] text-slate-500 font-semibold mb-6">
              Drag and drop your file here, or click browse.
            </p>
            <Button
              type="button"
              onClick={onButtonClick}
              className="text-[10.5px] tracking-wide px-5 py-2.5 hover:-translate-y-0.5"
            >
              Select PDF or Image
            </Button>
            <p className="text-[9.5px] text-slate-600 font-semibold mt-4">
              Supports: PDF, PNG, JPG, JPEG. Max 10MB.
            </p>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex gap-3 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl p-4 text-xs leading-relaxed">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <span className="font-bold text-white mb-0.5">OCR Analysis Failed</span>
            <span className="font-medium text-slate-400">{error}</span>
          </div>
        </div>
      )}

      {/* Extraction Results */}
      {extractedData && (
        <Card className="p-6 border border-emerald-500/20 bg-slate-900/10">
          <div className="flex items-center gap-2 mb-6 text-emerald-400">
            <CheckCircle2 className="h-4.5 w-4.5" />
            <h4 className="font-display font-bold text-white text-xs uppercase tracking-wider">Report Parsed Successfully</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {extractedData.lab_values.map((lab) => {
              // Map Low/High/Normal to Warning/Critical/Normal colors
              const statusBadges = {
                Normal: {
                  label: "Normal",
                  style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
                },
                Low: {
                  label: "Warning",
                  style: "bg-amber-500/10 text-amber-400 border-amber-500/25",
                },
                High: {
                  label: "Critical",
                  style: "bg-red-500/10 text-red-400 border-red-500/25",
                },
              };

              const currentBadge = statusBadges[lab.status] || statusBadges["Normal"];

              return (
                <div
                  key={lab.id}
                  className="bg-[#0f172a]/50 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700/80 transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-3.5">
                    <span className="text-xs font-bold text-slate-400">{lab.test_name}</span>
                    <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${currentBadge.style}`}>
                      {currentBadge.label}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-display font-extrabold text-white tracking-tight">{lab.value}</span>
                    <span className="text-[10px] text-slate-500 font-bold">{lab.unit}</span>
                  </div>

                  <div className="text-[10px] text-slate-500 flex justify-between border-t border-slate-800/80 pt-3.5 mt-2 font-semibold">
                    <span>Reference Range:</span>
                    <span className="text-slate-300">{lab.reference_range}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ReportUpload;
