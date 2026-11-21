"use client";

import type { Crianca, Criterios, Mae } from "@/lib/types";
import { linhasCrescimento } from "@/lib/domain/crescimento";
import { classeIMC, imc, linhasMae } from "@/lib/domain/maternal";
import { GANHO_GESTACIONAL } from "@/lib/domain/referencias";
import { dataBR, dias } from "@/lib/domain/datas";
import { fmt, ok, sinal } from "@/lib/format";
import { CLASSE_CSS, useTamanho } from "./ui";

const passoBonito = (x: number) => {
  const p = 10 ** Math.floor(Math.log10(x)), f = x / p;
  return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
};

function eixos(W: number, H: number, mg: { l: number; r: number; t: number; b: number }, y0: number, y1: number, st: number, xmax: number, xst: number, xsuf: string) {
  const X = (v: number) => mg.l + (v / xmax) * (W - mg.l - mg.r);
  const Y = (v: number) => H - mg.b - ((v - y0) / (y1 - y0)) * (H - mg.t - mg.b);
  const ys: number[] = [];
  for (let v = y0; v <= y1 + 1e-9; v += st) ys.push(v);
  const xs: number[] = [];
  for (let v = 0; v <= xmax; v += xst) xs.push(v);
  const el = (
    <>
      {ys.map((v) => (
        <g key={"y" + v}>
          <line x1={mg.l} x2={W - mg.r} y1={Y(v)} y2={Y(v)} stroke="var(--line)" />
          <text x={mg.l - 8} y={Y(v) + 4} textAnchor="end">{fmt(v, st < 1 ? 1 : 0)}</text>
        </g>
      ))}
      {xs.map((v) => <text key={"x" + v} x={X(v)} y={H - mg.b + 20} textAnchor="middle">{v}{v === 0 ? xsuf : ""}</text>)}
    </>
  );
  return { X, Y, el };
}

export type Serie = "peso" | "alt" | "pc";

export function GraficoCrescimento({ p, crit, serie }: { p: Crianca; crit: Criterios; serie: Serie }) {
  const [ref, { w: W, h: H }] = useTamanho<HTMLDivElement>();
  const classe = { peso: "cPeso", alt: "cEst", pc: "cPc" } as const;
  const un = serie === "peso" ? "kg" : "cm";
  const rs = linhasCrescimento(p, crit).filter((r) => ok(r[serie]));
  let svg = null;
  if (W && rs.length) {
    const mg = { l: 46, r: 64, t: 16, b: 36 };
    const xs = rs.map((r) => dias(p.nasc, r.data) / 30.4375), ys = rs.map((r) => r[serie] as number);
    const xmax = Math.max(1, Math.ceil(Math.max(...xs) + 0.6));
    let lo = Math.min(...ys), hi = Math.max(...ys);
    if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
    const st = passoBonito((hi - lo) / 4), y0 = Math.floor(lo / st) * st, y1 = Math.ceil(hi / st) * st;
    const xst = W < 520 ? Math.max(2, Math.ceil(xmax / 5)) : Math.max(1, Math.ceil(xmax / 10));
    const { X, Y, el } = eixos(W, H, mg, y0, y1, st, xmax, xst, " m");
    const pts = rs.map((_, i) => [X(xs[i]), Y(ys[i])]);
    const linha = "M" + pts.map((q) => q.join(",")).join("L");
    const area = linha + `L${pts[pts.length - 1][0]},${H - mg.b}L${pts[0][0]},${H - mg.b}Z`;
    const lp = pts[pts.length - 1];
    svg = (
      <svg viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--leaf)" stopOpacity=".28" />
            <stop offset="1" stopColor="var(--leaf)" stopOpacity=".02" />
          </linearGradient>
        </defs>
        {el}
        <path d={area} fill="url(#ga)" />
        <path d={linha} fill="none" stroke="var(--leaf)" strokeWidth={3} strokeLinejoin="round" />
        {rs.map((r, i) => {
          const c = r[classe[serie]];
          return (
            <circle key={r.data} cx={pts[i][0]} cy={pts[i][1]} r={i === rs.length - 1 ? 7 : 5.5}
              fill={c ? `var(--${CLASSE_CSS[c]})` : "var(--bg)"} stroke={c ? "var(--bg)" : "var(--leaf)"} strokeWidth={2.5}>
              <title>{`${dataBR(r.data)}: ${fmt(r[serie], serie === "peso" ? 3 : 1)} ${un}${c ? " · " + c : ""}`}</title>
            </circle>
          );
        })}
        <text x={lp[0] + 10} y={lp[1] + 5} style={{ fontWeight: 800, fill: "var(--ink)" }}>{fmt(ys[ys.length - 1], serie === "peso" ? 2 : 1)} {un}</text>
      </svg>
    );
  }
  return <div className="fig" ref={ref} role="img" aria-label="Gráfico da evolução por idade">{svg}</div>;
}

