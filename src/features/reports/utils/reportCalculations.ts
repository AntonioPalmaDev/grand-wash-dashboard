import { Operation } from "@/types";

export function calculateReportStats(operations: Operation[]) {
  const totalBruto = operations.reduce((acc, op) => acc + op.valorBruto, 0);
  const lucroLiquido = operations.reduce((acc, op) => acc + op.lucroLiquido, 0);
  const count = operations.length;
  const completedCount = operations.filter(op => op.status === 'concluido').length;
  
  return {
    totalBruto,
    lucroLiquido,
    count,
    completedCount,
    successRate: count > 0 ? (completedCount / count) * 100 : 0,
    ticketMedio: count > 0 ? totalBruto / count : 0,
    eficienciaLiquida: totalBruto > 0 ? (lucroLiquido / totalBruto) * 100 : 0,
  };
}

export function groupOperationsByDate(operations: Operation[]) {
  const groups: Record<string, { date: string; bruto: number; liquido: number }> = {};
  
  operations.forEach(op => {
    const date = new Date(op.data).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = { date, bruto: 0, liquido: 0 };
    }
    groups[date].bruto += op.valorBruto;
    groups[date].liquido += op.lucroLiquido;
  });

  return Object.values(groups).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
