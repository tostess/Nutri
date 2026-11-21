export const ok = (n: unknown): n is number => typeof n === "number" && isFinite(n);

export function fmt(n: number | null | undefined, d = 1): string {
  return ok(n)
    ? n.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d })
    : "—";
}

/** Valor com sinal: "+ 6,9" / "− 0,4". */
export function sinal(v: number, d = 2): string {
  return (v < 0 ? "− " : "+ ") + fmt(Math.abs(v), d);
}

/** Lê número digitado com vírgula ou ponto. Vazio vira null. */
export function num(v: unknown): number | null {
  if (v === "" || v == null) return null;
  const n = parseFloat(String(v).replace(",", "."));
  return isFinite(n) ? n : null;
}

export function uid(prefixo = ""): string {
  return prefixo + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