export function GraficoMae({ p }: { p: Mae }) {
  const [ref, { w: W, h: H }] = useTamanho<HTMLDivElement>();
  const G = p.tipo === "gestante";
  const rs = linhasMae(p).filter((r) => ok(r.peso));
  let conteudo = null;
  if (W && !rs.length) {
    conteudo = (
      <p className="dim" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center", margin: 0, padding: 20, border: "1.5px dashed var(--line)", borderRadius: 14 }}>
        Registre a primeira consulta{G ? "" : " após o parto"} para ver o gráfico.
      </p>
    );
  } else if (W) {
    const mg = { l: 46, r: 70, t: 22, b: 36 };
    const k = classeIMC(imc(p.pesoPre, p.altura) ?? 22);
    const marcos: [number, number, number][] = [[0, 0, 0], ...GANHO_GESTACIONAL[k]];
    let xs: number[], ys: number[], xmax: number, lo: number, hi: number;
    if (G) {
      xs = rs.map((r) => r.semana!); ys = rs.map((r) => r.dif!); xmax = 42;
      lo = Math.min(-2, ...ys, ...marcos.map((x) => x[1])); hi = Math.max(...ys, ...marcos.map((x) => x[2])) + 1;
    } else {
      xs = rs.map((r) => r.posParto! / 7); ys = rs.map((r) => r.peso!);
      xmax = Math.max(8, Math.ceil(Math.max(0, ...xs) / 4) * 4 + 4);
      lo = Math.min(p.pesoPre, ...ys) - 2; hi = Math.max(p.pesoPre, ...ys) + 2;
    }
    const st = passoBonito((hi - lo) / 5), y0 = Math.floor(lo / st) * st, y1 = Math.ceil(hi / st) * st;
    const xst = G ? (W < 520 ? 10 : 4) : W < 520 ? 8 : 4;
    const { X, Y, el } = eixos(W, H, mg, y0, y1, st, xmax, xst, " sem");
    const pts = rs.map((_, i) => [X(xs[i]), Y(ys[i])]);
    const lp = pts[pts.length - 1];
    conteudo = (
      <svg viewBox={`0 0 ${W} ${H}`}>
        {el}
        {G ? (
          <>
            <polygon fill="var(--leaf)" fillOpacity={0.18} stroke="var(--leaf)" strokeOpacity={0.5}
              points={[...marcos.map((q) => `${X(q[0])},${Y(q[2])}`), ...[...marcos].reverse().map((q) => `${X(q[0])},${Y(q[1])}`)].join(" ")} />
            {([[13, "2º tri"], [27, "3º tri"]] as const).map(([w, t]) => (
              <g key={t}>
                <line x1={X(w)} x2={X(w)} y1={mg.t} y2={H - mg.b} stroke="var(--line)" strokeDasharray="4 4" />
                <text x={X(w) + 6} y={mg.t + 2}>{t}</text>
              </g>
            ))}
            <line x1={mg.l} x2={W - mg.r} y1={Y(0)} y2={Y(0)} stroke="var(--mute)" strokeOpacity={0.5} />
          </>
        ) : (
          <>
            <line x1={mg.l} x2={W - mg.r} y1={Y(p.pesoPre)} y2={Y(p.pesoPre)} stroke="var(--mute)" strokeDasharray="6 5" />
            <text x={W - mg.r + 6} y={Y(p.pesoPre) + 4}>pré</text>
          </>
        )}
        <path d={"M" + pts.map((q) => q.join(",")).join("L")} fill="none" stroke={G ? "var(--ink)" : "var(--berry)"} strokeWidth={2.5} strokeLinejoin="round" />
        {rs.map((r, i) => (
          <circle key={r.data} cx={pts[i][0]} cy={pts[i][1]} r={i === rs.length - 1 ? 7 : 5.5}
            fill={G && r.classe ? `var(--${CLASSE_CSS[r.classe]})` : "var(--berry)"} stroke="var(--bg)" strokeWidth={2.5}>
            <title>{`${dataBR(r.data)}: ${G ? sinal(r.dif!, 1) : fmt(r.peso)} kg`}</title>
          </circle>
        ))}
        <text x={lp[0] + 10} y={lp[1] + 5} style={{ fontWeight: 800, fill: "var(--ink)" }}>{G ? sinal(ys[ys.length - 1], 1) : fmt(ys[ys.length - 1])} kg</text>
      </svg>
    );
  }
  return <div className="fig" ref={ref} role="img" aria-label={G ? "Ganho de peso por semana de gestação" : "Peso por semana pós-parto"}>{conteudo}</div>;
}

