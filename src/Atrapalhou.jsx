import React, { useState } from "react";
import { falar } from "./voz.js";
import { atrapalhouDe } from "./ajuste.js";

/* "O que atrapalhou?" — a criança conta o que ficou no caminho.
 *
 * A pergunta é "o que atrapalhou?", nunca "por que você não fez?". A primeira
 * põe o problema fora dela; a segunda é acusação, e para uma criança que
 * falha na mesma tarefa todo dia a diferença não é de estilo.
 *
 * Quatro regras:
 *   - só opção desenhada, nenhum texto livre, nenhum modelo de linguagem;
 *   - é oferecido, nunca cobrado, e "não quero dizer" é resposta inteira;
 *   - nada do que ela escolhe liga ajuste sozinho: chega no assistente do
 *     adulto como ponto de partida. É a invariante do apoio.js — a escolha
 *     manual do adulto é que governa a interface;
 *   - a tela não mostra acerto nem erro, e não aparece de novo no mesmo dia.
 *
 * Os nove desenhos moram aqui, como as pausas moram em pausas.jsx: é um
 * conjunto que só faz sentido junto, e cada um precisa de uma silhueta
 * própria — parte de quem usa esta tela não lê. A primeira versão tinha
 * "preciso me mexer" e "não sei" com o mesmo boneco de braços abertos, e isso
 * só apareceu olhando as nove lado a lado.
 */

const M = "#2F6B62";
const D = "#F2A65A";
const C = "#E8879B";
const L = "#8E82D4";
const T = "#24403C";
const P = "#F6DCC4";

const Cabeca = ({ cx, cy, r, children }) => (
  <>
    <circle cx={cx} cy={cy} r={r} fill={P} />
    <circle cx={cx - r * 0.42} cy={cy + r * 0.26} r={r * 0.17} fill={C} opacity=".55" />
    <circle cx={cx + r * 0.42} cy={cy + r * 0.26} r={r * 0.17} fill={C} opacity=".55" />
    {children}
  </>
);
const Olhos = ({ cx, cy, r }) => (
  <>
    <circle cx={cx - r * 0.34} cy={cy - r * 0.1} r={r * 0.13} fill={T} />
    <circle cx={cx + r * 0.34} cy={cy - r * 0.1} r={r * 0.13} fill={T} />
  </>
);
const risco = (d, cor, w, extra = {}) => (
  <path d={d} stroke={cor} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" {...extra} />
);
const raio = (ang, cx, cy, r1, r2) => {
  const t = (ang * Math.PI) / 180;
  return (
    <line key={ang} x1={cx + r1 * Math.cos(t)} y1={cy + r1 * Math.sin(t)}
      x2={cx + r2 * Math.cos(t)} y2={cy + r2 * Math.sin(t)}
      stroke={D} strokeWidth="6.5" strokeLinecap="round" />
  );
};

