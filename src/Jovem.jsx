import React, { useState } from "react";
import { dataPorExtenso, tx } from "./idioma.js";
import {
  CANAIS, partilhaDe, fitaDe, marcadoQuandoTravou,
  podeOferecerMenos, OPCOES_MENOS, DIAS_FITA,
} from "./nivel4.js";

/* A casa do nível 4. O jovem é o dono.
 *
 * O trabalho aqui foi mais tirar que pôr: saem o personagem, os pontos, o
 * confete e o cadeado da área dos adultos. O que entra é o controle — criar
 * a própria tarefa, ver o próprio padrão e decidir o que o adulto enxerga.
 *
 * A linguagem é segunda pessoa, sempre. Nos níveis 1 a 3 o app fala com o
 * adulto sobre a criança ("ela travou no passo 2"); aqui ele fala com quem
 * está segurando o aparelho.
 */



/* ------------------------------------------------------------------ hoje */

function Hoje({ tarefas, feitas, hoje, aoAbrir, aoNova }) {
  return (
    <>
      <p className="jv-data">{dataPorExtenso(hoje)}</p>
      {tarefas.length === 0 && (
        <p className="jv-vazio">{tx("jovem.vazio")}</p>
      )}
      <div className="jv-lista">
        {tarefas.map((t) => {
          const ok = feitas.includes(t.id);
          return (
            <button key={t.id} className="jv-item" data-ok={ok ? 1 : 0} onClick={() => aoAbrir(t.id)}>
              <span className="jv-cx">{ok ? "✓" : ""}</span>
              <span className="jv-txt">
                <b>{t.nome}</b>
                <span>
                  {t.horario || tx("jovem.semHorario")}
                  {t.semLembrete ? tx("jovem.semLembrete") : ""}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <button className="jv-nova" onClick={aoNova}>{tx("jovem.nova")}</button>
    </>
  );
}

/* ------------------------------------------------------- o que segurou */

function Segurou({ tarefas, historico, feitasHoje, notas, hoje, aoMenos }) {
  const [escolhida, setEscolhida] = useState(tarefas[0] ? tarefas[0].id : "");
  const tarefa = tarefas.find((t) => t.id === escolhida) || tarefas[0];
  if (!tarefa) return <p className="jv-vazio">{tx("jovem.semTarefa")}</p>;

  const fita = fitaDe({ tarefa, historico, hojeFeitas: feitasHoje, hoje, dias: DIAS_FITA });
  const marcado = marcadoQuandoTravou({ tarefa, notas, hoje });
  const oferecer = podeOferecerMenos({ tarefa, historico, hojeFeitas: feitasHoje, hoje });

  return (
    <>
      <div className="jv-escolhe">
        {tarefas.map((t) => (
          <button key={t.id} className="jv-chip" data-on={t.id === tarefa.id ? 1 : 0}
            onClick={() => setEscolhida(t.id)}>{t.nome}</button>
        ))}
      </div>

      <div className="jv-fita" aria-label={`Últimos ${DIAS_FITA} dias`}>
        {fita.map((f) => (
          <span key={f.dia} className={`jv-mc jv-${f.estado}`} title={f.dia}>
            {f.estado === "feito" ? "●" : f.estado === "nao" ? "○" : "·"}
          </span>
        ))}
      </div>
      <p className="jv-legenda">{tx("jovem.legenda")}</p>

      {marcado.length > 0 && (
        <div className="jv-achado">
          <b>{tx("jovem.marcou")}</b>
          <div>
            {marcado.map((m) => (
              <span className="jv-tag" key={m.rotulo}>“{m.rotulo}” — {m.vezes}</span>
            ))}
          </div>
          {/* Invariante 2: o número é sobre o ambiente, não sobre ele. */}
          <p className="jv-mudo">{tx("jovem.ambiente")}</p>
        </div>
      )}

      {oferecer && (
        <div className="jv-menos">
          <b>{tx("jovem.menos.titulo")}</b>
          <p>{tx("jovem.menos.texto")}</p>
          <div className="jv-ops">
            {OPCOES_MENOS.map((o) => (
              <button key={o.id} className="jv-op" onClick={() => aoMenos(tarefa, o.id)}>
                {o.rotulo}
              </button>
            ))}
          </div>
          <p className="jv-mudo">{tx("jovem.menos.volta")}</p>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------- ajustes */

function Ajustes({ d, deQuem, aoVirar, aoNotas, aoDevolver }) {
  const p = partilhaDe(d);
  return (
    <>
      <h3 className="jv-sub">{tx("jovem.partilha.titulo", { quem: deQuem || tx("jovem.quemCuida") })}</h3>
      <p className="jv-mudo">{tx("jovem.partilha.texto", { quem: deQuem || tx("jovem.essaPessoa") })}</p>
      {CANAIS.map((c) => {
        const on = Boolean(p[c.id]);
        return (
          <div key={c.id} className="jv-sw" data-on={on ? 1 : 0} data-travado={c.travado ? 1 : 0}>
            <div>
              <b>{c.nome}</b>
              <span>{c.travado ? c.desligado : on ? c.ligado : c.desligado}</span>
            </div>
            {c.travado ? (
              <span className="jv-cadeado" aria-label={tx("jovem.semLigar")}>🔒</span>
            ) : (
              <button className="jv-toggle" role="switch" aria-checked={on}
                aria-label={c.nome} onClick={() => aoVirar(c.id)}>
                <i />
              </button>
            )}
          </div>
        );
      })}

      <h3 className="jv-sub">{tx("jovem.notas.titulo")}</h3>
      <button className="btn-plano neutro" onClick={aoNotas}>{tx("jovem.notas.botao")}</button>

      <h3 className="jv-sub">{tx("jovem.devolver.titulo")}</h3>
      <p className="jv-mudo">{tx("jovem.devolver.texto")}</p>
      <button className="btn-plano fantasma" onClick={aoDevolver}>{tx("jovem.devolver.botao")}</button>
    </>
  );
}

/* ------------------------------------------------------------------ casa */

export default function Jovem({
  d, tarefas, hoje, notas, deQuem,
  aoAbrir, aoNova, aoVirarPartilha, aoNotas, aoMenos, aoDevolver,
}) {
  const [aba, setAba] = useState("hoje");
  const feitas = d.hoje || [];

  return (
    <div className="jv">
      <div className="jv-topo">
        <b>{tx("jovem.aba." + aba)}</b>
      </div>

      <div className="jv-corpo">
        {aba === "hoje" && (
          <Hoje tarefas={tarefas} feitas={feitas} hoje={hoje} aoAbrir={aoAbrir} aoNova={aoNova} />
        )}
        {aba === "segurou" && (
          <Segurou tarefas={tarefas} historico={d.historico || []} feitasHoje={feitas}
            notas={notas} hoje={hoje} aoMenos={aoMenos} />
        )}
        {aba === "ajustes" && (
          <Ajustes d={d} deQuem={deQuem} aoVirar={aoVirarPartilha} aoNotas={aoNotas}
            aoDevolver={aoDevolver} />
        )}
      </div>

      <div className="jv-barra" role="tablist">
        {["hoje", "segurou", "ajustes"].map((id) => (
          <button key={id} className="jv-b" role="tab" aria-selected={aba === id}
            onClick={() => setAba(id)}>{tx("jovem.aba." + id)}</button>
        ))}
      </div>
    </div>
  );
}
