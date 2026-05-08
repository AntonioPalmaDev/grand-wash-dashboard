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
    <div className={cn("glass-card rounded-lg p-4 sm:p-5 animate-fade-in w-full", variantStyles[variant])}>
      <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2">
        <span className="text-xs sm:text-sm text-muted-foreground font-medium truncate">{title}</span>
        <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5 shrink-0", iconStyles[variant])} />
      </div>
      <div className="text-lg sm:text-2xl font-bold font-mono tracking-tighter truncate">{value}</div>
      {description && <p className="text-xs text-muted-foreground mt-1 truncate">{description}</p>}
    </div>
  );
}
