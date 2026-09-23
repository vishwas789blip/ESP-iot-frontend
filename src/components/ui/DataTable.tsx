import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyState?: ReactNode;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends { _id?: string }>({
  columns,
  data,
  emptyState,
  onRowClick,
}: DataTableProps<T>) {
  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-4 py-3"
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
              {onRowClick && <th className="w-10" />}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={row._id || i}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-white/5 last:border-0 transition-colors ${
                  onRowClick ? 'hover:bg-white/5 cursor-pointer' : ''
                }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-sm text-gray-300">
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '—')}
                  </td>
                ))}
                {onRowClick && (
                  <td className="px-4 py-3 text-gray-600">
                    <ChevronRight className="w-4 h-4" />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
