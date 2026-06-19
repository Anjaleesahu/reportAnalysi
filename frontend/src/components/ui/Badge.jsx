import React from "react";

/**
 * Status pill (Normal / High / Low) used in lab value displays.
 * `status` selects the default color scheme; `label` overrides displayed text.
 * `size` toggles between the common pill sizings seen across the app.
 */
const statusStyles = {
  Normal: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  High: "bg-red-500/10 text-red-400 border-red-500/25",
  Low: "bg-amber-500/10 text-amber-400 border-amber-500/25",
};

const sizeStyles = {
  xs: "text-[8.5px] font-bold px-2 py-0.5 rounded-full border",
  sm: "text-[9px] font-bold px-2.5 py-0.5 rounded-full border",
};

const Badge = ({
  status = "Normal",
  label,
  size = "sm",
  className = "",
  children,
}) => {
  const style = statusStyles[status] || statusStyles.Normal;
  return (
    <span className={`${sizeStyles[size] || sizeStyles.sm} ${style} ${className}`}>
      {children ?? label ?? status}
    </span>
  );
};

export default Badge;
