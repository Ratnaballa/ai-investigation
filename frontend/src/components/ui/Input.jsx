export default function Input({
  label, type = 'text', value, onChange, placeholder, error,
  required = false, disabled = false, className = '', icon, ...rest
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-slate-300">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
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
          className={`w-full input-glass rounded-2xl px-4 py-2.75 text-sm ${icon ? 'pl-10' : ''} ${error ? 'border-red-500/60' : ''}`}
          {...rest}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
