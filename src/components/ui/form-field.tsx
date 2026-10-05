import type { ReactNode } from "react";

export const inputClassName =
  "w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-slate-500";

export const primaryButtonClassName =
  "rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButtonClassName =
  "cursor-pointer rounded-xl border px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:cursor-default disabled:opacity-60";

export const dangerButtonClassName =
  "cursor-pointer rounded-xl border border-red-700 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-default disabled:opacity-60";

/** Props to spread on an input so screen readers announce its error. */
export function errorAttributes(id: string, error?: string) {
  return {
    id,
    "aria-invalid": !!error,
    "aria-describedby": error ? `${id}-error` : undefined,
  };
}

type FormFieldProps = {
  id: string;
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
};

export function FormField({
  id,
  label,
  error,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>

      {children}

      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
