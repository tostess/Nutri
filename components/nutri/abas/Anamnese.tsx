"use client";

import type { Paciente } from "@/lib/types";
import { FormAnamnese } from "../../FormAnamnese";

export function AbaAnamnese({ p }: { p: Paciente }) {
  return (
    <>
      <p className="sample">A paciente também pode preencher esta ficha pelo app, antes da consulta. As respostas aparecem aqui para você revisar.</p>
      <FormAnamnese p={p} autor="nutri" />
    </>
  );
}
