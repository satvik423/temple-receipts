import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-xs space-y-2 py-8">
      <Skeleton className="mx-auto h-4 w-48" />
      <Skeleton className="mx-auto h-4 w-40" />
      <Skeleton className="mx-auto h-4 w-32" />
      <Skeleton className="mt-6 h-24 w-full" />
    </div>
  );
}
