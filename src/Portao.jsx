import React, { useEffect, useState } from 'react';
import App from './App.jsx';
import { conferir, ativar, extrair } from './licenca';
import { avisoDeLicencaPara } from './nivel4.js';
import { checar, adiar, baixar } from './atualizacao';
import { marca } from './marca';

/* Envolve o app: ativação, carência, bloqueio e aviso de nova versão.
   O App.jsx não precisa saber que isto existe. */

const CSS = `
.pt { position: fixed; inset: 0; z-index: 90; background: #F0EEDF; overflow-y: auto;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 32px 24px calc(32px + env(safe-area-inset-bottom));
  font-family: 'Nunito', system-ui, sans-serif; color: #24403C; text-align: center; }
.pt-logo { width: 72px; margin-bottom: 18px; }
.pt-marca { font-family: 'Source Sans 3', system-ui, sans-serif; font-size: 15px;
  letter-spacing: .075em; color: #6E6540; }
.pt-titulo { font-family: 'Baloo 2', system-ui, sans-serif; font-size: 25px; margin: 26px 0 8px; }
/* #6E6540 dá 5,0:1 sobre o creme. O oliva da marca (#7E7347) dava 4,06 e
   reprovava — a marca emoldura, mas não decide se o texto é legível. */
.pt-texto { font-size: 15px; font-weight: 600; color: #6E6540; line-height: 1.6; max-width: 330px; }
/* A borda é o que identifica o campo: o branco de dentro contra o creme dá
   1,13:1, então sozinho ele não delimita nada. #8A8266 dá 3,29 contra o creme. */
.pt-campo { width: 100%; max-width: 330px; margin-top: 22px; border: 2px solid #8A8266;
  background: #fff; border-radius: 16px; padding: 16px; font-family: 'Baloo 2', system-ui, sans-serif;
  font-size: 21px; letter-spacing: .08em; text-align: center; color: #24403C; outline: none; }
.pt-campo:focus { border-color: #2F6B62; box-shadow: 0 0 0 3px rgba(47,107,98,.22); }
/* A máscara precisa parecer máscara. Sem cor explícita ela herda o padrão do
   WebView, que em alguns aparelhos sai quase tão escura quanto texto digitado
   — e aí o campo parece preenchido. */
.pt-campo::placeholder { color: #A7B0AE; font-weight: 400; letter-spacing: .06em; }
.pt-botao { width: 100%; max-width: 330px; margin-top: 12px; border: none; cursor: pointer;
  border-radius: 18px; padding: 17px; background: #2F6B62; color: #fff;
  font-family: 'Baloo 2', system-ui, sans-serif; font-size: 18px; font-weight: 700; }
.pt-botao[disabled] { opacity: .5; }
.pt-botao.claro { background: #fff; color: #2F6B62; box-shadow: inset 0 0 0 2px #8A8266; }
.pt-colar { margin-top: 10px; border: none; background: transparent; cursor: pointer;
  color: #2F6B62; font-family: 'Baloo 2', system-ui, sans-serif; font-size: 15px;
  font-weight: 700; padding: 10px 14px; min-height: 44px; text-decoration: underline; }
.pt-erro { margin-top: 14px; font-size: 14px; font-weight: 700; color: #A8405A; max-width: 330px;
  line-height: 1.5; }
/* A região fica sempre no HTML para o leitor de tela anunciar a mensagem
   quando ela aparecer; vazia, não pode ocupar espaço. */
.pt-erro:empty { margin: 0; }
.pt-ajuda { margin-top: 10px; font-size: 13px; font-weight: 700; color: #6E6540; max-width: 330px;
  line-height: 1.5; }

.pt-faixa { position: fixed; left: 10px; right: 10px; bottom: calc(10px + env(safe-area-inset-bottom));
  z-index: 70; background: #fff; border-radius: 20px; padding: 14px 16px;
  box-shadow: 0 12px 30px -12px rgba(36,64,60,.5); display: flex; align-items: center; gap: 12px;
  font-family: 'Nunito', system-ui, sans-serif; animation: ptSobe .4s cubic-bezier(.2,.9,.3,1) both; }
@keyframes ptSobe { from { transform: translateY(120%); opacity: 0 } to { transform: none; opacity: 1 } }
.pt-faixa-txt { flex: 1; font-size: 13px; font-weight: 700; color: #24403C; line-height: 1.4; }
.pt-faixa-txt small { display: block; font-weight: 600; color: #6E6540; margin-top: 2px; }
.pt-faixa button { border: none; cursor: pointer; border-radius: 13px; padding: 11px 14px;
  font-family: 'Baloo 2', system-ui, sans-serif; font-size: 14px; font-weight: 700;
  background: #2F6B62; color: #fff; flex-shrink: 0; }
.pt-faixa button.ignorar { background: transparent; color: #6E6540; padding: 11px 6px; }
@media (prefers-reduced-motion: reduce) { .pt-faixa { animation: none } }
`;

