import { AlertCircle } from "lucide-react";

/**
 * Banner used for error / success / info messaging.
 * Default matches the error banner used in Login / Register / ReportsHistory.
 */
const variants = {
  error:
    "flex gap-2.5 items-center bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 text-xs text-red-400 font-bold leading-normal",
  errorPage:
    "flex gap-2 items-center bg-red-500/10 border border-red-500/20 text-red-300 p-4 rounded-xl text-xs font-semibold",
  success:
    "flex gap-2.5 items-center bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 text-xs text-emerald-400 font-bold leading-normal",
  info:
    "flex gap-2.5 items-center bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3.5 text-xs text-indigo-300 font-bold leading-normal",
};

const Alert = ({
  variant = "error",
  icon = <AlertCircle className="h-4.5 w-4.5 shrink-0" />,
  className = "",
  children,
}) => {
  return (
    <div className={`${variants[variant] || variants.error} ${className}`}>
      {icon}
      <span>{children}</span>
    </div>
  );
};

export default Alert;
