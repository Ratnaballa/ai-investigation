import { motion } from 'framer-motion';

export default function Button({
  children, onClick, type = 'button', variant = 'primary',
  size = 'md', disabled = false, loading = false, className = '', icon,
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-5 py-2.5 text-sm', lg: 'px-7 py-3 text-base' };
  const variants = {
    primary: 'btn-primary text-white',
    secondary: 'glass text-slate-200 hover:bg-white/10',
    danger: 'bg-red-600/80 hover:bg-red-600 text-white',
    ghost: 'text-slate-300 hover:text-white hover:bg-white/10',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : icon}
      {children}
    </motion.button>
  );
}
