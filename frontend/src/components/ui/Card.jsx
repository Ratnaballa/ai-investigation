export default function Card({ children, className = '', glow = false }) {
  return (
    <div className={`premium-card rounded-[24px] p-6 ${glow ? 'card-glow' : ''} ${className}`}>
      {children}
    </div>
  );
}
