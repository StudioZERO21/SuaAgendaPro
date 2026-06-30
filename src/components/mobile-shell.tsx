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
    <div className="min-h-screen w-full bg-gradient-to-b from-background via-background to-background">
      <div
        className={cn(
          "mx-auto flex min-h-screen w-full max-w-md flex-col bg-background/40",
          withNav && "pb-24",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
