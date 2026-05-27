import React from "react";
import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExecutiveKpiProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  } | null;
  color: string;
  critical?: boolean;
}

const colorMap: Record<string, string> = {
  emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  purple: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  indigo: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
  amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  cyan: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
  rose: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  teal: "text-teal-500 bg-teal-500/10 border-teal-500/20",
};

export function ExecutiveKpi({ title, value, icon: Icon, trend, color, critical }: ExecutiveKpiProps) {
  return (
    <div className={cn(
      "p-5 rounded-[1.5rem] border bg-secondary/5 backdrop-blur-sm transition-all hover:bg-secondary/10 group",
      critical ? "border-rose-500/50 bg-rose-500/5 animate-pulse" : "border-white/5"
    )}>
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-2.5 rounded-xl border", colorMap[color] || "text-primary bg-primary/10 border-primary/20")}>
          <Icon size={20} />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full",
            trend.isPositive ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10"
          )}>
            {trend.isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />} {trend.value}
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1 group-hover:text-white/60 transition-colors">{title}</p>
        <p className="text-2xl font-mono font-black text-white tracking-tighter leading-none">{value}</p>
      </div>
    </div>
  );
}
