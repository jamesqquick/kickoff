import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-(--color-card) group-[.toaster]:text-(--color-foreground) group-[.toaster]:border-(--color-border) group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-(--color-muted-fg)",
          actionButton:
            "group-[.toast]:bg-(--color-foreground) group-[.toast]:text-(--color-background)",
          cancelButton:
            "group-[.toast]:bg-(--color-border) group-[.toast]:text-(--color-foreground)",
          success: "group-[.toaster]:!text-(--color-success)",
          error: "group-[.toaster]:!text-(--color-danger)",
          warning: "group-[.toaster]:!text-(--color-warn)",
          info: "group-[.toaster]:!text-(--color-info)",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
