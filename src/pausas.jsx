import React from "react";
import { AVATARES } from "./avatar.jsx";

/* As pausas do corpo, desenhadas.
 *
 * Quem precisa mexer o corpo não deveria ter que ler para saber o que fazer:
 * é muitas vezes uma criança no limite, às vezes uma que ainda não lê. A
 * figura mostra o movimento; o texto fica como apoio, não como instrução
 * única.
 *
 * Duas decisões de movimento, e as duas são deliberadas:
 *
 * 1. A animação NÃO congela no modo calmo. Em todo o resto do app o modo
 *    calmo zera `--t` e o movimento para, porque lá o movimento é enfeite.
 *    Aqui ele é a instrução — congelar tiraria o conteúdo de quem mais
 *    precisa dele. Em vez de parar, ela fica mais lenta: de 2,8s para 4,6s.
 * 2. Com `prefers-reduced-motion` ela para de verdade, porque aí é o sistema
 *    operacional falando pelo usuário. Por isso toda cena carrega marcas de
 *    movimento estáticas — setas, convenção de quadrinhos — que continuam
 *    dizendo para onde o corpo vai quando nada se mexe. A pose de repouso
 *    (0% do ciclo) é sempre a legível.
 *
 * Nada pisca, nada muda de cor, nada é súbito.
 *
 * Sobre as proporções: cabeça pequena e pernas longas, de propósito. A
 * primeira versão tinha cabeça grande e corpo curto e saía um bebê — e o
 * nível 3 é criança de 9 anos para cima, que percebe quando está sendo
 * tratada como menor do que é.
 *
 * E sobre as poses: aperto e abraço têm de ser distinguíveis de relance. No
 * aperto as mãos se encontram no centro, na altura da barriga; no abraço elas
 * sobem para os ombros opostos e os braços se cruzam. Desenhados parecidos,
 * viram a mesma figura e a criança não sabe qual é qual.
 */

const C = {
  agua: "#8FCBE8", verde: "#78BE9B", coral: "#E8879B", damasco: "#F2A65A",
  lilas: "#A99BE0", madeira: "#D8A97A", madeira2: "#B98857", linha: "#2F6B62",
  tinta: "#2B3A38", sombra: "rgba(36,64,60,.15)", rubor: "#F0A0A8",
};

const BRACO = 9;
const PERNA = 10;

const corpo = (id) => AVATARES.find((a) => a.id === id) || AVATARES[0];

/* Marca de movimento: é o que diz para onde o corpo vai quando a animação
   está parada por prefers-reduced-motion. */
const Seta = ({ d }) => (
  <path d={d} fill="none" stroke={C.linha} strokeWidth="3.6" strokeLinecap="round"
    strokeLinejoin="round" opacity=".5" />
);

const Chao = ({ classe, cx = 110 }) => (
  <ellipse className={classe} cx={cx} cy="147" rx="34" ry="6" fill={C.sombra} />
);

const Tronco = ({ cor }) => <rect x="93" y="52" width="34" height="54" rx="14" fill={cor} />;

const Pernas = ({ pele }) => (
  <g stroke={pele} strokeWidth={PERNA} strokeLinecap="round">
    <path d="M103 102v40" />
    <path d="M117 102v40" />
  </g>
);

function Cabeca({ pele, cabelo, tipo, cx = 110, cy = 36, r = 15, olhosFechados = false }) {
  return (
    <g>
      {tipo === "longo" && (
        <path d={`M${cx - r - 3} ${cy + 4}c0-15 6-22 ${r + 3}-22s${r + 3} 7 ${r + 3} 22v12h-${(r + 3) * 2}z`} fill={cabelo} />
      )}
      <circle cx={cx} cy={cy} r={r} fill={pele} />
      <path d={`M${cx - r} ${cy - 1}a${r} ${r} 0 0 1 ${r * 2} 0c0-4-5-6-${r} -6s-${r} 2-${r} 6z`} fill={cabelo} />
      {olhosFechados ? (
        <g stroke={C.tinta} strokeWidth="2.2" strokeLinecap="round" fill="none">
          <path d={`M${cx - 8} ${cy + 2}c1.6 2 4.8 2 6.4 0`} />
          <path d={`M${cx + 1.6} ${cy + 2}c1.6 2 4.8 2 6.4 0`} />
        </g>
      ) : (
        <g fill={C.tinta}>
          <circle cx={cx - 5.5} cy={cy + 2} r="2.1" />
          <circle cx={cx + 5.5} cy={cy + 2} r="2.1" />
        </g>
      )}
      <path d={`M${cx - 4.5} ${cy + 8}c2 2 7 2 9 0`} stroke={C.tinta} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <circle cx={cx - 10.5} cy={cy + 6} r="2.2" fill={C.rubor} opacity=".4" />
      <circle cx={cx + 10.5} cy={cy + 6} r="2.2" fill={C.rubor} opacity=".4" />
    </g>
  );
}

