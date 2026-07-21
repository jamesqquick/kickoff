import { cn } from "@/lib/utils";

interface TeamCrestProps {
  initials: string;
  gradient: string; // e.g. "from-emerald-500 to-emerald-700"
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}

const sizeClasses: Record<string, string> = {
  xs:  "w-6 h-6 rounded-[6px] text-[10px]",
  sm:  "w-8 h-8 rounded-[8px] text-xs",
  md:  "w-9 h-9 rounded-[9px] text-xs",
  lg:  "w-10 h-10 rounded-[10px] text-sm",
  xl:  "w-11 h-11 rounded-[10px] text-sm",
  "2xl": "w-24 h-24 rounded-[20px] text-[34px]",
};

export function TeamCrest({ initials, gradient, size = "sm", className }: TeamCrestProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center font-bold text-white bg-gradient-to-br shrink-0",
        sizeClasses[size],
        gradient,
        className,
      )}
    >
      {initials}
    </div>
  );
}
