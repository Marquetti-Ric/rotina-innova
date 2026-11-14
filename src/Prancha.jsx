import React, { useState } from "react";
import { falar } from "./voz.js";

/* A prancha de comunicação alternativa.
 *
 * O vocabulário-núcleo: as dezesseis palavras que resolvem a maior parte do
 * que uma criança precisa dizer num dia. Não é lista de substantivos — é
 * pedido, recusa, ajuda e estado.
 *
 * Duas regras diferentes do resto do app:
 *
 * 1. Aqui a voz fala SEMPRE, mesmo com a narração automática desligada no
 *    perfil sensorial. Nos outros lugares a voz é o app lendo para a criança;
 *    aqui a voz é a dela. Desligar seria tirar a fala de quem não tem outra.
 * 2. Os símbolos são desenhados no mesmo traço das ilustrações da rotina, e
 *    não emoji: o rosto de um emoji muda de aparelho para aparelho, e uma
 *    criança que aprendeu um símbolo não deve reencontrá-lo diferente.
 */

const P = {
  pele: "#F0C39B", agua: "#8FCBE8", folha: "#78BE9B", coral: "#E8879B",
  damasco: "#F2A65A", lilas: "#8E82D4", cinza: "#6E8A85", branco: "#FFFFFF",
};

function cara(fundo, boca) {
  return (
    <>
      <circle cx="24" cy="24" r="16" fill={fundo} />
      <circle cx="18.5" cy="21" r="2.2" fill={P.branco} />
      <circle cx="29.5" cy="21" r="2.2" fill={P.branco} />
      <path d={boca} stroke={P.branco} strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  );
}

/* `fala` guarda o que a voz diz, quando difere da legenda — "não gostei"
   escrito curto, falado inteiro. */
export const NUCLEO = [
  {
    p: "eu", arte: (
      <g>
        <circle cx="24" cy="16" r="8" fill={P.pele} />
        <path d="M11 41c0-8 6-13 13-13s13 5 13 13z" fill={P.agua} />
      </g>
    ),
  },
  {
    p: "quero", arte: (
      <g>
        <path d="M14 19c0-4 7-4 7 0" fill={P.pele} />
        <rect x="9" y="19" width="20" height="15" rx="7.5" fill={P.pele} />
        <rect x="26" y="23" width="14" height="7" rx="3.5" fill={P.pele} />
      </g>
    ),
  },
  {
    p: "mais", arte: (
      <g>
        <circle cx="24" cy="24" r="16" fill={P.folha} />
        <path d="M24 15v18M15 24h18" stroke={P.branco} strokeWidth="5" strokeLinecap="round" />
      </g>
    ),
  },
  {
    p: "parar", arte: (
      <g>
        <path d="M17 8h14l9 9v14l-9 9H17l-9-9V17z" fill={P.coral} />
        <rect x="14" y="21" width="20" height="6" rx="3" fill={P.branco} />
      </g>
    ),
  },
  {
    p: "sim", arte: (
      <g>
        <circle cx="24" cy="24" r="16" fill={P.folha} />
        <path d="M16 25l6 6 12-13" stroke={P.branco} strokeWidth="5" fill="none"
          strokeLinecap="round" strokeLinejoin="round" />
      </g>
    ),
  },
  {
    p: "não", arte: (
      <g>
        <circle cx="24" cy="24" r="16" fill={P.coral} />
        <path d="M18 18l12 12M30 18L18 30" stroke={P.branco} strokeWidth="5" strokeLinecap="round" />
      </g>
    ),
  },
  {
    p: "ajuda", arte: (
      <g>
        <circle cx="24" cy="24" r="16" fill={P.damasco} />
        <path d="M17 33v-11c0-2 2.5-2 2.5 0v2.5V15c0-2 2.5-2 2.5 0v8.5V13.5c0-2 2.5-2 2.5 0v10V17c0-2 2.5-2 2.5 0v9c0 5.5-3 8.5-6.5 8.5-3.5 0-5.5-.5-5.5-1.5z"
          fill={P.branco} />
      </g>
    ),
  },
  {
    p: "banheiro", arte: (
      <g>
        <ellipse cx="24" cy="19" rx="13" ry="9" fill={P.branco} stroke={P.agua} strokeWidth="3" />
        <path d="M19 27l-2 13h14l-2-13z" fill={P.agua} />
      </g>
    ),
  },
  {
    p: "comer", arte: (
      <g>
        <rect x="7" y="13" width="3.4" height="22" rx="1.7" fill={P.cinza} />
        <rect x="37.6" y="13" width="3.4" height="22" rx="1.7" fill={P.cinza} />
        <circle cx="24" cy="24" r="13" fill={P.branco} stroke="#D8E4E1" strokeWidth="2" />
        <circle cx="24" cy="24" r="7" fill={P.damasco} />
      </g>
    ),
  },
  {
    p: "beber", arte: (
      <g>
        <path d="M14 15h20l-2.4 21c-.3 2.6-2.1 4-4.6 4h-6c-2.5 0-4.3-1.4-4.6-4z" fill={P.agua} />
        <rect x="25" y="5" width="4" height="13" rx="2" fill={P.coral} transform="rotate(14 27 11)" />
        <path d="M15.6 22h16.8" stroke={P.branco} strokeWidth="3" />
      </g>
    ),
  },
  {
    p: "brincar", arte: (
      <g>
        <circle cx="24" cy="24" r="15" fill={P.damasco} />
        <path d="M11.5 17c7.5 3.2 17.5 3.2 25 0" stroke={P.branco} strokeWidth="3" fill="none" />
        <path d="M11.5 31c7.5-3.2 17.5-3.2 25 0" stroke={P.branco} strokeWidth="3" fill="none" />
      </g>
    ),
  },
  { p: "gostei", arte: <g>{cara(P.damasco, "M18 28c3.4 3.4 8.6 3.4 12 0")}</g> },
  { p: "não gostei", arte: <g>{cara(P.lilas, "M18 30c3.4-3.4 8.6-3.4 12 0")}</g> },
  {
    p: "dói", arte: (
      <g transform="rotate(-40 24 24)">
        <rect x="7" y="18" width="34" height="12" rx="6" fill={P.coral} />
        <rect x="18" y="18" width="12" height="12" fill="#D4687E" />
        <g fill={P.branco} opacity=".85">
          <circle cx="21.5" cy="21.5" r="1.3" /><circle cx="26.5" cy="21.5" r="1.3" />
          <circle cx="21.5" cy="26.5" r="1.3" /><circle cx="26.5" cy="26.5" r="1.3" />
        </g>
      </g>
    ),
  },
  {
    p: "acabou", arte: (
      <g>
        <rect x="11" y="8" width="3.6" height="32" rx="1.8" fill={P.cinza} />
        <path d="M14.6 10h23l-5.2 7.5 5.2 7.5h-23z" fill={P.folha} />
      </g>
    ),
  },
  {
    p: "meu adulto", chamar: true, arte: (
      <g>
        <circle cx="17" cy="14" r="7" fill={P.pele} />
        <path d="M6 40c0-7 5-11 11-11s11 4 11 11z" fill={P.lilas} />
        <circle cx="34" cy="21" r="5.2" fill={P.pele} />
        <path d="M26 40c0-5 3.6-8 8-8s8 3 8 8z" fill={P.damasco} />
      </g>
    ),
  },
];

