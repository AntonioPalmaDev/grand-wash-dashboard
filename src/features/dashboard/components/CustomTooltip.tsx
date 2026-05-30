import React from "react";
import { formatCurrency } from "@/lib/format";

export function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl">
        <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-2">{label}</p>
        <p className="text-xl font-mono font-black text-emerald-500 tracking-tighter">
          {formatCurrency(payload[0].value)}
        </p>
        <p className="text-[9px] text-white/40 uppercase font-bold mt-1">Receita Real Consolidada</p>
      </div>
    );
  }
  return null;
}
