import type { Anamnese, Tipo } from "../types";

export type TipoCampo = "texto" | "textoLongo" | "opcao" | "multi" | "numero" | "simnao";

export interface Campo {
  id: string;
  rotulo: string;
  tipo: TipoCampo;
  opcoes?: string[];
  unidade?: string;
  largo?: boolean;
}

export interface Secao {
  id: string;
  titulo: string;
  campos: Campo[];
}

const FREQ_INTESTINO = ["Mais de 3 vezes ao dia", "1 a 3 vezes ao dia", "Dia sim, dia não", "2 vezes por semana ou menos"];
const SONO = ["Dorme bem", "Acorda várias vezes", "Dorme pouco"];

const INTESTINO_CRIANCA: Secao = {
  id: "intestino", titulo: "Hábito intestinal",
  campos: [
    { id: "int_freq", rotulo: "Frequência habitual", tipo: "opcao", opcoes: FREQ_INTESTINO },
    { id: "int_consist", rotulo: "Consistência mais comum", tipo: "opcao", opcoes: ["Aquosa", "Mole ou pastosa", "Formada", "Endurecida, em bolinhas"] },
    { id: "int_sint", rotulo: "Sintomas", tipo: "multi", opcoes: ["Choro ou dor ao evacuar", "Esforço", "Gases", "Cólica", "Assadura", "Sangue", "Nenhum"] },
    { id: "int_laxante", rotulo: "Usa laxante ou supositório?", tipo: "simnao" },
    { id: "int_agua", rotulo: "Água oferecida por dia (a partir de 6 meses)", tipo: "texto" },
  ],
};

const INTESTINO_ADULTO: Secao = {
  id: "intestino", titulo: "Hábito intestinal",
  campos: [
    { id: "int_freq", rotulo: "Frequência habitual", tipo: "opcao", opcoes: FREQ_INTESTINO },
    { id: "int_bristol", rotulo: "Formato mais comum (Bristol)", tipo: "opcao", opcoes: ["1 caroços duros", "2 salsicha encaroçada", "3 salsicha com rachaduras", "4 lisa e macia", "5 pedaços macios", "6 pastosa", "7 aquosa"] },
    { id: "int_sint", rotulo: "Sintomas", tipo: "multi", opcoes: ["Esforço", "Evacuação incompleta", "Gases", "Barriga inchada", "Hemorroidas", "Sangue", "Nenhum"] },
    { id: "int_laxante", rotulo: "Usa laxante?", tipo: "simnao" },
  ],
};

const HABITOS: Secao = {
  id: "habitos", titulo: "Hábitos",
  campos: [
    { id: "hab_atividade", rotulo: "Atividade física", tipo: "opcao", opcoes: ["Nenhuma", "1 a 2 vezes por semana", "3 ou mais vezes por semana"] },
    { id: "hab_sono", rotulo: "Sono", tipo: "opcao", opcoes: SONO },
    { id: "hab_agua", rotulo: "Água por dia", tipo: "numero", unidade: "L" },
    { id: "hab_cafe", rotulo: "Café por dia", tipo: "numero", unidade: "xícaras" },
    { id: "hab_tabaco", rotulo: "Fuma?", tipo: "simnao" },
    { id: "hab_alcool", rotulo: "Consome bebida alcoólica?", tipo: "simnao" },
  ],
};

const ALIMENTACAO_ADULTA = (sintomas: string[]): Secao => ({
  id: "alimentacao", titulo: "Alimentação",
  campos: [
    { id: "ali_refeicoes", rotulo: "Refeições por dia", tipo: "numero" },
    { id: "ali_prepara", rotulo: "Quem prepara as refeições", tipo: "texto" },
    { id: "ali_fora", rotulo: "Come fora de casa", tipo: "opcao", opcoes: ["Raramente", "Algumas vezes por semana", "Todo dia"] },
    { id: "ali_apetite", rotulo: "Apetite", tipo: "opcao", opcoes: ["Aumentado", "Normal", "Diminuído"] },
    { id: "ali_sint", rotulo: "Sintomas", tipo: "multi", opcoes: sintomas },
    { id: "ali_restricoes", rotulo: "Restrições, aversões ou intolerâncias", tipo: "textoLongo", largo: true },
    { id: "ali_preferencias", rotulo: "Preferências e desejos", tipo: "textoLongo", largo: true },
  ],
});

