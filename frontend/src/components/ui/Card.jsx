export default function Card({ children, className = '', glow = false }) {
  return (
    <div className={`glass rounded-2xl p-6 ${glow ? 'card-glow' : ''} ${className}`}>
      {children}
    </div>
  );
}
