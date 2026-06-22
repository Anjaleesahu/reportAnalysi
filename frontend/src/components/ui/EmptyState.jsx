
/**
 * Placeholder shown when there is no data (e.g. "No data available",
 * "Need at least 2 reports to compare"). Mirrors the dashed-border empty
 * blocks used in BiomarkerComparison and LabValuesChart.
 */
const EmptyState = ({
  icon = null,
  title,
  description,
  className = "flex flex-col items-center justify-center py-8 text-slate-500 border border-dashed border-slate-800 rounded-xl",
}) => {
  return (
    <div className={className}>
      {icon}
      {title && <p className="text-xs font-semibold">{title}</p>}
      {description && (
        <p className="text-[10px] text-slate-600 mt-1">{description}</p>
      )}
    </div>
  );
};

export default EmptyState;
