import React from "react";

/* Os personagens que a criança escolhe para si, e as carinhas dos adultos na
   lista de contatos. Saiu do App.jsx para a tela "Meus adultos" poder usar o
   mesmo desenho sem duplicar o traço. */

export const AVATARES = [
  { id: "a", pele: "#F0C39B", cabelo: "#4A3324", tipo: "curto" },
  { id: "b", pele: "#8C5A3E", cabelo: "#241A14", tipo: "cacho" },
  { id: "c", pele: "#F6D8BE", cabelo: "#D6A044", tipo: "longo" },
  { id: "d", pele: "#C4855E", cabelo: "#2C2856", tipo: "coque" },
];

/* A clínica não é uma pessoa: entra como prédio, para a criança não confundir
   a recepção com um adulto da casa dela. */
function Predio({ tam }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="24" fill="#FFFFFF" />
      <circle cx="24" cy="24" r="21" fill="#F0F7F5" />
      <rect x="13" y="14" width="22" height="24" rx="4" fill="#2F6B62" />
      <g fill="#FFFFFF">
        <rect x="17" y="19" width="5" height="5" rx="1.4" />
        <rect x="26" y="19" width="5" height="5" rx="1.4" />
        <rect x="21" y="29" width="6" height="9" rx="1.4" />
      </g>
      <path d="M20 11h8" stroke="#ECB70D" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Avatar({ id = "a", tam = 46 }) {
  if (id === "predio") return <Predio tam={tam} />;
  const a = AVATARES.find((x) => x.id === id) || AVATARES[0];
  return (
    <svg width={tam} height={tam} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="24" fill="#FFFFFF" />
      <circle cx="24" cy="24" r="21" fill="#F0F7F5" />
      {a.tipo === "longo" && <path d="M8 27c0-12 6-17 16-17s16 5 16 17v12H8z" fill={a.cabelo} />}
      {a.tipo === "coque" && <circle cx="24" cy="7" r="6" fill={a.cabelo} />}
      <circle cx="24" cy="25" r="13" fill={a.pele} />
      {a.tipo === "curto" && <path d="M11 24a13 13 0 0 1 26 0c0-3-4-4-13-4s-13 1-13 4z" fill={a.cabelo} />}
      {a.tipo === "cacho" && (
        <g fill={a.cabelo}><circle cx="14" cy="20" r="6" /><circle cx="24" cy="16" r="7" /><circle cx="34" cy="20" r="6" /></g>
      )}
      {a.tipo === "longo" && <path d="M11 24a13 13 0 0 1 26 0c0-4-5-6-13-6s-13 2-13 6z" fill={a.cabelo} />}
      {a.tipo === "coque" && <path d="M11 24a13 13 0 0 1 26 0c0-3-4-5-13-5s-13 2-13 5z" fill={a.cabelo} />}
      <circle cx="19.5" cy="26" r="1.9" fill="#2B3A38" />
      <circle cx="28.5" cy="26" r="1.9" fill="#2B3A38" />
      <path d="M21 31c1.7 1.6 4.3 1.6 6 0" stroke="#2B3A38" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <circle cx="15.5" cy="29.5" r="2.2" fill="#F0A0A8" opacity=".5" />
      <circle cx="32.5" cy="29.5" r="2.2" fill="#F0A0A8" opacity=".5" />
    </svg>
  );
}
