import { useMemo, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useApp } from "@/context/AppContext";
import { useRole } from "@/hooks/useRole";
import { formatCurrency, formatDateOnly } from "@/lib/format";
import { KpiCard } from "@/components/KpiCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, TrendingUp, TrendingDown, Wallet, Activity, Users, Calendar,
  CheckCircle2, Clock, XCircle, Trophy, AlertTriangle, Target,
  FileSpreadsheet, FileText, Download, ShieldAlert, Image as ImageIcon, FileImage,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

type PresetKey = "hoje" | "ontem" | "7d" | "30d" | "mes" | "mes_passado" | "custom" | "all";

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "hoje", label: "Hoje" },
  { key: "ontem", label: "Ontem" },
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "mes", label: "Este mês" },
  { key: "mes_passado", label: "Mês passado" },
  { key: "all", label: "Tudo" },
  { key: "custom", label: "Personalizado" },
];

const STATUS_COLORS: Record<string, string> = {
  concluido: "hsl(142, 71%, 45%)",
  pendente: "hsl(38, 92%, 50%)",
  cancelado: "hsl(0, 72%, 51%)",
};

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d: Date) { const x = new Date(d); x.setHours(23,59,59,999); return x; }

function getRange(preset: PresetKey, customStart?: string, customEnd?: string): { start: Date | null; end: Date | null } {
  const now = new Date();
  switch (preset) {
    case "hoje": return { start: startOfDay(now), end: endOfDay(now) };
    case "ontem": {
      const y = new Date(now); y.setDate(y.getDate() - 1);
      return { start: startOfDay(y), end: endOfDay(y) };
    }
    case "7d": {
      const s = new Date(now); s.setDate(s.getDate() - 6);
      return { start: startOfDay(s), end: endOfDay(now) };
    }
    case "30d": {
      const s = new Date(now); s.setDate(s.getDate() - 29);
      return { start: startOfDay(s), end: endOfDay(now) };
    }
    case "mes": {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: startOfDay(s), end: endOfDay(now) };
    }
    case "mes_passado": {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: startOfDay(s), end: endOfDay(e) };
    }
    case "custom":
      return {
        start: customStart ? startOfDay(new Date(customStart + "T00:00")) : null,
        end: customEnd ? endOfDay(new Date(customEnd + "T00:00")) : null,
      };
    default: return { start: null, end: null };
  }
}

