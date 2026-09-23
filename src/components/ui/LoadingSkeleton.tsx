interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

export function LoadingSkeleton({ className = '', lines = 1 }: LoadingSkeletonProps) {
  if (lines > 1) {
    return (
      <div className={`space-y-2.5 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="skeleton h-4 rounded"
            style={{ width: `${100 - i * (60 / lines)}%` }}
          />
        ))}
      </div>
    );
  }
  return <div className={`skeleton h-4 rounded ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <LoadingSkeleton className="w-32" />
        <div className="skeleton h-6 w-6 rounded" />
      </div>
      <LoadingSkeleton className="w-48" />
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="skeleton h-16 rounded-lg" />
        <div className="skeleton h-16 rounded-lg" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-3">
      <div className="flex justify-between">
        <LoadingSkeleton className="w-20" />
        <div className="skeleton h-10 w-10 rounded-lg" />
      </div>
      <div className="skeleton h-8 w-16 rounded" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex gap-4 pb-3 border-b border-white/5">
        {Array.from({ length: 4 }).map((_, i) => (
          <LoadingSkeleton key={i} className="flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: 4 }).map((_, j) => (
            <LoadingSkeleton key={j} className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
