import { forwardRef } from "react";
import { cn, formatPhoneBR } from "@/lib/utils";

interface PhoneInputBRProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "type"> {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const PhoneInputBR = forwardRef<HTMLInputElement, PhoneInputBRProps>(
  ({ value, onChange, className, placeholder = "(11) 99999-9999", ...props }, ref) => {
    return (
      <div
        className={cn(
          "flex h-14 items-center overflow-hidden rounded-2xl border border-border bg-card shadow-card focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-0",
          className,
        )}
      >
        <span className="flex h-full select-none items-center border-r border-border/60 bg-secondary/40 px-3 text-sm font-semibold text-muted-foreground">
          +55
        </span>
        <input
          ref={ref}
          type="tel"
          inputMode="tel"
          value={value}
          onChange={(e) => onChange(formatPhoneBR(e.target.value))}
          placeholder={placeholder}
          maxLength={15}
          className="flex-1 h-full bg-transparent px-3 text-base outline-none placeholder:text-muted-foreground"
          {...props}
        />
      </div>
    );
  }
);

PhoneInputBR.displayName = "PhoneInputBR";

export { PhoneInputBR };