/* De perfil, para a cena da parede: um olho, e a boca na borda do rosto. */
function CabecaPerfil({ pele, cabelo, cx = 92, cy = 40, r = 15 }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={pele} />
      <path d={`M${cx - r} ${cy - 1}a${r} ${r} 0 0 1 ${r * 2} 0c0-4-5-6-${r} -6s-${r} 2-${r} 6z`} fill={cabelo} />
      <path d={`M${cx - r + 1} ${cy - 4}c-4 2-4 8 0 10`} fill={pele} />
      <circle cx={cx + 6} cy={cy + 2} r="2.1" fill={C.tinta} />
      <path d={`M${cx + r - 1} ${cy + 3}c1 2 1 4 0 5`} stroke={pele} strokeWidth="3.4" strokeLinecap="round" fill="none" />
      <path d={`M${cx + 5} ${cy + 9}c2 1.6 5 1.6 7 0`} stroke={C.tinta} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <circle cx={cx - 3} cy={cy + 6} r="2.2" fill={C.rubor} opacity=".4" />
    </g>
  );
}

/* ---------------- 1. aperto forte ----------------
   As mãos se encontram no centro, na altura da barriga, e apertam. */
function ApertoForte({ pele, cabelo, tipo }) {
  return (
    <svg viewBox="0 0 220 160" aria-hidden="true">
      <Chao />
      <Pernas pele={pele} />
      <Tronco cor={C.agua} />
      <Cabeca pele={pele} cabelo={cabelo} tipo={tipo} />
      <g className="mx-aperta">
        <g stroke={pele} strokeWidth={BRACO} strokeLinecap="round" fill="none">
          <path d="M95 62Q80 74 101 79" />
          <path d="M125 62Q140 74 119 79" />
        </g>
        <ellipse cx="104" cy="79" rx="10" ry="8.5" fill={pele} />
        <ellipse cx="116" cy="79" rx="10" ry="8.5" fill={pele} />
        <path d="M110 72v14" stroke="#D9A77D" strokeWidth="2.2" strokeLinecap="round" />
      </g>
      {/* setas para DENTRO: é aperto, não abertura */}
      <Seta d="M56 79h16M66 73l6 6-6 6" />
      <Seta d="M164 79h-16M154 73l-6 6 6 6" />
    </svg>
  );
}

/* ---------------- 2. cinco pulos ---------------- */
function CincoPulos({ pele, cabelo, tipo }) {
  return (
    <svg viewBox="0 0 220 160" aria-hidden="true">
      <Chao classe="mx-sombra" />
      <g className="mx-pula">
        <g stroke={pele} strokeWidth={PERNA} strokeLinecap="round" fill="none">
          {/* joelhos dobrados: parada, a figura lê como "prestes a pular" */}
          <path d="M103 102q-10 14-4 26" />
          <path d="M117 102q10 14 4 26" />
        </g>
        <Tronco cor={C.coral} />
        <g stroke={pele} strokeWidth={BRACO} strokeLinecap="round" fill="none">
          <path d="M94 64L78 38" />
          <path d="M126 64l16-26" />
        </g>
        <circle cx="77" cy="36" r="6.5" fill={pele} />
        <circle cx="143" cy="36" r="6.5" fill={pele} />
        <Cabeca pele={pele} cabelo={cabelo} tipo={tipo} />
      </g>
      <Seta d="M58 130c2-14 8-24 16-30M68 96l6-4 1 7" />
      <Seta d="M162 130c-2-14-8-24-16-30M152 96l-6-4-1 7" />
    </svg>
  );
}

