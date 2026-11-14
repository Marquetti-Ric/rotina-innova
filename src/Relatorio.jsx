import React, { useState } from "react";
import { PERIODOS, montarRelatorio, comoTexto, copiar, diaBR } from "./notas.js";
import { EMOCOES } from "./Sentimentos.jsx";

/* O resumo que a família leva na consulta.
 *
 * O que ele mostra é o que foi registrado. O que ele NÃO faz, de propósito:
 * nenhum total geral, nenhuma média, nenhuma seta de tendência, nenhuma
 * comparação com outra criança. Um número que sobe sugere uma conclusão, e
 * quem conclui é o profissional, com o exame dele.
 *
 * O cabeçalho e o rodapé dizem isso dentro do próprio texto copiado: se o
 * resumo viajar sozinho para o WhatsApp de alguém, precisa se explicar sem a
 * tela em volta.
 */

export default function Relatorio({ estado, notas, tarefas, voltar }) {
  const [dias, setDias] = useState(30);
  const [copiado, setCopiado] = useState(null);

  const rel = montarRelatorio({ estado, notas, emocoes: EMOCOES, tarefas, dias });
  const vazio = !rel.rotinas.length && !rel.contagem.length && !rel.porTipo.length;

  return (
    <div className="tela">
      <div className="barra">
        <button className="btn-x" onClick={voltar} aria-label="Voltar">←</button>
        <span className="barra-titulo">Para levar na consulta</span>
        <span className="contador" />
      </div>

      <div className="periodos">
        {PERIODOS.map((p) => (
          <button key={p.dias} className="seg" data-on={dias === p.dias ? 1 : 0}
            aria-pressed={dias === p.dias} onClick={() => setDias(p.dias)}>
            {p.nome}
          </button>
        ))}
      </div>

      <div className="aviso">
        Isto reúne o que você observou e o que o app registrou, de {diaBR(rel.de)} a{" "}
        {diaBR(rel.ate)}. Não é avaliação, não é triagem e não conclui nada —
        quem interpreta é o profissional que acompanha {rel.nome}.
      </div>

      {vazio ? (
        <p className="linha-desc">
          Nada registrado neste período. Experimente um período maior, ou comece
          anotando em "O que eu noto".
        </p>
      ) : (
        <>
          {rel.rotinas.length > 0 && (
            <div>
              <div className="campo-rot" style={{ marginTop: 0 }}>
                Rotinas concluídas <small>· desde o início do uso</small>
              </div>
              {rel.rotinas.map((r) => (
                <div className="linha" key={r.nome} style={{ display: "block" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <div className="linha-nome" style={{ flex: 1 }}>{r.nome}</div>
                    <div className="linha-desc">{r.vezes}×</div>
                  </div>
                  {r.semAjuda !== null && (
                    <>
                      <div className="barra-prog"><i style={{ width: `${r.semAjuda}%` }} /></div>
                      <div className="linha-desc" style={{ marginTop: 5 }}>
                        {r.semAjuda}% das vezes sem ajuda
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {rel.contagem.length > 0 && (
            <div>
              <div className="campo-rot">
                Como {rel.nome} disse que estava <small>· {rel.dias} dias</small>
              </div>
              <div className="contagem">
                {rel.contagem.map((c) => (
                  <span className="conta-emo" key={c.nome}>{c.nome}: <b>{c.n}</b></span>
                ))}
              </div>
            </div>
          )}

          {rel.porTipo.map((t) => (
            <div key={t.id}>
              <div className="campo-rot">{t.nome}</div>
              <div className="notas">
                {t.notas.map((n) => (
                  <div className="nota" key={n.id} style={{ cursor: "default" }}>
                    <div className="nota-topo">
                      <span className="nota-tipo" data-cor={t.cor}>{diaBR(n.dia)}</span>
                    </div>
                    {n.etiquetas.length > 0 && (
                      <div className="nota-etiquetas">
                        {n.etiquetas.map((e) => <span className="nota-et" key={e}>{e}</span>)}
                      </div>
                    )}
                    {n.texto && <div className="nota-texto">{n.texto}</div>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      <button className="btn-plano"
        onClick={async () => {
          const ok = await copiar(comoTexto(rel));
          setCopiado(ok);
          setTimeout(() => setCopiado(null), 2600);
        }}>
        {copiado === true ? "Copiado" : copiado === false ? "Não consegui copiar" : "Copiar o resumo"}
      </button>
      <p className="linha-desc" style={{ textAlign: "center" }}>
        {copiado === false
          ? "Seu aparelho não deixou copiar. Dá para mostrar esta tela na consulta."
          : "Cola numa mensagem, num e-mail, ou mostra esta tela mesmo."}
      </p>
    </div>
  );
}
