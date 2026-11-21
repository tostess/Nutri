"use client";

import Link from "next/link";

export function Logo() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
      <circle cx="15" cy="15" r="14" fill="#fde3d6" />
      <path d="M8 17c2 5 12 5 14 0" stroke="#7d2a52" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <circle cx="15" cy="10" r="4" fill="#7d2a52" />
    </svg>
  );
}

export function Topo({ papel }: { papel: "nutri" | "paciente" }) {
  return (
    <header className="top">
      <Link href="/" className="logo">
        <Logo />
        <b>Colo</b>
        <span>Nutrição materno-infantil</span>
      </Link>
      <nav className="roles" aria-label="Área">
        <Link href="/nutri" aria-current={papel === "nutri"}>Nutricionista</Link>
        <Link href="/paciente" aria-current={papel === "paciente"}>Paciente</Link>
      </nav>
    </header>
  );
}
