import { useState, useEffect } from "react";
import { GitCompareArrows, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getHistory, getReport } from "../../api/reportsApi";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import Spinner from "../../components/ui/Spinner";
import Badge from "../../components/ui/Badge";

const buildMap = (report) => {
  const map = {};
  (report?.lab_values || []).forEach((l) => {
    map[l.test_name] = l;
  });
  return map;
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";

const ChangeCell = ({ from, to }) => {
  const a = Number(from?.value);
  const b = Number(to?.value);
  if (from == null || to == null || Number.isNaN(a) || Number.isNaN(b)) {
    return <span className="text-slate-600">—</span>;
  }
  const delta = b - a;
  if (delta === 0) {
    return (
      <span className="flex items-center gap-1 text-slate-400">
        <Minus className="h-3.5 w-3.5" /> 0
      </span>
    );
  }
  const up = delta > 0;
  const pct = a !== 0 ? Math.abs((delta / a) * 100).toFixed(1) : "—";
  return (
    <span className={`flex items-center gap-1 font-bold ${up ? "text-red-400" : "text-emerald-400"}`}>
      {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
      {up ? "+" : ""}{delta.toFixed(2)} {pct !== "—" ? `(${pct}%)` : ""}
    </span>
  );
};

const BiomarkerComparison = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [fromData, setFromData] = useState(null);
  const [toData, setToData] = useState(null);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getHistory();
        if (!active) return;
        setReports(data);
        if (data.length >= 2) {
          setFromId(String(data[1].id)); // older (history is newest-first)
          setToId(String(data[0].id)); // newer
        }
      } catch (err) {
        console.error("Failed to load reports for comparison:", err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!fromId || !toId || fromId === toId) {
      setFromData(null);
      setToData(null);
      return;
    }
    let active = true;
    (async () => {
      setComparing(true);
      try {
        const [a, b] = await Promise.all([getReport(Number(fromId)), getReport(Number(toId))]);
        if (active) {
          setFromData(a);
          setToData(b);
        }
      } catch (err) {
        console.error("Failed to load reports for comparison:", err);
      } finally {
        if (active) setComparing(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [fromId, toId]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center py-6">
          <Spinner size="sm" />
        </div>
      </Card>
    );
  }

  if (reports.length < 2) {
    return (
      <Card className="p-6">
        <h4 className="font-display font-bold text-white text-sm mb-4 flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <GitCompareArrows className="h-4.5 w-4.5 text-indigo-400" />
          Compare Reports
        </h4>
        <EmptyState
          icon={<GitCompareArrows className="h-8 w-8 text-slate-700 mb-2" />}
          title="Need at least 2 reports to compare"
          description="Upload another report to track how your biomarkers change over time."
        />
      </Card>
    );
  }

  const fromMap = buildMap(fromData);
  const toMap = buildMap(toData);
  const names = Array.from(new Set([...Object.keys(fromMap), ...Object.keys(toMap)])).sort();

  const selectClass =
    "premium-input text-[11px] font-semibold py-2 px-2.5 bg-[#0f172a]/60 rounded-lg w-full";

  return (
    <Card className="p-6">
      <h4 className="font-display font-bold text-white text-sm mb-4 flex items-center gap-2 border-b border-slate-800/80 pb-3">
        <GitCompareArrows className="h-4.5 w-4.5 text-indigo-400" />
        Compare Reports
      </h4>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div>
          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">From</label>
          <select value={fromId} onChange={(e) => setFromId(e.target.value)} className={selectClass}>
            {reports.map((r) => (
              <option key={r.id} value={r.id}>
                {fmtDate(r.created_at)} — {r.filename}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">To</label>
          <select value={toId} onChange={(e) => setToId(e.target.value)} className={selectClass}>
            {reports.map((r) => (
              <option key={r.id} value={r.id}>
                {fmtDate(r.created_at)} — {r.filename}
              </option>
            ))}
          </select>
        </div>
      </div>

      {fromId === toId ? (
        <EmptyState title="Pick two different reports to compare." />
      ) : comparing ? (
        <div className="flex justify-center py-6">
          <Spinner size="sm" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[9px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                <th className="text-left py-2 font-bold">Biomarker</th>
                <th className="text-right py-2 font-bold">From</th>
                <th className="text-right py-2 font-bold">To</th>
                <th className="text-right py-2 font-bold">Change</th>
              </tr>
            </thead>
            <tbody>
              {names.map((name) => {
                const f = fromMap[name];
                const t = toMap[name];
                return (
                  <tr key={name} className="border-b border-slate-900/80">
                    <td className="py-2.5 text-slate-300 font-semibold">{name}</td>
                    <td className="py-2.5 text-right text-slate-400">
                      {f ? `${f.value} ${f.unit || ""}` : "—"}
                    </td>
                    <td className="py-2.5 text-right">
                      {t ? (
                        <span className="inline-flex items-center gap-2 justify-end">
                          <span className="text-white font-bold">{t.value} {t.unit || ""}</span>
                          <Badge status={t.status} size="xs" />
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <span className="inline-flex justify-end w-full">
                        <ChangeCell from={f} to={t} />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default BiomarkerComparison;
