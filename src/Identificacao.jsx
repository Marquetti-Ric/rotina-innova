import React, { useState } from "react";
import {
  CONDICOES, NIVEIS_TEA, SENSORIAL, COMUNICACAO, VISAO, INTERESSES,
  APOIO_PADRAO, derivarAjustes, explicarAjustes,
} from "./apoio.js";

/* A identificação da atipicidade, em três passos.
 *
 * O consentimento vem ANTES da lista, em destaque, porque é o que a LGPD pede
 * para dado de saúde de criança: autorização específica e destacada de um dos
 * pais ou responsável legal. Sem o aceite, a lista não abre.
 *
 * A criança nunca vê nenhuma destas telas, nem o nome de nenhuma condição.
 */

function Caixa({ marcada }) {
  return marcada ? (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="6" fill="var(--musgo)" />
      <path d="M7 12.4l3.4 3.4L17.2 9" stroke="#FFFFFF" strokeWidth="2.8" fill="none"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" fill="none"
        stroke="#C4D4D1" strokeWidth="2.4" />
    </svg>
  );
}

function Item({ nome, desc, marcada, aoTocar }) {
  return (
    <button className="opc" data-on={marcada ? 1 : 0} aria-pressed={marcada} onClick={aoTocar}>
      <Caixa marcada={marcada} />
      <span className="opc-txt">
        <span className="opc-nome">{nome}</span>
        {desc ? <span className="opc-desc">{desc}</span> : null}
      </span>
    </button>
  );
}

function Grupo({ titulo, ajuda, children }) {
  return (
    <div>
      <div className="campo-rot" style={{ marginTop: 0 }}>{titulo}</div>
      {ajuda ? <p className="opc-desc" style={{ margin: "0 0 10px" }}>{ajuda}</p> : null}
      <div className="itens">{children}</div>
    </div>
  );
}

/* Ícones dos interesses. Mesmo traço das ilustrações da rotina. */
const ARTE_INTERESSE = {
  bichos: (
    <g>
      <ellipse cx="24" cy="30" rx="10" ry="8.5" fill="#F2A65A" />
      <circle cx="12" cy="17" r="4.6" fill="#F2A65A" /><circle cx="22" cy="13" r="4.6" fill="#F2A65A" />
      <circle cx="32" cy="15" r="4.6" fill="#F2A65A" /><circle cx="39" cy="23" r="4.2" fill="#F2A65A" />
    </g>
  ),
  dinos: (
    <g>
      <path d="M8 36c0-9 6-16 15-16 3 0 5 .5 7 1.5 2-5 7-8 12-7-3 2-4 5-3.5 8 3 2 4.5 5 4.5 8.5 0 1.8-.4 3.5-1 5z" fill="#78BE9B" />
      <circle cx="35" cy="24" r="1.8" fill="#1F4A43" />
      <path d="M12 36l-4 6M22 36l-3 6M31 36l-2.5 6" stroke="#78BE9B" strokeWidth="4" strokeLinecap="round" />
    </g>
  ),
  espaco: (
    <g>
      <path d="M24 7c6 5 9 12 9 19l-4 7h-10l-4-7c0-7 3-14 9-19z" fill="#E8879B" />
      <circle cx="24" cy="20" r="4" fill="#FFFFFF" />
      <path d="M15 29l-5 7 7-2zM33 29l5 7-7-2z" fill="#F2A65A" />
    </g>
  ),
  carros: (
    <g>
      <path d="M8 32c0-3 2-5 4-6l3-6c1-2 3-3 5-3h12c2 0 4 1 5 3l3 6c2 1 4 3 4 6v3H8z" fill="#8FCBE8" />
      <circle cx="16" cy="37" r="4.5" fill="#3B4A57" /><circle cx="32" cy="37" r="4.5" fill="#3B4A57" />
      <path d="M17 20h14l2 5H15z" fill="#FFFFFF" opacity=".85" />
    </g>
  ),
  mar: (
    <g>
      <path d="M10 24c7-9 20-9 25 0-5 9-18 9-25 0z" fill="#8FCBE8" />
      <path d="M35 24l7-6v12z" fill="#8FCBE8" />
      <circle cx="19" cy="22" r="2" fill="#1F4A43" />
    </g>
  ),
  musica: (
    <g fill="#8E82D4">
      <circle cx="17" cy="33" r="7" /><circle cx="35" cy="29" r="7" />
      <rect x="22" y="10" width="3.5" height="24" /><rect x="40" y="6" width="3.5" height="24" />
      <path d="M22 13l21-5v5l-21 5z" />
    </g>
  ),
};

