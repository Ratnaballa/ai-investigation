export default function Input({
  label, type = 'text', value, onChange, placeholder, error,
  required = false, disabled = false, className = '', icon, ...rest
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/80 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 ${icon ? 'pl-10' : ''} ${error ? 'border-red-500' : ''}`}
          {...rest}
        />
      </div>
      {error && <p className="text-xs text-red-500 font-medium mt-0.5">{error}</p>}
    </div>
  );
}
