import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarIcon,
  Download,
  FileText,
  TrendingUp,
  Activity,
  DollarSign,
  Loader2,
} from "lucide-react";
import { toPng } from "html-to-image";

import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type StatusGeral = "Dentro da Meta" | "Atenção" | "Fechado";

const STATUS_OPTIONS: StatusGeral[] = ["Dentro da Meta", "Atenção", "Fechado"];

const STATUS_STYLE: Record<StatusGeral, { bg: string; text: string; border: string; label: string }> = {
  "Dentro da Meta": { bg: "#dcfce7", text: "#166534", border: "#16a34a", label: "Dentro da Meta" },
  "Atenção":       { bg: "#fef3c7", text: "#92400e", border: "#d97706", label: "Atenção" },
  "Fechado":       { bg: "#e5e7eb", text: "#374151", border: "#6b7280", label: "Fechado" },
};

function slugify(s: string) {
  return (
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "empresa"
  );
}

// Garante que a logo já está pronta antes de exportar
function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

const LOGO_SRC = "/Zero foco cinza.png";

export default function ReportsPage() {
  const previewRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const { clients, operations } = useApp();
  const { user, nomePersonagem } = useAuth();

  const responsavelAuto =
    nomePersonagem || user?.user_metadata?.nome || user?.email || "Responsável";

  const [form, setForm] = useState({
    clientId: "",
    dataInicio: undefined as Date | undefined,
    dataFim: undefined as Date | undefined,
    statusGeral: "Dentro da Meta" as StatusGeral,
    resumo: "",
  });

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const empresaSelecionada = useMemo(
    () => clients.find((c) => c.id === form.clientId)?.nome ?? "",
    [clients, form.clientId],
  );

  // Cálculo automático: filtra operações pelo cliente + período (concluídas)
  const [calculating, setCalculating] = useState(false);
  const [metrics, setMetrics] = useState({ qtd: 0, valorTotal: 0 });
useEffect(() => {
    if (!form.clientId || !form.dataInicio || !form.dataFim) {
      setMetrics({ qtd: 0, valorTotal: 0 });
      update("resumo", ""); // Limpa o resumo se faltar dados
      return;
    }
    setCalculating(true);
    
    const t = setTimeout(() => {
      const start = new Date(form.dataInicio!);
      start.setHours(0, 0, 0, 0);
      const end = new Date(form.dataFim!);
      end.setHours(23, 59, 59, 999);

      const filtered = operations.filter((op) => {
        if (op.clientId !== form.clientId) return false;
        if (op.status !== "concluido") return false;
        const d = new Date(op.data).getTime();
        return d >= start.getTime() && d <= end.getTime();
      });

      const qtdCalc = filtered.length;
      const valorTotalCalc = filtered.reduce((s, op) => s + op.valorBruto, 0);
      const ticketMedioCalc = qtdCalc > 0 ? valorTotalCalc / qtdCalc : 0;

      setMetrics({
        qtd: qtdCalc,
        valorTotal: valorTotalCalc,
      });

      // === NOVA LÓGICA DO TEXTO DINÂMICO ===
      if (qtdCalc > 0) {
        const textoDinamico = `O período analisado apresentou um total de ${qtdCalc} operações, alcançando um valor total de ${formatCurrency(valorTotalCalc)}. O ticket médio registrado foi de ${formatCurrency(ticketMedioCalc)}, evidenciando um volume expressivo por transação.\n\nEsses resultados indicam uma movimentação financeira robusta, com operações de alto valor agregado, refletindo consistência nas negociações realizadas ao longo do período e consolidando a parceria firmada no início da afiliação.`;
        
        update("resumo", textoDinamico);
      } else {
        update("resumo", "Nenhuma operação encontrada para este período.");
      }

      setCalculating(false);
    }, 250);
    
    return () => clearTimeout(t);
  }, [form.clientId, form.dataInicio, form.dataFim, operations]);

  const ticketMedio = metrics.qtd > 0 ? metrics.valorTotal / metrics.qtd : 0;

  const periodoLabel = useMemo(() => {
    if (form.dataInicio && form.dataFim) {
      return `${format(form.dataInicio, "dd/MM/yyyy", { locale: ptBR })} — ${format(
        form.dataFim,
        "dd/MM/yyyy",
        { locale: ptBR },
      )}`;
    }
    if (form.dataInicio) return `A partir de ${format(form.dataInicio, "dd/MM/yyyy", { locale: ptBR })}`;
    if (form.dataFim) return `Até ${format(form.dataFim, "dd/MM/yyyy", { locale: ptBR })}`;
    return "—";
  }, [form.dataInicio, form.dataFim]);

  const handleDownload = async () => {
    if (!previewRef.current) return;
    try {
      setDownloading(true);
      // Espera fontes + logo carregarem
      await Promise.all([
        (document as any).fonts?.ready ?? Promise.resolve(),
        preloadImage(LOGO_SRC),
      ]);
      const dataUrl = await toPng(previewRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `resumo-operacoes-${slugify(empresaSelecionada)}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Resumo baixado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar o resumo.");
    } finally {
      setDownloading(false);
    }
  };

  const status = STATUS_STYLE[form.statusGeral];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Resumo Executivo de Operações
          </h1>
          <p className="text-sm text-muted-foreground">
            Selecione a empresa e o período — os dados são calculados automaticamente.
          </p>
        </div>
        <Button onClick={handleDownload} disabled={downloading || calculating} size="lg">
          <Download className="mr-2 h-4 w-4" />
          {downloading ? "Gerando..." : "Baixar Relatório (PNG)"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados do Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Empresa / Cliente Alvo</Label>
              <Select value={form.clientId} onValueChange={(v) => update("clientId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Nenhum cliente cadastrado
                    </div>
                  ) : (
                    clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Início</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.dataInicio && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.dataInicio
                        ? format(form.dataInicio, "dd/MM/yyyy", { locale: ptBR })
                        : "Selecione..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.dataInicio}
                      onSelect={(d) => update("dataInicio", d)}
                      initialFocus
                      locale={ptBR}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Data de Fim</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.dataFim && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.dataFim
                        ? format(form.dataFim, "dd/MM/yyyy", { locale: ptBR })
                        : "Selecione..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.dataFim}
                      onSelect={(d) => update("dataFim", d)}
                      initialFocus
                      locale={ptBR}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Métricas calculadas (apenas exibição) */}
            <div className="rounded-lg border bg-muted/30 p-4">
              {calculating ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calculando operações do período...
                </div>
              ) : !form.clientId || !form.dataInicio || !form.dataFim ? (
                <p className="text-sm text-muted-foreground">
                  Selecione empresa e período para calcular automaticamente.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Operações</p>
                    <p className="text-base font-bold">{metrics.qtd.toLocaleString("pt-BR")}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Valor Total</p>
                    <p className="text-base font-bold">{formatCurrency(metrics.valorTotal)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Ticket Médio</p>
                    <p className="text-base font-bold">{formatCurrency(ticketMedio)}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Status Geral</Label>
              <Select
                value={form.statusGeral}
                onValueChange={(v) => update("statusGeral", v as StatusGeral)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resumo">Resumo Executivo</Label>
              <Textarea
                id="resumo"
                rows={5}
                placeholder="Principais observações operacionais do período..."
                value={form.resumo}
                onChange={(e) => update("resumo", e.target.value)}
              />
            </div>

            <div className="rounded-md bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              Responsável pela análise: <span className="font-medium text-foreground">{responsavelAuto}</span>{" "}
              (preenchido automaticamente)
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Pré-visualização do Relatório</p>
          <div className="rounded-lg bg-muted/30 p-4 overflow-auto">
            <div
              ref={previewRef}
              className="mx-auto bg-white text-zinc-900 shadow-2xl"
              style={{
                width: "100%",
                maxWidth: "595px",
                aspectRatio: "1 / 1.414",
                padding: "40px",
                fontFamily: "'Helvetica', 'Arial', sans-serif",
              }}
            >
              {/* Cabeçalho com logo */}
              <div className="border-b-2 pb-4" style={{ borderColor: "#0f172a" }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <img
                      src={LOGO_SRC}
                      alt="Zero Foco"
                      crossOrigin="anonymous"
                      className="h-12 w-auto object-contain shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                        Resumo de Operações Financeiras e Estratégicas
                      </p>
                      <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-zinc-900 truncate">
                        {empresaSelecionada || "Nome da Empresa"}
                      </h2>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-zinc-500 shrink-0">
                    <p>Emitido em</p>
                    <p className="font-semibold text-zinc-700">
                      {format(new Date(), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mini cards de métricas */}
              <div className="mt-5 grid grid-cols-3 gap-3">
                <MiniMetric
                  icon={<Activity size={14} />}
                  label="Operações"
                  value={metrics.qtd.toLocaleString("pt-BR")}
                />
                <MiniMetric
                  icon={<DollarSign size={14} />}
                  label="Valor Total"
                  value={formatCurrency(metrics.valorTotal)}
                  highlight
                />
                <MiniMetric
                  icon={<TrendingUp size={14} />}
                  label="Ticket Médio"
                  value={formatCurrency(ticketMedio)}
                />
              </div>

              {/* Corpo */}
              <div className="mt-6 space-y-4 text-[12px]">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                      Período de Análise
                    </p>
                    <p className="text-[13px] font-medium text-zinc-900">{periodoLabel}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500">Status Geral</p>
                    <span
                      className="mt-1 inline-block rounded-full px-3 py-1 text-[11px] font-semibold"
                      style={{
                        backgroundColor: status.bg,
                        color: status.text,
                        border: `1px solid ${status.border}`,
                      }}
                    >
                      {status.label}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                    Resumo Executivo
                  </p>
                  <div
                    className="min-h-[140px] rounded border border-zinc-200 bg-zinc-50/50 p-3 text-[12px] text-zinc-800 whitespace-pre-wrap"
                    style={{ lineHeight: 1.6 }}
                  >
                    {form.resumo || (
                      <span className="text-zinc-400">Nenhum resumo informado.</span>
                    )}
                  </div>
                </div>
              </div>

             {/* Rodapé */}
              <div className="mt-20 pt-4">
                <div className="mx-auto w-2/3 border-t border-zinc-700 pt-2 text-center relative">
                  
                  {/* SIMULAÇÃO DA ASSINATURA DINÂMICA */}
                  <div className="absolute left-0 right-0 -top-14 flex justify-center pointer-events-none">
                    <span 
                      className="text-4xl text-zinc-700 -rotate-3 opacity-90"
                      style={{ fontFamily: "'Dancing Script', cursive" }}
                    >
                      {responsavelAuto}
                    </span>
                  </div>

                  <p className="text-[12px] font-semibold text-zinc-800 mt-2">{responsavelAuto}</p>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                    Assinatura do responsável
                  </p>
                </div>
                <p className="mt-8 text-center text-[9px] text-zinc-400">
                  Documento gerado automaticamente — Zero Foco
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniMetric({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="rounded-lg border p-3"
      style={{
        borderColor: highlight ? "#0f172a" : "#e5e7eb",
        backgroundColor: highlight ? "#0f172a" : "#fafafa",
        color: highlight ? "#ffffff" : "#0f172a",
      }}
    >
      <div
        className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest"
        style={{ color: highlight ? "#cbd5e1" : "#64748b" }}
      >
        {icon}
        {label}
      </div>
      <p className="mt-1 text-[15px] font-bold tracking-tight">{value}</p>
    </div>
  );
}
