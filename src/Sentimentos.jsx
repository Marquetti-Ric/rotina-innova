import React, { useState, useEffect, useRef } from "react";
import { falar } from "./voz.js";

/* "Como eu estou" — nomear o que se sente, e ter o que fazer em seguida.
 *
 * O que este módulo NÃO é: avaliação. Ele não mede humor, não traça curva, não
 * conclui nada. Guarda uma contagem simples para o responsável notar padrão
 * ("três dias seguidos com medo") e levar isso a quem acompanha a criança.
 *
 * Emoção pesada não termina em elogio. Termina em duas saídas concretas:
 * respirar, e contar para um adulto.
 */

const B = (cor) => <circle cx="32" cy="32" r="26" fill={cor} />;
const OLHOS = (
  <>
    <circle cx="24" cy="28" r="3.4" fill="#FFFFFF" />
    <circle cx="40" cy="28" r="3.4" fill="#FFFFFF" />
  </>
);
const traco = (d, w = 3.6) => (
  <path d={d} stroke="#FFFFFF" strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />
);

export const EMOCOES = [
  {
    id: "feliz", nome: "feliz", pesada: false,
    arte: <g>{B("#F2A65A")}{OLHOS}{traco("M23 38c4.5 5 13.5 5 18 0")}</g>,
  },
  {
    id: "calmo", nome: "calmo", pesada: false,
    arte: (
      <g>{B("#78BE9B")}
        {traco("M20 28c2.4-2.6 5.6-2.6 8 0", 3)}
        {traco("M36 28c2.4-2.6 5.6-2.6 8 0", 3)}
        {traco("M25 38c4 3.4 10 3.4 14 0")}
      </g>
    ),
  },
  {
    id: "triste", nome: "triste", pesada: true,
    arte: (
      <g>{B("#8FCBE8")}{OLHOS}{traco("M23 41c4.5-5 13.5-5 18 0")}
        <path d="M24 33c2.6 2.6 2.6 5.4 0 5.4s-2.6-2.8 0-5.4z" fill="#FFFFFF" opacity=".9" />
      </g>
    ),
  },
  {
    id: "bravo", nome: "bravo", pesada: true,
    arte: (
      <g>{B("#E8879B")}
        {traco("M19 21l8 3.6", 3)}{traco("M45 21l-8 3.6", 3)}
        {OLHOS}{traco("M24 40h16")}
      </g>
    ),
  },
  {
    id: "medo", nome: "com medo", pesada: true,
    arte: (
      <g>{B("#8E82D4")}
        <circle cx="24" cy="27" r="4.6" fill="#FFFFFF" />
        <circle cx="40" cy="27" r="4.6" fill="#FFFFFF" />
        <ellipse cx="32" cy="40" rx="5" ry="6" fill="#FFFFFF" />
      </g>
    ),
  },
  {
    id: "agitado", nome: "agitado", pesada: false,
    arte: <g>{B("#94ACE4")}{OLHOS}{traco("M22 38l5-3 5 3 5-3 5 3", 3.2)}</g>,
  },
];

/* A respiração. Nos níveis pequenos vira "cheire a flor, sopre a vela": a
   instrução precisa de um gesto, não de um comando abstrato. */
