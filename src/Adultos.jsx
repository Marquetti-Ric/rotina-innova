import React, { useState, useEffect } from "react";
import { Avatar } from "./avatar.jsx";
import { ligar, conversar, temWhatsapp, visiveisParaCrianca, comClinica } from "./contatos.js";
import { marca } from "./marca";

/* "Meus adultos" — a tela que a criança abre quando precisa de alguém.
 *
 * Duas decisões que valem explicação:
 *
 * 1. Confirmação antes de sair do app. Uma criança que arrasta o dedo na tela
 *    não deve ligar para a terapeuta por acidente. A folha mostra a carinha e
 *    o nome, grandes, e só então sai.
 * 2. Ligar vem primeiro. O link do WhatsApp deixa a mensagem digitada, mas
 *    quem aperta enviar é a pessoa — um passo a mais dentro de um app
 *    estranho, justamente quando ela já está em dificuldade.
 */

function Fone({ tam = 22, cor = "#15403A" }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6.5 3.5h3l1.6 4-2.2 1.6a11 11 0 0 0 5.9 5.9l1.6-2.2 4 1.6v3c0 1.1-.9 2-2 2A15.5 15.5 0 0 1 3 5.5c0-1.1.9-2 2-2z"
        fill={cor}
      />
    </svg>
  );
}

function Bolha({ tam = 22, cor = "#15403A" }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3.5 11.2c0-4.1 3.8-7.4 8.5-7.4s8.5 3.3 8.5 7.4-3.8 7.4-8.5 7.4c-1.2 0-2.4-.2-3.4-.6L4 20l1-3.6a7 7 0 0 1-1.5-5.2z"
        fill={cor}
      />
    </svg>
  );
}

export default function Adultos({ contatos, voltar, nivel, frase }) {
  const [confirmar, setConfirmar] = useState(null);
  const [zap, setZap] = useState(true);

  useEffect(() => {
    let vivo = true;
    temWhatsapp().then((v) => { if (vivo) setZap(v); });
    return () => { vivo = false; };
  }, []);

  const lista = visiveisParaCrianca(comClinica(contatos, marca()));
  /* Quando a criança monta uma frase na prancha e pede ajuda, é essa frase que
     vai pronta — ela disse o que queria dizer. Sem frase, a mensagem padrão. */
  const mensagem = (frase && frase.trim()) || contatos.mensagem;

  const fechar = () => setConfirmar(null);

  return (
    <div className="tela">
      <div className="barra">
        <button className="btn-x" onClick={voltar} aria-label="Voltar">
          ←
        </button>
        <span className="barra-titulo">Meus adultos</span>
        <span className="contador" />
      </div>

      {lista.length === 0 ? (
        <div className="vazio-adultos">
          <Avatar id="a" tam={74} />
          <p className="linha-nome" style={{ fontSize: 19 }}>
            Ainda não tem ninguém aqui.
          </p>
          <p className="linha-desc">
            Um adulto pode cadastrar quem você chama, na área dos responsáveis.
          </p>
        </div>
      ) : (
        <div className="adultos">
          {lista.map((c) => (
            <div className="pessoa" key={c.id}>
              <div className="pessoa-topo">
                <Avatar id={c.avatar} tam={nivel === 1 ? 66 : 58} />
                <div className="pessoa-txt">
                  <div className="pessoa-nome">{c.nome}</div>
                  {c.relacao && <div className="pessoa-rel">{c.relacao}</div>}
                </div>
              </div>
              <div className="pessoa-acoes">
                {c.ligar && (
                  <button
                    className="ac ac-ligar"
                    onClick={() => setConfirmar({ ...c, como: "ligar" })}
                  >
                    <Fone />
                    <span>Ligar</span>
                  </button>
                )}
                {c.whatsapp && zap && (
                  <button
                    className="ac ac-zap"
                    onClick={() => setConfirmar({ ...c, como: "zap" })}
                  >
                    <Bolha />
                    <span>WhatsApp</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmar && (
        <>
          <div className="scrim" onClick={fechar} />
          <div className="folha" role="group" aria-label="Confirmar">
            <Avatar id={confirmar.avatar} tam={72} />
            <h2 className="folha-titulo">
              {confirmar.como === "ligar" ? "Ligar" : "Mandar mensagem"} para {confirmar.nome}?
            </h2>
            <p className="folha-sub">
              {confirmar.como === "ligar"
                ? "O telefone vai abrir com o número pronto."
                : "O WhatsApp vai abrir com a mensagem escrita. Depois é só apertar enviar."}
            </p>
            <div className="folha-btns">
              <button
                className="btn-sim"
                onClick={async () => {
                  const c = confirmar;
                  fechar();
                  if (c.como === "ligar") await ligar(c.fone);
                  else await conversar(c.fone, mensagem);
                }}
              >
                {confirmar.como === "ligar" ? <Fone /> : <Bolha />}
                <span>Sim, {confirmar.como === "ligar" ? "ligar" : "mandar"}</span>
              </button>
              <button className="btn-nao" onClick={fechar}>
                Não agora
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
