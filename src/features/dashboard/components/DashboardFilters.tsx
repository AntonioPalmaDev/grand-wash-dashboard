import React from "react";
import { 
  Search, 
  Calendar as CalendarIcon, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  User, 
  Shield, 
  Layers,
  Filter,
  DollarSign,
  Package
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DashboardFiltersState } from "../hooks/useDashboardData";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface DashboardFiltersProps {
  filtros: DashboardFiltersState;
  setFiltros: React.Dispatch<React.SetStateAction<DashboardFiltersState>>;
  responsaveis: string[];
  clients: any[];
}

export function DashboardFilters({ 
  filtros, 
  setFiltros, 
  responsaveis, 
  clients 
}: DashboardFiltersProps) {
  const [range, setRange] = React.useState<DateRange | undefined>({
    from: filtros.startDate,
    to: filtros.endDate
  });
  
  const hasActiveFilters = 
    filtros.periodo !== "30d" || 
    filtros.status !== "concluido" || 
    filtros.camada !== "ALL" || 
    filtros.perfil !== "ALL" || 
    filtros.responsavel !== "ALL" || 
    filtros.clienteId !== "ALL";

  const clearFilters = () => {
    setFiltros({
      periodo: "30d",
      startDate: undefined,
      endDate: undefined,
      tipoOperacao: "ALL",
      clienteId: "ALL",
      responsavel: "ALL",
      perfil: "ALL",
      status: "concluido",
      camada: "ALL",
    });
    setRange(undefined);
  };

  const handleRangeChange = (newRange: DateRange | undefined) => {
    setRange(newRange);
    if (newRange?.from && newRange?.to) {
      setFiltros(f => ({ 
        ...f, 
        periodo: "custom", 
        startDate: newRange.from, 
        endDate: newRange.to 
      }));
    } else if (!newRange) {
      setFiltros(f => ({ ...f, periodo: "30d", startDate: undefined, endDate: undefined }));
    }
  };

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col md:flex-row flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Busca */}
          <div className="relative w-full md:w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar cliente ou placa..." 
              className="pl-10 bg-secondary/30 border-white/10 h-11 rounded-xl focus-visible:ring-primary/50 transition-all w-full"
              value={filtros.clienteId === "ALL" ? "" : clients.find(c => c.id === filtros.clienteId)?.nome || ""}
              onChange={(e) => {
                const term = e.target.value.toLowerCase();
                const found = clients.find(c => c.nome.toLowerCase().includes(term));
                if (found) {
                  setFiltros(f => ({ ...f, clienteId: found.id }));
                } else if (!term) {
                  setFiltros(f => ({ ...f, clienteId: "ALL" }));
                }
              }}
            />
          </div>

          {/* Período (Date Range Picker) */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full md:w-auto md:min-w-[260px] justify-start text-left font-normal bg-secondary/30 border-white/10 h-11 rounded-xl transition-all hover:bg-white/5 hover:border-white/20",
                  !range && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                {range?.from ? (
                  range.to ? (
                    <>
                      {format(range.from, "dd MMM, yyyy", { locale: ptBR })} -{" "}
                      {format(range.to, "dd MMM, yyyy", { locale: ptBR })}
                    </>
                  ) : (
                    format(range.from, "dd MMM, yyyy", { locale: ptBR })
                  )
                ) : (
                  <span>Selecionar período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-black/90 border-white/10 backdrop-blur-xl" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={range?.from}
                selected={range}
                onSelect={handleRangeChange}
                numberOfMonths={window.innerWidth > 768 ? 2 : 1}
                locale={ptBR}
              />
              <div className="p-3 border-t border-white/10 flex flex-wrap gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-[10px] uppercase font-bold"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() - 7);
                    handleRangeChange({ from: d, to: new Date() });
                  }}
                >
                  7 Dias
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-[10px] uppercase font-bold"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() - 30);
                    handleRangeChange({ from: d, to: new Date() });
                  }}
                >
                  30 Dias
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-[10px] uppercase font-bold"
                  onClick={() => setFiltros(f => ({ ...f, periodo: "ALL", startDate: undefined, endDate: undefined }))}
                >
                  Total
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 w-full sm:w-auto">
            {/* Camada */}
            <Select 
              value={filtros.camada} 
              onValueChange={(v) => setFiltros(f => ({ ...f, camada: v }))}
            >
              <SelectTrigger className="w-full sm:w-[140px] bg-secondary/30 border-white/10 h-11 rounded-xl">
                <Layers className="mr-2 h-4 w-4 text-primary hidden sm:block" />
                <SelectValue placeholder="Camada" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-white/10 backdrop-blur-xl">
                <SelectItem value="ALL">Todas Camadas</SelectItem>
                <SelectItem value="FINANCEIRO">Financeiro</SelectItem>
                <SelectItem value="PRODUTOS">Produtos</SelectItem>
              </SelectContent>
            </Select>

            {/* Status */}
            <Select 
              value={filtros.status} 
              onValueChange={(v) => setFiltros(f => ({ ...f, status: v }))}
            >
              <SelectTrigger className="w-full sm:w-[140px] bg-secondary/30 border-white/10 h-11 rounded-xl">
                <Filter className="mr-2 h-4 w-4 text-primary hidden sm:block" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-white/10 backdrop-blur-xl">
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            {/* Responsável */}
            <Select 
              value={filtros.responsavel} 
              onValueChange={(v) => setFiltros(f => ({ ...f, responsavel: v }))}
            >
              <SelectTrigger className="w-full sm:w-[160px] bg-secondary/30 border-white/10 h-11 rounded-xl">
                <User className="mr-2 h-4 w-4 text-primary hidden sm:block" />
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-white/10 backdrop-blur-xl">
                <SelectItem value="ALL">Responsáveis</SelectItem>
                {responsaveis.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Perfil */}
            <Select 
              value={filtros.perfil} 
              onValueChange={(v) => setFiltros(f => ({ ...f, perfil: v }))}
            >
              <SelectTrigger className="w-full sm:w-[120px] bg-secondary/30 border-white/10 h-11 rounded-xl">
                <Shield className="mr-2 h-4 w-4 text-primary hidden sm:block" />
                <SelectValue placeholder="Perfil" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-white/10 backdrop-blur-xl">
                <SelectItem value="ALL">Perfis</SelectItem>
                <SelectItem value="PF">PF</SelectItem>
                <SelectItem value="PJ">PJ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            onClick={clearFilters}
            className="text-muted-foreground hover:text-white hover:bg-white/5 h-11 gap-2 rounded-xl transition-all w-full lg:w-auto"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Limpar Filtros</span>
          </Button>
        )}
      </div>
    </div>
  );
}
