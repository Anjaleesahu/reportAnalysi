import React from "react";

/**
 * The common glassmorphism panel used across pages. Wraps the `.glass-panel`
 * class so callers can add their own padding / extra classes.
 */
const Card = ({ as: Component = "div", className = "", children, ...props }) => {
  return (
    <Component className={`glass-panel ${className}`} {...props}>
      {children}
    </Component>
  );
};

export default Card;
