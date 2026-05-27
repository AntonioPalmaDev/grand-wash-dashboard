import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReportChartsProps {
  data: { date: string; bruto: number; liquido: number }[];
}

export function ReportCharts({ data }: ReportChartsProps) {
  return (
    <Card className="bg-secondary/10 border-white/5 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
          Tendência de Movimentação
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorBruto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorLiquido" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.3)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="rgba(255,255,255,0.3)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `R$ ${value / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(13, 13, 13, 0.95)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#fff",
                }}
                formatter={(value: number) => [formatCurrency(value), ""]}
              />
              <Area
                type="monotone"
                dataKey="bruto"
                name="Bruto"
                stroke="var(--primary)"
                fillOpacity={1}
                fill="url(#colorBruto)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="liquido"
                name="Líquido"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorLiquido)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
