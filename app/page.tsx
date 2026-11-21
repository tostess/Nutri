import Link from "next/link";
import { Topo } from "@/components/Topo";

export default function Entrada() {
  return (
    <>
      <Topo papel="nutri" />
      <main className="entrada">
        <h1>Acompanhamento nutricional de gestantes, lactantes e crianças</h1>
        <p style={{ fontSize: 18, maxWidth: 640 }}>
          A nutricionista registra consultas, calcula necessidades e prescreve. A paciente acompanha o plano,
          registra o dia a dia e conversa pelo WhatsApp.
        </p>
        <div className="escolhas">
          <Link className="escolha" href="/nutri">
            <b>Sou a nutricionista</b>
            Pacientes, consultas, cálculos, anamnese, avaliação intestinal e mensagens.
          </Link>
          <Link className="escolha" href="/paciente">
            <b>Sou paciente</b>
            Plano de mamadas e alimentar, diário, registro de evacuações e ficha antes da consulta.
          </Link>
        </div>
        <p className="note">Versão de demonstração: os dados ficam salvos neste navegador até a integração com o banco.</p>
      </main>
    </>
  );
}
