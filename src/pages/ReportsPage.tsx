import { useRef, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Download, FileText } from "lucide-react";
import { toPng } from "html-to-image";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const TIPOS_SERVICO = [
  "Lavagem Simples",
  "Lavagem Completa",
  "Detalhamento",
  "Polimento",
  "Higienização Interna",
  "Vitrificação",
  "Enceramento",
];

export default function ReportsPage() {
  const previewRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const [form, setForm] = useState({
    cliente: "",
    placa: "",
    modelo: "",
    tipoServico: "",
    dataServico: new Date(),
    observacoes: "",
    responsavel: "",
  });

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleDownload = async () => {
    if (!previewRef.current) return;
    try {
      setDownloading(true);
      const dataUrl = await toPng(previewRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      const placa = form.placa.trim() ? form.placa.trim().replace(/\s+/g, "-") : "sem-placa";
      link.download = `laudo-${placa}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Laudo baixado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar o laudo.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Geração de Laudos
          </h1>
          <p className="text-sm text-muted-foreground">
            Preencha os dados e baixe o laudo técnico em PNG.
          </p>
        </div>
        <Button onClick={handleDownload} disabled={downloading} size="lg">
          <Download className="mr-2 h-4 w-4" />
          {downloading ? "Gerando..." : "Baixar Relatório (PNG)"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados do Laudo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cliente">Nome do Cliente</Label>
              <Input
                id="cliente"
                placeholder="Ex: João da Silva"
                value={form.cliente}
                onChange={(e) => update("cliente", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="placa">Placa</Label>
                <Input
                  id="placa"
                  placeholder="ABC-1D23"
                  value={form.placa}
                  onChange={(e) => update("placa", e.target.value.toUpperCase())}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo do Veículo</Label>
                <Input
                  id="modelo"
                  placeholder="Ex: Honda Civic 2022"
                  value={form.modelo}
                  onChange={(e) => update("modelo", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Serviço</Label>
                <Select
                  value={form.tipoServico}
                  onValueChange={(v) => update("tipoServico", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_SERVICO.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data do Serviço</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.dataServico && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.dataServico
                        ? format(form.dataServico, "dd/MM/yyyy", { locale: ptBR })
                        : "Escolha uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.dataServico}
                      onSelect={(d) => d && update("dataServico", d)}
                      initialFocus
                      locale={ptBR}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="obs">Observações Técnicas / Avarias pré-existentes</Label>
              <Textarea
                id="obs"
                rows={5}
                placeholder="Descreva avarias, riscos, amassados ou observações técnicas..."
                value={form.observacoes}
                onChange={(e) => update("observacoes", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resp">Responsável / Inspetor</Label>
              <Input
                id="resp"
                placeholder="Nome do responsável"
                value={form.responsavel}
                onChange={(e) => update("responsavel", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Pré-visualização do Laudo</p>
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
              {/* Cabeçalho */}
              <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-3">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-zinc-900">
                    Zero Foco
                  </h2>
                  <p className="text-[11px] uppercase tracking-widest text-zinc-500">
                    Laudo Técnico de Serviço
                  </p>
                </div>
                <div className="text-right text-[10px] text-zinc-500">
                  <p>Emitido em</p>
                  <p className="font-semibold text-zinc-700">
                    {format(new Date(), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>

              {/* Dados */}
              <div className="mt-6 space-y-4 text-[12px]">
                <Field label="Cliente" value={form.cliente || "—"} />

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Placa" value={form.placa || "—"} />
                  <Field label="Modelo" value={form.modelo || "—"} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Tipo de Serviço" value={form.tipoServico || "—"} />
                  <Field
                    label="Data do Serviço"
                    value={
                      form.dataServico
                        ? format(form.dataServico, "dd/MM/yyyy", { locale: ptBR })
                        : "—"
                    }
                  />
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                    Observações Técnicas / Avarias
                  </p>
                  <div
                    className="min-h-[120px] rounded border border-zinc-200 p-3 text-zinc-800 whitespace-pre-wrap"
                    style={{ lineHeight: 1.5 }}
                  >
                    {form.observacoes || (
                      <span className="text-zinc-400">
                        Nenhuma observação informada.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Rodapé / Assinatura */}
              <div className="mt-12 pt-4">
                <div className="mx-auto w-2/3 border-t border-zinc-700 pt-2 text-center">
                  <p className="text-[12px] font-semibold text-zinc-800">
                    {form.responsavel || "Responsável / Inspetor"}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                    Assinatura do responsável
                  </p>
                </div>

                <p className="mt-8 text-center text-[9px] text-zinc-400">
                  Este documento é um laudo técnico emitido pela Zero Foco.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="text-[13px] font-medium text-zinc-900">{value}</p>
    </div>
  );
}
