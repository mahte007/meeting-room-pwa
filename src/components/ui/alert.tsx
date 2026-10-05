import type { ReactNode } from "react";

type AlertProps = {
  variant: "success" | "error" | "warning";
  title?: string;
  children?: ReactNode;
};

const variantClasses = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-red-200 bg-red-50 text-red-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
};

export function Alert({ variant, title, children }: AlertProps) {
  return (
    <div
      // Errors interrupt the screen reader; other messages wait their turn.
      role={variant === "error" ? "alert" : "status"}
      className={`rounded-2xl border p-4 text-sm ${variantClasses[variant]}`}
    >
      {title && <p className="font-medium">{title}</p>}
      {children && <div className={title ? "mt-1" : undefined}>{children}</div>}
    </div>
  );
}
