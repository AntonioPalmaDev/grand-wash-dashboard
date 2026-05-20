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
  ArrowDownRight,
  TrendingDown,
  BarChart3,
  Layers,
  Briefcase,
  Zap,
  Target
} from "lucide-react";
import { 
  format, 
  subDays, 
  startOfMonth, 
  endOfMonth, 
  startOfDay, 
  endOfDay, 
  subMonths,
  eachMonthOfInterval,
  isSameMonth
} from "date-fns";
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
import { motion } from "framer-motion";

const formatShortCurrency = (value: number) => {
  if (value >= 1000000000) return `R$ ${(value / 1000000000).toFixed(1).replace(/\.0$/, '')}B`;
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return formatCurrency(value);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950/90 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl">
        <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => {
            const isCount = entry.dataKey === 'count' || entry.name === 'Operações' || entry.name === 'value' && typeof entry.value === 'number' && entry.value < 1000 && !entry.name.toLowerCase().includes('lucro') && !entry.name.toLowerCase().includes('volume');
            
            return (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                  <span className="text-xs font-medium text-slate-300">{entry.name}:</span>
                </div>
                <span className="text-sm font-bold" style={{ color: entry.color || entry.fill }}>
                  {typeof entry.value === 'number' 
                    ? (isCount ? entry.value : formatCurrency(entry.value)) 
                    : entry.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export default function PainelFinanceiroPage() {
  const { operations, clients, loading } = useApp();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [capturing, setCapturing] = useState(false);
  
  const [dateRange, setDateRange] = useState<"today" | "yesterday" | "7d" | "30d" | "thisMonth" | "lastMonth" | "all" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("concluido");
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
    else if (dateRange === "custom" && customStartDate && customEndDate) {
      start = startOfDay(new Date(customStartDate));
      end = endOfDay(new Date(customEndDate));
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
    const clientStats: Record<string, { lucro: number; volume: number; name: string; operations: number }> = {};
    
    filteredData.forEach(op => {
      if (!clientStats[op.clientId]) {
        clientStats[op.clientId] = { 
          lucro: 0, 
          volume: 0, 
          name: clients.find(c => c.id === op.clientId)?.nome || "Desconhecido",
          operations: 0
        };
      }
      clientStats[op.clientId].lucro += op.lucroLiquido;
      clientStats[op.clientId].volume += op.valorBruto;
      clientStats[op.clientId].operations += 1;
    });

    return Object.entries(clientStats)
      .map(([id, stats]) => ({
        id,
        ...stats
      }))
      .sort((a, b) => b.lucro - a.lucro)
      .slice(0, 10);
  }, [filteredData, clients]);

  const performanceByResponsible = useMemo(() => {
    const stats: Record<string, { lucro: number; volume: number; name: string; ops: number }> = {};
    
    filteredData.forEach(op => {
      const resp = op.responsavel || "Sistema";
      if (!stats[resp]) {
        stats[resp] = { lucro: 0, volume: 0, name: resp, ops: 0 };
      }
      stats[resp].lucro += op.lucroLiquido;
      stats[resp].volume += op.valorBruto;
      stats[resp].ops += 1;
    });

    return Object.values(stats).sort((a, b) => b.lucro - a.lucro);
  }, [filteredData]);

  const monthlyEvolution = useMemo(() => {
    const now = new Date();
    const months = eachMonthOfInterval({
      start: subMonths(now, 5),
      end: now
    });

    return months.map(month => {
      const monthOps = operations.filter(op => isSameMonth(new Date(op.data), month));
      return {
        month: format(month, "MMM", { locale: ptBR }),
        lucro: monthOps.reduce((acc, op) => acc + op.lucroLiquido, 0),
        volume: monthOps.reduce((acc, op) => acc + op.valorBruto, 0)
      };
    });
  }, [operations]);

  const typeDistribution = useMemo(() => {
    let pf = 0;
    let pj = 0;
    filteredData.forEach(op => {
      const client = clients.find(c => c.id === op.clientId);
      if (client?.tipo === "PJ") pj += op.valorBruto;
      else pf += op.valorBruto;
    });
    return [
      { name: "Pessoa Física", value: pf, color: "#a855f7" },
      { name: "Pessoa Jurídica", value: pj, color: "#3b82f6" }
    ];
  }, [filteredData, clients]);

  const operationalVolume = useMemo(() => {
    const daily: Record<string, { date: string; count: number }> = {};
    
    filteredData.forEach(op => {
      const day = format(new Date(op.data), "dd/MM");
      if (!daily[day]) daily[day] = { date: day, count: 0 };
      daily[day].count += 1;
    });

    return Object.values(daily).sort((a, b) => {
      const [dayA, monthA] = a.date.split("/").map(Number);
      const [dayB, monthB] = b.date.split("/").map(Number);
      return monthA !== monthB ? monthA - monthB : dayA - dayB;
    });
  }, [filteredData]);


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
              <SelectItem value="custom">Personalizado</SelectItem>
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {dateRange === "custom" && (
          <>
            <div className="flex flex-col gap-1">
              <input
                type="date"
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <input
                type="date"
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
          </>
        )}
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

      <motion.div 
        ref={dashboardRef} 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn("space-y-6 p-1 rounded-lg", capturing && "bg-slate-950")}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
            <KpiCard
              title="Volume Movimentado"
              value={formatCurrency(metrics.totalMov)}
              icon={DollarSign}
              description={`${gMov >= 0 ? "↑" : "↓"} ${Math.abs(gMov).toFixed(1)}% vs anterior`}
              variant={gMov >= 0 ? "success" : "destructive"}
            />
          </motion.div>
          <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
            <KpiCard
              title="Lucro Líquido"
              value={formatCurrency(metrics.totalNet)}
              icon={TrendingUp}
              description={`${gNet >= 0 ? "↑" : "↓"} ${Math.abs(gNet).toFixed(1)}% vs anterior`}
              variant={gNet >= 0 ? "success" : "destructive"}
            />
          </motion.div>
          <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
            <KpiCard
              title="Total Operações"
              value={metrics.totalOps.toString()}
              icon={Activity}
              description={`${gOps >= 0 ? "↑" : "↓"} ${Math.abs(gOps).toFixed(1)}% vs anterior`}
              variant={gOps >= 0 ? "success" : "destructive"}
            />
          </motion.div>
          <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
            <KpiCard
              title="Ticket Médio"
              value={formatCurrency(metrics.avgTicket)}
              icon={Zap}
              description="Valor médio por op."
              variant="default"
            />
          </motion.div>

          <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
            <KpiCard
              title="Margem Operacional"
              value={`${metrics.margin.toFixed(1)}%`}
              icon={BarChart3}
              description={metrics.margin > 15 ? "Eficiência excelente" : "Eficiência estável"}
              variant={metrics.margin > 15 ? "success" : "default"}
            />
          </motion.div>
          <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
            <KpiCard
              title="Status de Crescimento"
              value={`${gNet >= 0 ? "+" : ""}${gNet.toFixed(1)}%`}
              icon={TrendingUp}
              description={gNet >= 0 ? "Tendência de alta" : "Tendência de baixa"}
              variant={gNet >= 0 ? "success" : "destructive"}
            />
          </motion.div>
          <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
            <KpiCard
              title="Projeção"
              value={gNet > 10 ? "Alta Forte" : gNet > 0 ? "Estável" : "Revisão"}
              icon={Target}
              description="Baseado no histórico"
              variant="default"
            />
          </motion.div>
          <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
            <KpiCard
              title="Clientes Ativos"
              value={metrics.activeClients.toString()}
              icon={Users}
              description="No período atual"
              variant="default"
            />
          </motion.div>
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
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="border-white/5 bg-slate-950/50 backdrop-blur-sm overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-0.5">
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Volume vs Lucro por Dia
                  </CardTitle>
                  <CardDescription>Comparativo estratégico de movimentação diária</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="h-[350px] mt-4 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: '#64748b' }}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={formatShortCurrency}
                      tick={{ fill: '#64748b' }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ffffff20', strokeWidth: 1 }} />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconType="circle"
                      wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                    />
                    <Area 
                      name="Volume Bruto" 
                      type="monotone" 
                      dataKey="volume" 
                      stroke="#3b82f6" 
                      fillOpacity={1} 
                      fill="url(#colorVolume)" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#0f172a' }}
                      activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                    />
                    <Area 
                      name="Lucro Líquido" 
                      type="monotone" 
                      dataKey="lucro" 
                      stroke="#a855f7" 
                      fillOpacity={1} 
                      fill="url(#colorLucro)" 
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#a855f7', strokeWidth: 2, stroke: '#0f172a' }}
                      activeDot={{ r: 6, fill: '#a855f7', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="h-full"
          >
            <Card className="border-white/5 bg-slate-950/50 backdrop-blur-sm h-full overflow-hidden flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-purple-500" />
                  Status Global
                </CardTitle>
                <CardDescription>Distribuição por status</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between pt-0 pb-6">
                <div className="relative h-[220px] w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={statusPieData}
                        innerRadius="65%"
                        outerRadius="90%"
                        paddingAngle={5}
                        dataKey="value"
                        animationBegin={400}
                        animationDuration={1500}
                        cx="50%"
                        cy="50%"
                        stroke="none"
                      >
                        {statusPieData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color} 
                            style={{ filter: `drop-shadow(0 0 6px ${entry.color}40)` }}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </RePieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Total</span>
                    <span className="text-2xl font-black text-white leading-none">{metrics.totalOps}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-2 mt-4 px-1">
                  {statusPieData.map(s => (
                    <div key={s.name} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300 group">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full shadow-lg transition-transform group-hover:scale-125" 
                          style={{ backgroundColor: s.color, boxShadow: `0 0 10px ${s.color}60` }} 
                        />
                        <span className="text-[11px] font-bold text-slate-300">{s.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black text-white">{s.value}</span>
                        <span className="text-[10px] text-muted-foreground font-medium italic">ops</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="border-white/5 bg-slate-950/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Lucro por Período
                  </CardTitle>
                  <CardDescription>Evolução do lucro líquido diário</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorWaveLucro" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8" 
                      fontSize={10} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={10} 
                      axisLine={false} 
                      tickLine={false}
                      tickFormatter={formatShortCurrency}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="lucro" 
                      name="Lucro Líquido" 
                      stroke="#22c55e" 
                      fillOpacity={1} 
                      fill="url(#colorWaveLucro)" 
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2"
          >
            <Card className="border-white/5 bg-slate-950/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Operações por Dia
                </CardTitle>
                <CardDescription>Volume de transações diárias</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={operationalVolume}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8" 
                      fontSize={10} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={10} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="count" 
                      name="Operações" 
                      fill="#3b82f6" 
                      radius={[4, 4, 0, 0]} 
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-4"
          >
            <Card className="border-white/5 bg-slate-950/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Top 10 Clientes
                  </CardTitle>
                  <CardDescription>Principais parceiros por rentabilidade</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-white/5">
                        <th className="pb-3 pl-2">Rank</th>
                        <th className="pb-3">Cliente</th>
                        <th className="pb-3 text-center">Operações</th>
                        <th className="pb-3 text-right">Valor Movimentado</th>
                        <th className="pb-3 text-right pr-2">Lucro Gerado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {topClients.map((client, index) => (
                        <motion.tr 
                          key={client.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 * index }}
                          className="group hover:bg-white/5 transition-colors"
                        >
                          <td className="py-4 pl-2">
                            <div className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shadow-lg",
                              index === 0 ? "bg-gradient-to-br from-yellow-400 to-amber-600 text-yellow-950" : 
                              index === 1 ? "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800" :
                              index === 2 ? "bg-gradient-to-br from-amber-600 to-orange-800 text-amber-50" : "bg-slate-800 text-slate-400"
                            )}>
                              {index + 1}
                            </div>
                          </td>
                          <td className="py-4">
                            <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                              {client.name}
                            </span>
                          </td>
                          <td className="py-4 text-center">
                            <span className="text-sm font-medium text-slate-400">
                              {client.operations}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <span className="text-sm font-medium text-slate-300">
                              {formatCurrency(client.volume)}
                            </span>
                          </td>
                          <td className="py-4 text-right pr-2">
                            <span className="text-sm font-black text-green-400">
                              {formatCurrency(client.lucro)}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                  {topClients.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">Nenhum dado disponível.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="lg:col-span-2"
          >
            <Card className="border-white/5 bg-slate-950/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      Evolução Estratégica
                    </CardTitle>
                    <CardDescription>Performance consolidada nos últimos 6 meses</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Live Analysis</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyEvolution}>
                      <defs>
                        <linearGradient id="colorMonthLucro" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="lucro" 
                        name="Lucro Mensal" 
                        stroke="#22c55e" 
                        fillOpacity={1} 
                        fill="url(#colorMonthLucro)" 
                        strokeWidth={3} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/5 relative group overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                    <TrendingUp className="h-12 w-12 text-primary rotate-12" />
                  </div>
                  <div className="relative z-10 space-y-3">
                    <p className="text-sm leading-relaxed text-slate-300 font-medium">
                      Análise do período: O volume de transações atingiu <span className="text-white font-bold">{formatCurrency(metrics.totalMov)}</span>, 
                      gerando um lucro líquido de <span className="text-green-400 font-bold">{formatCurrency(metrics.totalNet)}</span>. 
                      A margem operacional de <span className="text-white font-bold">{metrics.margin.toFixed(1)}%</span> indica {metrics.margin > 15 ? "excelente" : "boa"} eficiência de capital.
                    </p>
                    <div className="flex flex-wrap gap-4 pt-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Ticket Médio</span>
                        <span className="text-lg font-black text-white">{formatCurrency(metrics.avgTicket)}</span>
                      </div>
                      <div className="flex flex-col border-l border-white/10 pl-4">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Status de Crescimento</span>
                        <div className="flex items-center gap-1.5">
                          <span className={cn("text-lg font-black", gNet >= 0 ? "text-green-400" : "text-red-400")}>
                            {gNet >= 0 ? "+" : ""}{gNet.toFixed(1)}%
                          </span>
                          {gNet >= 0 ? <ArrowUpRight className="h-4 w-4 text-green-400" /> : <TrendingDown className="h-4 w-4 text-red-400" />}
                        </div>
                      </div>
                      <div className="flex flex-col border-l border-white/10 pl-4">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Projeção</span>
                        <span className="text-xs font-bold text-slate-400 mt-1">
                          {gNet > 10 ? "Tendência de Alta Forte" : gNet > 0 ? "Estabilidade Positiva" : "Revisão Necessária"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