export function Mamadeira({ ml, className = "bottle" }: { ml: number | null; className?: string }) {
  const nivel = Math.max(0, Math.min(1, (ml || 0) / 260)), topo = 58, base = 190, y = base - (base - topo) * nivel;
  return (
    <svg className={className} viewBox="0 0 120 200" aria-hidden="true">
      <defs><clipPath id="bc"><rect x="22" y="58" width="76" height="134" rx="18" /></clipPath></defs>
      <path d="M48 8c0-5 24-5 24 0l6 26H42z" style={{ fill: "light-dark(#e9b9a2,#7a4a38)" }} />
      <rect x="34" y="32" width="52" height="20" rx="5" fill="var(--berry)" />
      <rect className="liqr liq" x="22" y={y} width="76" height={base - y + 4} clipPath="url(#bc)" style={{ stroke: "none" }} />
      <rect className="glass" x="22" y="58" width="76" height="134" rx="18" />
      {[1, 2, 3, 4, 5].map((i) => <path key={i} d={`M84 ${190 - i * 26}h10`} stroke="var(--apri-ink)" strokeWidth="2" />)}
    </svg>
  );
}

export function Faisca({ pontos }: { pontos: { x: number; y: number }[] }) {
  if (pontos.length < 2) return null;
  const xs = pontos.map((p) => p.x), ys = pontos.map((p) => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const pts = pontos.map((p) => `${4 + ((p.x - x0) / (x1 - x0 || 1)) * 392},${64 - ((p.y - y0) / (y1 - y0 || 1)) * 54}`).join(" ");
  return (
    <svg className="spark" viewBox="0 0 400 70" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts} fill="none" stroke="#fde3d6" strokeWidth={3} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

/** Desenho simples de cada tipo de fezes, para a pessoa reconhecer sem ler. */
export function IconeFezes({ escala, tipo }: { escala: "bristol" | "lactente"; tipo: number }) {
  const c = "var(--apri-ink)";
  const b = (cx: number, cy: number, r: number) => <circle key={`${cx}${cy}`} cx={cx} cy={cy} r={r} fill={c} />;
  const salsicha = (rach: boolean, lisa: boolean) => (
    <>
      <rect x="4" y="13" width="36" height="14" rx="7" fill={c} />
      {!lisa && [10, 18, 26, 34].map((x) => <path key={x} d={`M${x} ${rach ? 13 : 15}v${rach ? 4 : 10}`} stroke="var(--bg)" strokeWidth={rach ? 1.5 : 2.5} />)}
    </>
  );
  let g;
  if (escala === "lactente") {
    g = tipo === 1 ? <path d="M4 26c6-6 10 4 16-2s10 4 20-2v8H4z" fill={c} opacity={0.7} />
      : tipo === 2 ? <ellipse cx="22" cy="22" rx="17" ry="8" fill={c} opacity={0.85} />
        : tipo === 3 ? salsicha(false, true)
          : [b(10, 20, 5), b(22, 16, 5), b(32, 23, 5)];
  } else {
    g = tipo === 1 ? [b(8, 20, 4.5), b(19, 15, 4.5), b(30, 22, 4.5), b(38, 14, 3.5)]
      : tipo === 2 ? salsicha(false, false)
        : tipo === 3 ? salsicha(true, false)
          : tipo === 4 ? salsicha(false, true)
            : tipo === 5 ? [<ellipse key="a" cx="11" cy="20" rx="8" ry="6" fill={c} />, <ellipse key="b" cx="29" cy="18" rx="9" ry="6" fill={c} />]
              : tipo === 6 ? <path d="M4 22c4-8 8-2 12-6s8 4 12-2 8 6 12 2v12H4z" fill={c} opacity={0.85} />
                : <path d="M4 26c6-4 10 2 16-2s10 3 20-1v7H4z" fill={c} opacity={0.6} />;
  }
  return <svg width="44" height="40" viewBox="0 0 44 40" aria-hidden="true">{g}</svg>;
}
