import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

export function TableSkeleton({ rows = 5, cols = 6 }: TableSkeletonProps) {
  // Generate stable unique keys for skeleton elements
  const headerKeys = Array.from({ length: cols }, (_, i) => `header-${crypto.randomUUID()}-${i}`);
  const rowKeys = Array.from({ length: rows }, (_, i) => `row-${crypto.randomUUID()}-${i}`);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {headerKeys.map((key) => (
            <TableHead key={key}>
              <Skeleton className="h-4 w-20" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rowKeys.map((rowKey) => {
          const cellKeys = Array.from({ length: cols }, (_, i) => `${rowKey}-cell-${i}`);
          return (
            <TableRow key={rowKey}>
              {cellKeys.map((cellKey) => (
                <TableCell key={cellKey}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
