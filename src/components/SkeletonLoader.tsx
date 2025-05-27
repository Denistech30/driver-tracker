interface SkeletonLoaderProps {
  type: 'card' | 'table';
  count?: number;
}

function SkeletonLoader({ type, count = 3 }: SkeletonLoaderProps) {
  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 card-grid-sm">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-card shadow-sm rounded-lg p-4 animate-pulse">
            <div className="h-4 w-1/3 bg-muted rounded mb-2" />
            <div className="h-6 w-2/3 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto animate-pulse">
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-muted">
            {Array.from({ length: 3 }).map((_, i) => (
              <th key={i} className="px-4 py-2">
                <div className="h-4 w-3/4 bg-muted rounded" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: count }).map((_, i) => (
            <tr key={i} className="border-t">
              {Array.from({ length: 3 }).map((__, j) => (
                <td key={j} className="px-4 py-2">
                  <div className="h-4 w-full bg-muted rounded" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SkeletonLoader;