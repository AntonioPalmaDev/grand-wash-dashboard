import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReportFilters as IReportFilters } from "../hooks/useReportsData";
import { ClientType, ProductCategory, OperationStatus } from "@/types";
import { Search, Filter } from "lucide-react";

interface ReportFiltersProps {
  filters: IReportFilters;
  onFilterChange: (filters: IReportFilters) => void;
}

export function ReportFilters({ filters, onFilterChange }: ReportFiltersProps) {
  const handleChange = (key: keyof IReportFilters, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-secondary/20 rounded-xl border border-white/5 backdrop-blur-md sticky top-0 z-10">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente..."
          value={filters.search}
          onChange={(e) => handleChange("search", e.target.value)}
          className="pl-9 bg-background/50 border-white/10"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        <Select value={filters.tipo} onValueChange={(v) => handleChange("tipo", v)}>
          <SelectTrigger className="w-32 bg-secondary/50 border-white/10">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos (PF/PJ)</SelectItem>
            <SelectItem value="PF">PF</SelectItem>
            <SelectItem value="PJ">PJ</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.category} onValueChange={(v) => handleChange("category", v)}>
          <SelectTrigger className="w-40 bg-secondary/50 border-white/10">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            <SelectItem value="dinheiro">Finanças</SelectItem>
            <SelectItem value="itens">Produtos</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.status} onValueChange={(v) => handleChange("status", v)}>
          <SelectTrigger className="w-36 bg-secondary/50 border-white/10">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