function Alto({ tam = 20 }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9.5h3.5L13 5v14l-5.5-4.5H4z" fill="#FFFFFF" />
      <path d="M16.5 9a4.5 4.5 0 0 1 0 6" stroke="#FFFFFF" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M19.5 6a8.5 8.5 0 0 1 0 12" stroke="#FFFFFF" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export default function Prancha({ voltar, aoChamar, temAdultos, alto }) {
  const [frase, setFrase] = useState([]);
  const texto = frase.map((s) => s.p).join(" ");

  return (
    <div className="tela">
      <div className="barra">
        <button className="btn-x" onClick={voltar} aria-label="Voltar">←</button>
        <span className="barra-titulo">Minha prancha</span>
        <span className="contador" />
      </div>

      <div className="tira" aria-live="polite" aria-label="Frase montada">
        {frase.length === 0 ? (
          <span className="tira-vazia">Toque nos símbolos para montar a frase.</span>
        ) : (
          frase.map((s, i) => <span className="ficha" key={i}>{s.p}</span>)
        )}
      </div>

      <div className="pr-acoes">
        <button className="btn-falar" disabled={frase.length === 0}
          onClick={() => falar(texto)}>
          <Alto /><span>Falar a frase</span>
        </button>
        <button className="btn-mini-pr" aria-label="Apagar a última palavra"
          disabled={frase.length === 0} onClick={() => setFrase(frase.slice(0, -1))}>←</button>
        <button className="btn-mini-pr" aria-label="Limpar a frase"
          disabled={frase.length === 0} onClick={() => setFrase([])}>✕</button>
      </div>

      {/* Com uma frase montada, levar o que ela disse para o adulto é o passo
          natural: a mensagem do WhatsApp sai com as palavras dela. */}
      {temAdultos && frase.length > 0 && (
        <button className="btn-levar" onClick={() => aoChamar(texto)}>
          Mostrar isso para um adulto
        </button>
      )}

      <div className="prancha" role="group" aria-label="Vocabulário">
        {NUCLEO.map((s) => (
          <button className="cel" key={s.p}
            onClick={() => {
              /* A voz da criança fala sempre, mesmo com a narração desligada. */
              falar(s.p);
              if (s.chamar && temAdultos) { aoChamar(texto); return; }
              setFrase((f) => [...f, s]);
            }}>
            <span className="cel-arte">
              <svg viewBox="0 0 48 48" aria-hidden="true">{s.arte}</svg>
            </span>
            <span className="cel-nome">{s.p}</span>
          </button>
        ))}
      </div>

      <p className="pr-pe">
        {alto
          ? "A prancha fala sempre, mesmo com a narração automática desligada."
          : "Aqui a voz é da criança: a prancha fala mesmo com a narração automática desligada."}
      </p>
    </div>
  );
}
