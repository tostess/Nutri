// Datas em ISO "AAAA-MM-DD", calculadas em UTC para não sofrer com fuso.

const pad = (n: number) => String(n).padStart(2, "0");

export function hoje(d = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function pd(s: string): number {
  const [y, m, d] = s.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Dias corridos entre duas datas (b - a). */
export function dias(a: string, b: string): number {
  return Math.round((pd(b) - pd(a)) / 864e5);
}

/** Meses completos entre duas datas, igual ao DATEDIF(...;"m") do Excel. */
export function meses(a: string, b: string): number {
  const [y1, m1, d1] = a.split("-").map(Number);
  const [y2, m2, d2] = b.split("-").map(Number);
  let m = (y2 - y1) * 12 + (m2 - m1);
  if (d2 < d1) m--;
  return m;
}

export function anos(nasc: string, d: string): number {
  return Math.floor(meses(nasc, d) / 12);
}

export function somaMeses(a: string, n: number): string {
  const [y, m, d] = a.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + n, 1));
  const ultimo = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 0)).getUTCDate();
  dt.setUTCDate(Math.min(d, ultimo));
  return dt.toISOString().slice(0, 10);
}

export function somaDias(a: string, n: number): string {
  return new Date(pd(a) + n * 864e5).toISOString().slice(0, 10);
}

const pl = (n: number, s: string, p: string) => `${n} ${n === 1 ? s : p}`;

/** "8 meses e 26 dias", "2 anos e 4 meses", "12 dias". */
export function idadeTexto(a: string, b: string): string {
  const m = meses(a, b);
  if (m < 0) return "—";
  const y = Math.floor(m / 12);
  const mm = m % 12;
  const dd = dias(somaMeses(a, m), b);
  if (y) return pl(y, "ano", "anos") + (mm ? " e " + pl(mm, "mês", "meses") : "");
  if (m) return pl(m, "mês", "meses") + (dd ? " e " + pl(dd, "dia", "dias") : "");
  return pl(dd, "dia", "dias");
}

export function dataBR(s?: string | null): string {
  return s ? s.split("-").reverse().join("/") : "—";
}

const SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
export function diaSemana(s: string): string {
  return SEMANA[new Date(pd(s)).getUTCDay()];
}

/** Idade gestacional a partir de dias: "28 sem e 4 d". */
export function igTexto(d: number): string {
  return `${Math.floor(d / 7)} sem e ${d % 7} d`;
}
