// Tone classes must stay complete string literals (not `bg-${tone}-50` etc) or
// Tailwind's JIT scanner won't find them and the class will silently no-op.
const TONES = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  red: 'bg-red-50 text-red-500',
  yellow: 'bg-yellow-50 text-yellow-600',
  indigo: 'bg-indigo-50 text-indigo-600',
};

export default function StatCard({ icon: Icon, label, value, sub, tone = 'blue' }) {
  return (
    <div className="card py-4 text-center">
      <div className={`stat-icon mx-auto ${TONES[tone]}`}>
        <Icon className="w-6 h-6" strokeWidth={1.75} />
      </div>
      <div className="text-2xl font-bold text-gray-900 mt-2">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}
