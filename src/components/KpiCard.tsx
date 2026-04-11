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
    <div className={cn("glass-card rounded-lg p-5 animate-fade-in min-w-[280px] flex-1", variantStyles[variant])}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground font-medium">{title}</span>
        <Icon className={cn("h-5 w-5 shrink-0", iconStyles[variant])} />
      </div>
      <div className="text-2xl font-bold font-mono tracking-tighter whitespace-nowrap">{value}</div>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </div>
  );
}
