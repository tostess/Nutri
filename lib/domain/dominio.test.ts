import { describe, expect, it } from "vitest";
import { estadoExemplo } from "../data/seed";
import type { Crianca, Gestante, Lactante } from "../types";
import { idadeTexto, meses } from "./datas";
import { linhasCrescimento } from "./crescimento";
import { necessidadesCrianca } from "./necessidades";
import { calcularFormula } from "./formula";
import { faixaGanho, linhasMae, necessidadesMae } from "./maternal";
import { avaliarRoma, resumoIntestinal } from "./intestinal";
import { lembretesDoDia, montarMensagem, normalizarTelefone, preencher } from "./mensagens";
import { reduzir } from "../data/eventos";

const S = estadoExemplo();
const pac = <T,>(id: string) => S.pacientes.find((p) => p.id === id) as T;
const helena = pac<Crianca>("helena");

describe("datas", () => {
  it("conta meses completos como o DATEDIF", () => {
    expect(meses("2026-02-25", "2026-08-25")).toBe(6);
    expect(meses("2026-02-25", "2026-08-24")).toBe(5);
    expect(idadeTexto("2026-02-25", "2026-11-20")).toBe("8 meses e 26 dias");
  });
});

describe("crescimento (valores da planilha)", () => {
  const rs = linhasCrescimento(helena, S.config.crit);
  it("calcula idade, ganho e classificação SBP", () => {
    expect(rs.map((r) => r.idade)).toEqual([0, 0, 1, 2, 4, 5, 5, 6, 8]);
    expect(rs.slice(1).map((r) => r.cPeso)).toEqual(["Atenção", "Abaixo", "Abaixo", "Adequado", "Abaixo", "Abaixo", "Atenção", "Abaixo"]);
    expect(rs[8].gDia).toBeCloseTo(6.0526, 3);
  });
});

describe("necessidades da criança (valores da planilha)", () => {
  const n = necessidadesCrianca(helena, S.config.crit)!;
  it("EER pela DRI 2023", () => expect(n.eer).toBeCloseTo(548.2212, 3));
  it("volume de fórmula pela energia", () => {
    expect(n.volume!.vol).toBeCloseTo(818.2406, 3);
    expect(n.volume!.situacao).toBe("acima");
  });
  it("proteína 1,2 g/kg após 6 meses", () => expect(n.macros[0].meta).toBeCloseTo(7.968, 3));
});

describe("fórmula e diluição", () => {
  const r = calcularFormula(helena, S.config.formulas);
  it("volume, medidas e latas", () => {
    expect(r.porEtapa).toBeCloseTo(109.8529, 3);
    expect(r.medidas).toBe(4);
    expect(r.agua).toBe(120);
    expect(r.latasMes).toBeCloseTo(10.9853, 3);
    expect(r.situacaoKcal).toBe("Dentro da meta");
  });
});

describe("gestação", () => {
  const camila = pac<Gestante>("camila");
  it("faixa interpolada das curvas brasileiras", () => {
    const [a, b] = faixaGanho("eu", 28);
    expect(a).toBeCloseTo(3.4769, 3);
    expect(b).toBeCloseTo(6.7385, 3);
  });
  it("classifica o último ganho como acima", () => {
    const rs = linhasMae(camila);
    expect(rs[rs.length - 1].classe).toBe("Acima");
  });
  it("EER do 3º trimestre com deposição", () => {
    const n = necessidadesMae(camila, "2026-11-21");
    expect(n.trimestre).toBe(3);
    // 693,35 − 2,04×32 + 5,73×164 + 10,20×68,9 + 9,16×28 + 200
    expect(n.eer).toBeCloseTo(2727.05, 1);
  });
  it("lactante mista antes de 6 meses soma 380 kcal", () => {
    const n = necessidadesMae(pac<Lactante>("juliana"), "2026-11-21");
    expect(n.eer).toBeCloseTo(584.9 - 7.01 * 31 + 5.72 * 168 + 11.71 * 66.9 + 380, 3);
  });
});

describe("intestinal", () => {
  it("resume a janela e alerta para fezes endurecidas", () => {
    const r = resumoIntestinal(helena.evacuacoes, "lactente", "2026-11-21", 14);
    expect(r.total).toBe(5);
    expect(r.pctDuras).toBeCloseTo(0.4);
    expect(r.alertas.some((a) => a[1].includes("endurecidas"))).toBe(true);
  });
  it("alerta fezes claras", () => {
    const r = resumoIntestinal([{ ...helena.evacuacoes[0], cor: "clara", data: "2026-11-20" }], "lactente", "2026-11-21");
    expect(r.alertas[0][0]).toBe("ab");
  });
  it("Roma IV com 2 critérios", () => {
    expect(avaliarRoma("ate4", { freq2: true, dor: true }).compativel).toBe(true);
    expect(avaliarRoma("adulto", { esforco: true }).compativel).toBe(false);
  });
});

describe("mensagens", () => {
  it("normaliza telefone brasileiro", () => {
    expect(normalizarTelefone("(22) 99876-5432")).toBe("5522998765432");
    expect(normalizarTelefone("5522998765432")).toBe("5522998765432");
    expect(normalizarTelefone("123")).toBeNull();
  });
  it("preenche variáveis e mantém as desconhecidas", () => {
    expect(preencher("Oi {contato}, {x}", { contato: "Ana" })).toBe("Oi Ana, {x}");
  });
  it("monta lembrete para a responsável do bebê", () => {
    const t = montarMensagem("lembrete", helena, S.config, "https://app.test");
    expect(t).toContain("Olá, Mariana!");
    expect(t).toContain("a consulta de Helena");
    expect(t).toContain("segunda, 07/12, às 10:00");
  });
  it("lembretes do dia só para quem tem consulta e telefone", () => {
    const l = lembretesDoDia(S.pacientes, S.config, "2026-12-12", "https://app.test");
    expect(l.map((x) => x.pacienteId).sort()).toEqual(["davi", "juliana"]);
  });
});

describe("eventos", () => {
  it("registra o parto: cria o bebê e muda a mãe para lactante", () => {
    const s = reduzir(estadoExemplo(), {
      t: "paciente/parto", maeId: "camila", data: "2027-02-01", amam: "exclusiva",
      bebe: { id: "bento", nome: "Bento", sexo: "M", peso: 3.3, alt: 49, pc: 34 },
    });
    const mae = s.pacientes.find((p) => p.id === "camila") as Lactante;
    expect(mae.tipo).toBe("lactante");
    expect(mae.bebeId).toBe("bento");
    expect(mae.gestacao?.consultas.length).toBe(5);
    const b = s.pacientes.find((p) => p.id === "bento") as Crianca;
    expect(b.maeId).toBe("camila");
    expect(b.consultas[0]).toMatchObject({ data: "2027-02-01", peso: 3.3 });
  });
});
