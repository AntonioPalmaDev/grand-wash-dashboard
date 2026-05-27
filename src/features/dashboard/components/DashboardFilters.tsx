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
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  
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
      tipoOperacao: "ALL",
      clienteId: "ALL",
      responsavel: "ALL",
      perfil: "ALL",
      status: "concluido",
      camada: "ALL",
    });
  };

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Busca */}
          <div className="relative w-full sm:w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar cliente ou placa..." 
              className="pl-10 bg-secondary/30 border-white/10 h-11 rounded-xl focus-visible:ring-primary/50 transition-all"
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

          {/* Período */}
          <Select 
            value={filtros.periodo} 
            onValueChange={(v) => setFiltros(f => ({ ...f, periodo: v }))}
          >
            <SelectTrigger className="w-full sm:w-[160px] bg-secondary/30 border-white/10 h-11 rounded-xl">
              <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent className="bg-black/90 border-white/10 backdrop-blur-xl">
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="ALL">Todo o período</SelectItem>
            </SelectContent>
          </Select>

          {/* Camada */}
          <Select 
            value={filtros.camada} 
            onValueChange={(v) => setFiltros(f => ({ ...f, camada: v }))}
          >
            <SelectTrigger className="w-full sm:w-[160px] bg-secondary/30 border-white/10 h-11 rounded-xl">
              <Layers className="mr-2 h-4 w-4 text-primary" />
              <SelectValue placeholder="Camada" />
            </SelectTrigger>
            <SelectContent className="bg-black/90 border-white/10 backdrop-blur-xl">
              <SelectItem value="ALL">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white/40" />
                  Todas Camadas
                </div>
              </SelectItem>
              <SelectItem value="FINANCEIRO">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  Financeiro
                </div>
              </SelectItem>
              <SelectItem value="PRODUTOS">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  Produtos
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Status */}
          <Select 
            value={filtros.status} 
            onValueChange={(v) => setFiltros(f => ({ ...f, status: v }))}
          >
            <SelectTrigger className="w-full sm:w-[160px] bg-secondary/30 border-white/10 h-11 rounded-xl">
              <Filter className="mr-2 h-4 w-4 text-primary" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-black/90 border-white/10 backdrop-blur-xl">
              <SelectItem value="ALL">Todos Status</SelectItem>
              <SelectItem value="concluido">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  Concluído
                </div>
              </SelectItem>
              <SelectItem value="pendente">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-amber-500" />
                  Pendente
                </div>
              </SelectItem>
              <SelectItem value="cancelado">
                <div className="flex items-center gap-2">
                  <XCircle className="h-3 w-3 text-rose-500" />
                  Cancelado
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Responsável */}
          <Select 
            value={filtros.responsavel} 
            onValueChange={(v) => setFiltros(f => ({ ...f, responsavel: v }))}
          >
            <SelectTrigger className="w-full sm:w-[180px] bg-secondary/30 border-white/10 h-11 rounded-xl">
              <User className="mr-2 h-4 w-4 text-primary" />
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent className="bg-black/90 border-white/10 backdrop-blur-xl">
              <SelectItem value="ALL">Todos Responsáveis</SelectItem>
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
            <SelectTrigger className="w-full sm:w-[140px] bg-secondary/30 border-white/10 h-11 rounded-xl">
              <Shield className="mr-2 h-4 w-4 text-primary" />
              <SelectValue placeholder="Perfil" />
            </SelectTrigger>
            <SelectContent className="bg-black/90 border-white/10 backdrop-blur-xl">
              <SelectItem value="ALL">Todos Perfis</SelectItem>
              <SelectItem value="PF">Pessoa Física</SelectItem>
              <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            onClick={clearFilters}
            className="text-muted-foreground hover:text-white hover:bg-white/5 h-11 gap-2 rounded-xl transition-all"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Limpar</span>
          </Button>
        )}
      </div>
    </div>
  );
}
