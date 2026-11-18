import React, { useState } from "react";

/* A passagem — o momento em que o app muda de dono.
 *
 * Isto não é uma troca de nível: é uma entrega. Por isso tem duas telas e
 * uma confirmação no meio, em vez de um toque num seletor.
 *
 * O adulto lê o que está abrindo mão ANTES de confirmar, nomeadamente que
 * ele deixa de ver tudo. E o jovem é recebido com a regra na cara, inclusive
 * a parte desconfortável: o app pode ser retomado. Dizer isso na entrada é o
 * que impede a retomada de ser uma traição depois.
 */

export function PassagemAdulto({ nome, aoPassar, aoCancelar }) {
  const [confere, setConfere] = useState(false);
  const quem = nome && nome !== "amigo" ? nome : "ele";

  return (
    <div className="psg">
      <h2 className="psg-tit">Passar o app para {quem}</h2>
      <p className="psg-txt">Isto não é só mais um nível. Muda quem manda no app.</p>

      <div className="psg-aviso">
        <ul>
          <li>O app passa a falar com {quem}, não com você sobre {quem}.</li>
          <li>{quem === "ele" ? "Ele cria" : `${quem} cria`}, muda e apaga as próprias tarefas.</li>
          <li><b>{quem === "ele" ? "Ele decide" : `${quem} decide`} o que você vê.</b> Hoje você vê tudo; a partir da passagem, só o que for partilhado.</li>
          <li>As anotações dele passam a ser só dele. Para sempre, sem interruptor.</li>
          <li>Acabam estrela, confete e personagem.</li>
        </ul>
      </div>

      {/* A retomada é possível e aparece aqui, não escondida nas configurações:
          quem entrega precisa saber que pode voltar, e precisa saber que
          voltar não é silencioso. */}
      <p className="psg-volta">
        Dá para voltar atrás depois — e, se você voltar, o app conta para {quem}.
        Tirar sem avisar seria pior do que nunca ter dado.
      </p>

      <label className="psg-check">
        <input type="checkbox" checked={confere} onChange={(e) => setConfere(e.target.checked)} />
        <span>Eu li e quero passar o app.</span>
      </label>

      {/* Botão que nunca fica mudo, como na tela de código: ele responde e
          diz o que falta, em vez de parecer quebrado. */}
      <button className="btn-plano" onClick={() => (confere ? aoPassar() : setConfere(false))}
        aria-describedby="psg-falta">
        Passar o app
      </button>
      <p id="psg-falta" className="psg-falta" role="status">
        {confere ? "" : "Marque a caixa acima para confirmar."}
      </p>
      <button className="btn-plano neutro" onClick={aoCancelar}>Agora não</button>
    </div>
  );
}

export function PassagemJovem({ nome, deQuem, aoComecar }) {
  const quem = nome && nome !== "amigo" ? nome : "";
  return (
    <div className="psg">
      <h2 className="psg-tit">{quem ? `${quem}, a` : "A"} partir de hoje este app é seu.</h2>
      <p className="psg-txt">
        {deQuem ? `${deQuem} passou ele para você.` : "Passaram ele para você."} Na prática:
      </p>
      <ul className="psg-lista">
        <li>As tarefas são suas. Monte, mude e apague.</li>
        <li>Você escolhe o que {deQuem || "quem cuida de você"} vê. Agora, nada — até você ligar.</li>
        <li>Suas anotações são só suas, sempre.</li>
      </ul>
      <p className="psg-txt mudo">
        {deQuem || "Quem passou"} pode pegar o app de volta. Se fizer isso, aparece aqui.
      </p>
      <button className="btn-plano" onClick={aoComecar}>Começar</button>
    </div>
  );
}

/* O aviso da retomada. Invariante 1 do nivel4.js: o jovem não descobre
 * sozinho que perdeu o controle — o app conta, na primeira abertura. */
export function AvisoRetomada({ em, aoEntender }) {
  return (
    <div className="psg">
      <h2 className="psg-tit">O app voltou para quem cuida de você.</h2>
      <p className="psg-txt">
        Isso aconteceu em {em}. Suas tarefas e suas anotações continuam aqui, do
        jeito que estavam.
      </p>
      <p className="psg-txt mudo">
        Se você não concorda, vale conversar. Este aviso existe justamente para
        você não descobrir sozinho.
      </p>
      <button className="btn-plano" onClick={aoEntender}>Entendi</button>
    </div>
  );
}
