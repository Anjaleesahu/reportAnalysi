import React from "react";

/**
 * Loading spinner. Sizes map to the existing border-width / dimension combos
 * used across ProtectedRoute, ReportsHistory, Tracker and BiomarkerComparison.
 */
const sizes = {
  sm: "h-6 w-6 border-2",
  md: "h-10 w-10 border-4",
};

const Spinner = ({ size = "md", className = "" }) => {
  return (
    <div
      className={`${sizes[size]} animate-spin rounded-full border-indigo-500/20 border-t-indigo-500 ${className}`}
    />
  );
};

export default Spinner;