function Respiracao({ nivel, voz, aoCompletar }) {
  const fases = nivel <= 2
    ? [{ t: "Cheire a flor", s: 4 }, { t: "Sopre a vela", s: 4 }]
    : [{ t: "Puxe o ar", s: 4 }, { t: "Segure", s: 4 }, { t: "Solte devagar", s: 4 }, { t: "Espere", s: 4 }];

  const [fase, setFase] = useState(0);
  const [seg, setSeg] = useState(fases[0].s);
  const rodadas = useRef(0);
  const atual = fases[fase % fases.length];

  useEffect(() => {
    if (voz) falar(atual.t);
    setSeg(atual.s);
    const id = setInterval(() => {
      setSeg((s) => {
        if (s > 1) return s - 1;
        setFase((f) => {
          const prox = f + 1;
          if (prox % fases.length === 0) {
            rodadas.current += 1;
            if (rodadas.current === 3) aoCompletar();
          }
          return prox;
        });
        return atual.s;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [fase]);

  const enchendo = atual.t.startsWith("Cheire") || atual.t.startsWith("Puxe");

  return (
    <div className="palco" style={{ padding: "22px 18px 24px", textAlign: "center" }}>
      <div className="bola-ar" data-cheia={enchendo ? 1 : 0} />
      <div className="ar-titulo">{atual.t}</div>
      <div className="ar-conta">{seg}</div>
      <p className="passo-dica" style={{ paddingTop: 2 }}>
        Rodada {Math.min(rodadas.current + 1, 3)} de 3
      </p>
    </div>
  );
}

export default function Sentimentos({ nivel, voz, voltar, aoRegistrar, temAdultos, aoChamar }) {
  const [aba, setAba] = useState("escolher");
  const [escolhida, setEscolhida] = useState(null);
  const [pronto, setPronto] = useState(false);

  if (aba === "respirar") {
    return (
      <div className="tela">
        <div className="barra">
          <button className="btn-x" onClick={() => setAba("escolher")} aria-label="Voltar">←</button>
          <span className="barra-titulo">Respirar</span>
          <span className="contador" />
        </div>
        <Respiracao nivel={nivel} voz={voz} aoCompletar={() => setPronto(true)} />
        {pronto && (
          <div className="deriv">
            <div className="deriv-tit">Três rodadas feitas.</div>
            <p className="opc-desc" style={{ margin: 0 }}>
              Se ainda estiver difícil, chamar um adulto é uma boa ideia.
            </p>
          </div>
        )}
        <button className="btn-plano" onClick={() => { setPronto(false); setAba("escolher"); }}>
          Terminei
        </button>
      </div>
    );
  }

  return (
    <div className="tela">
      <div className="barra">
        <button className="btn-x" onClick={voltar} aria-label="Voltar">←</button>
        <span className="barra-titulo">Como eu estou</span>
        <span className="contador" />
      </div>

      <h1 className="nome" style={{ fontSize: 22, padding: "0 2px" }}>
        {nivel === 1 ? "Toque na carinha igual a você." : "Como você está agora?"}
      </h1>

      <div className="emocoes">
        {EMOCOES.map((e) => (
          <button className="emo" key={e.id} data-on={escolhida?.id === e.id ? 1 : 0}
            aria-pressed={escolhida?.id === e.id}
            onClick={() => {
              setEscolhida(e);
              aoRegistrar(e.id);
              if (voz) falar(`Você está ${e.nome}.`);
            }}>
            <span className="emo-arte">
              <svg viewBox="0 0 64 64" aria-hidden="true">{e.arte}</svg>
            </span>
            <span className="emo-nome">{e.nome}</span>
          </button>
        ))}
      </div>

      {escolhida && (
        <div className="resposta">
          <p>
            {escolhida.pesada
              ? (nivel === 1
                ? "Pode sentir isso. Vamos respirar junto?"
                : nivel === 2
                  ? "Sentir isso é normal. Quer respirar comigo?"
                  : "Essa emoção é válida. Costuma diminuir quando o corpo desacelera.")
              : "Bom. Quer respirar para guardar essa calma?"}
          </p>
          <button className="btn-sim" onClick={() => { setPronto(false); setAba("respirar"); }}>
            Respirar agora
          </button>
          {escolhida.pesada && temAdultos && (
            <button className="btn-nao" style={{ minHeight: 54, fontSize: 16 }}
              onClick={() => aoChamar(`estou ${escolhida.nome}`)}>
              Contar para um adulto
            </button>
          )}
        </div>
      )}

      <p className="pr-pe">
        O que você marcar fica neste aparelho, para o seu adulto acompanhar.
      </p>
    </div>
  );
}