export const ARTES_ATRAPALHOU = {
  /* orelha com três ondas crescentes — o sinal é a onda */
  barulho: (
    <g>
      <path d="M44 26c-13 0-21 10-21 22 0 9 4 13 4 22 0 5 4 8 9 8 6 0 9-4 9-9 0-6-3-8-3-13 0-4 3-6 6-6"
        fill={P} stroke={T} strokeWidth="2.6" strokeLinejoin="round" />
      <circle cx="41" cy="44" r="5.5" fill={T} opacity=".3" />
      {risco("M60 36a16 16 0 0 1 0 24", D, 5.5)}
      {risco("M70 28a28 28 0 0 1 0 40", D, 5.5, { opacity: ".72" })}
      {risco("M80 20a40 40 0 0 1 0 56", D, 5.5, { opacity: ".45" })}
    </g>
  ),
  /* raios e um rosto apertando os olhos — sol sorridente lia como "dia bonito" */
  luz: (
    <g>
      {[200, 225, 250, 290, 315, 340].map((a) => raio(a, 50, 34, 30, 46))}
      <path d="M18 34a32 32 0 0 1 64 0z" fill={D} />
      <Cabeca cx={50} cy={66} r={17} />
      {risco("M36 62q7 -7 14 0", T, 3)}
      {risco("M50 62q7 -7 14 0", T, 3)}
      <line x1="42" y1="76" x2="58" y2="76" stroke={T} strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
  /* rosto de "eca": olhos apertados e língua para fora */
  gosto: (
    <g>
      <Cabeca cx={50} cy={46} r={26} />
      {risco("M30 40q8 -8 16 0", T, 3.2)}
      {risco("M54 40q8 -8 16 0", T, 3.2)}
      <path d="M36 60q14 -6 28 0q-3 8 -14 8q-11 0 -14 -8z" fill={T} />
      <path d="M44 66q6 -3 12 0q0 16 -6 16q-6 0 -6 -16z" fill={C} stroke={T} strokeWidth="2.6" strokeLinejoin="round" />
      {risco("M78 22q8 5 3 12", M, 3.6)}
      {risco("M88 14q8 6 3 14", M, 3.2, { opacity: ".55" })}
    </g>
  ),
  /* figura pulando: cabeça pequena, pernas longas — a do app */
  mexer: (
    <g>
      <line x1="30" y1="86" x2="70" y2="86" stroke={M} strokeWidth="3.4" strokeLinecap="round" opacity=".35" />
      <Cabeca cx={50} cy={22} r={11}><Olhos cx={50} cy={22} r={11} /></Cabeca>
      <line x1="50" y1="33" x2="50" y2="56" stroke={M} strokeWidth="8" strokeLinecap="round" />
      {risco("M50 38 36 24", M, 6.5)}
      {risco("M50 38 64 24", M, 6.5)}
      {risco("M50 56 40 76", M, 7)}
      {risco("M50 56 60 76", M, 7)}
      {risco("M22 50q-6 6 0 12", D, 4.4)}
      {risco("M78 50q6 6 0 12", D, 4.4)}
    </g>
  ),
  /* caminho que sobe e some, com a bandeira longe */
  longo: (
    <g>
      {risco("M14 84q20 0 24 -16t24 -16 20 -22", M, 9, { opacity: ".22" })}
      {risco("M14 84q20 0 24 -16t24 -16 20 -22", M, 3.4, { strokeDasharray: "2 8" })}
      <circle cx="14" cy="84" r="8" fill={M} />
      <line x1="82" y1="30" x2="82" y2="12" stroke={T} strokeWidth="3.4" strokeLinecap="round" />
      <path d="M82 13h18l-5 7 5 7H82z" fill={D} stroke={T} strokeWidth="2.4" strokeLinejoin="round" />
    </g>
  ),
  /* balão com interrogação */
  entendi: (
    <g>
      <path d="M18 24h64a8 8 0 0 1 8 8v30a8 8 0 0 1-8 8H46l-14 14V70H18a8 8 0 0 1-8-8V32a8 8 0 0 1 8-8z"
        fill="#FFFFFF" stroke={T} strokeWidth="2.8" strokeLinejoin="round" />
      {risco("M38 38q0-9 12-9t12 9q0 7-8 9-4 1-4 6", L, 6)}
      <circle cx="50" cy="60" r="4.2" fill={L} />
    </g>
  ),
  /* cabeça no travesseiro, olhos fechados */
  cansada: (
    <g>
      <path d="M14 66q10 -14 36 -14t36 14v8q0 6 -6 6H20q-6 0 -6 -6z" fill={L} stroke={T} strokeWidth="2.6" strokeLinejoin="round" />
      <Cabeca cx={50} cy={44} r={15} />
      {risco("M42.5 42.8q2.6 3 5.1 0", T, 2.4)}
      {risco("M52.4 42.8q2.6 3 5.1 0", T, 2.4)}
      {risco("M43 56q7 4 14 0", T, 2.4)}
      {risco("M70 26q8 0 4 7t4 7", M, 3.2, { opacity: ".7" })}
      {risco("M82 14q7 0 3 6t3 6", M, 3, { opacity: ".45" })}
    </g>
  ),
  /* mão levantada */
  ajuda: (
    <g>
      <path d="M30 58V34a7 7 0 0 1 14 0v22" fill={P} stroke={T} strokeWidth="3" strokeLinejoin="round" />
      <path d="M44 56V24a7 7 0 0 1 14 0v32" fill={P} stroke={T} strokeWidth="3" strokeLinejoin="round" />
      <path d="M58 58V30a7 7 0 0 1 14 0v28" fill={P} stroke={T} strokeWidth="3" strokeLinejoin="round" />
      <path d="M30 56h42v12a20 20 0 0 1-20 20h-4a20 20 0 0 1-20-20z" fill={P} stroke={T} strokeWidth="3" strokeLinejoin="round" />
      <path d="M30 62l-9-9a7 7 0 0 1 10-10l7 7" fill={P} stroke={T} strokeWidth="3" strokeLinejoin="round" />
      {risco("M14 26q-6 -7 1 -12", D, 4.2)}
      {risco("M88 26q6 -7 -1 -12", D, 4.2)}
    </g>
  ),
  /* ombros erguidos e palmas para cima, SEM pernas — quem tem pernas é o
     "preciso me mexer", e os dois não podem ter a mesma silhueta */
  naoSei: (
    <g>
      <Cabeca cx={52} cy={32} r={14}><Olhos cx={52} cy={32} r={14} /></Cabeca>
      {risco("M44 42q8 4 16 0", T, 2.6, { opacity: ".55" })}
      <path d="M28 76q4 -24 24 -24t24 24" fill={M} />
      {risco("M28 64 16 56", M, 7.5)}
      {risco("M76 64 88 56", M, 7.5)}
      <path d="M8 60q2 -8 10 -6 6 2 2 8" fill={P} stroke={T} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M96 60q-2 -8 -10 -6 -6 2 -2 8" fill={P} stroke={T} strokeWidth="2.4" strokeLinejoin="round" />
      {risco("M30 48q-4 -6 1 -9", D, 3.4)}
      {risco("M74 48q4 -6 -1 -9", D, 3.4)}
    </g>
  ),
};

export const Arte = ({ id, tam = 62 }) => (
  <svg viewBox="0 0 100 100" width={tam} height={tam} aria-hidden="true">
    {ARTES_ATRAPALHOU[id] || null}
  </svg>
);

export default function Atrapalhou({ apoio, tarefa, voz, aoResponder, aoPular }) {
  const [marcadas, setMarcadas] = useState([]);
  const opcoes = atrapalhouDe(apoio);

  const virar = (o) => {
    setMarcadas((m) => (m.includes(o.id) ? m.filter((x) => x !== o.id) : [...m, o.id]));
    /* A voz lê o que ela tocou. Numa tela de opções desenhadas isso é o que
       substitui a leitura, e vale mesmo com a narração automática desligada:
       aqui não é o app narrando, é ela conferindo a própria escolha. */
    falar(o.rotulo);
  };

  return (
    <div className="atrap">
      <h2 className="atrap-tit">O que atrapalhou?</h2>
      <p className="atrap-sub">
        {tarefa ? tarefa.nome + "." : ""} Pode escolher mais de um.
      </p>

      <div className="atrap-grade" role="group" aria-label="O que atrapalhou">
        {opcoes.map((o) => (
          <button key={o.id} className="atrap-op" aria-pressed={marcadas.includes(o.id)}
            onClick={() => virar(o)}>
            <Arte id={o.id} />
            <span>{o.rotulo}</span>
          </button>
        ))}
      </div>

      {/* Um botão só, que muda de palavra: duas saídas lado a lado fazem a
          criança escolher entre botões antes de escolher o que sentiu. */}
      <button className="atrap-pronto" data-tem={marcadas.length ? 1 : 0}
        onClick={() => (marcadas.length ? aoResponder(marcadas) : aoPular())}>
        {marcadas.length ? "Pronto" : "Não quero dizer"}
      </button>
    </div>
  );
}
