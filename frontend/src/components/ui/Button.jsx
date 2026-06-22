
/**
 * Reusable button primitive.
 *
 * variants:
 *  - primary:   solid indigo (default action buttons)
 *  - secondary: subtle dark/bordered button (e.g. stepper controls)
 *  - danger:    rose/red destructive action
 *  - ghost:     transparent, used for menu/icon actions
 *
 * Supports `loading` (shows loadingText / spinner), `icon`, and `disabled`.
 */
const baseClasses = "transition duration-200 cursor-pointer";

const variantClasses = {
  primary:
    "bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:shadow-indigo-500/20",
  secondary:
    "bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-white rounded-xl",
  danger:
    "text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg border border-transparent hover:border-red-500/20",
  ghost:
    "text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/50",
};

const Button = ({
  variant = "primary",
  type = "button",
  loading = false,
  loadingText,
  icon = null,
  disabled = false,
  className = "",
  children,
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant] || ""} ${className}`}
      {...props}
    >
      {icon}
      {loading && loadingText ? loadingText : children}
    </button>
  );
};

export default Button;
