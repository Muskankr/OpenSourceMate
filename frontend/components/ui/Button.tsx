import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  theme?: "dark" | "light";
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  theme = "dark",
  className = "",
  disabled,
  ...props
}) => {
  const isDark = theme === "dark";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs font-medium rounded-lg",
    md: "px-4 py-2 text-sm font-medium rounded-xl",
    lg: "px-6 py-3 text-base font-semibold rounded-2xl",
  }[size];

  const variantClasses = {
    primary: isDark
      ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-98 shadow-md shadow-emerald-500/20"
      : "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-98 shadow-md shadow-emerald-600/20",
    secondary: isDark
      ? "bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700"
      : "bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200",
    outline: isDark
      ? "bg-transparent text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500"
      : "bg-transparent text-slate-700 hover:text-slate-900 border border-slate-300 hover:border-slate-400",
    ghost: isDark
      ? "bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white"
      : "bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900",
    danger: isDark
      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
      : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100",
  }[variant];

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 transition-all duration-150 select-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-0.5 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};
