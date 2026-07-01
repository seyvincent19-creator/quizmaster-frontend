export default function SkeletonCard({ rows = 3 }) {
  return (
    <div className="card animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 rounded mb-3" style={{ width: `${75 - i * 15}%` }}></div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="animate-pulse">
      <div className="h-10 bg-gray-200 rounded mb-2"></div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 mb-2">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-8 bg-gray-100 rounded flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  );
}
