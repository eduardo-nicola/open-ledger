const formatterBRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatBRLFromCents(cents: number): string {
  return formatterBRL.format(cents / 100);
}

export function parseBRLToCents(input: string): number | null {
  const normalized = input
    .trim()
    .replace(/\s/g, "")
    .replace(/R\$\s?/i, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = Number.parseFloat(normalized);
  if (Number.isNaN(n) || n < 0) return null;
  return Math.round(n * 100);
}
