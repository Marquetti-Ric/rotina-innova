import React, { useEffect, useState } from 'react';
import App from './App.jsx';
import { conferir, ativar } from './licenca';
import { checar, adiar, baixar } from './atualizacao';

/* Envolve o app: ativação, carência, bloqueio e aviso de nova versão.
   O App.jsx não precisa saber que isto existe. */

const CSS = `
.pt { position: fixed; inset: 0; z-index: 90; background: #F0EEDF; overflow-y: auto;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 32px 24px calc(32px + env(safe-area-inset-bottom));
  font-family: 'Nunito', system-ui, sans-serif; color: #24403C; text-align: center; }
.pt-logo { width: 72px; margin-bottom: 18px; }
.pt-marca { font-family: 'Source Sans 3', system-ui, sans-serif; font-size: 15px;
  letter-spacing: .075em; color: #7E7347; }
.pt-titulo { font-family: 'Baloo 2', system-ui, sans-serif; font-size: 25px; margin: 26px 0 8px; }
.pt-texto { font-size: 15px; font-weight: 600; color: #8E8668; line-height: 1.6; max-width: 330px; }
.pt-campo { width: 100%; max-width: 330px; margin-top: 22px; border: 2px solid #D8D2BC;
  background: #fff; border-radius: 16px; padding: 16px; font-family: 'Baloo 2', system-ui, sans-serif;
  font-size: 21px; letter-spacing: .08em; text-align: center; color: #24403C; outline: none; }
.pt-campo:focus { border-color: #2F6B62; }
.pt-botao { width: 100%; max-width: 330px; margin-top: 12px; border: none; cursor: pointer;
  border-radius: 18px; padding: 17px; background: #2F6B62; color: #fff;
  font-family: 'Baloo 2', system-ui, sans-serif; font-size: 18px; font-weight: 700; }
.pt-botao[disabled] { opacity: .5; }
.pt-botao.claro { background: #fff; color: #2F6B62; box-shadow: inset 0 0 0 2px #D8D2BC; }
.pt-erro { margin-top: 14px; font-size: 14px; font-weight: 700; color: #C2566E; max-width: 330px; line-height: 1.5; }

.pt-faixa { position: fixed; left: 10px; right: 10px; bottom: calc(10px + env(safe-area-inset-bottom));
  z-index: 70; background: #fff; border-radius: 20px; padding: 14px 16px;
  box-shadow: 0 12px 30px -12px rgba(36,64,60,.5); display: flex; align-items: center; gap: 12px;
  font-family: 'Nunito', system-ui, sans-serif; animation: ptSobe .4s cubic-bezier(.2,.9,.3,1) both; }
@keyframes ptSobe { from { transform: translateY(120%); opacity: 0 } to { transform: none; opacity: 1 } }
.pt-faixa-txt { flex: 1; font-size: 13px; font-weight: 700; color: #24403C; line-height: 1.4; }
.pt-faixa-txt small { display: block; font-weight: 600; color: #8E8668; margin-top: 2px; }
.pt-faixa button { border: none; cursor: pointer; border-radius: 13px; padding: 11px 14px;
  font-family: 'Baloo 2', system-ui, sans-serif; font-size: 14px; font-weight: 700;
  background: #2F6B62; color: #fff; flex-shrink: 0; }
.pt-faixa button.ignorar { background: transparent; color: #8E8668; padding: 11px 6px; }
@media (prefers-reduced-motion: reduce) { .pt-faixa { animation: none } }
`;

function Moldura({ children }) {
  return (
    <div className="pt">
      <style>{CSS}</style>
      <img src="/logo-innova.png" alt="" className="pt-logo" />
      <div className="pt-marca">INSTITUTO INNOVA</div>
      {children}
    </div>
  );
}

export default function Portao() {
  const [estado, setEstado] = useState('carregando');
  const [carencia, setCarencia] = useState(null);
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [atualizacao, setAtualizacao] = useState(null);

  useEffect(() => {
    (async () => {
      const r = await conferir();
      if (r.estado === 'sem-licenca') setEstado('ativar');
      else if (r.estado === 'bloqueada') setEstado('bloqueada');
      else {
        setEstado('liberado');
        if (r.estado === 'carencia') setCarencia(r);
      }
    })();
  }, []);

  useEffect(() => {
    if (estado !== 'liberado') return;
    // Espera o app assentar antes de olhar a rede.
    const t = setTimeout(async () => {
      const r = await checar();
      if (r.temNova) setAtualizacao(r);
    }, 4000);
    return () => clearTimeout(t);
  }, [estado]);

  async function enviar() {
    setEnviando(true);
    setErro('');
    const r = await ativar(codigo);
    setEnviando(false);
    if (r.ok) setEstado('liberado');
    else setErro(r.motivo);
  }

  if (estado === 'carregando') {
    return <div style={{ position: 'fixed', inset: 0, background: '#F0EEDF' }} />;
  }

  if (estado === 'ativar') {
    return (
      <Moldura>
        <h1 className="pt-titulo">Código de acesso</h1>
        <p className="pt-texto">
          Digite o código que o Instituto Innova entregou ao responsável.
          Isso é pedido uma única vez.
        </p>
        <input
          className="pt-campo"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          placeholder="INNV-0000-0000-0000"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck="false"
          inputMode="text"
          maxLength={24}
        />
        <button className="pt-botao" onClick={enviar} disabled={enviando || codigo.length < 8}>
          {enviando ? 'Conferindo...' : 'Liberar o app'}
        </button>
        {erro && <p className="pt-erro">{erro}</p>}
        <p className="pt-texto" style={{ marginTop: 22, fontSize: 13 }}>
          Ainda não tem um código? Peça na recepção do Instituto.
        </p>
      </Moldura>
    );
  }

  if (estado === 'bloqueada') {
    return (
      <Moldura>
        <h1 className="pt-titulo">Acesso encerrado</h1>
        <p className="pt-texto">
          O código deste aparelho não está mais válido. Os dados da rotina continuam
          guardados aqui e voltam assim que um novo código for inserido.
        </p>
        <button className="pt-botao" style={{ marginTop: 24 }} onClick={() => setEstado('ativar')}>
          Inserir outro código
        </button>
      </Moldura>
    );
  }

  return (
    <>
      <App />

      {carencia && (
        <div className="pt-faixa">
          <style>{CSS}</style>
          <span className="pt-faixa-txt">
            Acesso vence em {carencia.diasRestantes} {carencia.diasRestantes === 1 ? 'dia' : 'dias'}
            <small>Fale com o Instituto Innova para renovar.</small>
          </span>
          <button className="ignorar" onClick={() => setCarencia(null)}>Ok</button>
        </div>
      )}

      {atualizacao && !carencia && (
        <div className="pt-faixa">
          <style>{CSS}</style>
          <span className="pt-faixa-txt">
            Nova versão {atualizacao.nova}
            <small>{atualizacao.tamanho ? `${atualizacao.tamanho} · ` : ''}{atualizacao.notas}</small>
          </span>
          {!atualizacao.obrigatoria && (
            <button className="ignorar"
              onClick={() => { adiar(atualizacao.codigo); setAtualizacao(null); }}>
              Depois
            </button>
          )}
          <button onClick={() => baixar(atualizacao.url)}>Atualizar</button>
        </div>
      )}
    </>
  );
}