export default function Identificacao({ apoio, aoSalvar, aoApagar, aoSair }) {
  const [p, setP] = useState({ ...APOIO_PADRAO, ...apoio });
  const [etapa, setEtapa] = useState(1);
  const [confirmaApagar, setConfirmaApagar] = useState(false);

  const alterna = (id) => setP({
    ...p,
    condicoes: p.condicoes.includes(id)
      ? p.condicoes.filter((x) => x !== id)
      : [...p.condicoes, id],
  });

  const aj = derivarAjustes(p);
  const linhas = explicarAjustes(p);

  const barra = (
    <div className="barra">
      <button className="btn-x" aria-label="Voltar"
        onClick={() => (etapa === 1 ? aoSair() : setEtapa(etapa - 1))}>←</button>
      <span className="barra-titulo">
        {etapa === 3 ? "O que muda no app" : "Identificação"}
      </span>
      <span className="contador">{etapa} de 3</span>
    </div>
  );

  /* ---------- 1. consentimento e atipicidade ---------- */
  if (etapa === 1) {
    return (
      <div className="tela">
        {barra}

        <div className="destaque">
          <h2 className="destaque-tit">O que vem a seguir é informação de saúde da criança</h2>
          <p>
            Serve para o app ajustar a linguagem, o estímulo e o ritmo da rotina. Fica guardado
            só neste aparelho: não sobe para o servidor de licenças, não aparece no painel da
            clínica e não vai para ninguém.
          </p>
          <button className="aceite" aria-pressed={p.consentiu}
            onClick={() => setP({ ...p, consentiu: !p.consentiu })}>
            <Caixa marcada={p.consentiu} />
            <span className="aceite-txt">
              Sou o responsável legal pela criança e autorizo este uso.
            </span>
          </button>
          <p>Dá para apagar tudo a qualquer momento, no fim desta mesma sequência.</p>
        </div>

        {p.consentiu && (
          <Grupo titulo="Atipicidade"
            ajuda="Marque o que já foi fechado por um profissional. O app não avalia, não mede evolução e não sugere diagnóstico — ele só usa o que você informar aqui.">
            {CONDICOES.map((c) => (
              <React.Fragment key={c.id}>
                <Item nome={c.nome} marcada={p.condicoes.includes(c.id)} aoTocar={() => alterna(c.id)} />
                {c.temNivel && p.condicoes.includes(c.id) && (
                  <div className="niveis-tea">
                    {NIVEIS_TEA.map((n) => (
                      <button key={n.n} className="nv-tea" data-on={p.nivelTEA === n.n ? 1 : 0}
                        aria-pressed={p.nivelTEA === n.n}
                        onClick={() => setP({ ...p, nivelTEA: n.n })}>
                        {n.nome}<small>{n.sub}</small>
                      </button>
                    ))}
                  </div>
                )}
              </React.Fragment>
            ))}
          </Grupo>
        )}

        <p className="opc-desc">
          A criança nunca vê esta lista, nem o nome de nenhuma condição. Para ela, o app só fica
          do jeito que funciona melhor.
        </p>

        <button className="btn-plano" disabled={!p.consentiu} onClick={() => setEtapa(2)}>
          Continuar
        </button>
      </div>
    );
  }

  /* ---------- 2. sensorial, fala, visão, interesse ---------- */
  if (etapa === 2) {
    return (
      <div className="tela">
        {barra}

        <Grupo titulo="Perfil sensorial" ajuda="Decide a paleta, a animação e o som.">
          {SENSORIAL.map((s) => (
            <Item key={s.id} nome={s.nome} desc={s.desc} marcada={p.sensorial === s.id}
              aoTocar={() => setP({ ...p, sensorial: s.id })} />
          ))}
        </Grupo>

        <Grupo titulo="Como a criança se comunica"
          ajuda="Com a prancha ativa, nenhuma atividade cobra fala oral.">
          {COMUNICACAO.map((c) => (
            <Item key={c.id} nome={c.nome} desc={c.desc} marcada={p.comunicacao === c.id}
              aoTocar={() => setP({ ...p, comunicacao: c.id })} />
          ))}
        </Grupo>

        <Grupo titulo="Visão">
          {VISAO.map((v) => (
            <Item key={v.id} nome={v.nome} desc={v.desc} marcada={p.visao === v.id}
              aoTocar={() => setP({ ...p, visao: v.id })} />
          ))}
        </Grupo>

        <Grupo titulo="Interesse preferido"
          ajuda="Aparece nas ilustrações extras e nas palavras das atividades.">
          <div className="interesses">
            {INTERESSES.map((t) => (
              <button key={t.id} className="interesse" data-on={p.interesse === t.id ? 1 : 0}
                aria-pressed={p.interesse === t.id}
                onClick={() => setP({ ...p, interesse: p.interesse === t.id ? "" : t.id })}>
                <span className="interesse-arte">
                  <svg viewBox="0 0 48 48" aria-hidden="true">{ARTE_INTERESSE[t.id]}</svg>
                </span>
                <span className="interesse-nome">{t.nome}</span>
              </button>
            ))}
          </div>
        </Grupo>

        <button className="btn-plano" onClick={() => setEtapa(3)}>Continuar</button>
      </div>
    );
  }

  /* ---------- 3. o que muda, e como apagar ---------- */
  return (
    <div className="tela">
      {barra}

      <div className="deriv">
        <div className="deriv-tit">
          {linhas.length ? "Vindo do que você informou" : "Nada muda, por enquanto"}
        </div>
        {linhas.length === 0 ? (
          <p className="opc-desc" style={{ margin: 0 }}>
            Com o que foi marcado, o app segue no modo padrão para a idade escolhida.
          </p>
        ) : (
          <ul className="deriv-lista">
            {linhas.map((l, i) => (
              <li key={i}>
                <span className="d-txt">{l.texto}</span>
                <span className="d-tag" data-manual={l.manual ? 1 : 0}>{l.origem}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="opc-desc">
        Cada criança é única e nenhuma tabela acerta sempre. Se um ajuste não servir, desligue
        na área dos responsáveis — a sua escolha passa a vencer esta lista.
      </p>

      <button className="btn-plano" onClick={() => aoSalvar(p)}>Salvar e voltar</button>

      <div className="apagar">
        <button className="btn-apagar"
          onClick={() => (confirmaApagar ? aoApagar(p) : setConfirmaApagar(true))}>
          {confirmaApagar ? "Toque de novo para apagar" : "Apagar a identificação"}
        </button>
        <p>
          Sai do aparelho a lista de condições, o perfil sensorial e o de comunicação. Os
          {" "}{linhas.length === 1 ? "ajuste" : "ajustes"} acima {linhas.length === 1 ? "continua" : "continuam"}
          {" "}como {linhas.length === 1 ? "está" : "estão"}: a criança não perde o app do jeito
          que ela já usa.
        </p>
      </div>

      <div className="aviso">
        O app é material de apoio e brincadeira. Não avalia, não mede evolução clínica, não
        diagnostica e não substitui fonoaudiologia, terapia ocupacional, psicologia ou pediatria.
      </div>

      {/* Mantém o objeto derivado visível ao desenvolvedor sem custo de render. */}
      <span hidden data-ajustes={JSON.stringify(aj)} />
    </div>
  );
}
