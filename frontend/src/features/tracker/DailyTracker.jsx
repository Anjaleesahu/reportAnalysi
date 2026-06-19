import React, { useState } from "react";
import { Plus, Minus, Moon, Droplets, CheckCircle, Smile } from "lucide-react";
import { logDaily } from "../../api/trackingApi";
import Button from "../../components/ui/Button";

const DailyTracker = ({ onLogSuccess }) => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [sleepHours, setSleepHours] = useState(7.0);
  const [waterMl, setWaterMl] = useState(2000);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const symptomsList = [
    "Fatigue",
    "Headache",
    "Insomnia",
    "Dizziness",
    "Brain Fog",
    "Muscle Ache",
    "Stress",
    "Heartburn",
    "Dehydration",
    "Irritability",
  ];

  const handleSymptomToggle = (symptom) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleQuickWaterAdd = (amount) => {
    setWaterMl((prev) => Math.max(0, prev + amount));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      await logDaily({
        date,
        sleep_hours: parseFloat(sleepHours),
        water_ml: parseInt(waterMl),
        symptoms: selectedSymptoms,
      });
      setSuccess(true);
      if (onLogSuccess) {
        onLogSuccess();
      }
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Could not log tracking data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-6 flex flex-col gap-6 bg-[#0f172a]/20 border border-white/5">
      <div className="flex justify-between items-center border-b border-slate-800/80 pb-4">
        <h4 className="font-display font-bold text-white text-sm">Log Daily Wellness</h4>
        <input
          type="date"
          value={date}
          max={new Date().toISOString().split("T")[0]}
          onChange={(e) => setDate(e.target.value)}
          className="premium-input text-[10.5px] font-bold px-3 py-1.5 cursor-pointer"
        />
      </div>

      {/* Sleep Duration Slider */}
      <div className="flex flex-col gap-2.5">
        <div className="flex justify-between items-center">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Moon className="h-4 w-4 text-indigo-400" />
            Sleep Duration
          </label>
          <span className="text-sm font-display font-black text-indigo-400">
            {sleepHours} <span className="text-[10px] font-semibold text-slate-500">hrs</span>
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="24"
          step="0.5"
          value={sleepHours}
          onChange={(e) => setSleepHours(parseFloat(e.target.value))}
          className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-colors"
        />
        <div className="flex justify-between text-[9px] text-slate-650 font-bold px-0.5">
          <span>0 hrs</span>
          <span className="text-slate-500">8 hrs (Goal)</span>
          <span>24 hrs</span>
        </div>
      </div>

      {/* Water Intake Section */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Droplets className="h-4 w-4 text-cyan-400" />
            Water Intake
          </label>
          <span className="text-sm font-display font-black text-cyan-400">
            {waterMl} <span className="text-[10px] font-semibold text-slate-500">ml</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleQuickWaterAdd(-250)}
            className="p-2 transition duration-150"
            icon={<Minus className="h-4 w-4" />}
          />

          <input
            type="number"
            value={waterMl}
            onChange={(e) => setWaterMl(Math.max(0, parseInt(e.target.value) || 0))}
            className="premium-input text-center text-xs font-extrabold flex-1 py-1.5"
          />

          <Button
            type="button"
            variant="secondary"
            onClick={() => handleQuickWaterAdd(250)}
            className="p-2 transition duration-150"
            icon={<Plus className="h-4 w-4" />}
          />
        </div>

        {/* Quick Add Pills */}
        <div className="grid grid-cols-3 gap-2">
          {[250, 500, 1000].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => handleQuickWaterAdd(amt)}
              className="text-[9.5px] font-extrabold py-2 rounded-xl bg-[#06b6d4]/5 border border-[#06b6d4]/10 text-[#06b6d4] hover:bg-[#06b6d4]/15 hover:border-[#06b6d4]/20 transition-all duration-200 cursor-pointer"
            >
              +{amt === 1000 ? "1.0L" : `${amt}ml`}
            </button>
          ))}
        </div>
      </div>

      {/* Active Symptoms Selection */}
      <div className="flex flex-col gap-3">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Smile className="h-4 w-4 text-emerald-400" />
          Today's Symptoms
        </label>
        <div className="flex flex-wrap gap-2">
          {symptomsList.map((symptom) => {
            const isSelected = selectedSymptoms.includes(symptom);
            return (
              <button
                key={symptom}
                type="button"
                onClick={() => handleSymptomToggle(symptom)}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 shadow-sm shadow-emerald-500/5"
                    : "bg-slate-900/60 border-slate-850 text-slate-400 hover:border-slate-750"
                }`}
              >
                {symptom}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback Panel */}
      <div className="flex flex-col gap-2 mt-2">
        {error && <p className="text-xs text-red-400 font-bold">{error}</p>}
        {success && (
          <div className="flex items-center gap-2 text-[10.5px] text-emerald-400 font-bold bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
            <CheckCircle className="h-4 w-4" />
            <span>Health log updated successfully!</span>
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          loading={loading}
          loadingText="Saving Logs..."
          className="w-full disabled:opacity-50 text-xs py-3 hover:-translate-y-0.5"
        >
          Save Daily Log
        </Button>
      </div>
    </form>
  );
};

export default DailyTracker;
