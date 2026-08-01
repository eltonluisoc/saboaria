import { useId, type InputHTMLAttributes, type LabelHTMLAttributes } from "react";

interface FieldProps {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  className = "",
  id,
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <Field label={label} error={error} htmlFor={inputId}>
      <input
        id={inputId}
        className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 ${
          error ? "border-red-400" : "border-slate-300"
        } ${className}`}
        {...props}
      />
    </Field>
  );
}

export function Select({
  label,
  error,
  className = "",
  id,
  children,
  ...props
}: FieldProps &
  React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  return (
    <Field label={label} error={error} htmlFor={selectId}>
      <select
        id={selectId}
        className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 ${
          error ? "border-red-400" : "border-slate-300"
        } ${className}`}
        {...props}
      >
        {children}
      </select>
    </Field>
  );
}

function Field({
  label,
  error,
  htmlFor,
  children,
}: FieldProps & Pick<LabelHTMLAttributes<HTMLLabelElement>, "htmlFor"> & { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      {children}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
