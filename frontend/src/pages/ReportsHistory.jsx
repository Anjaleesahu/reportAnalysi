import { useState, useEffect } from "react";
import { Trash2, AlertCircle, FileText, ChevronDown, ChevronUp, Clock, Image as ImageIcon, Search, Download, FileDown } from "lucide-react";
import { getHistory, getReport, deleteReport, downloadReportFile } from "../api/reportsApi";
import { exportReportPdf } from "../utils/pdf";
import Spinner from "../components/ui/Spinner";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";

const isImage = (name = "") => /\.(png|jpe?g|bmp|tiff?)$/i.test(name);

const ReportsHistory = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [reportDetails, setReportDetails] = useState({});
  const [query, setQuery] = useState("");

  const filteredReports = reports.filter((r) =>
    (r.filename || "").toLowerCase().includes(query.trim().toLowerCase())
  );

  const ensureDetails = async (reportId) => {
    if (reportDetails[reportId]) return reportDetails[reportId];
    const data = await getReport(reportId);
    setReportDetails((prev) => ({ ...prev, [reportId]: data }));
    return data;
  };

  const handleDownload = async (e, report) => {
    e.stopPropagation();
    try {
      await downloadReportFile(report.id, report.filename);
    } catch (err) {
      console.error(err);
      alert("Could not download the original file.");
    }
  };

  const handleExportPdf = async (e, report) => {
    e.stopPropagation();
    try {
      const details = await ensureDetails(report.id);
      exportReportPdf({ ...report, ...details });
    } catch (err) {
      console.error(err);
      alert("Could not generate the PDF.");
    }
  };

  const fetchReports = async () => {
    try {
      const data = await getHistory();
      setReports(data);
    } catch (err) {
      console.error(err);
      setError("Failed to retrieve report history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleToggleExpand = async (reportId) => {
    if (expandedId === reportId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(reportId);

    if (!reportDetails[reportId]) {
      try {
        const data = await getReport(reportId);
        setReportDetails((prev) => ({
          ...prev,
          [reportId]: data,
        }));
      } catch (err) {
        console.error("Failed to load report details:", err);
      }
    }
  };

  const handleDelete = async (e, reportId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this report and all its extracted values?")) {
      return;
    }

    try {
      await deleteReport(reportId);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      if (expandedId === reportId) setExpandedId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete report.");
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-9 w-9 items-center justify-center flex rounded-lg bg-indigo-500/10 text-indigo-400">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-extrabold text-white">Report Archives</h1>
          <p className="text-xs text-slate-500">Manage previously uploaded health logs and review raw parser outputs.</p>
        </div>
      </div>

      {!loading && !error && reports.length > 0 && (
        <div className="relative max-w-md">
          <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reports by file name..."
            className="premium-input w-full pl-9 pr-3 py-2.5 text-xs font-medium"
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="md" />
        </div>
      ) : error ? (
        <Alert variant="errorPage" icon={<AlertCircle className="h-5 w-5" />}>
          {error}
        </Alert>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500 border border-dashed border-slate-800 rounded-2xl glass-panel">
          <FileText className="h-12 w-12 text-slate-700 mb-4" />
          <h3 className="font-display text-sm font-bold text-white mb-1">No reports archived</h3>
          <p className="text-xs text-slate-500 max-w-xs text-center leading-relaxed font-semibold">
            All your processed documents will list here. Upload a PDF or Image from the dashboard tab to begin.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {filteredReports.length === 0 && (
            <p className="text-xs text-slate-500 font-semibold py-6 text-center">
              No reports match "{query}".
            </p>
          )}
          {filteredReports.map((report) => {
            const isExpanded = expandedId === report.id;
            const details = reportDetails[report.id];

            return (
              <div
                key={report.id}
                className="glass-panel overflow-hidden transition-all duration-300 border-slate-800/80 bg-slate-900/10 hover:border-slate-800"
              >
                {/* Accordion Header */}
                <div
                  onClick={() => handleToggleExpand(report.id)}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4.5 gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 items-center justify-center flex rounded-xl bg-[#050816] border border-slate-800 ${isImage(report.filename) ? "text-cyan-400" : "text-indigo-400"}`}>
                      {isImage(report.filename) ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-100 max-w-sm sm:max-w-md truncate">
                        {report.filename}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[9.5px] text-slate-500 font-semibold mt-1">
                        <Clock className="h-3.5 w-3.5 text-indigo-400/80" />
                        <span>
                          Uploaded on{" "}
                          {new Date(report.created_at).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 border-slate-900 pt-3 sm:pt-0">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={(e) => handleExportPdf(e, report)}
                      className="p-2 transition duration-150"
                      title="Export as PDF"
                      icon={<FileDown className="h-4.5 w-4.5" />}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={(e) => handleDownload(e, report)}
                      className="p-2 transition duration-150"
                      title="Download original file"
                      icon={<Download className="h-4.5 w-4.5" />}
                    />
                    <Button
                      type="button"
                      variant="danger"
                      onClick={(e) => handleDelete(e, report.id)}
                      className="p-2 transition duration-150"
                      title="Delete Report"
                      icon={<Trash2 className="h-4.5 w-4.5" />}
                    />
                    {isExpanded ? (
                      <ChevronUp className="h-4.5 w-4.5 text-slate-500" />
                    ) : (
                      <ChevronDown className="h-4.5 w-4.5 text-slate-500" />
                    )}
                  </div>
                </div>

                {/* Accordion Body */}
                {isExpanded && (
                  <div className="border-t border-slate-900 bg-slate-950/20 p-5 space-y-6">
                    {!details ? (
                      <div className="flex justify-center py-6">
                        <Spinner size="sm" />
                      </div>
                    ) : (
                      <>
                        {/* AI Summary */}
                        {details.summary && (
                          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
                            <h5 className="text-[9.5px] font-extrabold text-indigo-300 uppercase tracking-wider mb-1.5">AI Summary</h5>
                            <p className="text-[11.5px] leading-relaxed text-slate-300 whitespace-pre-line">{details.summary}</p>
                          </div>
                        )}

                        {/* Extracted Lab Values list */}
                        <div>
                          <h5 className="text-[9.5px] font-extrabold text-slate-500 uppercase tracking-wider mb-3.5">Parsed Biomarkers</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {details.lab_values.map((lab) => {
                              return (
                                <div key={lab.id} className="bg-[#0f172a]/40 border border-slate-800/80 rounded-xl p-4">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] text-slate-400 font-bold">{lab.test_name}</span>
                                    <Badge status={lab.status} size="xs" />
                                  </div>
                                  <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-xl font-display font-extrabold text-white">{lab.value}</span>
                                    <span className="text-[9.5px] text-slate-500 font-bold">{lab.unit}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Raw OCR Text Panel */}
                        <div>
                          <h5 className="text-[9.5px] font-extrabold text-slate-500 uppercase tracking-wider mb-2.5">Raw Text Output</h5>
                          <div className="bg-[#050816]/85 border border-slate-900 rounded-xl p-4 max-h-48 overflow-y-auto text-[11px] text-slate-400 leading-relaxed font-mono whitespace-pre-wrap selection:bg-indigo-500/20 selection:text-white">
                            {details.extracted_text || "No raw text was archived."}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReportsHistory;
