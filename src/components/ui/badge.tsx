import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-(--color-primary) text-(--color-primary-fg)",
        secondary:
          "border-(--color-border) bg-(--color-border-soft) text-(--color-muted)",
        success:
          "border-(--color-primary)/30 bg-(--color-primary-subtle) text-(--color-primary)",
        warning:
          "border-(--color-warn)/30 bg-(--color-warn-subtle) text-(--color-warn)",
        destructive:
          "border-(--color-danger)/30 bg-(--color-danger-subtle) text-(--color-danger)",
        accent:
          "border-(--color-accent)/30 bg-(--color-accent-subtle) text-(--color-accent)",
        info:
          "border-(--color-info)/30 bg-(--color-info-subtle) text-(--color-info)",
        outline:
          "border-(--color-border) text-(--color-foreground)",
        live:
          "border-(--color-danger)/30 bg-(--color-danger-subtle) text-(--color-danger) animate-pulse",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
