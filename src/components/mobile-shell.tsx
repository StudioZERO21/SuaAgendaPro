import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MobileShell({
  children,
  className,
  withNav = false,
}: {
  children: ReactNode;
  className?: string;
  withNav?: boolean;
}) {
  return (
    <div className="min-h-screen w-full bg-background">
      <div
        className={cn(
          "mx-auto flex min-h-screen w-full max-w-md flex-col bg-background",
          withNav && "pb-24",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
