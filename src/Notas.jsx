import React, { useState } from "react";
import {
  TIPOS, ETIQUETAS, novaNota, limparNota, temConteudo, diaBR,
} from "./notas.js";

/* "O que eu noto" — o caderno do responsável.
 *
 * O desenho tem um inimigo só: o esforço. Caderno que pede redação fica vazio
 * na segunda semana, e um caderno vazio não serve a ninguém na consulta. Por
 * isso tudo é de um toque: quatro tipos, etiquetas prontas, e o texto livre
 * como extra, nunca como obrigação.
 *
 * O vocabulário é de comportamento observável. "Som alto incomodou" é o que o
 * responsável viu. "Hipersensibilidade auditiva" seria conclusão, e conclusão
 * aqui não é trabalho do app.
 */

function Ficha({ nota, aoMudar, aoSalvar, aoApagar, aoFechar }) {
  const tipo = TIPOS.find((t) => t.id === nota.tipo) || TIPOS[0];
  const marcadas = nota.etiquetas || [];
  const ontem = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const hoje = new Date().toISOString().slice(0, 10);

  const alterna = (e) => aoMudar({
    ...nota,
    etiquetas: marcadas.includes(e) ? marcadas.filter((x) => x !== e) : [...marcadas, e],
  });

  return (
    <>
      <div className="scrim" onClick={aoFechar} />
      <div className="folha" style={{ textAlign: "left", alignItems: "stretch", maxHeight: "88vh", overflowY: "auto" }}>
        <div className="campo-rot" style={{ marginTop: 0 }}>Sobre o quê</div>
        <div className="tipos">
          {TIPOS.map((t) => (
            <button key={t.id} className="tipo" data-on={nota.tipo === t.id ? 1 : 0}
              aria-pressed={nota.tipo === t.id}
              onClick={() => aoMudar({ ...nota, tipo: t.id, etiquetas: [] })}>
              {t.nome}
            </button>
          ))}
        </div>

        <div className="campo-rot">Quando</div>
        <div className="tipos">
          {[[hoje, "Hoje"], [ontem, "Ontem"]].map(([dia, rot]) => (
            <button key={dia} className="tipo" data-on={nota.dia === dia ? 1 : 0}
              aria-pressed={nota.dia === dia}
              onClick={() => aoMudar({ ...nota, dia })}>
              {rot}
            </button>
          ))}
        </div>

        <div className="campo-rot">{tipo.pergunta}</div>
        <div className="etiquetas">
          {(ETIQUETAS[nota.tipo] || []).map((e) => (
            <button key={e} className="etiqueta" data-on={marcadas.includes(e) ? 1 : 0}
              aria-pressed={marcadas.includes(e)} onClick={() => alterna(e)}>
              {e}
            </button>
          ))}
        </div>

        <div className="campo-rot">Quer escrever alguma coisa? (opcional)</div>
        <textarea className="campo area" value={nota.texto} maxLength={400} rows={3}
          placeholder="Do jeito que você viu acontecer."
          onChange={(ev) => aoMudar({ ...nota, texto: ev.target.value })} />

        <div className="folha-btns" style={{ marginTop: 2 }}>
          <button className="btn-plano" disabled={!temConteudo(nota)}
            onClick={() => aoSalvar(limparNota(nota))}>
            Salvar
          </button>
          {aoApagar && (
            <button className="btn-plano fantasma" onClick={aoApagar}>Apagar esta anotação</button>
          )}
          <button className="btn-nao" onClick={aoFechar}>Cancelar</button>
        </div>
      </div>
    </>
  );
}

export default function Notas({ notas, aoSalvar, voltar, verRelatorio }) {
  const [ficha, setFicha] = useState(null);

  const lista = [...(notas.lista || [])].sort((a, b) => (a.dia < b.dia ? 1 : a.dia > b.dia ? -1 : 0));

  const gravar = (n) => {
    const existe = (notas.lista || []).some((x) => x.id === n.id);
    aoSalvar({
      ...notas,
      lista: existe
        ? notas.lista.map((x) => (x.id === n.id ? n : x))
        : [...(notas.lista || []), n],
    });
    setFicha(null);
  };

  return (
    <div className="tela">
      <div className="barra">
        <button className="btn-x" onClick={voltar} aria-label="Voltar">←</button>
        <span className="barra-titulo">O que eu noto</span>
        <span className="contador" />
      </div>

      <div className="aviso">
        Um caderno, não um teste. Anote o que você viu acontecer — o app junta
        isso com o que ele já registra e monta um resumo para você levar na
        consulta. Nada aqui é avaliado, pontuado ou comparado com nada.
      </div>

      <button className="btn-plano" onClick={() => setFicha(novaNota())}>
        Anotar uma coisa
      </button>

      {lista.length > 0 && (
        <button className="btn-plano fantasma" onClick={verRelatorio}>
          Ver o resumo para a consulta
        </button>
      )}

      {lista.length === 0 ? (
        <p className="linha-desc">
          Ainda sem anotações. Uma por semana já muda a conversa na consulta:
          o profissional passa a ter o que a família viu, em vez de só o que ela
          lembra na hora.
        </p>
      ) : (
        <div className="notas">
          {lista.map((n) => {
            const t = TIPOS.find((x) => x.id === n.tipo) || TIPOS[0];
            return (
              <button className="nota" key={n.id} onClick={() => setFicha({ ...n })}>
                <div className="nota-topo">
                  <span className="nota-tipo" data-cor={t.cor}>{t.nome}</span>
                  <span className="nota-dia">{diaBR(n.dia)}</span>
                </div>
                {n.etiquetas.length > 0 && (
                  <div className="nota-etiquetas">
                    {n.etiquetas.map((e) => <span className="nota-et" key={e}>{e}</span>)}
                  </div>
                )}
                {n.texto && <div className="nota-texto">{n.texto}</div>}
              </button>
            );
          })}
        </div>
      )}

      {ficha && (
        <Ficha
          nota={ficha}
          aoMudar={setFicha}
          aoSalvar={gravar}
          aoFechar={() => setFicha(null)}
          aoApagar={(notas.lista || []).some((x) => x.id === ficha.id)
            ? () => {
              aoSalvar({ ...notas, lista: notas.lista.filter((x) => x.id !== ficha.id) });
              setFicha(null);
            }
            : null}
        />
      )}
    </div>
  );
}
