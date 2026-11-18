import React, { useState } from "react";
import { PONTOS, sondasDe, opcoesDa, contextoDe, propostasDe, aplicarTodas, fraseDoAjuste, ATRAPALHOU } from "./ajuste.js";

/* "Vamos ajustar juntos" — o assistente do responsável.
 *
 * Três etapas: onde trava, até três sondas escolhidas pelo perfil, e as
 * propostas. Nada muda até ele ligar, e tudo volta atrás no mesmo lugar.
 *
 * A tela não conclui nada sobre a criança: ela propõe mudanças no app, e diz
 * de onde cada pergunta veio. O selo "pelo perfil" existe para o responsável
 * ver que o app está usando o que ele já informou, em vez de perguntar de
 * novo — foi para isso que ele preencheu a identificação.
 */

export default function Ajuste({ d, apoio, tarefa, nivel, tarefas, inicio = [], aoGravar, voltar }) {
  const [ponto, setPonto] = useState(null);
  const [respostas, setRespostas] = useState([]);
  const [ligadas, setLigadas] = useState([]);
  const [pronto, setPronto] = useState(false);

  const sondas = ponto ? sondasDe(ponto.id, apoio) : [];
  const etapa = respostas.length;
  const naSonda = ponto && etapa < sondas.length;
  const ctx = contextoDe({ tarefa, nivel, apoio, tarefas, respostas });

  /* O que a criança disse entra como ponto de partida, nunca como ajuste
     aplicado: são respostas na lista, e o adulto decide o que fazer com elas. */
  const deLaParaCa = inicio
    .map((id) => ATRAPALHOU.find((o) => o.id === id))
    .filter(Boolean)
    .map((o) => ({ id: "c-" + o.id, rotulo: o.rotulo, propoe: o.propoe, daCrianca: true }));

  const propostas = ponto ? propostasDe([...deLaParaCa, ...respostas], ctx) : [];

  function responder(op) {
    setRespostas((r) => [...r, op]);
  }

  function gravar() {
    const escolhidas = propostas.filter((p) => ligadas.includes(p.id));
    const novo = aplicarTodas(escolhidas, { d, apoio, tarefa });
    aoGravar({
      ...novo,
      nota: {
        tipo: "rotina",
        fonte: "adulto",
        tarefa: tarefa.id,
        etiquetas: [],
        texto:
          fraseDoAjuste(ponto, respostas, tarefa)
          + (escolhidas.length ? " Ajustes: " + escolhidas.map((p) => p.efeito).join("; ") + "." : ""),
      },
    });
    setPronto(true);
  }

  if (pronto) {
    return (
      <div className="aj">
        <h2 className="aj-tit">Pronto.</h2>
        <p className="aj-txt">
          {ligadas.length
            ? "O que você ligou já vale a partir de agora, e ficou registrado no caderno."
            : "Nada foi mudado. A conversa ficou registrada no caderno, e dá para tentar de novo em alguns dias."}
        </p>
        <button className="btn-plano" onClick={voltar}>Voltar</button>
      </div>
    );
  }

  return (
    <div className="aj">
      <div className="aj-topo">
        <b>Vamos ajustar juntos</b>
        <button className="btn-x" onClick={voltar} aria-label="Fechar">✕</button>
      </div>

      {ponto && (
        <div className="aj-passos" aria-hidden="true">
          {Array.from({ length: sondas.length + 1 }, (_, i) => (
            <i key={i} className={i <= etapa ? "on" : ""} />
          ))}
        </div>
      )}

      {!ponto && (
        <>
          <p className="aj-perg">{tarefa.nome}: onde trava?</p>
          {deLaParaCa.length > 0 && (
            <p className="aj-dacrianca">
              Ela já contou: {deLaParaCa.map((r) => r.rotulo.toLowerCase()).join("; ")}.
            </p>
          )}
          <div className="aj-ops">
            {PONTOS.map((p) => (
              <button key={p.id} className="aj-op" onClick={() => setPonto(p)}>
                <b>{p.rotulo}</b>
                <span>{p.sub}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {naSonda && (() => {
        const s = sondas[etapa];
        return (
          <>
            <p className="aj-perg">{s.pergunta}</p>
            {s.peloPerfil && (
              <p className="aj-porque"><em>pelo perfil</em>{s.peloPerfil}</p>
            )}
            {s.dica && <p className="aj-dica">{s.dica}</p>}
            <div className="aj-ops">
              {opcoesDa(s, ctx).map((o) => (
                <button key={o.id} className="aj-op" onClick={() => responder(o)}>
                  <b>{o.rotulo}</b>
                </button>
              ))}
            </div>
          </>
        );
      })()}

      {ponto && !naSonda && (
        <>
          <p className="aj-perg">O que eu proponho mudar</p>
          <p className="aj-porque"><em>importante</em>Nada muda até você ligar. Tudo volta atrás no mesmo lugar.</p>

          {propostas.length ? propostas.map((p) => (
            <div className="aj-prop" key={p.id}>
              <h4>{p.titulo}</h4>
              <p className="aj-pq">{p.porque}</p>
              <div className="aj-ef">{p.efeito}</div>
              <div className="aj-linha">
                <button className="aj-lig" aria-pressed={ligadas.includes(p.id)}
                  onClick={() => setLigadas((l) => (l.includes(p.id) ? l.filter((x) => x !== p.id) : [...l, p.id]))}>
                  {ligadas.includes(p.id) ? "Ligado" : "Ligar"}
                </button>
                <span className="aj-onde">{p.alvo === "tarefa" ? "só nesta tarefa" : "no app todo"}</span>
              </div>
            </div>
          )) : (
            <div className="aj-prop">
              <p className="aj-pq">
                Com estas respostas eu não tenho proposta melhor que o que já está ligado.
                Vale registrar no caderno e tentar de novo em alguns dias.
              </p>
            </div>
          )}

          <button className="btn-plano" onClick={gravar}>
            {ligadas.length ? `Aplicar ${ligadas.length === 1 ? "o ajuste" : "os " + ligadas.length + " ajustes"}` : "Só registrar no caderno"}
          </button>
        </>
      )}
    </div>
  );
}
