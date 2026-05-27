import React from "react";
import { LucideIcon } from "lucide-react";

interface FilterItemProps {
  icon: LucideIcon;
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}

export function FilterItem({ icon: Icon, label, value, options, onChange }: FilterItemProps) {
  return (
    <div className="relative group">
      <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
        <Icon size={14} className="text-primary" />
        <div className="flex flex-col">
          <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground leading-none mb-1">{label}</span>
          <select 
            className="bg-transparent border-none p-0 text-xs font-bold text-white outline-none cursor-pointer appearance-none min-w-[80px]"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-black text-white">{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
