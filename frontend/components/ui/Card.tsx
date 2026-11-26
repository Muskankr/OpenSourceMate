import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  theme?: "dark" | "light";
  variant?: "default" | "interactive" | "glass";
}

export const Card: React.FC<CardProps> = ({
  children,
  theme = "dark",
  variant = "default",
  className = "",
  ...props
}) => {
  const isDark = theme === "dark";

  const baseStyle = isDark
    ? "bg-slate-900/60 border border-slate-800 text-slate-100"
    : "bg-white border border-slate-200 text-slate-900 shadow-sm";

  const variantStyle = {
    default: "",
    interactive: isDark
      ? "hover:border-slate-700 hover:bg-slate-900/80 transition-all duration-200"
      : "hover:border-slate-300 hover:shadow-md transition-all duration-200",
    glass: isDark
      ? "backdrop-blur-xl bg-slate-900/40 border-slate-800/80"
      : "backdrop-blur-xl bg-white/80 border-slate-200/80",
  }[variant];

  return (
    <div className={`rounded-2xl p-6 ${baseStyle} ${variantStyle} ${className}`} {...props}>
      {children}
    </div>
  );
};
