import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  description?: string;
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
}

const variantStyles = {
  default: "border-border/50",
  primary: "border-primary/30 glow-primary",
  success: "border-success/30",
  warning: "border-warning/30",
  destructive: "border-destructive/30",
};

const iconStyles = {
  default: "text-muted-foreground",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

export function KpiCard({ title, value, icon: Icon, description, variant = "default" }: KpiCardProps) {
  return (
    <div className={cn("glass-card rounded-lg p-3 sm:p-4 lg:p-5 animate-fade-in min-w-0", variantStyles[variant])}>
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <span className="text-xs sm:text-sm text-muted-foreground font-medium truncate mr-2">{title}</span>
        <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5 shrink-0", iconStyles[variant])} />
      </div>
      <div
        className="font-bold font-mono tracking-tighter leading-tight break-all"
        style={{ fontSize: "clamp(0.875rem, 2.5vw, 1.5rem)" }}
      >
        {value}
      </div>
      {description && <p className="text-xs text-muted-foreground mt-1 truncate">{description}</p>}
    </div>
  );
}