/* ---------------- 3. abraço apertado ----------------
   Os braços se cruzam e as mãos sobem para os ombros opostos. É o que
   distingue esta cena do aperto, onde elas ficam no centro. */
function AbracoApertado({ pele, cabelo, tipo }) {
  return (
    <svg viewBox="0 0 220 160" aria-hidden="true">
      <Chao />
      <Pernas pele={pele} />
      <Tronco cor={C.lilas} />
      {/* olhos fechados: um abraço de autorregulação tem isso, um aperto de
          mãos não. É o que separa as duas cenas de relance. */}
      <Cabeca pele={pele} cabelo={cabelo} tipo={tipo} olhosFechados />
      <g className="mx-abraca">
        <g strokeLinecap="round" fill="none">
          <path d="M125 63Q114 90 96 70" stroke={pele} strokeWidth={BRACO} />
          {/* o contorno na cor da roupa abre o braço da frente do de trás,
              senão os dois viram uma massa só */}
          <path d="M95 63Q106 90 124 70" stroke={C.lilas} strokeWidth={BRACO + 6} />
          <path d="M95 63Q106 90 124 70" stroke={pele} strokeWidth={BRACO} />
        </g>
        <ellipse cx="93" cy="67" rx="9.5" ry="8" fill={pele} />
        <ellipse cx="127" cy="67" rx="9.5" ry="8" fill={pele} />
      </g>
      <Seta d="M50 67h16M60 61l6 6-6 6" />
      <Seta d="M170 67h-16M160 61l-6 6 6 6" />
    </svg>
  );
}

/* ---------------- 4. empurrar a parede ----------------
   As mãos encostam na parede: é dela que vem a resistência. */
function EmpurrarParede({ pele, cabelo }) {
  return (
    <svg viewBox="0 0 220 160" aria-hidden="true">
      <Chao cx="96" />
      <rect x="182" y="10" width="24" height="140" rx="5" fill={C.madeira} />
      <path d="M182 50h24M182 92h24M182 128h24" stroke={C.madeira2} strokeWidth="3" />
      <g className="mx-empurra">
        <g stroke={pele} strokeWidth={PERNA} strokeLinecap="round">
          <path d="M92 104l-18 38" />
          <path d="M104 104l6 38" />
        </g>
        {/* o braço de trás sai antes do tronco, e mais escuro: de perfil,
            um braço fica atrás do corpo */}
        <path d="M104 84l66 8" stroke="#D9A77D" strokeWidth={BRACO} strokeLinecap="round" fill="none" />
        <rect x="166" y="85" width="15" height="14" rx="6" fill="#D9A77D" />
        <rect x="80" y="54" width="32" height="52" rx="14" fill={C.verde}
          transform="rotate(11 96 80)" />
        <CabecaPerfil pele={pele} cabelo={cabelo} />
        <path d="M110 64l62 4" stroke={pele} strokeWidth={BRACO} strokeLinecap="round" fill="none" />
        <rect x="168" y="61" width="15" height="14" rx="6" fill={pele} />
      </g>
      <Seta d="M118 130h26M136 124l8 6-8 6" />
    </svg>
  );
}

export const PAUSAS_CORPO = [
  { id: "aperto", nome: "Aperto forte", dica: "Junte as mãos e aperte enquanto conta até dez.", Arte: ApertoForte },
  { id: "pulos", nome: "Cinco pulos", dica: "Pule cinco vezes, contando alto.", Arte: CincoPulos },
  { id: "abraco", nome: "Abraço apertado", dica: "Abrace o seu corpo e aperte um pouquinho.", Arte: AbracoApertado },
  { id: "parede", nome: "Empurrar a parede", dica: "Empurre a parede com as duas mãos, bem forte.", Arte: EmpurrarParede },
];

export default function Pausa({ indice = 0, avatarId = "a" }) {
  const p = PAUSAS_CORPO[indice % PAUSAS_CORPO.length];
  const a = corpo(avatarId);
  return (
    <div className="mexer">
      <p.Arte pele={a.pele} cabelo={a.cabelo} tipo={a.tipo} />
    </div>
  );
}
