import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted/80", className)} />;
}

/** Placeholder instantâneo — melhora perceived performance vs spinner central. */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 px-5 pb-6 pt-2" aria-busy="true" aria-label="Carregando dashboard">
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bone key={i} className="h-[118px]" />
        ))}
      </div>
      <Bone className="h-12 w-full rounded-2xl" />
      <div className="space-y-2">
        <Bone className="h-4 w-32" />
        <Bone className="h-16 w-full rounded-lg" />
        <Bone className="h-16 w-full rounded-lg" />
      </div>
      <Bone className="h-52 w-full rounded-2xl" />
    </div>
  );
}
