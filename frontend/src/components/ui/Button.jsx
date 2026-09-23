import { motion } from 'framer-motion';

export default function Button({
  children, onClick, type = 'button', variant = 'primary',
  size = 'md', disabled = false, loading = false, className = '', icon,
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-2xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-transparent';
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-5 py-2.5 text-sm', lg: 'px-7 py-3 text-base' };
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/35 hover:from-blue-500 hover:to-indigo-500',
    secondary: 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-sm',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20',
    ghost: 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -1, scale: 1.01 }}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : icon}
      {children}
    </motion.button>
  );
}
