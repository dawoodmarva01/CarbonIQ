import { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}

export function Button({ children, variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "px-4 py-2.5 rounded-lg text-[14px] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "primary" && "bg-lime text-white hover:bg-lime/90 shadow-sm",
        variant === "secondary" && "bg-panel2 text-cream hover:bg-line border border-line",
        variant === "ghost" && "text-sage hover:text-cream hover:bg-panel2",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
