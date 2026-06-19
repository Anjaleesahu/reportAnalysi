import React from "react";

/**
 * Labeled input used in forms (Login / Register / DailyTracker).
 * Optionally renders a leading icon and a trailing adornment (e.g. show/hide
 * password toggle). When `label` is omitted it renders a bare input so it can
 * be used for inline controls too.
 */
const Input = ({
  label,
  icon = null,
  trailing = null,
  containerClassName = "flex flex-col gap-1.5",
  labelClassName = "text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-0.5",
  className = "",
  labelRight = null,
  ...props
}) => {
  const field = (
    <div className="relative">
      {icon && (
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
          {icon}
        </span>
      )}
      <input className={className} {...props} />
      {trailing}
    </div>
  );

  if (!label) {
    return field;
  }

  return (
    <div className={containerClassName}>
      {labelRight ? (
        <div className="flex justify-between items-center px-0.5">
          <label className={labelClassName}>{label}</label>
          {labelRight}
        </div>
      ) : (
        <label className={labelClassName}>{label}</label>
      )}
      {field}
    </div>
  );
};

export default Input;
