import { useState, useMemo, useRef } from "react";
import { 
  FileDown, 
  FileJson, 
  FileSpreadsheet, 
  Filter, 
  TrendingUp, 
  AlertCircle,
  Activity,
  DollarSign,
  Users,
  PieChart,
  Calendar,
  ImageIcon,
  FileImage,
  Trophy,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart as RePieChart,
  Pie,
  Legend,
  AreaChart,
  Area
} from "recharts";
import { KpiCard } from "@/components/KpiCard";
import { Skeleton } from "@/components/ui/skeleton";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import html2canvas from "html2canvas";

export default function PainelFinanceiroPage() {
  const { operations, clients, loading } = useApp();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [capturing, setCapturing] = useState(false);
  
  const [dateRange, setDateRange] = useState<"today" | "yesterday" | "7d" | "30d" | "thisMonth" | "lastMonth" | "all">("thisMonth");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [responsibleFilter, setResponsibleFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredData = useMemo(() => {
    let now = new Date();
    let start: Date | null = null;
    let end: Date | null = now;

    if (dateRange === "today") start = startOfDay(now);
    else if (dateRange === "yesterday") {
      start = startOfDay(subDays(now, 1));
      end = endOfDay(subDays(now, 1));
    }
    else if (dateRange === "7d") start = subDays(now, 7);
    else if (dateRange === "30d") start = subDays(now, 30);
    else if (dateRange === "thisMonth") start = startOfMonth(now);
    else if (dateRange === "lastMonth") {
      start = startOfMonth(subMonths(now, 1));
      end = endOfMonth(subMonths(now, 1));
    }

    return operations.filter(op => {
      const opDate = new Date(op.data);
      const dateMatch = !start || (opDate >= start && opDate <= end!);
      const statusMatch = statusFilter === "all" || op.status === statusFilter;
      const clientMatch = clientFilter === "all" || op.clientId === clientFilter;
      const responsibleMatch = responsibleFilter === "all" || op.responsavel === responsibleFilter;
      
      const client = clients.find(c => c.id === op.clientId);
      const typeMatch = typeFilter === "all" || (client?.tipo === typeFilter);

      return dateMatch && statusMatch && clientMatch && responsibleMatch && typeMatch;
    });
  }, [operations, clients, dateRange, statusFilter, clientFilter, responsibleFilter, typeFilter]);

  const prevPeriodData = useMemo(() => {
    let now = new Date();
    let start: Date | null = null;
    let end: Date | null = null;

    if (dateRange === "thisMonth") {
      start = startOfMonth(subMonths(now, 1));
      end = endOfMonth(subMonths(now, 1));
    } else if (dateRange === "30d") {
      start = subDays(now, 60);
      end = subDays(now, 30);
    } else if (dateRange === "7d") {
      start = subDays(now, 14);
      end = subDays(now, 7);
    }

    if (!start) return [];

    return operations.filter(op => {
      const opDate = new Date(op.data);
      return opDate >= start! && opDate <= end!;
    });
  }, [operations, dateRange]);

  const metrics = useMemo(() => {
    const totalMov = filteredData.reduce((acc, op) => acc + op.valorBruto, 0);
    const totalNet = filteredData.reduce((acc, op) => acc + op.lucroLiquido, 0);
    const totalOps = filteredData.length;
    const avgTicket = totalOps > 0 ? totalMov / totalOps : 0;
    const margin = totalMov > 0 ? (totalNet / totalMov) * 100 : 0;
    const activeClients = new Set(filteredData.map(op => op.clientId)).size;

    return { totalMov, totalNet, totalOps, avgTicket, margin, activeClients };
  }, [filteredData]);

  const prevMetrics = useMemo(() => {
    const totalMov = prevPeriodData.reduce((acc, op) => acc + op.valorBruto, 0);
    const totalNet = prevPeriodData.reduce((acc, op) => acc + op.lucroLiquido, 0);
    const totalOps = prevPeriodData.length;
    return { totalMov, totalNet, totalOps };
  }, [prevPeriodData]);

  const growth = (atual: number, anterior: number) => {
    if (anterior === 0) return atual > 0 ? 100 : 0;
    return ((atual - anterior) / anterior) * 100;
  };

  const gMov = growth(metrics.totalMov, prevMetrics.totalMov);
  const gNet = growth(metrics.totalNet, prevMetrics.totalNet);
  const gOps = growth(metrics.totalOps, prevMetrics.totalOps);

  const chartData = useMemo(() => {
    const daily: Record<string, { date: string; lucro: number; volume: number }> = {};
    
    filteredData.forEach(op => {
      const day = format(new Date(op.data), "dd/MM");
      if (!daily[day]) daily[day] = { date: day, lucro: 0, volume: 0 };
      daily[day].lucro += op.lucroLiquido;
      daily[day].volume += op.valorBruto;
    });

    return Object.values(daily).sort((a, b) => {
      const [dayA, monthA] = a.date.split("/").map(Number);
      const [dayB, monthB] = b.date.split("/").map(Number);
      return monthA !== monthB ? monthA - monthB : dayA - dayB;
    });
  }, [filteredData]);

  const statusPieData = useMemo(() => {
    const counts: Record<string, number> = {
      concluido: 0,
      pendente: 0,
      cancelado: 0
    };
    filteredData.forEach(op => counts[op.status]++);
    return [
      { name: "Concluído", value: counts.concluido, color: "#22c55e" },
      { name: "Pendente", value: counts.pendente, color: "#eab308" },
      { name: "Cancelado", value: counts.cancelado, color: "#ef4444" }
    ];
  }, [filteredData]);

  const topClients = useMemo(() => {
    const clientStats: Record<string, { lucro: number; volume: number; name: string }> = {};
    
    filteredData.forEach(op => {
      if (!clientStats[op.clientId]) {
        clientStats[op.clientId] = { 
          lucro: 0, 
          volume: 0, 
          name: clients.find(c => c.id === op.clientId)?.nome || "Desconhecido" 
        };
      }
      clientStats[op.clientId].lucro += op.lucroLiquido;
      clientStats[op.clientId].volume += op.valorBruto;
    });

    return Object.entries(clientStats)
      .map(([id, stats]) => ({
        id,
        ...stats
      }))
      .sort((a, b) => b.lucro - a.lucro)
      .slice(0, 10);
  }, [filteredData, clients]);

  const runCapture = async () => {
    if (!dashboardRef.current) return null;
    setCapturing(true);
    try {
      await document.fonts.ready;
      await new Promise(r => setTimeout(r, 500));
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#030712",
        logging: false
      });
      return canvas;
    } catch (e) {
      console.error(e);
      toast.error("Erro ao capturar imagem");
      return null;
    } finally {
      setCapturing(false);
    }
  };

  const exportPNG = async () => {
    const canvas = await runCapture();
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `painel-financeiro-${format(new Date(), "yyyy-MM-dd")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("PNG exportado com sucesso");
  };

  const exportJPEG = async () => {
    const canvas = await runCapture();
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `painel-financeiro-${format(new Date(), "yyyy-MM-dd")}.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 0.95);
    link.click();
    toast.success("JPEG exportado com sucesso");
  };

  const exportPDFImage = async () => {
    const canvas = await runCapture();
    if (!canvas) return;
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("l", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`painel-financeiro-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success("PDF exportado com sucesso");
  };

  const exportCSV = () => {
    const headers = ["Data", "Cliente", "Responsável", "Valor Bruto", "Valor Líquido", "Status"];
    const rows = filteredData.map(op => [
      format(new Date(op.data), "dd/MM/yyyy"),
      clients.find(c => c.id === op.clientId)?.nome || "",
      op.responsavel || "",
      op.valorBruto,
      op.lucroLiquido,
      op.status
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `financeiro-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const exportXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData.map(op => ({
      Data: format(new Date(op.data), "dd/MM/yyyy"),
      Cliente: clients.find(c => c.id === op.clientId)?.nome || "",
      Status: op.status,
      "Valor Bruto": op.valorBruto,
      "Valor Líquido": op.lucroLiquido
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório");
    XLSX.writeFile(wb, `financeiro-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel Financeiro Geral</h1>
          <p className="text-muted-foreground">Consolidação estratégica de todas as operações.</p>
        </div>

        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="yesterday">Ontem</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="thisMonth">Este Mês</SelectItem>
              <SelectItem value="lastMonth">Mês Passado</SelectItem>
              <SelectItem value="all">Tudo</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FileDown className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportCSV}>
                <FileJson className="mr-2 h-4 w-4" /> CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportXLSX}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel (XLSX)
              </DropdownMenuItem>
              <Separator className="my-1" />
              <DropdownMenuItem onClick={exportPNG} disabled={capturing}>
                <ImageIcon className="mr-2 h-4 w-4" /> PNG (Screenshot)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportJPEG} disabled={capturing}>
                <FileImage className="mr-2 h-4 w-4" /> JPEG (Screenshot)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportPDFImage} disabled={capturing}>
                <FileDown className="mr-2 h-4 w-4" /> {capturing ? "Gerando..." : "PDF (Screenshot)"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Clientes</SelectItem>
            {clients.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Tipos</SelectItem>
            <SelectItem value="pf">PF</SelectItem>
            <SelectItem value="pj">PJ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div ref={dashboardRef} className={cn("space-y-6 p-1 rounded-lg", capturing && "bg-slate-950")}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Volume Movimentado"
            value={formatCurrency(metrics.totalMov)}
            icon={DollarSign}
            description={`${gMov >= 0 ? "↑" : "↓"} ${Math.abs(gMov).toFixed(1)}% vs anterior`}
            variant={gMov >= 0 ? "success" : "destructive"}
          />
          <KpiCard
            title="Lucro Líquido"
            value={formatCurrency(metrics.totalNet)}
            icon={TrendingUp}
            description={`${gNet >= 0 ? "↑" : "↓"} ${Math.abs(gNet).toFixed(1)}% vs anterior`}
            variant={gNet >= 0 ? "success" : "destructive"}
          />
          <KpiCard
            title="Total Operações"
            value={metrics.totalOps.toString()}
            icon={Activity}
            description={`${gOps >= 0 ? "↑" : "↓"} ${Math.abs(gOps).toFixed(1)}% vs anterior`}
            variant={gOps >= 0 ? "success" : "destructive"}
          />
          <KpiCard
            title="Clientes Ativos"
            value={metrics.activeClients.toString()}
            icon={Users}
            description="Participando no período"
          />
        </div>

        {gMov < -15 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="text-destructive h-5 w-5" />
            <p className="text-sm font-medium text-destructive">
              Alerta: Queda significativa de faturamento (-{Math.abs(gMov).toFixed(1)}%) em relação ao período anterior.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-0.5">
                <CardTitle className="text-base font-semibold">Volume vs Lucro por Dia</CardTitle>
                <CardDescription>Comparativo diário de movimentação financeira</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `R$ ${v / 1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }} 
                    formatter={(v: any) => [formatCurrency(v)]}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  <Area name="Volume Bruto" type="monotone" dataKey="volume" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVolume)" strokeWidth={2} />
                  <Area name="Lucro Líquido" type="monotone" dataKey="lucro" stroke="#10b981" fillOpacity={1} fill="url(#colorLucro)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status das Operações</CardTitle>
              <CardDescription>Distribuição percentual</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={statusPieData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {statusPieData.map(s => (
                  <div key={s.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-xs text-muted-foreground">{s.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Ranking Top 10 Clientes</CardTitle>
                <CardDescription>Maiores geradores de lucro e volume</CardDescription>
              </div>
              <Trophy className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topClients.map((client, index) => (
                  <div key={client.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                        index === 0 ? "bg-yellow-500 text-yellow-950" : 
                        index === 1 ? "bg-slate-300 text-slate-800" :
                        index === 2 ? "bg-amber-600 text-amber-50" : "bg-secondary text-muted-foreground"
                      )}>
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium truncate max-w-[120px] md:max-w-none">{client.name}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-bold text-green-500">{formatCurrency(client.lucro)}</span>
                      <span className="text-[10px] text-muted-foreground">Vol: {formatCurrency(client.volume)}</span>
                    </div>
                  </div>
                ))}
                {topClients.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Nenhum dado disponível para o período.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-base">Análise e Insights</CardTitle>
              <CardDescription>Resumo automático do desempenho</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="text-sm leading-relaxed text-balance">
                  Durante o período analisado, a empresa movimentou um volume bruto de <span className="font-bold text-primary">{formatCurrency(metrics.totalMov)}</span> em <span className="font-bold text-primary">{metrics.totalOps}</span> operações cadastradas. 
                  Isso resultou em um lucro líquido consolidado de <span className="font-bold text-green-500">{formatCurrency(metrics.totalNet)}</span>, apresentando uma margem operacional média de <span className="font-bold">{metrics.margin.toFixed(1)}%</span>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-background border border-border shadow-sm">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Ticket Médio</p>
                  <p className="text-xl font-bold tracking-tight">{formatCurrency(metrics.avgTicket)}</p>
                  <div className="mt-2 flex items-center text-[10px] text-muted-foreground">
                    <Activity className="h-3 w-3 mr-1" />
                    Valor médio por operação
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-background border border-border shadow-sm">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Evolução Lucro</p>
                  <div className="flex items-center gap-2">
                    <p className={cn("text-xl font-bold tracking-tight", gNet >= 0 ? "text-green-500" : "text-red-500")}>
                      {gNet >= 0 ? "+" : ""}{gNet.toFixed(1)}%
                    </p>
                    {gNet >= 0 ? <ArrowUpRight className="h-4 w-4 text-green-500" /> : <ArrowDownRight className="h-4 w-4 text-red-500" />}
                  </div>
                  <p className="mt-2 text-[10px] text-muted-foreground">Comparado ao período anterior</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tendência de Mercado</h4>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${Math.min(100, Math.max(0, 50 + gNet))}%` }} 
                    />
                  </div>
                  <span className="text-xs font-medium">
                    {gNet > 10 ? "Crescimento Acelerado" : gNet > 0 ? "Estável" : "Em Retração"}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground italic">
                  * Projeção baseada na variação percentual do lucro líquido entre os períodos.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