const SUPLEMENTOS_MULHER: Campo = { id: "cli_suplementos", rotulo: "Suplementos em uso", tipo: "multi", opcoes: ["Ácido fólico", "Ferro", "Vitamina D", "Ômega-3", "Polivitamínico", "Cálcio", "Nenhum"] };

const SECOES: Record<Tipo, Secao[]> = {
  crianca: [
    {
      id: "nascimento", titulo: "Gestação e nascimento",
      campos: [
        { id: "nas_ig", rotulo: "Idade gestacional ao nascer", tipo: "numero", unidade: "semanas" },
        { id: "nas_parto", rotulo: "Tipo de parto", tipo: "opcao", opcoes: ["Normal", "Cesárea"] },
        { id: "nas_uti", rotulo: "Ficou em UTI neonatal?", tipo: "simnao" },
        { id: "nas_uti_dias", rotulo: "Dias de UTI", tipo: "numero", unidade: "dias" },
        { id: "nas_intercorrencias", rotulo: "Intercorrências na gestação ou no parto", tipo: "textoLongo", largo: true },
      ],
    },
    {
      id: "aleitamento", titulo: "Aleitamento",
      campos: [
        { id: "ale_atual", rotulo: "Alimentação láctea hoje", tipo: "opcao", opcoes: ["Leite materno exclusivo", "Leite materno e fórmula", "Só fórmula", "Desmamado"] },
        { id: "ale_inicio_formula", rotulo: "Idade em que começou a fórmula", tipo: "numero", unidade: "meses" },
        { id: "ale_desmame", rotulo: "Idade do desmame", tipo: "numero", unidade: "meses" },
        { id: "ale_dificuldades", rotulo: "Dificuldades na amamentação", tipo: "multi", opcoes: ["Pega", "Dor ao amamentar", "Pouco leite", "Dorme ao peito", "Nenhuma"] },
        { id: "ale_utensilios", rotulo: "Usa", tipo: "multi", opcoes: ["Mamadeira", "Chupeta", "Copo", "Nenhum"] },
      ],
    },
    {
      id: "complementar", titulo: "Alimentação complementar",
      campos: [
        { id: "com_inicio", rotulo: "Início da alimentação complementar", tipo: "numero", unidade: "meses" },
        { id: "com_consistencia", rotulo: "Consistência atual", tipo: "opcao", opcoes: ["Ainda não começou", "Amassada", "Pedaços pequenos", "Comida da família"] },
        { id: "com_aceitacao", rotulo: "Aceitação", tipo: "opcao", opcoes: ["Boa", "Regular", "Ruim"] },
        { id: "com_acucar", rotulo: "Já recebeu açúcar, doces ou ultraprocessados?", tipo: "simnao" },
        { id: "com_quem", rotulo: "Quem prepara e oferece as refeições", tipo: "texto" },
        { id: "com_creche", rotulo: "Frequenta creche ou escola?", tipo: "simnao" },
        { id: "com_recusas", rotulo: "Alimentos recusados", tipo: "textoLongo", largo: true },
      ],
    },
    {
      id: "saude", titulo: "Saúde",
      campos: [
        { id: "sau_alergias", rotulo: "Alergias ou intolerâncias", tipo: "multi", opcoes: ["APLV", "Ovo", "Soja", "Trigo", "Amendoim ou castanhas", "Lactose", "Nenhuma"] },
        { id: "sau_suplementos", rotulo: "Suplementos e medicamentos", tipo: "multi", opcoes: ["Vitamina D", "Ferro", "Polivitamínico", "Probiótico", "Antirrefluxo", "Nenhum"] },
        { id: "sau_doses", rotulo: "Doses e outros medicamentos", tipo: "texto" },
        { id: "sau_sono", rotulo: "Sono", tipo: "opcao", opcoes: SONO },
        { id: "sau_vacinas", rotulo: "Vacinação", tipo: "opcao", opcoes: ["Em dia", "Atrasada", "Não sei"] },
        { id: "sau_internacoes", rotulo: "Internações e doenças anteriores", tipo: "textoLongo", largo: true },
        { id: "sau_marcos", rotulo: "Desenvolvimento (sustenta a cabeça, senta, engatinha, anda)", tipo: "textoLongo", largo: true },
      ],
    },
    INTESTINO_CRIANCA,
    {
      id: "familia", titulo: "Família",
      campos: [
        { id: "fam_historico", rotulo: "Histórico familiar", tipo: "multi", opcoes: ["Alergia alimentar", "Diabetes", "Obesidade", "Hipertensão", "Doença celíaca", "Doença intestinal"] },
        { id: "fam_obs", rotulo: "Observações", tipo: "textoLongo", largo: true },
      ],
    },
  ],
  gestante: [
    {
      id: "obstetrico", titulo: "Histórico obstétrico",
      campos: [
        { id: "obs_gestacoes", rotulo: "Gestações (incluindo esta)", tipo: "numero" },
        { id: "obs_partos", rotulo: "Partos", tipo: "numero" },
        { id: "obs_abortos", rotulo: "Abortos", tipo: "numero" },
        { id: "obs_tipo", rotulo: "Gestação", tipo: "opcao", opcoes: ["Única", "Gemelar"] },
        { id: "obs_intercorrencias", rotulo: "Intercorrências nesta gestação", tipo: "multi", opcoes: ["Diabetes gestacional", "Hipertensão ou pré-eclâmpsia", "Anemia", "Hiperêmese", "Infecção urinária", "Sangramento", "Nenhuma"] },
        { id: "obs_prenatal", rotulo: "Onde faz o pré-natal", tipo: "texto" },
      ],
    },
    {
      id: "clinico", titulo: "Saúde",
      campos: [
        SUPLEMENTOS_MULHER,
        { id: "cli_pa", rotulo: "Pressão arterial (última)", tipo: "texto" },
        { id: "cli_doencas", rotulo: "Doenças prévias", tipo: "textoLongo", largo: true },
        { id: "cli_medicamentos", rotulo: "Medicamentos em uso", tipo: "textoLongo", largo: true },
      ],
    },
    HABITOS,
    ALIMENTACAO_ADULTA(["Náusea", "Vômito", "Azia", "Constipação", "Inchaço", "Muita fome", "Nenhum"]),
    INTESTINO_ADULTO,
  ],
  lactante: [
    {
      id: "parto", titulo: "Parto e pós-parto",
      campos: [
        { id: "par_tipo", rotulo: "Tipo de parto", tipo: "opcao", opcoes: ["Normal", "Cesárea"] },
        { id: "par_intercorrencias", rotulo: "Intercorrências na gestação ou no parto", tipo: "multi", opcoes: ["Diabetes gestacional", "Hipertensão ou pré-eclâmpsia", "Anemia", "Hemorragia", "Nenhuma"] },
        { id: "par_obs", rotulo: "Observações", tipo: "textoLongo", largo: true },
      ],
    },
    {
      id: "amamentacao", titulo: "Amamentação",
      campos: [
        { id: "ama_demanda", rotulo: "Livre demanda?", tipo: "simnao" },
        { id: "ama_mamadas", rotulo: "Mamadas por dia", tipo: "numero" },
        { id: "ama_problemas", rotulo: "Dificuldades", tipo: "multi", opcoes: ["Fissura", "Dor", "Ingurgitamento", "Mastite", "Pouco leite", "Excesso de leite", "Nenhuma"] },
        { id: "ama_bomba", rotulo: "Usa bomba de extração?", tipo: "simnao" },
        { id: "ama_trabalho", rotulo: "Volta ao trabalho", tipo: "opcao", opcoes: ["Já voltou", "Nos próximos 2 meses", "Sem previsão"] },
      ],
    },
    {
      id: "clinico", titulo: "Saúde",
      campos: [
        SUPLEMENTOS_MULHER,
        { id: "cli_doencas", rotulo: "Doenças prévias", tipo: "textoLongo", largo: true },
        { id: "cli_medicamentos", rotulo: "Medicamentos em uso", tipo: "textoLongo", largo: true },
      ],
    },
    HABITOS,
    ALIMENTACAO_ADULTA(["Muita fome", "Pouco apetite", "Cansaço", "Constipação", "Nenhum"]),
    INTESTINO_ADULTO,
  ],
};

export const secoesAnamnese = (t: Tipo) => SECOES[t];

export function anamneseVazia(): Anamnese {
  return { respostas: {}, r24: [], exames: [], atualizadaEm: null, atualizadaPor: null };
}

/** Quantos campos foram respondidos, para mostrar o progresso. */
export function progressoAnamnese(t: Tipo, a: Anamnese) {
  const campos = SECOES[t].flatMap((s) => s.campos);
  const feitos = campos.filter((c) => {
    const v = a.respostas[c.id];
    return v != null && v !== "" && !(Array.isArray(v) && !v.length);
  }).length;
  return { feitos, total: campos.length };
}