export default function PainelFinanceiroPage() {
  const { operations, clients, loading } = useApp();
  const { isDev, loading: roleLoading } = useRole();

  const [preset, setPreset] = useState<PresetKey>("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [clientFilter, setClientFilter] = useState<string>("ALL");
  const [respFilter, setRespFilter] = useState<string>("ALL");
  const [tipoFilter, setTipoFilter] = useState<string>("ALL");

  const { start, end } = useMemo(() => getRange(preset, customStart, customEnd), [preset, customStart, customEnd]);

  // Filtragem
  const filtered = useMemo(() => {
    return operations.filter(op => {
      const d = new Date(op.data);
      if (start && d < start) return false;
      if (end && d > end) return false;
      if (statusFilter !== "ALL" && op.status !== statusFilter) return false;
      if (clientFilter !== "ALL" && op.clientId !== clientFilter) return false;
      if (respFilter !== "ALL" && op.responsavel !== respFilter) return false;
      if (tipoFilter !== "ALL") {
        const c = clients.find(cl => cl.id === op.clientId);
        if (c?.tipo !== tipoFilter) return false;
      }
      return true;
    });
  }, [operations, clients, start, end, statusFilter, clientFilter, respFilter, tipoFilter]);

  // Período anterior (mesmo tamanho)
  const previous = useMemo(() => {
    if (!start || !end) return [];
    const ms = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - ms);
    return operations.filter(op => {
      const d = new Date(op.data);
      if (d < prevStart || d > prevEnd) return false;
      if (statusFilter !== "ALL" && op.status !== statusFilter) return false;
      if (clientFilter !== "ALL" && op.clientId !== clientFilter) return false;
      if (respFilter !== "ALL" && op.responsavel !== respFilter) return false;
      if (tipoFilter !== "ALL") {
        const c = clients.find(cl => cl.id === op.clientId);
        if (c?.tipo !== tipoFilter) return false;
      }
      return true;
    });
  }, [operations, clients, start, end, statusFilter, clientFilter, respFilter, tipoFilter]);

  // Métricas
  const metrics = useMemo(() => {
    const done = filtered.filter(o => o.status === "concluido");
    const pend = filtered.filter(o => o.status === "pendente");
    const canc = filtered.filter(o => o.status === "cancelado");
    const totalMov = done.reduce((s, o) => s + o.valorBruto, 0);
    const lucro = done.reduce((s, o) => s + o.lucroLiquido, 0);
    const ticket = done.length ? totalMov / done.length : 0;
    const pctLucro = totalMov > 0 ? (lucro / totalMov) * 100 : 0;

    // dias únicos
    const dias = new Set(done.map(o => formatDateOnly(o.data)));
    const mediaDiaria = dias.size > 0 ? done.length / dias.size : 0;

    // melhor dia
    const dayMap: Record<string, number> = {};
    done.forEach(o => {
      const k = formatDateOnly(o.data);
      dayMap[k] = (dayMap[k] || 0) + o.valorBruto;
    });
    const melhorDia = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0];

    // melhor cliente
    const clientMap: Record<string, number> = {};
    done.forEach(o => {
      clientMap[o.clientId] = (clientMap[o.clientId] || 0) + o.valorBruto;
    });
    const melhorClienteEntry = Object.entries(clientMap).sort((a, b) => b[1] - a[1])[0];
    const melhorCliente = melhorClienteEntry
      ? { nome: clients.find(c => c.id === melhorClienteEntry[0])?.nome ?? "—", valor: melhorClienteEntry[1] }
      : null;

    const clientesAtivos = new Set(done.map(o => o.clientId)).size;

    return {
      totalMov, totalOps: done.length, ticket, lucro, pctLucro,
      concluidas: done.length, pendentes: pend.length, canceladas: canc.length,
      mediaDiaria, melhorDia, melhorCliente, clientesAtivos,
    };
  }, [filtered, clients]);

  // Período anterior - mesmas métricas
  const prevMetrics = useMemo(() => {
    const done = previous.filter(o => o.status === "concluido");
    const totalMov = done.reduce((s, o) => s + o.valorBruto, 0);
    const lucro = done.reduce((s, o) => s + o.lucroLiquido, 0);
    return { totalMov, totalOps: done.length, lucro };
  }, [previous]);

  const growth = (atual: number, anterior: number) => {
    if (anterior === 0) return atual > 0 ? 100 : 0;
    return ((atual - anterior) / anterior) * 100;
  };

  const gMov = growth(metrics.totalMov, prevMetrics.totalMov);
  const gOps = growth(metrics.totalOps, prevMetrics.totalOps);
  const gLucro = growth(metrics.lucro, prevMetrics.lucro);

  // Charts data
  const chartByDay = useMemo(() => {
    const map: Record<string, { label: string; movimentado: number; lucro: number; operacoes: number }> = {};
    filtered.filter(o => o.status === "concluido").forEach(o => {
      const k = formatDateOnly(o.data);
      if (!map[k]) map[k] = { label: k, movimentado: 0, lucro: 0, operacoes: 0 };
      map[k].movimentado += o.valorBruto;
      map[k].lucro += o.lucroLiquido;
      map[k].operacoes += 1;
    });
    return Object.values(map).sort((a, b) => {
      const [da, ma, ya] = a.label.split("/").map(Number);
      const [db, mb, yb] = b.label.split("/").map(Number);
      return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime();
    });
  }, [filtered]);

  const statusChart = [
    { name: "Concluídas", value: metrics.concluidas, fill: STATUS_COLORS.concluido },
    { name: "Pendentes", value: metrics.pendentes, fill: STATUS_COLORS.pendente },
    { name: "Canceladas", value: metrics.canceladas, fill: STATUS_COLORS.cancelado },
  ].filter(s => s.value > 0);

  const rankingClientes = useMemo(() => {
    const map: Record<string, { nome: string; total: number; ops: number; lucro: number }> = {};
    filtered.filter(o => o.status === "concluido").forEach(o => {
      const c = clients.find(cl => cl.id === o.clientId);
      const key = o.clientId;
      if (!map[key]) map[key] = { nome: c?.nome ?? "—", total: 0, ops: 0, lucro: 0 };
      map[key].total += o.valorBruto;
      map[key].ops += 1;
      map[key].lucro += o.lucroLiquido;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [filtered, clients]);

  const responsaveis = useMemo(() => Array.from(new Set(operations.map(o => o.responsavel))).filter(Boolean), [operations]);

  // Resumo textual
  const resumoTexto = useMemo(() => {
    const periodoLabel = PRESETS.find(p => p.key === preset)?.label.toLowerCase() ?? "período";
    const trend = gMov >= 0 ? `crescimento de ${gMov.toFixed(1)}%` : `queda de ${Math.abs(gMov).toFixed(1)}%`;
    return `No período (${periodoLabel}), a empresa movimentou ${formatCurrency(metrics.totalMov)} em ${metrics.totalOps} operação(ões) concluída(s), gerando lucro líquido de ${formatCurrency(metrics.lucro)} (margem ${metrics.pctLucro.toFixed(1)}%). Comparado ao período anterior, houve ${trend} em movimentação.`;
  }, [preset, metrics, gMov]);

  // Alertas
  const alertaQueda = gMov < -15;
  const alertaPendentes = metrics.pendentes > metrics.concluidas && metrics.pendentes > 5;

  // Exportações
  const buildExportRows = () => filtered.map(o => {
    const c = clients.find(cl => cl.id === o.clientId);
    return {
      Data: formatDateOnly(o.data),
      Cliente: c?.nome ?? "—",
      Tipo: c?.tipo ?? "—",
      Responsavel: o.responsavel,
      Status: o.status,
      ValorBruto: o.valorBruto,
      LucroLiquido: o.lucroLiquido,
      PIX: o.pix ?? "",
    };
  });

  const exportCSV = () => {
    const rows = buildExportRows();
    if (rows.length === 0) return;
    const header = Object.keys(rows[0]).join(";");
    const body = rows.map(r => Object.values(r).map(v => String(v).replace(/;/g, ",")).join(";")).join("\n");
    const blob = new Blob(["\ufeff" + header + "\n" + body], { type: "text/csv;charset=utf-8" });
    triggerDownload(blob, `resumo-financeiro-${Date.now()}.csv`);
  };

  const exportXLSX = async () => {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const wsResumo = XLSX.utils.json_to_sheet([
      { Métrica: "Total Movimentado", Valor: metrics.totalMov },
      { Métrica: "Total de Operações", Valor: metrics.totalOps },
      { Métrica: "Ticket Médio", Valor: metrics.ticket },
      { Métrica: "Lucro Líquido", Valor: metrics.lucro },
      { Métrica: "Margem Líquida (%)", Valor: metrics.pctLucro },
      { Métrica: "Concluídas", Valor: metrics.concluidas },
      { Métrica: "Pendentes", Valor: metrics.pendentes },
      { Métrica: "Canceladas", Valor: metrics.canceladas },
      { Métrica: "Clientes Ativos", Valor: metrics.clientesAtivos },
    ]);
    const wsOps = XLSX.utils.json_to_sheet(buildExportRows());
    XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");
    XLSX.utils.book_append_sheet(wb, wsOps, "Operações");
    XLSX.writeFile(wb, `resumo-financeiro-${Date.now()}.xlsx`);
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Resumo Financeiro Geral", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(resumoTexto, 14, 28, { maxWidth: 180 });

    autoTable(doc, {
      startY: 50,
      head: [["Métrica", "Valor"]],
      body: [
        ["Total Movimentado", formatCurrency(metrics.totalMov)],
        ["Total de Operações", String(metrics.totalOps)],
        ["Ticket Médio", formatCurrency(metrics.ticket)],
        ["Lucro Líquido", formatCurrency(metrics.lucro)],
        ["Margem Líquida", `${metrics.pctLucro.toFixed(1)}%`],
        ["Concluídas", String(metrics.concluidas)],
        ["Pendentes", String(metrics.pendentes)],
        ["Canceladas", String(metrics.canceladas)],
        ["Clientes Ativos", String(metrics.clientesAtivos)],
        ["Melhor Cliente", metrics.melhorCliente ? `${metrics.melhorCliente.nome} (${formatCurrency(metrics.melhorCliente.valor)})` : "—"],
        ["Melhor Dia", metrics.melhorDia ? `${metrics.melhorDia[0]} (${formatCurrency(metrics.melhorDia[1])})` : "—"],
      ],
    });

    autoTable(doc, {
      head: [["Ranking", "Cliente", "Movimentado", "Ops", "Lucro"]],
      body: rankingClientes.map((c, i) => [
        String(i + 1), c.nome, formatCurrency(c.total), String(c.ops), formatCurrency(c.lucro),
      ]),
    });

    doc.save(`resumo-financeiro-${Date.now()}.pdf`);
  };

  const triggerDownload = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };

  // ====== Captura visual (PDF/PNG/JPEG) =========================
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [capturing, setCapturing] = useState(false);

  const snapshotCanvas = async () => {
    const el = dashboardRef.current;
    if (!el) throw new Error("Dashboard não encontrado");
    const html2canvas = (await import("html2canvas")).default;
    // Aguardar fontes para garantir render correto
    if ((document as any).fonts?.ready) {
      try { await (document as any).fonts.ready; } catch {}
    }
    const bg = getComputedStyle(document.body).backgroundColor || "#0d0a14";
    return await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: bg,
      windowWidth: el.scrollWidth,
      windowHeight: el.scrollHeight,
      scrollX: 0,
      scrollY: -window.scrollY,
      logging: false,
    });
  };

  const runCapture = async (fn: (c: HTMLCanvasElement) => Promise<void> | void) => {
    if (capturing) return;
    setCapturing(true);
    try {
      const canvas = await snapshotCanvas();
      await fn(canvas);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Falha ao exportar", description: e?.message ?? "Tente novamente", variant: "destructive" });
    } finally {
      setCapturing(false);
    }
  };

  const exportPNG = () => runCapture(async (canvas) => {
    canvas.toBlob((blob) => {
      if (blob) triggerDownload(blob, `resumo-financeiro-${Date.now()}.png`);
    }, "image/png");
  });

  const exportJPEG = () => runCapture(async (canvas) => {
    canvas.toBlob((blob) => {
      if (blob) triggerDownload(blob, `resumo-financeiro-${Date.now()}.jpg`);
    }, "image/jpeg", 0.95);
  });

  const exportPDFImage = () => runCapture(async (canvas) => {
    const { default: jsPDF } = await import("jspdf");
    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const isLandscape = canvas.width >= canvas.height;
    const pdf = new jsPDF({
      orientation: isLandscape ? "landscape" : "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;

    if (imgH <= pageH) {
      pdf.addImage(imgData, "JPEG", 0, 0, imgW, imgH, undefined, "FAST");
    } else {
      // Múltiplas páginas: desloca a mesma imagem para cobrir todo o conteúdo
      let heightLeft = imgH;
      let position = 0;
      pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH, undefined, "FAST");
      heightLeft -= pageH;
      while (heightLeft > 0) {
        position = heightLeft - imgH;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH, undefined, "FAST");
        heightLeft -= pageH;
      }
    }
    pdf.save(`resumo-financeiro-${Date.now()}.pdf`);
  });


  // Gate de acesso (admin/dev)
  if (roleLoading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-32 w-full" /></div>;
  }
  if (!isDev) {
    return (
      <div className="glass-card rounded-lg p-8 text-center space-y-3 max-w-md mx-auto">
        <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-lg font-semibold">Acesso restrito</h2>
        <p className="text-sm text-muted-foreground">Esta área é exclusiva para administradores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header (fora da captura) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Resumo Financeiro Geral</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Painel administrativo consolidado de todas as operações da empresa</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={exportCSV} disabled={capturing}><Download className="h-4 w-4" /> CSV</Button>
          <Button size="sm" variant="outline" onClick={exportXLSX} disabled={capturing}><FileSpreadsheet className="h-4 w-4" /> Excel</Button>
          <Button size="sm" variant="outline" onClick={exportPNG} disabled={capturing}><ImageIcon className="h-4 w-4" /> PNG</Button>
          <Button size="sm" variant="outline" onClick={exportJPEG} disabled={capturing}><FileImage className="h-4 w-4" /> JPEG</Button>
          <Button size="sm" onClick={exportPDFImage} disabled={capturing}><FileText className="h-4 w-4" /> {capturing ? "Gerando..." : "PDF"}</Button>
        </div>
      </div>

      {/* Área capturada */}
      <div ref={dashboardRef} className="space-y-4 sm:space-y-6 bg-background p-2 sm:p-3 rounded-xl">

      {/* Filtros de período (presets) */}
      <div className="glass-card rounded-xl p-3 sm:p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <Button key={p.key} size="sm" variant={preset === p.key ? "default" : "outline"} onClick={() => setPreset(p.key)}>
              {p.label}
            </Button>
          ))}
        </div>

        {preset === "custom" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} />
            <Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <select className="bg-secondary p-2 rounded text-sm w-full" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="ALL">Todos status</option>
            <option value="concluido">Concluído</option>
            <option value="pendente">Pendente</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <select className="bg-secondary p-2 rounded text-sm w-full" value={clientFilter} onChange={e => setClientFilter(e.target.value)}>
            <option value="ALL">Todos clientes</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <select className="bg-secondary p-2 rounded text-sm w-full" value={respFilter} onChange={e => setRespFilter(e.target.value)}>
            <option value="ALL">Todos responsáveis</option>
            {responsaveis.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="bg-secondary p-2 rounded text-sm w-full" value={tipoFilter} onChange={e => setTipoFilter(e.target.value)}>
            <option value="ALL">Todos tipos</option>
            <option value="PF">PF</option>
            <option value="PJ">PJ</option>
          </select>
        </div>
      </div>

      {/* Alertas inteligentes */}
      {(alertaQueda || alertaPendentes) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {alertaQueda && (
            <div className="glass-card rounded-lg p-4 border-destructive/40 flex gap-3 items-start">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Queda de faturamento</p>
                <p className="text-xs text-muted-foreground">Movimentação caiu {Math.abs(gMov).toFixed(1)}% vs. período anterior.</p>
              </div>
            </div>
          )}
          {alertaPendentes && (
            <div className="glass-card rounded-lg p-4 border-warning/40 flex gap-3 items-start">
              <Clock className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Muitas operações pendentes</p>
                <p className="text-xs text-muted-foreground">{metrics.pendentes} operações aguardando conclusão.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resumo textual */}
      <div className="glass-card rounded-xl p-4 sm:p-5 border-primary/20">
        <div className="flex items-start gap-3">
          <Target className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm leading-relaxed">{resumoTexto}</p>
        </div>
      </div>

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            <KpiCard title="Movimentado" value={formatCurrency(metrics.totalMov)} icon={DollarSign} variant="primary" description={`${gMov >= 0 ? "↑" : "↓"} ${Math.abs(gMov).toFixed(1)}% vs anterior`} />
            <KpiCard title="Operações" value={String(metrics.totalOps)} icon={Activity} description={`${gOps >= 0 ? "↑" : "↓"} ${Math.abs(gOps).toFixed(1)}% vs anterior`} />
            <KpiCard title="Ticket Médio" value={formatCurrency(metrics.ticket)} icon={TrendingUp} />
            <KpiCard title="Lucro Líquido" value={formatCurrency(metrics.lucro)} icon={Wallet} variant="success" description={`${gLucro >= 0 ? "↑" : "↓"} ${Math.abs(gLucro).toFixed(1)}% vs anterior`} />
            <KpiCard title="Margem Líquida" value={`${metrics.pctLucro.toFixed(1)}%`} icon={Target} variant={metrics.pctLucro >= 15 ? "success" : "warning"} />
            <KpiCard title="Média Diária Ops" value={metrics.mediaDiaria.toFixed(1)} icon={Calendar} />
            <KpiCard title="Clientes Ativos" value={String(metrics.clientesAtivos)} icon={Users} />
            <KpiCard title="Melhor Dia" value={metrics.melhorDia ? formatCurrency(metrics.melhorDia[1]) : "—"} icon={Trophy} variant="primary" description={metrics.melhorDia?.[0]} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <KpiCard title="Concluídas" value={String(metrics.concluidas)} icon={CheckCircle2} variant="success" />
            <KpiCard title="Pendentes" value={String(metrics.pendentes)} icon={Clock} variant="warning" />
            <KpiCard title="Canceladas" value={String(metrics.canceladas)} icon={XCircle} variant="destructive" />
          </div>
        </>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-4 sm:p-5 space-y-3">
          <h3 className="text-sm font-semibold">Lucro por período</h3>
          <div className="h-[240px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartByDay} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(260,12%,18%)" vertical={false} />
                <XAxis dataKey="label" stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={compact} width={50} />
                <Tooltip contentStyle={{ background: "#121212", border: "1px solid #333", borderRadius: 12 }} formatter={(v: number) => formatCurrency(v)} />
                <Line type="monotone" dataKey="lucro" stroke="hsl(142,71%,45%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 sm:p-5 space-y-3">
          <h3 className="text-sm font-semibold">Operações por dia</h3>
          <div className="h-[240px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartByDay} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(260,12%,18%)" vertical={false} />
                <XAxis dataKey="label" stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} width={30} />
                <Tooltip contentStyle={{ background: "#121212", border: "1px solid #333", borderRadius: 12 }} />
                <Bar dataKey="operacoes" fill="hsl(270,70%,55%)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 sm:p-5 space-y-3">
          <h3 className="text-sm font-semibold">Status das operações</h3>
          <div className="h-[240px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusChart} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {statusChart.map((s, i) => <Cell key={i} fill={s.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#121212", border: "1px solid #333", borderRadius: 12 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 sm:p-5 space-y-3">
          <h3 className="text-sm font-semibold">Movimentado vs Lucro</h3>
          <div className="h-[240px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartByDay} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(260,12%,18%)" vertical={false} />
                <XAxis dataKey="label" stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={compact} width={50} />
                <Tooltip contentStyle={{ background: "#121212", border: "1px solid #333", borderRadius: 12 }} formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="movimentado" fill="hsl(270,70%,55%)" radius={[4,4,0,0]} name="Movimentado" />
                <Bar dataKey="lucro" fill="hsl(142,71%,45%)" radius={[4,4,0,0]} name="Lucro" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Ranking */}
      <div className="glass-card rounded-xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Ranking de Clientes (Top 10)</h3>
        </div>
        {rankingClientes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados no período selecionado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b border-border/40">
                <tr>
                  <th className="text-left py-2 px-2">#</th>
                  <th className="text-left py-2 px-2">Cliente</th>
                  <th className="text-right py-2 px-2">Movimentado</th>
                  <th className="text-right py-2 px-2 hidden sm:table-cell">Operações</th>
                  <th className="text-right py-2 px-2 hidden sm:table-cell">Lucro</th>
                </tr>
              </thead>
              <tbody>
                {rankingClientes.map((c, i) => (
                  <tr key={c.nome} className="border-b border-border/20 hover:bg-secondary/30 transition-colors">
                    <td className="py-2 px-2">
                      <Badge variant={i < 3 ? "default" : "secondary"} className="text-[10px]">{i + 1}</Badge>
                    </td>
                    <td className="py-2 px-2 font-medium">{c.nome}</td>
                    <td className="py-2 px-2 text-right font-mono">{formatCurrency(c.total)}</td>
                    <td className="py-2 px-2 text-right font-mono hidden sm:table-cell">{c.ops}</td>
                    <td className="py-2 px-2 text-right font-mono text-success hidden sm:table-cell">{formatCurrency(c.lucro)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

function compact(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return String(v);
}
