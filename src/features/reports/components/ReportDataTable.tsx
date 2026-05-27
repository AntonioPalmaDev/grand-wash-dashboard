import { Operation, Client } from "@/types";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Package, User } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ReportDataTableProps {
  operations: Operation[];
  clients: Client[];
}

export function ReportDataTable({ operations, clients }: ReportDataTableProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-secondary/5 overflow-hidden">
      <Table>
        <TableHeader className="bg-white/5">
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead className="text-[11px] uppercase font-bold tracking-wider">Cliente</TableHead>
            <TableHead className="text-[11px] uppercase font-bold tracking-wider">Produtos/Info</TableHead>
            <TableHead className="text-right text-[11px] uppercase font-bold tracking-wider">Bruto</TableHead>
            <TableHead className="text-right text-[11px] uppercase font-bold tracking-wider">Líquido</TableHead>
            <TableHead className="text-center text-[11px] uppercase font-bold tracking-wider">Status</TableHead>
            <TableHead className="text-right text-[11px] uppercase font-bold tracking-wider">Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {operations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                Nenhuma operação encontrada com os filtros selecionados.
              </TableCell>
            </TableRow>
          ) : (
            operations.map((op) => {
              const client = clients.find((c) => c.id === op.clientId);
              return (
                <TableRow key={op.id} className="border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-full bg-primary/10 text-primary">
                        <User size={14} />
                      </div>
                      <span className="font-medium text-white">{client?.nome || "Desconhecido"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {op.category === "itens" ? (
                        <div className="flex items-center gap-1 text-[10px] text-primary font-bold uppercase">
                          <Package size={10} /> Venda de Itens
                        </div>
                      ) : (
                        <div className="text-[10px] text-muted-foreground uppercase">
                          Taxa: {formatPercent(op.taxaPercentual)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-white">
                    {formatCurrency(op.valorBruto)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-emerald-500">
                    {formatCurrency(op.lucroLiquido)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        op.status === "concluido"
                          ? "default"
                          : op.status === "cancelado"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-[9px] uppercase font-bold px-1.5 py-0"
                    >
                      {op.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {formatDate(op.data)}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
        </Table>
      </div>
    </div>
  );
}
