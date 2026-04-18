const TZ = "America/Sao_Paulo";

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatDate(iso: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(iso));
}

export function formatDateTime(iso: string | Date): string {
  return formatDate(iso);
}

export function formatDateOnly(iso: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    timeZone: TZ,
  }).format(new Date(iso));
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