function Moldura({ children }) {
  return (
    <div className="pt">
      <style>{CSS}</style>
      <img src={marca().logo} alt="" className="pt-logo" />
      <div className="pt-marca">{marca().nome}</div>
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
  /* A licença chega ao App porque ela decide duas coisas lá dentro: se o
     nível 4 existe para esta instalação, e para quem vai o aviso de
     vencimento. Nenhuma das duas é propriedade da rotina. */
  const [licenca, setLicenca] = useState(null);

  useEffect(() => {
    (async () => {
      const r = await conferir();
      if (r.licenca) setLicenca(r.licenca);
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

  /* Sem botão desabilitado. Um botão que não responde ao toque não diz se o
     app travou, se o toque não pegou ou se falta alguma coisa — e com a
     máscara no campo, a pessoa acha que já preencheu. Aqui ele sempre
     responde, e quando falta código ele explica o que falta. */
  async function enviar() {
    if (extrair(codigo).length < 12) {
      setErro(codigo.trim()
        ? 'Esse código está incompleto. Confira se copiou os quatro grupos.'
        : 'Digite o código que a clínica entregou. O campo ainda está vazio.');
      return;
    }
    setEnviando(true);
    setErro('');
    const r = await ativar(codigo);
    setEnviando(false);
    if (r.ok) setEstado('liberado');
    else setErro(r.motivo);
  }

  /* A clínica manda o código por WhatsApp: colar é o caminho principal, e
     toque longo num campo é difícil para quem está com a criança no colo. */
  async function colar() {
    setErro('');
    try {
      const t = await navigator.clipboard.readText();
      if (!t || !t.trim()) {
        setErro('Não há nada copiado. Copie o código na mensagem da clínica e volte aqui.');
        return;
      }
      setCodigo(extrair(t));
    } catch {
      setErro('Seu aparelho não deixou eu ler o que está copiado. '
        + 'Toque e segure no campo acima para colar.');
    }
  }

  if (estado === 'carregando') {
    return <div style={{ position: 'fixed', inset: 0, background: '#F0EEDF' }} />;
  }

  if (estado === 'ativar') {
    return (
      <Moldura>
        <h1 className="pt-titulo">Código de acesso</h1>
        <p className="pt-texto">
          Digite o código que a clínica entregou ao responsável.
          Isso é pedido uma única vez.
        </p>
        <input
          className="pt-campo"
          id="pt-codigo"
          aria-label="Código de acesso, quatro grupos de letras e números"
          aria-describedby="pt-dica"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          /* X e não 0: o gerador não usa 0, O, 1, I, L, 5 nem S, justamente
             porque se confundem lidos à mão. Uma máscara com zeros ensina um
             caractere que nenhum código tem. */
          placeholder="CMB-XXXX-XXXX-XXXX"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck="false"
          inputMode="text"
          /* Folgado de propósito: quem cola a mensagem inteira da clínica
             ("Código de acesso: CMB-...") não pode ter o texto cortado —
             o extrair() acha o código dentro. */
          maxLength={160}
        />
        {!codigo && (
          <button className="pt-colar" onClick={colar}>Colar o código copiado</button>
        )}
        <button className="pt-botao" onClick={enviar} disabled={enviando}>
          {enviando ? 'Conferindo...' : 'Liberar o app'}
        </button>
        <p className="pt-erro" role="status" aria-live="polite">{erro}</p>
        <p className="pt-ajuda" id="pt-dica">
          Ainda não tem um código? Peça na recepção da clínica.
        </p>
        <p className="pt-ajuda" style={{ marginTop: 18 }}>
          O Combinado organiza a rotina do dia em passos ilustrados, no ritmo
          de cada criança.
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
      <App licenca={licenca} />

      {carencia && (
        <div className="pt-faixa">
          <style>{CSS}</style>
          <span className="pt-faixa-txt">
            Acesso vence em {carencia.diasRestantes} {carencia.diasRestantes === 1 ? 'dia' : 'dias'}
            {/* Quem renova é o titular da licença. Numa licença de clínica a
                família não consegue renovar, então mandá-la "renovar" é
                mandar fazer o que ela não pode. */}
            <small>
              {avisoDeLicencaPara(licenca) === 'clinica'
                ? 'Fale com a clínica para renovar.'
                : 'Renove na loja para continuar usando.'}
            </small>
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
