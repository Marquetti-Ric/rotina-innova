import React, { useState, useEffect, useRef, useCallback } from "react";
import { App as AppNativo } from "@capacitor/app";
import { KeepAwake } from "@capacitor-community/keep-awake";
import { storage } from "./armazenamento";
import { reprogramar, avisosLigados, definirAvisos } from "./notificacoes";
import { marca } from "./marca";
import { AVATARES, Avatar } from "./avatar.jsx";
import Adultos from "./Adultos.jsx";
import {
  PADRAO_CONTATOS, carregarContatos, gravarContatos, novoContato, limpar as limparContato,
  telefoneValido, exibir as exibirFone, visiveisParaCrianca, comClinica,
} from "./contatos.js";
import Identificacao from "./Identificacao.jsx";
import {
  APOIO_PADRAO, carregarApoio, gravarApoio, apagarIdentificacao,
  derivarAjustes, explicarAjustes, temIdentificacao, resumoApoio,
} from "./apoio.js";
import { falar, calar } from "./voz.js";
import Prancha from "./Prancha.jsx";
import Sentimentos, { EMOCOES } from "./Sentimentos.jsx";

/* ============================================================
   ROTINA — jogo de rotinas diárias para crianças com TEA
   Mundo de feltro e papel recortado.

   TRÊS NÍVEIS POR IDADE. O nível muda quatro coisas de verdade:
   1. Granularidade  — 3-5 anos recebe micro-passos; 9+ recebe blocos.
   2. Linguagem      — do imperativo concreto ao checklist adulto.
   3. Estrutura      — trilha guiada (N1/N2) x lista livre (N3).
   4. Recompensa     — celebração alta e constante x registro de autonomia.
   ============================================================ */

const CSS = `
/* Fontes vêm de @fontsource, importadas em main.jsx — nada é buscado na internet. */

.rt, .rt * { box-sizing: border-box; margin: 0; padding: 0; }

.rt {
  /* cores institucionais da moldura — a clínica pode sobrescrever o destaque */
  --creme:   #F0EEDF;
  --grafite: #7E7347;
  --ouro:    #ECB70D;

  --musgo:   #2F6B62;
  --musgo-2: #E3F0ED;
  --neblina: #E8F0EE;
  --papel:   #FFFFFF;
  --damasco: #F2A65A;
  --lilas:   #8E82D4;
  --coral:   #E8879B;
  --folha:   #78BE9B;
  --tinta:   #24403C;
  --tinta-3: #6E8A85;
  --raio: 26px;
  --sombra: 0 2px 0 rgba(36,64,60,.07), 0 10px 24px -12px rgba(36,64,60,.28);
  --t: 1;

  font-family: 'Nunito', ui-rounded, system-ui, sans-serif;
  color: var(--tinta);
  background: radial-gradient(120% 70% at 50% 0%, #F4FAF8 0%, var(--neblina) 60%, #DFEAE7 100%);
  min-height: 100vh; display: flex; justify-content: center;
  padding: 14px 12px 26px; -webkit-tap-highlight-color: transparent;
}
.rt.calmo { --t: 0; }

.tela { width: 100%; max-width: 460px; display: flex; flex-direction: column; gap: 16px; }
h1, h2, h3, .display { font-family: 'Baloo 2', ui-rounded, system-ui, sans-serif; font-weight: 700; letter-spacing: -.01em; }

/* ---------- cabeçalho ---------- */
.topo { display: flex; align-items: center; gap: 12px; }
.topo-txt { flex: 1; min-width: 0; }
.saudacao { font-size: 13px; font-weight: 700; color: var(--tinta-3); letter-spacing: .04em; text-transform: uppercase; }
.nome { font-size: 24px; line-height: 1.15; }
.pote { display: flex; align-items: center; gap: 7px; background: var(--papel); border-radius: 999px;
  padding: 8px 15px 8px 11px; box-shadow: var(--sombra); font-family: 'Baloo 2', sans-serif; font-size: 19px; font-weight: 700; }
.pote.pulso { animation: pulso calc(.5s * var(--t)) ease-out; }
@keyframes pulso { 0%{transform:scale(1)} 40%{transform:scale(1.14)} 100%{transform:scale(1)} }
.btn-avatar { background: none; border: none; cursor: pointer; padding: 0; border-radius: 50%; flex-shrink: 0; }
.btn-avatar:active { transform: scale(.94); }
.selo-nivel { font-size: 11px; font-weight: 800; color: var(--musgo); background: var(--musgo-2);
  border-radius: 999px; padding: 3px 9px; display: inline-block; margin-top: 4px; letter-spacing: .02em; }

/* ---------- abas ---------- */
.abas { display: flex; gap: 8px; background: rgba(255,255,255,.6); padding: 5px; border-radius: 999px; }
.aba { flex: 1; border: none; cursor: pointer; padding: 11px 6px; border-radius: 999px; background: transparent;
  color: var(--tinta-3); font-family: 'Baloo 2', sans-serif; font-size: 15px; font-weight: 600;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  transition: background calc(.25s * var(--t)) ease, color calc(.25s * var(--t)) ease; }
.aba[data-on="1"] { background: var(--papel); color: var(--tinta); box-shadow: 0 4px 12px -6px rgba(36,64,60,.4); }

/* ---------- grade ---------- */
.grade { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.nv1 .grade { grid-template-columns: 1fr; }
.cartao { position: relative; border: none; cursor: pointer; text-align: left; background: var(--papel);
  border-radius: var(--raio); padding: 12px 12px 14px; box-shadow: var(--sombra);
  display: flex; flex-direction: column; gap: 6px; opacity: 0; transform: translateY(14px);
  animation: entra calc(.5s * var(--t)) cubic-bezier(.2,.9,.3,1) forwards; transition: transform .16s ease; }
.nv1 .cartao { flex-direction: row; align-items: center; gap: 14px; padding: 10px 16px 10px 10px; }
.nv1 .cartao-arte { width: 106px; flex-shrink: 0; }
.nv1 .cartao-nome { font-size: 21px; }
.rt.calmo .cartao { opacity: 1; transform: none; animation: none; }
@keyframes entra { to { opacity: 1; transform: none; } }
.cartao:active { transform: scale(.97); }
.cartao-arte { border-radius: 18px; overflow: hidden; background: var(--musgo-2); }
.cartao-txt { display: flex; flex-direction: column; gap: 4px; }
.cartao-nome { font-family: 'Baloo 2', sans-serif; font-size: 16px; line-height: 1.15; }
.cartao-rodape { display: flex; align-items: center; gap: 4px; font-size: 12.5px; font-weight: 700; color: var(--tinta-3); }
.selo-ok { position: absolute; top: -7px; right: -7px; width: 30px; height: 30px; border-radius: 50%;
  background: var(--folha); color: #fff; display: grid; place-items: center; font-size: 16px;
  box-shadow: 0 4px 10px -3px rgba(36,64,60,.5); animation: selo calc(.45s * var(--t)) cubic-bezier(.2,1.5,.4,1) both; }
@keyframes selo { from { transform: scale(0) rotate(-40deg); } to { transform: none; } }

/* ---------- rodapé ---------- */
.rodape { display: flex; gap: 10px; }
.btn-rodape { flex: 1; border: none; cursor: pointer; background: rgba(255,255,255,.75); border-radius: 18px;
  padding: 13px; display: flex; align-items: center; justify-content: center; gap: 8px;
  font-family: 'Baloo 2', sans-serif; font-size: 15px; font-weight: 600; color: var(--tinta); }
.btn-rodape:active { transform: scale(.97); }

/* ---------- trilha de pedrinhas ---------- */
.trilha { position: relative; height: 78px; margin: 2px 0 -2px; }
.trilha svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.andarilho { transition: transform calc(.55s * var(--t)) cubic-bezier(.34,1.4,.5,1); }

/* ---------- tarefa ---------- */
.barra { display: flex; align-items: center; gap: 10px; }
.btn-x { width: 42px; height: 42px; flex-shrink: 0; border: none; cursor: pointer; border-radius: 14px;
  background: rgba(255,255,255,.8); font-size: 19px; color: var(--tinta-3); display: grid; place-items: center; }
.btn-x:active { transform: scale(.93); }
.barra-titulo { flex: 1; font-family: 'Baloo 2', sans-serif; font-size: 18px; text-align: center; }
.contador { font-size: 13px; font-weight: 800; color: var(--tinta-3); min-width: 46px; text-align: right; }

.palco { background: var(--papel); border-radius: 30px; padding: 6px 6px 22px; box-shadow: var(--sombra); overflow: hidden; }
.quadro { border-radius: 26px; background: linear-gradient(170deg, #F3FAF8, #E4F0ED); }
.quadro svg { display: block; width: 100%; height: auto; }
.passo-troca { animation: troca calc(.42s * var(--t)) cubic-bezier(.2,.9,.3,1) both; }
@keyframes troca { from { opacity: 0; transform: translateX(18px) } to { opacity: 1; transform: none } }
.flutua { animation: flutua calc(4s * var(--t) + .01s) ease-in-out infinite; transform-origin: center; }
.rt.calmo .flutua { animation: none; }
@keyframes flutua { 0%,100%{ transform: translateY(0) } 50%{ transform: translateY(-5px) } }

.passo-titulo { font-family: 'Baloo 2', sans-serif; font-size: 25px; line-height: 1.15; text-align: center; padding: 18px 20px 0; }
.passo-dica { text-align: center; font-size: 15px; color: var(--tinta-3); padding: 7px 26px 0; line-height: 1.45; font-weight: 600; }
.nv1 .passo-titulo { font-size: 31px; padding-top: 20px; }
.nv1 .passo-dica { font-size: 17px; }
.nv3 .passo-titulo { font-size: 21px; }

/* ---------- ampulheta ---------- */
.relogio { display: flex; flex-direction: column; align-items: center; gap: 8px; padding-top: 16px; }
.relogio-num { font-family: 'Baloo 2', sans-serif; font-size: 15px; color: var(--musgo); font-weight: 700; }
.anel-fundo { stroke: var(--musgo-2); }
.anel-frente { stroke: var(--damasco); stroke-linecap: round; transition: stroke-dashoffset 1s linear; }

/* ---------- ações ---------- */
.acoes { display: flex; flex-direction: column; align-items: center; gap: 10px; position: relative; }
.btn-feito { width: 100%; border: none; cursor: pointer; border-radius: 24px; padding: 20px;
  background: var(--musgo); color: #fff; box-shadow: 0 5px 0 #234F49, 0 14px 22px -12px rgba(36,64,60,.7);
  font-family: 'Baloo 2', sans-serif; font-size: 22px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  transition: transform .12s ease, box-shadow .12s ease; }
.nv1 .btn-feito { padding: 26px; font-size: 26px; }
.nv3 .btn-feito { padding: 17px; font-size: 19px; box-shadow: 0 4px 0 #234F49; }
.btn-feito:active { transform: translateY(4px); box-shadow: 0 1px 0 #234F49; }
.btn-voltar { border: none; cursor: pointer; background: none; color: var(--tinta-3);
  font-family: 'Nunito', sans-serif; font-weight: 700; font-size: 14px; padding: 8px 16px; border-radius: 999px; }
.faisca { position: absolute; top: 20px; left: 50%; pointer-events: none;
  animation: faisca calc(.75s * var(--t) + .01s) ease-out forwards; }
.rt.calmo .faisca { display: none; }
@keyframes faisca { to { transform: translate(var(--dx), var(--dy)) scale(.3) rotate(140deg); opacity: 0 } }

/* ---------- lista livre (nível 3) ---------- */
.lista { display: flex; flex-direction: column; gap: 8px; }
.item { display: flex; gap: 12px; align-items: flex-start; background: var(--papel); border: none;
  border-radius: 18px; padding: 14px 15px; text-align: left; cursor: pointer; box-shadow: var(--sombra);
  transition: background calc(.2s * var(--t)) ease, transform .12s ease; }
.item:active { transform: scale(.985); }
.item[data-ok="1"] { background: #E9F5EF; box-shadow: none; }
.item[data-ok="1"] .item-txt b { color: var(--tinta-3); text-decoration: line-through; }
.item-cx { width: 28px; height: 28px; border-radius: 9px; background: #EAF1F0; display: grid; place-items: center;
  font-weight: 800; font-size: 13px; color: var(--tinta-3); flex-shrink: 0; }
.item[data-ok="1"] .item-cx { background: var(--folha); color: #fff; }
.item-txt { flex: 1; }
.item-txt b { font-family: 'Baloo 2', sans-serif; font-size: 16px; display: block; font-weight: 600; }
.item-txt small { font-size: 13px; color: var(--tinta-3); font-weight: 600; display: block; margin-top: 2px; line-height: 1.4; }
.item-tempo { font-size: 11.5px; font-weight: 800; color: var(--damasco); background: #FFF3E4;
  border-radius: 999px; padding: 4px 9px; flex-shrink: 0; }

/* ---------- festa / painel ---------- */
.festa { position: fixed; inset: 0; z-index: 40; display: grid; place-items: center; padding: 22px;
  background: rgba(36,64,60,.5); backdrop-filter: blur(5px); animation: aparece calc(.3s * var(--t)) ease both; }
@keyframes aparece { from { opacity: 0 } to { opacity: 1 } }
.festa-caixa { background: var(--papel); border-radius: 34px; padding: 30px 24px 24px; text-align: center;
  width: 100%; max-width: 340px; box-shadow: 0 30px 60px -24px rgba(0,0,0,.5);
  animation: sobe calc(.5s * var(--t)) cubic-bezier(.2,1.3,.4,1) both; }
@keyframes sobe { from { transform: translateY(26px) scale(.92); opacity: 0 } to { transform: none; opacity: 1 } }
.festa-titulo { font-size: 27px; margin-top: 12px; }
.nv3 .festa-titulo { font-size: 23px; }
.festa-texto { color: var(--tinta-3); font-weight: 700; margin-top: 6px; font-size: 15px; }
.premio { margin: 16px auto 4px; width: 122px; animation: gira calc(.7s * var(--t)) cubic-bezier(.2,1.4,.4,1) both; }
.nv3 .premio { width: 78px; }
@keyframes gira { from { transform: scale(.3) rotate(-25deg) } to { transform: none } }
.papelote { position: absolute; top: -10vh; width: 11px; height: 15px; border-radius: 3px; animation: cai linear forwards; }
.rt.calmo .papelote { display: none; }
@keyframes cai { to { transform: translateY(118vh) rotate(720deg); opacity: .2 } }
.par { display: flex; gap: 9px; margin-top: 14px; }
.par button { flex: 1; border: none; cursor: pointer; border-radius: 16px; padding: 14px 8px;
  font-family: 'Baloo 2', sans-serif; font-size: 15px; font-weight: 600; background: var(--musgo-2); color: var(--musgo); }

/* ---------- folha / formulário ---------- */
.folha { position: fixed; inset: 0; z-index: 50; background: rgba(36,64,60,.45);
  display: flex; align-items: flex-end; justify-content: center; animation: aparece calc(.25s * var(--t)) ease both; }
.folha-caixa { background: var(--neblina); width: 100%; max-width: 460px; border-radius: 30px 30px 0 0;
  padding: 22px 20px calc(22px + env(safe-area-inset-bottom)); max-height: 88vh; overflow-y: auto;
  animation: desliza calc(.36s * var(--t)) cubic-bezier(.2,.9,.3,1) both; }
@keyframes desliza { from { transform: translateY(100%) } to { transform: none } }
.folha-titulo { font-size: 21px; margin-bottom: 4px; }
.folha-sub { font-size: 14px; color: var(--tinta-3); font-weight: 600; margin-bottom: 18px; line-height: 1.5; }

.linha { display: flex; align-items: center; gap: 12px; background: var(--papel); border-radius: 18px; padding: 14px 16px; margin-bottom: 9px; }
.linha-txt { flex: 1; }
.linha-nome { font-family: 'Baloo 2', sans-serif; font-size: 16px; }
.linha-desc { font-size: 12.5px; color: var(--tinta-3); font-weight: 600; margin-top: 1px; line-height: 1.4; }
.chave { width: 54px; height: 31px; border-radius: 999px; border: none; cursor: pointer; background: #CBD9D6;
  position: relative; flex-shrink: 0; transition: background calc(.25s * var(--t)) ease; }
.chave[data-on="1"] { background: var(--folha); }
.chave i { position: absolute; top: 3px; left: 3px; width: 25px; height: 25px; border-radius: 50%; background: #fff;
  transition: transform calc(.25s * var(--t)) cubic-bezier(.3,1.4,.5,1); box-shadow: 0 2px 5px rgba(0,0,0,.2); }
.chave[data-on="1"] i { transform: translateX(23px); }
.campo { width: 100%; border: 2px solid #D5E3E0; background: var(--papel); border-radius: 16px; padding: 14px 16px;
  font-family: 'Baloo 2', sans-serif; font-size: 17px; color: var(--tinta); outline: none; }
.campo:focus { border-color: var(--musgo); }
.escolha-avatar { display: flex; gap: 10px; margin: 4px 0 18px; }
.op-avatar { border: 3px solid transparent; background: var(--papel); border-radius: 50%; padding: 4px; cursor: pointer; line-height: 0; }
.op-avatar[data-on="1"] { border-color: var(--musgo); }
.btn-plano { width: 100%; border: none; cursor: pointer; border-radius: 18px; padding: 16px; background: var(--musgo);
  color: #fff; font-family: 'Baloo 2', sans-serif; font-size: 17px; font-weight: 700; margin-top: 8px; }
.btn-plano.fantasma { background: var(--papel); color: var(--coral); box-shadow: inset 0 0 0 2px #F0D6DB; }

/* ---------- cartões de nível ---------- */
.niveis { display: flex; flex-direction: column; gap: 10px; }
.nivel { border: 3px solid transparent; background: var(--papel); border-radius: 22px; padding: 15px 16px;
  cursor: pointer; text-align: left; display: flex; gap: 14px; align-items: center; box-shadow: var(--sombra);
  transition: transform .14s ease, border-color calc(.2s * var(--t)) ease; }
.nivel:active { transform: scale(.98); }
.nivel[data-on="1"] { border-color: var(--musgo); }
.nivel-idade { font-family: 'Baloo 2', sans-serif; font-size: 22px; color: var(--musgo); width: 62px;
  flex-shrink: 0; text-align: center; line-height: 1.05; }
.nivel-idade small { display: block; font-size: 11px; color: var(--tinta-3); font-weight: 800; letter-spacing: .05em; }
.nivel-nome { font-family: 'Baloo 2', sans-serif; font-size: 17px; }
.nivel-desc { font-size: 13px; color: var(--tinta-3); font-weight: 600; margin-top: 3px; line-height: 1.45; }

/* ---------- álbum e relatório ---------- */
.album { display: grid; grid-template-columns: repeat(3, 1fr); gap: 11px; }
.figurinha { background: var(--papel); border-radius: 22px; padding: 10px 8px 12px; text-align: center; box-shadow: var(--sombra); }
.figurinha[data-travada="1"] { background: rgba(255,255,255,.45); box-shadow: none; }
.figurinha[data-travada="1"] .fig-arte { filter: grayscale(1); opacity: .3; }
.fig-nome { font-size: 11.5px; font-weight: 800; line-height: 1.2; margin-top: 6px; color: var(--tinta-3); }
.fig-qtd { font-size: 10.5px; font-weight: 800; color: var(--damasco); margin-top: 2px; }
.barra-prog { height: 7px; border-radius: 99px; background: #E4EDEB; overflow: hidden; margin-top: 7px; }
.barra-prog i { display: block; height: 100%; background: var(--folha); border-radius: 99px;
  transition: width calc(.6s * var(--t)) cubic-bezier(.2,.9,.3,1); }
.aviso { background: #FFF6EA; border-radius: 18px; padding: 14px 16px; font-size: 13px; line-height: 1.55; color: #7A5B34; font-weight: 600; }

/* ---------- a moldura da marca ---------- */
.logo { display: flex; flex-direction: column; align-items: center; }
.logo img { display: block; }
.logo-nome { font-family: 'Source Sans 3', 'Segoe UI', system-ui, sans-serif; font-weight: 400;
  color: var(--grafite); letter-spacing: .075em; line-height: 1; white-space: nowrap; }
.logo-tag { font-family: 'Source Sans 3', 'Segoe UI', system-ui, sans-serif; font-weight: 400;
  color: var(--grafite); letter-spacing: .045em; line-height: 1; white-space: nowrap; }

.abertura { position: fixed; inset: 0; z-index: 80; background: var(--creme);
  display: grid; place-items: center; padding: 30px; }
.abertura[data-saindo="1"] { animation: sai calc(.55s * var(--t) + .01s) ease forwards; }
@keyframes sai { to { opacity: 0; visibility: hidden } }
.abertura-linha { font-family: 'Nunito', sans-serif; font-size: 12.5px; font-weight: 700; color: #9C9377;
  letter-spacing: .05em; text-align: center; margin-top: 34px; line-height: 1.7;
  opacity: 0; animation: revela calc(.8s * var(--t) + .01s) ease calc(1.2s * var(--t)) forwards; }
@keyframes revela { to { opacity: 1; transform: none } }
.logo-entra { opacity: 0; transform: translateY(14px);
  animation: revela calc(1s * var(--t) + .01s) cubic-bezier(.2,.9,.3,1) calc(.35s * var(--t)) forwards; }

.assinatura { display: flex; align-items: center; gap: 13px; background: var(--creme);
  border-radius: 20px; padding: 12px 18px; }
.assinatura-txt { font-size: 11.5px; color: #938B6E; font-weight: 700; line-height: 1.45; }
.assinatura-txt b { color: var(--grafite); font-weight: 800; }
.institucional { background: var(--creme); border-radius: 26px; padding: 26px 20px 24px; text-align: center; }
.institucional p { font-size: 13px; color: #8E8668; font-weight: 600; line-height: 1.6; margin-top: 20px; }


/* ---------- horários, momentos e editor ---------- */
.cartao-hora { font-family: 'Baloo 2', sans-serif; font-size: 12px; font-weight: 700; color: var(--damasco); }
.cartao[data-agora="1"] { box-shadow: 0 0 0 3px var(--damasco), var(--sombra); }
.faixa-prova { background: #FFF3E4; color: #8A6636; border-radius: 16px; padding: 11px 15px;
  font-size: 13px; font-weight: 800; text-align: center; }
.vazio { grid-column: 1 / -1; background: rgba(255,255,255,.6); border-radius: 20px; padding: 22px 18px;
  text-align: center; font-size: 14px; font-weight: 600; color: var(--tinta-3); line-height: 1.55; }
.opcoes { display: flex; gap: 10px; justify-content: center; padding: 16px 20px 0; }
.opcoes button { flex: 1; max-width: 150px; border: none; cursor: pointer; border-radius: 16px; padding: 14px;
  background: var(--musgo-2); color: var(--musgo); font-family: 'Baloo 2', sans-serif; font-size: 17px; font-weight: 700; }
.opcoes button[data-on="1"] { background: var(--musgo); color: #fff; }

.grupo-titulo { display: flex; align-items: center; gap: 8px; font-family: 'Baloo 2', sans-serif;
  font-size: 16px; margin: 16px 0 8px; }
.linha-tarefa { display: flex; align-items: center; gap: 11px; background: var(--papel);
  border-radius: 16px; padding: 11px 13px; margin-bottom: 7px; }
.linha-tarefa[data-off="1"] { opacity: .5; }
.hora-chip { font-family: 'Baloo 2', sans-serif; font-size: 13px; font-weight: 700; color: var(--musgo);
  background: var(--musgo-2); border-radius: 9px; padding: 5px 8px; min-width: 50px; text-align: center; }
.tarefa-nome { flex: 1; font-size: 14.5px; font-weight: 700; line-height: 1.25; }
.tarefa-dias { font-size: 11px; color: var(--tinta-3); font-weight: 700; margin-top: 2px; }
.btn-mini { border: none; cursor: pointer; background: #EAF1F0; border-radius: 11px; width: 34px; height: 34px;
  font-size: 15px; color: var(--tinta-3); flex-shrink: 0; }
.btn-mini[data-on="1"] { background: var(--folha); color: #fff; }
.btn-mini.perigo { background: #FCEAEE; color: var(--coral); }

.campo-rot { font-size: 12px; font-weight: 800; color: var(--tinta-3); text-transform: uppercase;
  letter-spacing: .05em; margin: 16px 0 7px; }
.escolha { display: flex; flex-wrap: wrap; gap: 7px; }
.escolha button { border: none; cursor: pointer; background: var(--papel); border-radius: 13px; padding: 11px 14px;
  font-family: 'Baloo 2', sans-serif; font-size: 14px; font-weight: 600; color: var(--tinta-3); }
.escolha button[data-on="1"] { background: var(--musgo); color: #fff; }
.dias-linha { display: flex; gap: 6px; }
.dias-linha button { flex: 1; border: none; cursor: pointer; background: var(--papel); border-radius: 12px;
  padding: 13px 0; font-family: 'Baloo 2', sans-serif; font-size: 14px; font-weight: 700; color: var(--tinta-3); }
.dias-linha button[data-on="1"] { background: var(--musgo); color: #fff; }
.artes { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; max-height: 210px; overflow-y: auto;
  background: rgba(255,255,255,.5); border-radius: 18px; padding: 8px; }
.arte-op { border: 3px solid transparent; background: var(--papel); border-radius: 14px; padding: 2px;
  cursor: pointer; overflow: hidden; }
.arte-op[data-on="1"] { border-color: var(--musgo); }
.arte-op svg { display: block; width: 100%; height: auto; }
.num-linha { display: flex; align-items: center; gap: 9px; }
.num-linha .campo.num { width: 84px; text-align: center; padding: 12px 8px; }
.num-rot { flex: 1; font-size: 13px; font-weight: 700; color: var(--tinta-3); }
.num-un { font-family: 'Baloo 2', sans-serif; font-size: 15px; color: var(--tinta-3); font-weight: 600; }
.num-linha .btn-mini { width: 40px; height: 44px; font-size: 20px; font-weight: 700; }
.passo-edit { display: flex; gap: 8px; align-items: flex-start; margin-bottom: 7px; }
.passo-edit .campo { font-size: 15px; padding: 11px 13px; }
/* ---------- chamar um adulto ---------- */
.fixos { position: fixed; right: 16px; bottom: 18px; z-index: 30; display: flex;
  flex-direction: column; align-items: flex-end; gap: 9px; }
.chamar { display: flex; align-items: center; gap: 8px; border: none; cursor: pointer;
  background: var(--coral); color: #fff; border-radius: 999px;
  padding: 13px 19px 13px 16px; min-height: 52px;
  font-family: 'Baloo 2', sans-serif; font-size: 15.5px; font-weight: 700;
  box-shadow: 0 10px 24px -8px rgba(36,64,60,.7); }
.chamar:active { transform: scale(.96); }
.prancha-btn { background: var(--musgo); }
.chamar-barra { width: 42px; height: 42px; flex-shrink: 0; border: none; cursor: pointer;
  border-radius: 14px; background: #FCEAEE; display: grid; place-items: center; }

.adultos { display: flex; flex-direction: column; gap: 13px; }
.pessoa { background: var(--papel); border-radius: var(--raio); padding: 13px 15px 15px;
  box-shadow: var(--sombra); display: flex; flex-direction: column; gap: 11px; }
.pessoa-topo { display: flex; align-items: center; gap: 13px; }
.pessoa-txt { flex: 1; min-width: 0; }
.pessoa-nome { font-family: 'Baloo 2', sans-serif; font-size: 20px; line-height: 1.15; }
.pessoa-rel { font-size: 12px; font-weight: 800; color: var(--tinta-3);
  text-transform: uppercase; letter-spacing: .05em; margin-top: 2px; }
.pessoa-fone { font-size: 12.5px; font-weight: 800; color: var(--tinta-3); margin-top: 2px; }
.pessoa-acoes { display: flex; gap: 10px; }
.ac { flex: 1; border: none; cursor: pointer; border-radius: 19px; padding: 14px 10px;
  display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 54px;
  font-family: 'Baloo 2', sans-serif; font-size: 16px; font-weight: 700; color: #15403A; }
.ac:active { transform: scale(.97); }
.ac-ligar { background: var(--folha); }
.ac-zap { background: #8FCBE8; }
.nv1 .ac { font-size: 18px; min-height: 60px; }
.vazio-adultos { background: var(--papel); border-radius: var(--raio); padding: 26px 22px;
  box-shadow: var(--sombra); display: flex; flex-direction: column; align-items: center;
  gap: 9px; text-align: center; }

.scrim { position: fixed; inset: 0; background: rgba(20,38,35,.45); z-index: 40; }
.folha { position: fixed; left: 12px; right: 12px; bottom: 12px; z-index: 41; max-width: 436px;
  margin: 0 auto; background: var(--papel); border-radius: 30px; padding: 20px 20px 18px;
  box-shadow: 0 -6px 40px -10px rgba(20,38,35,.5); display: flex; flex-direction: column;
  align-items: center; gap: 7px; text-align: center;
  animation: sobe-folha calc(.3s * var(--t) + .01s) cubic-bezier(.2,.9,.3,1) both; }
@keyframes sobe-folha { from { transform: translateY(26px); opacity: 0 } to { transform: none; opacity: 1 } }
.folha-titulo { font-family: 'Baloo 2', sans-serif; font-size: 23px; line-height: 1.2; margin-top: 3px; }
.folha-sub { font-size: 13.5px; font-weight: 700; color: var(--tinta-3); line-height: 1.45; }
.folha-btns { display: flex; flex-direction: column; gap: 9px; width: 100%; margin-top: 7px; }
.btn-sim { border: none; cursor: pointer; background: var(--folha); color: #15403A;
  border-radius: 20px; padding: 16px; min-height: 56px; display: flex; align-items: center;
  justify-content: center; gap: 9px; font-family: 'Baloo 2', sans-serif; font-size: 18px; font-weight: 700; }
.btn-nao { border: none; cursor: pointer; background: var(--neblina); color: var(--tinta-3);
  border-radius: 20px; padding: 14px; min-height: 50px;
  font-family: 'Baloo 2', sans-serif; font-size: 16px; font-weight: 700; }
.minis { display: flex; flex-wrap: wrap; gap: 9px 15px; border-top: 1px solid rgba(36,64,60,.09);
  padding-top: 11px; }
.mini-chave { display: flex; align-items: center; gap: 7px; font-size: 11.5px; font-weight: 800;
  color: var(--tinta-3); }
.chave.sm { width: 40px; height: 24px; }
.chave.sm i { width: 18px; height: 18px; top: 3px; left: 3px; }
.chave.sm[data-on="1"] i { left: 19px; }
.trava { font-size: 10px; font-weight: 800; color: var(--musgo); background: var(--musgo-2);
  border-radius: 999px; padding: 4px 10px; text-transform: uppercase; letter-spacing: .05em;
  flex-shrink: 0; }
.btn-add { width: 100%; border: 2.5px dashed rgba(47,107,98,.35); cursor: pointer;
  background: transparent; color: var(--musgo); border-radius: 20px; padding: 14px; min-height: 52px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  font-family: 'Baloo 2', sans-serif; font-size: 15.5px; font-weight: 700; }

/* ---------- identificação ---------- */
.destaque { background: #FBF3DF; border: 2.5px solid #EBD79C; border-radius: 24px;
  padding: 16px 17px; display: flex; flex-direction: column; gap: 9px; }
.destaque-tit { font-family: 'Baloo 2', sans-serif; font-size: 17px; line-height: 1.25;
  color: #6B5A2C; }
.destaque p { font-size: 12.5px; font-weight: 700; line-height: 1.55; color: #7E6A3A; }
.aceite { display: flex; align-items: flex-start; gap: 11px; background: rgba(255,255,255,.8);
  border: none; border-radius: 17px; padding: 13px 14px; cursor: pointer; text-align: left;
  width: 100%; min-height: 52px; }
.aceite-txt { font-size: 13px; font-weight: 800; line-height: 1.45; color: #5C4D24; }
.itens { display: flex; flex-direction: column; gap: 9px; }
.opc { display: flex; align-items: center; gap: 12px; background: var(--papel);
  border-radius: 19px; padding: 13px 15px; box-shadow: var(--sombra);
  border: 2px solid transparent; cursor: pointer; text-align: left; width: 100%;
  min-height: 52px; }
.opc[data-on="1"] { border-color: var(--musgo); background: #F7FCFB; }
.opc svg { flex-shrink: 0; }
.opc-txt { flex: 1; min-width: 0; }
.opc-nome { font-family: 'Baloo 2', sans-serif; font-size: 14.5px; line-height: 1.2;
  display: block; }
.opc-desc { font-size: 11.5px; font-weight: 700; color: var(--tinta-3); line-height: 1.45;
  margin-top: 2px; display: block; }
.niveis-tea { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px;
  padding: 0 2px; }
.nv-tea { border: 2.5px solid transparent; background: var(--neblina); border-radius: 17px;
  padding: 11px 6px; cursor: pointer; font-family: 'Baloo 2', sans-serif; font-size: 14px;
  font-weight: 700; color: var(--tinta-3); min-height: 62px; line-height: 1.2; }
.nv-tea[data-on="1"] { border-color: var(--musgo); background: var(--musgo-2); color: var(--musgo); }
.nv-tea small { display: block; font-family: 'Nunito', sans-serif; font-size: 10px;
  font-weight: 800; margin-top: 3px; }
.interesses { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.interesse { border: 2.5px solid transparent; background: var(--papel); border-radius: 20px;
  padding: 9px 6px 10px; box-shadow: var(--sombra); cursor: pointer; display: flex;
  flex-direction: column; gap: 5px; min-height: 92px; }
.interesse[data-on="1"] { border-color: var(--musgo); background: #F7FCFB; }
.interesse-arte { border-radius: 14px; background: linear-gradient(170deg, #F3FAF8, #E4F0ED);
  padding: 5px; }
.interesse-arte svg { display: block; width: 100%; height: auto; }
.interesse-nome { font-size: 11px; font-weight: 800; text-align: center; line-height: 1.2; }

.deriv { background: var(--musgo-2); border-radius: 24px; padding: 16px 17px; }
.deriv-tit { font-family: 'Baloo 2', sans-serif; font-size: 15px; color: var(--musgo);
  margin-bottom: 10px; }
.deriv-lista { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column;
  gap: 9px; }
.deriv-lista li { display: flex; align-items: baseline; gap: 9px; }
.d-txt { flex: 1; font-size: 13px; font-weight: 700; color: #23453F; line-height: 1.4; }
.d-tag { flex-shrink: 0; font-size: 9.5px; font-weight: 800; color: var(--musgo);
  background: rgba(255,255,255,.8); border-radius: 999px; padding: 3px 8px;
  text-transform: uppercase; letter-spacing: .04em; }
.d-tag[data-manual="1"] { background: var(--damasco); color: #5A3A12; }
.apagar { background: #FBEEEC; border-radius: 24px; padding: 15px 16px; display: flex;
  flex-direction: column; gap: 10px; }
.btn-apagar { border: 2.5px solid #E3B6B0; cursor: pointer; background: rgba(255,255,255,.75);
  color: #A24C44; border-radius: 18px; padding: 14px; min-height: 52px;
  font-family: 'Baloo 2', sans-serif; font-size: 15.5px; font-weight: 700; }
.apagar p { font-size: 11.5px; font-weight: 700; color: #8A5A54; line-height: 1.5; }
.selo-apoio { font-size: 10.5px; font-weight: 800; color: var(--musgo); background: var(--musgo-2);
  border-radius: 999px; padding: 4px 10px; text-transform: uppercase; letter-spacing: .04em; }

/* ---------- faixa de antecipação ---------- */
.antecipa { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,.72);
  border-radius: 17px; padding: 10px 14px; font-size: 13.5px; font-weight: 800; }
.antecipa-rot { color: var(--tinta-3); font-size: 11px; font-weight: 800;
  text-transform: uppercase; letter-spacing: .05em; flex-shrink: 0; }
.antecipa b { font-family: 'Baloo 2', sans-serif; font-weight: 700; font-size: 14px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.antecipa-seta { color: var(--tinta-3); flex-shrink: 0; }

.item-voz { width: 40px; height: 40px; flex-shrink: 0; border-radius: 13px; background: var(--musgo-2);
  display: grid; place-items: center; cursor: pointer; }
.item-voz:active { transform: scale(.93); }

.atalhos { display: flex; gap: 10px; }
.btn-pausa, .btn-sentir { flex: 1; border: none; cursor: pointer; border-radius: 19px;
  padding: 14px 10px; min-height: 52px;
  font-family: 'Baloo 2', sans-serif; font-size: 15.5px; font-weight: 700; }
.btn-pausa { background: var(--folha); color: #15403A; }
.btn-sentir { background: var(--coral); color: #4A1F2A; }
.btn-pausa:active, .btn-sentir:active { transform: scale(.97); }

/* ---------- prancha de comunicação ---------- */
.tira { min-height: 66px; background: var(--papel); border-radius: 22px;
  box-shadow: var(--sombra); padding: 11px 13px; display: flex; flex-wrap: wrap;
  gap: 7px; align-items: center; }
.tira-vazia { font-size: 13.5px; font-weight: 700; color: var(--tinta-3); }
.ficha { background: var(--musgo-2); color: var(--musgo); border-radius: 13px;
  padding: 7px 12px; font-family: 'Baloo 2', sans-serif; font-size: 16px; font-weight: 700; }
.pr-acoes { display: flex; gap: 9px; }
.btn-falar { flex: 1; border: none; cursor: pointer; background: var(--musgo); color: #fff;
  border-radius: 19px; padding: 14px; min-height: 52px; display: flex; align-items: center;
  justify-content: center; gap: 9px; font-family: 'Baloo 2', sans-serif;
  font-size: 16px; font-weight: 700; }
.btn-mini-pr { width: 52px; min-height: 52px; border: none; cursor: pointer;
  border-radius: 19px; background: rgba(255,255,255,.85); color: var(--tinta-3);
  font-size: 19px; display: grid; place-items: center; }
.btn-falar:disabled, .btn-mini-pr:disabled { opacity: .45; cursor: default; }
.btn-levar { border: 2.5px solid var(--musgo); cursor: pointer; background: var(--musgo-2);
  color: var(--musgo); border-radius: 19px; padding: 13px; min-height: 50px;
  font-family: 'Baloo 2', sans-serif; font-size: 15px; font-weight: 700; }
.prancha { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.cel { border: none; cursor: pointer; background: var(--papel); border-radius: 18px;
  padding: 6px 5px 8px; box-shadow: var(--sombra); display: flex; flex-direction: column;
  gap: 4px; min-height: 44px; }
.cel:active { transform: scale(.95); }
.cel-arte { border-radius: 13px; overflow: hidden; padding: 6px;
  background: linear-gradient(170deg, #F3FAF8, #E4F0ED); }
.cel-arte svg { display: block; width: 100%; height: auto; }
.cel-nome { font-size: 10.5px; font-weight: 800; text-align: center; line-height: 1.15; }
.pr-pe { font-size: 11.5px; font-weight: 700; color: var(--tinta-3); line-height: 1.5;
  text-align: center; }
.rt.contraste .tira, .rt.contraste .cel, .rt.contraste .btn-mini-pr {
  background: #000000; border: 3px solid #FFFFFF; box-shadow: none; }
.rt.contraste .cel-arte { background: #FFFFFF; }
.rt.contraste .ficha { background: #FFD400; color: #000000; }
.rt.contraste .btn-falar { background: #5BFF5B; color: #000000; border: 3px solid #FFFFFF; }
.rt.contraste .prancha { grid-template-columns: repeat(3, minmax(0, 1fr)); }

.contagem { display: flex; flex-wrap: wrap; gap: 8px; }
.conta-emo { display: flex; align-items: center; gap: 6px; background: var(--papel);
  border-radius: 999px; padding: 6px 13px 6px 7px; box-shadow: var(--sombra);
  font-size: 12.5px; font-weight: 700; color: var(--tinta-3); }
.conta-emo b { font-family: 'Baloo 2', sans-serif; font-size: 15px; color: var(--tinta); }

/* ---------- sentimentos ---------- */
.emocoes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 11px; }
.emo { border: 2.5px solid transparent; cursor: pointer; background: var(--papel);
  border-radius: 24px; padding: 9px 8px 11px; box-shadow: var(--sombra);
  display: flex; flex-direction: column; gap: 6px; }
.emo[data-on="1"] { border-color: var(--musgo); background: var(--musgo-2); }
.emo:active { transform: scale(.96); }
.emo-arte svg { display: block; width: 100%; height: auto; }
.emo-nome { font-family: 'Baloo 2', sans-serif; font-size: 13.5px; text-align: center;
  line-height: 1.15; }
.resposta { background: var(--papel); border-radius: var(--raio); padding: 17px;
  box-shadow: var(--sombra); display: flex; flex-direction: column; gap: 10px; }
.resposta p { font-size: 14.5px; font-weight: 700; line-height: 1.5; }
.bola-ar { width: 150px; height: 150px; margin: 6px auto 12px; border-radius: 50%;
  background: var(--coral); transform: scale(.66);
  transition: transform calc(3.6s * var(--t) + .01s) ease-in-out; }
.bola-ar[data-cheia="1"] { transform: scale(1); }
.ar-titulo { font-family: 'Baloo 2', sans-serif; font-size: 24px; }
.ar-conta { font-family: 'Baloo 2', sans-serif; font-size: 40px; color: var(--coral); }
.rt.contraste .emo, .rt.contraste .resposta { background: #000000;
  border: 3px solid #FFFFFF; box-shadow: none; }
.rt.contraste .emo[data-on="1"] { border-color: #FFD400; }

/* ---------- leitura ampliada ---------- */
.rt.leitura { font-size: 112%; }
.rt.leitura .passo-titulo { font-size: 28px; }
.rt.leitura .passo-dica { font-size: 17px; line-height: 1.6; }
.rt.leitura .cartao-nome { font-size: 17.5px; }
.rt.leitura .linha-desc { font-size: 13.5px; line-height: 1.55; }

/* ---------- alto contraste ----------
   Não é a mesma tela mais escura: é outra paleta, de cores puras, com
   contorno em tudo que se toca. Vence a cor de destaque da clínica — a
   acessibilidade não cede para a marca. */
.rt.contraste { --papel: #000000; --neblina: #000000; --musgo: #FFD400;
  --musgo-2: #1A1A1A; --tinta: #FFFFFF; --tinta-3: #FFD400; --folha: #5BFF5B;
  --damasco: #FFD400; --coral: #FF9BB0; --lilas: #C9BBFF; --creme: #000000;
  --sombra: none;
  background: #000000; font-size: 118%; }
.rt.contraste .tela > * { color: #FFFFFF; }
.rt.contraste .cartao, .rt.contraste .linha, .rt.contraste .pessoa,
.rt.contraste .palco, .rt.contraste .folha, .rt.contraste .pote,
.rt.contraste .btn-rodape, .rt.contraste .btn-x, .rt.contraste .aba,
.rt.contraste .campo, .rt.contraste .btn-eng, .rt.contraste .chamar-barra {
  background: #000000; border: 3px solid #FFFFFF; box-shadow: none; }
.rt.contraste .aba[data-on="1"] { background: #FFD400; color: #000000; border-color: #FFD400; }
.rt.contraste .cartao-arte, .rt.contraste .quadro { background: #FFFFFF;
  outline: 3px solid #FFFFFF; }
.rt.contraste .cartao-rodape, .rt.contraste .cartao-hora { color: #00E5FF; }
.rt.contraste .btn-feito, .rt.contraste .btn-plano, .rt.contraste .btn-sim,
.rt.contraste .btn-pausa, .rt.contraste .ac-ligar {
  background: #5BFF5B; color: #000000; border: 3px solid #FFFFFF; box-shadow: none; }
.rt.contraste .ac-zap { background: #00E5FF; color: #000000; border: 3px solid #FFFFFF; }
.rt.contraste .btn-nao { background: #000000; color: #FFFFFF; border: 3px solid #FFFFFF; }
.rt.contraste .chamar { background: #FF9BB0; color: #000000; border: 3px solid #FFFFFF; }
.rt.contraste .antecipa { background: #000000; border: 3px solid #FFFFFF; }
.rt.contraste .antecipa-rot, .rt.contraste .antecipa-seta { color: #FFD400; }
.rt.contraste .selo-nivel { background: #1A1A1A; color: #FFD400; border: 2px solid #FFD400; }
.rt.contraste .trilha svg circle { stroke: #FFFFFF; stroke-width: 2; }
.rt.contraste .aviso { background: #1A1A1A; color: #FFFFFF; border: 3px solid #FFD400; }

.rt :focus-visible { outline: 3px solid var(--damasco); outline-offset: 3px; border-radius: 12px; }
.rt.contraste :focus-visible { outline: 4px solid #00E5FF; }
@media (prefers-reduced-motion: reduce) { .rt { --t: 0.001; } .rt * { animation-duration: .01ms !important; } }
@media (max-width: 340px) { .grade { grid-template-columns: 1fr; } }
`;

/* ================= som ================= */
let audio = null;
function tocar(notas, ligado) {
  if (!ligado) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume();
    notas.forEach(([f, atraso]) => {
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = "sine"; o.frequency.value = f;
      const t0 = audio.currentTime + atraso;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.09, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.42);
      o.connect(g); g.connect(audio.destination); o.start(t0); o.stop(t0 + 0.45);
    });
  } catch (e) {}
}
const SOM_PASSO = [[587.33, 0], [880, 0.07]];
const SOM_FESTA = [[523.25, 0], [659.25, 0.11], [783.99, 0.22], [1046.5, 0.33]];
const SOM_SECO = [[659.25, 0]];

/* ================= marca ================= */
/* O símbolo vem de marca.js, que o tema da clínica sobrescreve. */

function Monograma({ tam = 56 }) {
  return (
    <img src={marca().logo} alt="" aria-hidden="true"
      style={{ width: tam, height: "auto", display: "block" }} />
  );
}

const ESCALAS = {
  pequeno: { m: 26, nome: 12, tag: 6.5, gap: 6 },
  medio: { m: 48, nome: 20, tag: 10.5, gap: 12 },
  grande: { m: 86, nome: 33, tag: 17, gap: 20 },
};

function LogoMarca({ tamanho = "medio" }) {
  const s = ESCALAS[tamanho];
  const m = marca();
  return (
    <div className="logo">
      <Monograma tam={s.m} />
      <div className="logo-nome" style={{ fontSize: s.nome, marginTop: s.gap }}>{m.nome}</div>
      {m.assinatura && (
        <div className="logo-tag" style={{ fontSize: s.tag, marginTop: s.gap * 0.32 }}>
          {m.assinatura}
        </div>
      )}
    </div>
  );
}

/* ================= ilustrações ================= */
const C = {
  agua: "#8FCBE8", madeira: "#D8A97A", madeira2: "#B98857", branco: "#FFFFFF", creme: "#F6EEE0",
  verde: "#78BE9B", coral: "#E8879B", damasco: "#F2A65A", lilas: "#A99BE0",
  tecido: "#B7C9F0", tecido2: "#94ACE4", linha: "#2F6B62", espuma: "#F2F8FF", pele: "#F0C39B",
};

const Chao = () => <ellipse cx="110" cy="146" rx="88" ry="12" fill="#000" opacity=".05" />;
const Brilhos = ({ pontos }) => (
  <g opacity=".55">{pontos.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#FFFFFF" />)}</g>
);

const Cama = ({ cobertor }) => (
  <g>
    <rect x="24" y="60" width="15" height="82" rx="7" fill={C.madeira2} />
    <rect x="181" y="86" width="15" height="56" rx="7" fill={C.madeira2} />
    <rect x="30" y="98" width="160" height="34" rx="10" fill={C.creme} />
    {cobertor === "bagunca" && <path d="M112 98h74v26a10 10 0 0 1-10 10h-52c-14 0-20-10-12-18 6-6 4-14 0-18z" fill={C.tecido} />}
    {cobertor === "arrumado" && <rect x="86" y="96" width="102" height="38" rx="9" fill={C.tecido} />}
    {cobertor === "arrumado" && <rect x="86" y="96" width="102" height="9" rx="4" fill={C.tecido2} />}
    <rect x="30" y="128" width="160" height="12" rx="6" fill={C.madeira} />
  </g>
);

const Escova = ({ x, y, g = 0, pasta }) => (
  <g transform={`translate(${x} ${y}) rotate(${g})`}>
    <rect x="-6" y="0" width="12" height="62" rx="6" fill={C.lilas} />
    <rect x="-9" y="-16" width="18" height="20" rx="7" fill={C.branco} />
    {pasta && <path d="M-7 -18c4-6 10-6 14 0z" fill={C.verde} />}
    <g stroke={C.espuma} strokeWidth="3" strokeLinecap="round"><path d="M-5 -13v-4" /><path d="M0 -13v-5" /><path d="M5 -13v-4" /></g>
  </g>
);

const Pia = () => (
  <g>
    <rect x="40" y="104" width="140" height="34" rx="12" fill={C.branco} />
    <ellipse cx="110" cy="112" rx="52" ry="12" fill="#E6EFEE" />
    <rect x="100" y="62" width="12" height="30" rx="6" fill="#C3D3D1" />
    <rect x="100" y="58" width="42" height="11" rx="5" fill="#C3D3D1" />
  </g>
);

const Maos = ({ espuma }) => (
  <g>
    <path d="M78 96c-6-14 2-22 8-18l10 8 6-16c2-6 12-4 11 3l-3 20 14 4c7 2 6 12-2 13l-30 4c-8 1-12-6-14-18z" fill={C.pele} />
    <path d="M142 96c6-14-2-22-8-18l-10 8-6-16c-2-6-12-4-11 3l3 20-14 4c-7 2-6 12 2 13l30 4c8 1 12-6 14-18z" fill={C.pele} />
    {espuma && (
      <g fill={C.branco} opacity=".92">
        <circle cx="96" cy="86" r="10" /><circle cx="112" cy="78" r="12" />
        <circle cx="128" cy="88" r="9" /><circle cx="110" cy="92" r="11" />
      </g>
    )}
  </g>
);

const Banheira = () => <path d="M40 96h140v18c0 16-10 26-26 26H66c-16 0-26-10-26-26z" fill={C.branco} />;
const Toalha = ({ cor, cor2 }) => (
  <g>
    <path d="M56 44h108c8 0 12 6 12 14v58c0 12-8 20-20 20H64c-12 0-20-8-20-20V58c0-8 4-14 12-14z" fill={cor} />
    <rect x="44" y="72" width="132" height="14" fill={cor2} />
    <rect x="44" y="98" width="132" height="14" fill={cor2} />
  </g>
);

const CENAS = {
  cama1: <g><Chao /><Cama cobertor="bagunca" /><Brilhos pontos={[[54, 46, 3], [172, 56, 4]]} /></g>,
  cama2: (
    <g><Chao /><Cama cobertor="arrumado" />
      <path d="M64 88c-8-4-4-16 5-13l20 7" stroke={C.pele} strokeWidth="13" strokeLinecap="round" fill="none" />
    </g>
  ),
  cama3: (
    <g><Chao /><Cama cobertor="arrumado" />
      <rect x="36" y="92" width="52" height="30" rx="13" fill={C.branco} />
      <rect x="44" y="99" width="36" height="7" rx="3" fill="#EAF1F0" />
    </g>
  ),
  cama4: (
    <g><Chao /><Cama cobertor="arrumado" />
      <rect x="36" y="92" width="52" height="30" rx="13" fill={C.branco} />
      <g transform="translate(122 62)">
        <circle cx="-13" cy="-8" r="8" fill={C.damasco} /><circle cx="13" cy="-8" r="8" fill={C.damasco} />
        <circle cx="0" cy="6" r="20" fill="#F6BC7C" />
        <circle cx="-7" cy="2" r="2.6" fill="#4A3324" /><circle cx="7" cy="2" r="2.6" fill="#4A3324" />
        <ellipse cx="0" cy="11" rx="7" ry="5" fill={C.creme} /><circle cx="0" cy="9" r="2.4" fill="#4A3324" />
      </g>
      <Brilhos pontos={[[62, 44, 4], [170, 60, 3], [80, 30, 3]]} />
    </g>
  ),

  dentes1: <g><Chao /><Pia /><Escova x="86" y="42" /><rect x="130" y="72" width="26" height="46" rx="10" fill={C.verde} /><rect x="136" y="62" width="14" height="12" rx="5" fill="#5FA985" /></g>,
  dentes2: <g><Chao /><Pia /><Escova x="96" y="44" g={-14} pasta /><rect x="138" y="76" width="26" height="42" rx="10" fill={C.verde} /></g>,
  dentes3: (
    <g><Chao />
      <circle cx="110" cy="84" r="46" fill={C.pele} />
      <path d="M78 84c8-16 46-16 54 0 6 20-46 26-54 0z" fill="#B8626F" />
      <rect x="82" y="74" width="46" height="13" rx="5" fill={C.branco} />
      <Escova x="150" y="30" g={38} pasta />
      <Brilhos pontos={[[70, 50, 4], [156, 100, 3]]} />
    </g>
  ),
  dentes4: (
    <g><Chao />
      <circle cx="110" cy="84" r="46" fill={C.pele} />
      <path d="M78 84c8-16 46-16 54 0 6 20-46 26-54 0z" fill="#B8626F" />
      <rect x="84" y="93" width="42" height="13" rx="5" fill={C.branco} />
      <Escova x="60" y="30" g={-38} pasta />
      <Brilhos pontos={[[160, 54, 4], [64, 104, 3]]} />
    </g>
  ),
  dentes5: (
    <g><Chao /><Pia />
      <path d="M84 46h52l-7 44a10 10 0 0 1-10 9h-18a10 10 0 0 1-10-9z" fill={C.branco} />
      <path d="M88 54h44l-2 14H90z" fill={C.agua} />
      <Brilhos pontos={[[70, 40, 3], [152, 52, 4]]} />
    </g>
  ),

  maos1: <g><Chao /><Pia /><g stroke={C.agua} strokeWidth="6" strokeLinecap="round" className="flutua"><path d="M118 70v22" /><path d="M126 74v14" /></g></g>,
  maos2: <g><Chao /><Pia /><Maos /><g stroke={C.agua} strokeWidth="6" strokeLinecap="round"><path d="M118 68v18" /></g></g>,
  maos3: (
    <g><Chao /><Pia />
      <rect x="76" y="66" width="68" height="40" rx="16" fill={C.coral} />
      <rect x="86" y="74" width="26" height="9" rx="4" fill="#F3AEBB" />
      <Brilhos pontos={[[70, 52, 4], [156, 62, 3]]} />
    </g>
  ),
  maos4: <g><Chao /><Pia /><Maos espuma /><g fill={C.branco} opacity=".8" className="flutua"><circle cx="72" cy="58" r="7" /><circle cx="150" cy="50" r="9" /><circle cx="128" cy="42" r="5" /></g></g>,
  maos5: <g><Chao /><Pia /><Maos /><g stroke={C.agua} strokeWidth="6" strokeLinecap="round"><path d="M110 62v22" /><path d="M120 66v16" /><path d="M100 66v16" /></g></g>,
  maos6: <g><Chao /><Toalha cor={C.tecido} cor2={C.tecido2} /><Brilhos pontos={[[38, 36, 4], [188, 50, 3]]} /></g>,

  roupa1: (
    <g><Chao />
      <g transform="translate(-4 6) scale(.78)">
        <path d="M52 56h38l10 9 10-9h38l12 24-20 9v44H60V89l-20-9z" fill={C.tecido} />
      </g>
      <g transform="translate(118 60) scale(.9)">
        <path d="M0 0h48v22l-6 56h-15l-3-42-3 42H6L0 22z" fill={C.lilas} />
      </g>
      <Brilhos pontos={[[46, 42, 4], [190, 52, 3]]} />
    </g>
  ),
  roupa2: <g><Chao /><path d="M52 56h38l10 9 10-9h38l12 24-20 9v44H60V89l-20-9z" fill={C.tecido} /><circle cx="110" cy="60" r="16" fill={C.pele} opacity=".9" /></g>,
  roupa3: <g><Chao /><path d="M74 42h72v28l-9 70h-22l-5-52-5 52H83l-9-70z" fill={C.lilas} /><rect x="74" y="42" width="72" height="12" rx="5" fill="#8E82D4" /></g>,
  roupa4: (
    <g><Chao />
      <g transform="translate(58 48)"><path d="M0 0h30v46c0 16-8 22-20 22S-8 60 0 46z" fill={C.coral} /><rect x="0" y="0" width="30" height="12" rx="5" fill="#F3AEBB" /></g>
      <g transform="translate(126 48)"><path d="M0 0h30v46c8 14 4 22-10 22s-20-6-20-22z" fill={C.coral} /><rect x="0" y="0" width="30" height="12" rx="5" fill="#F3AEBB" /></g>
    </g>
  ),
  roupa5: (
    <g><Chao />
      <g transform="translate(36 74)"><path d="M0 20c0-14 6-20 18-20h10l14 14h22c8 0 12 6 12 14v6H6c-4 0-6-4-6-14z" fill={C.verde} /><rect x="0" y="30" width="76" height="10" rx="5" fill="#5FA985" /></g>
      <g transform="translate(120 74)"><path d="M0 20c0-14 6-20 18-20h10l14 14h22c8 0 12 6 12 14v6H6c-4 0-6-4-6-14z" fill={C.verde} /><rect x="0" y="30" width="76" height="10" rx="5" fill="#5FA985" /></g>
    </g>
  ),

  banho1: (
    <g><Chao /><Banheira />
      <rect x="100" y="26" width="12" height="24" rx="6" fill="#C3D3D1" />
      <ellipse cx="106" cy="52" rx="26" ry="9" fill="#C3D3D1" />
      <g stroke={C.agua} strokeWidth="5" strokeLinecap="round" className="flutua"><path d="M90 62v26" /><path d="M106 62v34" /><path d="M122 62v26" /></g>
    </g>
  ),
  banho2: (
    <g><Chao /><Banheira />
      <rect x="82" y="52" width="58" height="36" rx="15" fill={C.damasco} />
      <g fill={C.branco} opacity=".85"><circle cx="70" cy="46" r="9" /><circle cx="152" cy="40" r="11" /><circle cx="130" cy="30" r="6" /></g>
    </g>
  ),
  banho3: (
    <g><Chao />
      <circle cx="110" cy="96" r="40" fill={C.pele} />
      <g fill={C.branco}><circle cx="80" cy="62" r="18" /><circle cx="108" cy="50" r="22" /><circle cx="138" cy="62" r="18" /><circle cx="110" cy="70" r="20" /></g>
      <circle cx="98" cy="98" r="3" fill="#2B3A38" /><circle cx="122" cy="98" r="3" fill="#2B3A38" />
      <path d="M100 110c4 4 12 4 16 0" stroke="#2B3A38" strokeWidth="3" strokeLinecap="round" fill="none" />
    </g>
  ),
  banho4: (
    <g><Chao /><Banheira />
      <ellipse cx="106" cy="52" rx="26" ry="9" fill="#C3D3D1" />
      <g stroke={C.agua} strokeWidth="5" strokeLinecap="round"><path d="M84 62v30" /><path d="M96 62v38" /><path d="M108 62v34" /><path d="M120 62v38" /><path d="M132 62v30" /></g>
    </g>
  ),
  banho5: <g><Chao /><Toalha cor={C.coral} cor2="#F3AEBB" /><Brilhos pontos={[[38, 36, 4], [188, 50, 3]]} /></g>,

  brinq1: (
    <g><Chao />
      <circle cx="62" cy="120" r="18" fill={C.coral} />
      <rect x="94" y="106" width="30" height="30" rx="7" fill={C.lilas} />
      <path d="M150 136l16-30 16 30z" fill={C.damasco} />
      <circle cx="140" cy="72" r="13" fill={C.verde} />
    </g>
  ),
  brinq2: (
    <g><Chao />
      <rect x="52" y="76" width="116" height="60" rx="14" fill={C.madeira} />
      <rect x="52" y="76" width="116" height="16" rx="8" fill={C.madeira2} />
      <rect x="96" y="98" width="28" height="8" rx="4" fill={C.madeira2} />
    </g>
  ),
  brinq3: (
    <g><Chao />
      <rect x="52" y="86" width="116" height="50" rx="14" fill={C.madeira} />
      <circle cx="82" cy="72" r="15" fill={C.coral} />
      <rect x="108" y="52" width="26" height="26" rx="6" fill={C.lilas} className="flutua" />
      <circle cx="146" cy="70" r="12" fill={C.verde} />
    </g>
  ),
  brinq4: (
    <g><Chao />
      <rect x="34" y="118" width="152" height="14" rx="6" fill={C.madeira2} />
      <rect x="66" y="64" width="88" height="54" rx="12" fill={C.madeira} />
      <rect x="66" y="64" width="88" height="14" rx="7" fill={C.madeira2} />
      <Brilhos pontos={[[48, 52, 4], [178, 62, 3]]} />
    </g>
  ),

  comer1: (
    <g><Chao />
      <rect x="30" y="112" width="160" height="12" rx="6" fill={C.madeira} />
      <ellipse cx="110" cy="98" rx="46" ry="16" fill={C.branco} />
      <ellipse cx="110" cy="95" rx="32" ry="10" fill="#F6D9A8" />
      <rect x="46" y="76" width="7" height="34" rx="3" fill="#C3D3D1" />
      <rect x="168" y="76" width="7" height="34" rx="3" fill="#C3D3D1" />
    </g>
  ),
  comer2: (
    <g><Chao />
      <rect x="30" y="112" width="160" height="12" rx="6" fill={C.madeira} />
      <ellipse cx="110" cy="98" rx="46" ry="16" fill={C.branco} />
      <ellipse cx="110" cy="95" rx="30" ry="9" fill="#F6D9A8" />
      <g transform="translate(150 34) rotate(24)"><rect x="0" y="0" width="7" height="46" rx="3" fill="#C3D3D1" /><circle cx="3.5" cy="52" r="9" fill="#C3D3D1" /></g>
      <Brilhos pontos={[[56, 48, 4], [186, 70, 3]]} />
    </g>
  ),
  comer3: (
    <g><Chao />
      <path d="M82 48h56l-6 76a12 12 0 0 1-12 11h-20a12 12 0 0 1-12-11z" fill={C.branco} />
      <path d="M85 76h50l-4 46H89z" fill={C.agua} />
      <Brilhos pontos={[[66, 42, 4], [156, 56, 3]]} />
    </g>
  ),
  comer4: (
    <g><Chao /><Pia />
      <ellipse cx="110" cy="80" rx="42" ry="14" fill={C.branco} />
      <path d="M68 80c0 8 84 8 84 0" stroke="#E1EAE8" strokeWidth="4" fill="none" />
      <Brilhos pontos={[[62, 48, 4], [166, 58, 3]]} />
    </g>
  ),

  dormir1: (
    <g><Chao />
      <path d="M52 50h38l10 9 10-9h38l12 22-18 8v46H58V80l-18-8z" fill={C.lilas} />
      <g fill="#C9BEF0"><circle cx="80" cy="96" r="5" /><circle cx="110" cy="112" r="5" /><circle cx="140" cy="92" r="5" /></g>
    </g>
  ),
  dormir2: (
    <g><Chao />
      <rect x="102" y="96" width="16" height="42" rx="5" fill={C.madeira2} />
      <path d="M70 92l18-40h44l18 40z" fill={C.damasco} />
      <g opacity=".5"><circle cx="110" cy="70" r="30" fill="#FBE3C2" /></g>
    </g>
  ),
  dormir3: (
    <g><Chao /><Cama cobertor="arrumado" />
      <circle cx="62" cy="106" r="14" fill={C.pele} />
      <path d="M56 104a5 5 0 0 1 12 0" stroke="#2B3A38" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <g fill="#9FB8B4" className="flutua"><circle cx="150" cy="60" r="12" opacity=".5" /><circle cx="168" cy="44" r="8" opacity=".4" /></g>
    </g>
  ),
  dormir4: (
    <g><Chao /><Cama cobertor="arrumado" />
      <circle cx="62" cy="106" r="14" fill={C.pele} />
      <path d="M56 104h6M66 104h4" stroke="#2B3A38" strokeWidth="2.4" strokeLinecap="round" />
      <g fill={C.lilas} fontFamily="Baloo 2, sans-serif" fontWeight="700" className="flutua">
        <text x="130" y="66" fontSize="20">z</text><text x="148" y="48" fontSize="26">Z</text>
      </g>
    </g>
  ),

  /* ---- itens da rotina real ---- */
  cabelo: (
    <g><Chao />
      <rect x="100" y="86" width="20" height="54" rx="10" fill={C.lilas} />
      <ellipse cx="110" cy="72" rx="38" ry="30" fill="#8E82D4" />
      <ellipse cx="110" cy="70" rx="30" ry="23" fill="#A99BE0" />
      <g fill={C.branco}>
        {[[92, 56], [110, 52], [128, 56], [86, 70], [110, 68], [134, 70], [94, 84], [110, 86], [126, 84]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.4" />)}
      </g>
    </g>
  ),
  desodorante: (
    <g><Chao />
      <rect x="86" y="60" width="48" height="76" rx="16" fill={C.agua} />
      <rect x="86" y="60" width="48" height="14" rx="7" fill="#6FB4D6" />
      <rect x="96" y="38" width="28" height="26" rx="9" fill="#C3D3D1" />
      <rect x="94" y="92" width="32" height="9" rx="4" fill={C.branco} opacity=".7" />
      <g fill={C.branco} opacity=".7" className="flutua"><circle cx="152" cy="46" r="5" /><circle cx="166" cy="60" r="3.5" /><circle cx="158" cy="72" r="4" /></g>
    </g>
  ),
  remedio: (
    <g><Chao />
      <path d="M118 60h44l-6 66a11 11 0 0 1-11 10h-10a11 11 0 0 1-11-10z" fill={C.branco} />
      <path d="M121 84h38l-3 36h-32z" fill={C.agua} />
      <rect x="46" y="86" width="52" height="50" rx="12" fill={C.coral} />
      <rect x="52" y="76" width="40" height="14" rx="6" fill="#D9707F" />
      <circle cx="66" cy="60" r="10" fill={C.branco} />
      <circle cx="88" cy="54" r="8" fill={C.damasco} />
    </g>
  ),
  licao: (
    <g><Chao />
      <rect x="34" y="112" width="152" height="12" rx="5" fill={C.madeira} />
      <path d="M40 108V56c22-8 44-8 66 0v52c-22-7-44-7-66 0z" fill={C.branco} />
      <path d="M180 108V56c-22-8-44-8-66 0v52c22-7 44-7 66 0z" fill="#F4F8F7" />
      <g stroke="#DDE7E5" strokeWidth="3" strokeLinecap="round">
        <path d="M52 70h42" /><path d="M52 82h42" /><path d="M52 94h30" />
        <path d="M126 70h42" /><path d="M126 82h30" />
      </g>
      <g transform="translate(152 26) rotate(22)"><rect x="0" y="0" width="10" height="52" rx="4" fill={C.damasco} /><path d="M0 52h10l-5 12z" fill="#4A3324" /></g>
    </g>
  ),
  manta: (
    <g><Chao />
      <rect x="26" y="98" width="168" height="34" rx="12" fill={C.creme} />
      <rect x="26" y="126" width="168" height="12" rx="6" fill={C.madeira} />
      <rect x="42" y="58" width="136" height="52" rx="18" fill="#B65C7E" />
      <rect x="50" y="66" width="120" height="36" rx="13" fill="#CF7093" />
      <g fill="#FFD2E0" className="flutua">
        {[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={68 + i * 22} cy="76" r="5" />)}
        {[0, 1, 2, 3, 4].map((i) => <circle key={"b" + i} cx={68 + i * 22} cy="92" r="5" />)}
      </g>
    </g>
  ),
  bone: (
    <g><Chao />
      <path d="M46 104c0-38 28-58 64-58s64 20 64 58z" fill="#5C7FB8" />
      <path d="M174 104h30c6 0 8 8 2 11l-32 5z" fill="#4A6A9E" />
      <g fill="#BFE0FF" className="flutua">
        {[[80, 82], [110, 74], [140, 82], [95, 96], [125, 96]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5.5" />)}
      </g>
      <path d="M46 104h128v10H46z" fill="#4A6A9E" />
    </g>
  ),
  ilib: (
    <g><Chao />
      <path d="M40 82c22-12 48-12 70 0l38 22c8 5 4 18-6 18l-92-6c-14-1-22-26-10-34z" fill={C.pele} />
      <rect x="78" y="76" width="44" height="40" rx="14" fill="#6E5AA8" transform="rotate(12 100 96)" />
      <circle cx="100" cy="96" r="9" fill={C.coral} />
      <g stroke="#F3AEBB" strokeWidth="3.5" strokeLinecap="round" opacity=".8" className="flutua">
        <path d="M100 78v-12" /><path d="M118 92l12-6" /><path d="M84 84l-8-9" />
      </g>
    </g>
  ),
  placa: (
    <g><Chao />
      <path d="M44 100c0-26 26-42 66-42s66 16 66 42c0 10-14 12-22 6-12-9-26-13-44-13s-32 4-44 13c-8 6-22 4-22-6z" fill="#DCEBF5" />
      <path d="M56 96c0-18 22-30 54-30s54 12 54 30" stroke={C.branco} strokeWidth="7" fill="none" strokeLinecap="round" />
      <rect x="60" y="112" width="100" height="22" rx="10" fill={C.lilas} />
      <Brilhos pontos={[[54, 50, 4], [172, 60, 3]]} />
    </g>
  ),
  mochila: (
    <g><Chao />
      <path d="M64 62c0-16 20-24 46-24s46 8 46 24v58c0 10-6 16-16 16H80c-10 0-16-6-16-16z" fill={C.verde} />
      <path d="M64 84h92v22H64z" fill="#5FA985" />
      <rect x="88" y="88" width="44" height="14" rx="7" fill={C.creme} />
      <path d="M86 44c8-14 40-14 48 0" stroke="#5FA985" strokeWidth="9" fill="none" strokeLinecap="round" />
    </g>
  ),
  praia: (
    <g>
      <circle cx="166" cy="46" r="20" fill={C.damasco} />
      <path d="M14 108h192v14c0 8-6 14-14 14H28c-8 0-14-6-14-14z" fill="#F3E2C0" />
      <path d="M14 96c14-8 26 0 40 0s26-8 40 0 26 0 40 0 26-8 40 0 26 0 32-4v16H14z" fill={C.agua} />
      <path d="M52 108V60" stroke="#8B6A4A" strokeWidth="6" strokeLinecap="round" />
      <path d="M14 62c8-22 32-32 56-24 20 7 26 20 24 24z" fill={C.coral} />
      <Brilhos pontos={[[110, 118, 3], [150, 122, 4]]} />
    </g>
  ),
  sapatos: (
    <g><Chao />
      <rect x="26" y="60" width="168" height="12" rx="5" fill={C.madeira2} />
      <g transform="translate(36 92)">
        <path d="M0 20c0-14 6-20 18-20h10l14 14h22c8 0 12 6 12 14v6H6c-4 0-6-4-6-14z" fill={C.lilas} />
        <rect x="0" y="30" width="76" height="10" rx="5" fill="#8E82D4" />
      </g>
      <g transform="translate(118 92)">
        <path d="M0 20c0-14 6-20 18-20h10l14 14h22c8 0 12 6 12 14v6H6c-4 0-6-4-6-14z" fill={C.lilas} />
        <rect x="0" y="30" width="76" height="10" rx="5" fill="#8E82D4" />
      </g>
    </g>
  ),
  estudar: (
    <g><Chao />
      <path d="M34 116V58c24-9 48-9 72 0v58c-24-8-48-8-72 0z" fill={C.branco} />
      <path d="M186 116V58c-24-9-48-9-72 0v58c24-8 48-8 72 0z" fill="#F4F8F7" />
      <g stroke="#DDE7E5" strokeWidth="3" strokeLinecap="round">
        <path d="M46 74h44" /><path d="M46 86h44" /><path d="M46 98h28" /><path d="M130 74h44" /><path d="M130 86h30" />
      </g>
      <g transform="translate(160 26)">
        <circle cx="0" cy="0" r="19" fill={C.damasco} /><circle cx="0" cy="0" r="14" fill={C.creme} />
        <path d="M0-8v9l6 4" stroke="#8B6A4A" strokeWidth="3" strokeLinecap="round" fill="none" />
      </g>
    </g>
  ),
  terapia: (
    <g><Chao />
      <rect x="30" y="106" width="160" height="12" rx="5" fill={C.madeira} />
      <rect x="46" y="76" width="30" height="30" rx="7" fill={C.coral} />
      <rect x="80" y="76" width="30" height="30" rx="7" fill={C.damasco} />
      <rect x="114" y="76" width="30" height="30" rx="7" fill={C.verde} />
      <rect x="63" y="44" width="30" height="30" rx="7" fill={C.lilas} className="flutua" />
      <circle cx="164" cy="90" r="17" fill={C.agua} />
    </g>
  ),
  casa: (
    <g><Chao />
      <path d="M110 34l84 56H26z" fill={C.coral} />
      <rect x="46" y="86" width="128" height="52" rx="10" fill={C.creme} />
      <rect x="94" y="98" width="32" height="40" rx="6" fill={C.madeira} />
      <circle cx="118" cy="118" r="3" fill={C.damasco} />
      <rect x="56" y="98" width="26" height="22" rx="6" fill={C.agua} />
      <rect x="138" y="98" width="26" height="22" rx="6" fill={C.agua} />
    </g>
  ),

  pet: (
    <g><Chao />
      <ellipse cx="118" cy="104" rx="44" ry="25" fill="#C98A63" />
      <rect x="84" y="112" width="12" height="26" rx="6" fill="#B57A55" />
      <rect x="106" y="112" width="12" height="26" rx="6" fill="#C98A63" />
      <rect x="132" y="112" width="12" height="26" rx="6" fill="#B57A55" />
      <rect x="150" y="112" width="12" height="26" rx="6" fill="#C98A63" />
      <path d="M160 88c9-13 27-8 24 6l-5 18" stroke="#C98A63" strokeWidth="11" strokeLinecap="round" fill="none" />
      <circle cx="66" cy="84" r="26" fill="#D89A72" />
      <path d="M46 66c-8 12-6 26 4 28l10-18z" fill="#B57A55" />
      <path d="M86 66c8 12 6 26-4 28l-10-18z" fill="#B57A55" />
      <circle cx="57" cy="82" r="3.2" fill="#3B2A20" />
      <circle cx="75" cy="82" r="3.2" fill="#3B2A20" />
      <ellipse cx="66" cy="94" rx="7" ry="5" fill="#3B2A20" />
      <path d="M66 99v4" stroke="#3B2A20" strokeWidth="2" strokeLinecap="round" />
      <path d="M60 105c4 3 8 3 12 0" stroke="#3B2A20" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M78 100c8 4 14 6 20 6" stroke={C.coral} strokeWidth="7" fill="none" strokeLinecap="round" />
      <circle cx="92" cy="104" r="4" fill={C.damasco} />
      <path d="M92 104C102 74 126 48 152 40" stroke={C.verde} strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="160" cy="36" r="10" fill="none" stroke={C.verde} strokeWidth="5" />
      <Brilhos pontos={[[36, 40, 4], [190, 76, 3]]} />
    </g>
  ),
};

function Cena({ nome }) {
  return (
    <svg viewBox="0 0 220 160" role="img" aria-hidden="true">
      <g className="flutua">{CENAS[nome] || null}</g>
    </svg>
  );
}

/* ================= níveis ================= */
const NIVEIS = {
  1: {
    id: 1, idade: "3–5", nome: "Primeiros passos", moeda: "estrelas",
    resumo: "Um micro-passo por tela, frases de três palavras e comemoração a cada acerto.",
    porPasso: 2, bonus: 6, faisca: true, listaLivre: false, botao: "Já fiz!",
    festaTitulo: "Você conseguiu!", confete: true,
  },
  2: {
    id: 2, idade: "6–8", nome: "Explorador", moeda: "estrelas",
    resumo: "Passos médios com dica de apoio. A trilha mostra o que já passou e o que falta.",
    porPasso: 1, bonus: 5, faisca: false, listaLivre: false, botao: "Já fiz!",
    festaTitulo: "Rotina completa!", confete: true,
  },
  3: {
    id: 3, idade: "9+", nome: "Autonomia", moeda: "pontos",
    resumo: "A rotina inteira em lista, na ordem que quiser, e um registro de quanto fez sozinho.",
    porPasso: 1, bonus: 8, faisca: false, listaLivre: true, botao: "Concluído",
    festaTitulo: "Rotina concluída", confete: false,
  },
};

const MOMENTOS = [
  { id: "manha", nome: "Manhã", icone: "☀️" },
  { id: "clinica", nome: "Clínica", icone: "🏥" },
  { id: "noite", nome: "Noite", icone: "🌙" },
  { id: "fds", nome: "Fim de semana", icone: "🎈" },
];

const DIAS = ["D", "S", "T", "Q", "Q", "S", "S"];
const DIAS_NOME = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const SEMANA = [1, 2, 3, 4, 5];
const FDS = [0, 6];
const TODOS = [0, 1, 2, 3, 4, 5, 6];

/* Catálogo de ilustrações para o responsável escolher ao criar uma tarefa. */
const ARTES = [
  { k: "cama4", r: "Cama" }, { k: "dentes3", r: "Dentes" }, { k: "maos4", r: "Mãos" },
  { k: "roupa1", r: "Roupa" }, { k: "roupa5", r: "Sapatos" }, { k: "banho2", r: "Banho" },
  { k: "cabelo", r: "Cabelo" }, { k: "desodorante", r: "Desodorante" }, { k: "remedio", r: "Remédio" },
  { k: "licao", r: "Lição" }, { k: "estudar", r: "Estudar" }, { k: "manta", r: "Manta" },
  { k: "bone", r: "Boné" }, { k: "ilib", r: "ILIB" }, { k: "placa", r: "Placa" },
  { k: "mochila", r: "Mochila" }, { k: "terapia", r: "Terapia" }, { k: "casa", r: "Casa" },
  { k: "comer1", r: "Refeição" }, { k: "brinq4", r: "Brinquedos" }, { k: "sapatos", r: "Guardar" },
  { k: "praia", r: "Praia" }, { k: "dormir4", r: "Dormir" }, { k: "comer3", r: "Água" },
  { k: "pet", r: "Pet" },
];

/* ================= rotinas ================= */
/* Cada tarefa tem três versões da mesma atividade. Não é o mesmo texto
   em fonte maior: a quebra dos passos e o tom mudam de verdade. */
const TAREFAS = [
  {
    id: "cama", nome: "Arrumar a cama", momento: "fds", horario: "09:00", dias: FDS, capa: "cama4", figurinha: "🛏️",
    n: {
      1: [
        { t: "Pegue o cobertor", d: "Com as duas mãos.", arte: "cama1" },
        { t: "Puxe para cima", d: "Até o travesseiro.", arte: "cama2" },
        { t: "Passe a mão", d: "Alise o cobertor.", arte: "cama2" },
        { t: "Pegue o travesseiro", d: "Ele é macio.", arte: "cama3" },
        { t: "Coloque no lugar", d: "Na cabeceira da cama.", arte: "cama3" },
        { t: "Ponha o bichinho", d: "Escolha um amiguinho.", arte: "cama4" },
      ],
      2: [
        { t: "Estique o cobertor", d: "Puxe o cobertor até o travesseiro.", arte: "cama1" },
        { t: "Alise com as mãos", d: "Passe a mão para tirar as dobras.", arte: "cama2" },
        { t: "Coloque o travesseiro", d: "Deixe o travesseiro na cabeceira.", arte: "cama3" },
        { t: "Ponha seu bichinho", d: "Escolha um bichinho para descansar ali.", arte: "cama4" },
      ],
      3: [
        { t: "Estique e alise o cobertor", d: "Do pé da cama até a cabeceira, sem dobras.", arte: "cama2" },
        { t: "Ajuste travesseiro e almofadas", d: "Alinhe tudo na cabeceira.", arte: "cama3" },
        { t: "Confira o resultado", d: "Olhe de longe: ficou do jeito que você queria?", arte: "cama4" },
      ],
    },
  },
  {
    id: "dentes", nome: "Escovar os dentes", momento: "manha", horario: "07:15", dias: TODOS, capa: "dentes3", figurinha: "🪥",
    n: {
      1: [
        { t: "Pegue a escova", d: "Ela está no copo.", arte: "dentes1" },
        { t: "Molhe a escova", d: "Só um pouquinho de água.", arte: "dentes1" },
        { t: "Coloque a pasta", d: "Do tamanho de uma ervilha.", arte: "dentes2" },
        { t: "Escove em cima", d: "Faça bolinhas devagar.", arte: "dentes3", tempo: 20 },
        { t: "Escove embaixo", d: "Agora os dentes de baixo.", arte: "dentes4", tempo: 20 },
        { t: "Cuspa na pia", d: "Toda a espuma.", arte: "dentes5" },
        { t: "Guarde a escova", d: "De volta para o copo.", arte: "dentes1" },
      ],
      2: [
        { t: "Pegue a escova", d: "Molhe as cerdas com um pouquinho de água.", arte: "dentes1" },
        { t: "Coloque a pasta", d: "Uma quantidade do tamanho de uma ervilha.", arte: "dentes2" },
        { t: "Escove os de cima", d: "Faça bolinhas com a escova, sem apertar.", arte: "dentes3", tempo: 30 },
        { t: "Escove os de baixo", d: "Um lado de cada vez.", arte: "dentes4", tempo: 30 },
        { t: "Bocheche e guarde", d: "Cuspa, beba um gole de água e guarde a escova.", arte: "dentes5" },
      ],
      3: [
        { t: "Prepare a escova", d: "Molhe as cerdas e use pasta do tamanho de uma ervilha.", arte: "dentes2" },
        { t: "Escove os quatro cantos", d: "Fora, dentro e as pontas. Dois minutos no total.", arte: "dentes3", tempo: 120 },
        { t: "Finalize", d: "Bocheche, lave a escova e deixe secando em pé.", arte: "dentes5" },
      ],
    },
  },
  {
    id: "maos", nome: "Lavar as mãos", momento: "clinica", horario: "11:50", dias: SEMANA, capa: "maos4", figurinha: "🫧",
    n: {
      1: [
        { t: "Abra a torneira", d: "Água morninha.", arte: "maos1" },
        { t: "Molhe as mãos", d: "As duas mãos.", arte: "maos2" },
        { t: "Pegue o sabonete", d: "Uma vez só.", arte: "maos3" },
        { t: "Esfregue as palmas", d: "Faça espuma.", arte: "maos4", tempo: 10 },
        { t: "Entre os dedos", d: "Um dedinho de cada vez.", arte: "maos4", tempo: 10 },
        { t: "Tire a espuma", d: "Na água da torneira.", arte: "maos5" },
        { t: "Seque na toalha", d: "Aperte bem.", arte: "maos6" },
      ],
      2: [
        { t: "Abra a torneira", d: "Água morninha, devagar.", arte: "maos1" },
        { t: "Molhe as mãos", d: "Deixe a água cobrir as duas mãos.", arte: "maos2" },
        { t: "Pegue o sabonete", d: "Uma vez só já é o bastante.", arte: "maos3" },
        { t: "Esfregue tudo", d: "Palma, dedos e entre os dedinhos.", arte: "maos4", tempo: 20 },
        { t: "Enxágue", d: "Tire toda a espuma na água.", arte: "maos5" },
        { t: "Seque na toalha", d: "Até as mãos ficarem secas.", arte: "maos6" },
      ],
      3: [
        { t: "Ensaboe as mãos", d: "Palmas, dorso, entre os dedos e as unhas.", arte: "maos4", tempo: 20 },
        { t: "Enxágue", d: "Até não sobrar nenhuma espuma.", arte: "maos5" },
        { t: "Seque e feche a torneira", d: "Mãos secas antes de sair do banheiro.", arte: "maos6" },
      ],
    },
  },
  {
    id: "roupa", nome: "Se arrumar", momento: "manha", horario: "07:00", dias: TODOS, capa: "roupa1", figurinha: "👕",
    n: {
      1: [
        { t: "Olhe a roupa", d: "Está tudo aqui.", arte: "roupa1" },
        { t: "Cabeça na camiseta", d: "Passe a cabeça pelo buraco maior.", arte: "roupa2" },
        { t: "Um braço", d: "Depois o outro braço.", arte: "roupa2" },
        { t: "Sente-se", d: "Sentado é mais fácil.", arte: "roupa3" },
        { t: "Vista a calça", d: "Uma perna de cada vez.", arte: "roupa3" },
        { t: "Calce as meias", d: "Primeiro os dedinhos.", arte: "roupa4" },
        { t: "Calce os sapatos", d: "E feche bem.", arte: "roupa5" },
      ],
      2: [
        { t: "Separe a roupa", d: "Deixe tudo na cama, na ordem de vestir.", arte: "roupa1" },
        { t: "Vista a camiseta", d: "Cabeça primeiro, depois um braço de cada vez.", arte: "roupa2" },
        { t: "Vista a calça", d: "Sente para colocar uma perna de cada vez.", arte: "roupa3" },
        { t: "Calce as meias", d: "Calcanhar no lugar certo.", arte: "roupa4" },
        { t: "Calce os sapatos", d: "Pé direito, pé esquerdo, e feche bem.", arte: "roupa5" },
      ],
      3: [
        { t: "Escolha a roupa do dia", d: "Veja o tempo lá fora e o que você vai fazer hoje.", arte: "roupa1" },
        { t: "Vista de cima para baixo", d: "Camiseta, calça, e etiquetas para dentro.", arte: "roupa2" },
        { t: "Meias e calçados", d: "Confira se está tudo fechado antes de sair.", arte: "roupa5" },
      ],
    },
  },
  {
    id: "brinq", nome: "Guardar brinquedos", momento: "fds", horario: "10:30", dias: FDS, capa: "brinq4", figurinha: "🧸",
    n: {
      1: [
        { t: "Olhe o chão", d: "O que está fora do lugar?", arte: "brinq1" },
        { t: "Traga a caixa", d: "Deixe ela aberta.", arte: "brinq2" },
        { t: "Pegue um brinquedo", d: "Só um por vez.", arte: "brinq3" },
        { t: "Coloque na caixa", d: "Pode contar em voz alta.", arte: "brinq3" },
        { t: "Guarde a caixa", d: "Na prateleira.", arte: "brinq4" },
      ],
      2: [
        { t: "Olhe o chão", d: "Veja quais brinquedos estão fora do lugar.", arte: "brinq1" },
        { t: "Abra a caixa", d: "Deixe a caixa aberta pertinho de você.", arte: "brinq2" },
        { t: "Guarde um por um", d: "Pode contar cada brinquedo em voz alta.", arte: "brinq3" },
        { t: "Coloque na prateleira", d: "A caixa volta para o lugar dela.", arte: "brinq4" },
      ],
      3: [
        { t: "Separe por tipo", d: "Blocos com blocos, carrinhos com carrinhos.", arte: "brinq1" },
        { t: "Guarde nas caixas certas", d: "Cada caixa na prateleira de sempre.", arte: "brinq3" },
        { t: "Deixe o caminho livre", d: "Nada no chão entre a porta e a cama.", arte: "brinq4" },
      ],
    },
  },
  {
    id: "comer", nome: "Almoçar", momento: "clinica", horario: "12:00", dias: SEMANA, capa: "comer1", figurinha: "🍽️",
    n: {
      1: [
        { t: "Lave as mãos", d: "Com sabonete.", arte: "maos4" },
        { t: "Sente na cadeira", d: "Pés no chão.", arte: "comer1" },
        { t: "Coma devagar", d: "Mastigue bem.", arte: "comer2" },
        { t: "Beba água", d: "Um copo.", arte: "comer3" },
        { t: "Leve o prato", d: "Até a pia.", arte: "comer4" },
      ],
      2: [
        { t: "Sente à mesa", d: "Pés no chão e costas no encosto.", arte: "comer1" },
        { t: "Coma devagar", d: "Mastigue bem antes da próxima garfada.", arte: "comer2" },
        { t: "Beba água", d: "Um copo durante a refeição.", arte: "comer3" },
        { t: "Leve o prato", d: "Leve seu prato até a pia.", arte: "comer4" },
      ],
      3: [
        { t: "Prepare seu lugar", d: "Prato, copo e talheres antes de sentar.", arte: "comer1" },
        { t: "Coma com calma", d: "Pouse o garfo entre uma garfada e outra.", arte: "comer2" },
        { t: "Recolha e limpe", d: "Prato na pia e mesa sem migalhas.", arte: "comer4" },
      ],
    },
  },
  {
    id: "banho", nome: "Tomar banho", momento: "noite", horario: "19:00", dias: TODOS, duracao: 15, capa: "banho2", figurinha: "🚿",
    n: {
      1: [
        { t: "Tire a roupa", d: "Deixe no cesto.", arte: "banho1" },
        { t: "Teste a água", d: "Com a mão primeiro.", arte: "banho1" },
        { t: "Molhe o corpo", d: "Todo o corpo.", arte: "banho1" },
        { t: "Passe sabonete", d: "Braços e barriga.", arte: "banho2", tempo: 15 },
        { t: "Lave o cabelo", d: "Massageie a cabeça.", arte: "banho3", tempo: 15 },
        { t: "Tire a espuma", d: "Com bastante água.", arte: "banho4" },
        { t: "Seque com a toalha", d: "Cabelo e corpo.", arte: "banho5" },
      ],
      2: [
        { t: "Entre no chuveiro", d: "Teste a água antes com a mão.", arte: "banho1" },
        { t: "Passe o sabonete", d: "Braços, barriga, pernas e pés.", arte: "banho2" },
        { t: "Lave o cabelo", d: "Massageie a cabeça com as pontas dos dedos.", arte: "banho3", tempo: 20 },
        { t: "Enxágue tudo", d: "Até não ficar mais espuma.", arte: "banho4" },
        { t: "Seque com a toalha", d: "Cabelo, corpo e entre os dedos do pé.", arte: "banho5" },
      ],
      3: [
        { t: "Lave o corpo", d: "Incluindo pescoço, axilas e pés.", arte: "banho2", tempo: 30 },
        { t: "Lave o cabelo e enxágue", d: "Shampoo no couro cabeludo, não só nas pontas.", arte: "banho3", tempo: 30 },
        { t: "Seque e organize", d: "Toalha no varal e roupa suja no cesto.", arte: "banho5" },
      ],
    },
  },
  {
    id: "dormir", nome: "Hora de dormir", momento: "noite", horario: "21:30", dias: TODOS, capa: "dormir4", figurinha: "🌙",
    n: {
      1: [
        { t: "Vista o pijama", d: "O mais confortável.", arte: "dormir1" },
        { t: "Guarde a roupa", d: "No cesto.", arte: "dormir1" },
        { t: "Diminua a luz", d: "Só o abajur.", arte: "dormir2" },
        { t: "Deite e respire", d: "Devagar, cinco vezes.", arte: "dormir3", tempo: 20 },
        { t: "Boa noite", d: "Feche os olhinhos.", arte: "dormir4" },
      ],
      2: [
        { t: "Vista o pijama", d: "A roupa mais confortável do dia.", arte: "dormir1" },
        { t: "Deixe a luz baixinha", d: "Só o abajur aceso.", arte: "dormir2" },
        { t: "Deite e respire", d: "Puxe o ar devagar e solte, cinco vezes.", arte: "dormir3", tempo: 30 },
        { t: "Boa noite", d: "Feche os olhos. Amanhã tem mais.", arte: "dormir4" },
      ],
      3: [
        { t: "Prepare o quarto", d: "Pijama, luz baixa e telas desligadas.", arte: "dormir2" },
        { t: "Respiração longa", d: "Inspire em 4, segure 4, solte em 6.", arte: "dormir3", tempo: 60 },
        { t: "Durma", d: "Se a cabeça acelerar, volte à respiração.", arte: "dormir4" },
      ],
    },
  },

  /* ---------- rotina real, montada com o responsável ---------- */
  { id: "cabelo", nome: "Pentear o cabelo", momento: "manha", horario: "07:20", dias: TODOS, capa: "cabelo", figurinha: "💇",
    passos: [{ t: "Pentear o cabelo", d: "Comece pelas pontas e vá subindo, sem puxar.", arte: "cabelo" }] },
  { id: "desodorante", nome: "Passar desodorante", momento: "manha", horario: "07:25", dias: TODOS, capa: "desodorante", figurinha: "🧴",
    passos: [{ t: "Passar desodorante", d: "Nas duas axilas, com a pele seca.", arte: "desodorante" }] },
  { id: "remedio_manha", nome: "Remédios da manhã", momento: "manha", horario: "07:30", dias: TODOS, capa: "remedio", figurinha: "💊",
    passos: [{ t: "Tomar os remédios", d: "Confira com o adulto e beba água depois.", arte: "remedio" }] },

  { id: "trocar", nome: "Se trocar", momento: "clinica", horario: "12:40", dias: SEMANA, capa: "roupa2", figurinha: "🔁",
    passos: [
      { t: "Tirar a roupa de casa", d: "Uma peça de cada vez.", arte: "roupa1" },
      { t: "Vestir a roupa daqui", d: "Camiseta primeiro, depois a calça.", arte: "roupa2" },
    ] },
  { id: "mochila", nome: "Guardar a roupa na mochila", momento: "clinica", horario: "12:50", dias: SEMANA, capa: "mochila", figurinha: "🎒",
    passos: [
      { t: "Dobrar a roupa", d: "Dobre ao meio, sem pressa.", arte: "roupa1" },
      { t: "Guardar na mochila", d: "No bolso grande, e feche o zíper.", arte: "mochila" },
    ] },
  { id: "terapia", nome: "Terapia", momento: "clinica", horario: "13:30", dias: SEMANA, capa: "terapia", figurinha: "🧩",
    passos: [
      { t: "Ir para a sala", d: "O adulto mostra qual é a sala de hoje.", arte: "casa" },
      { t: "Fazer a atividade", d: "Um combinado de cada vez.", arte: "terapia" },
      { t: "Guardar o material", d: "Cada coisa no lugar antes de sair.", arte: "brinq4" },
    ] },
  { id: "ir_casa", nome: "Hora de ir pra casa", momento: "clinica", horario: "17:00", dias: SEMANA, capa: "casa", figurinha: "🏠",
    passos: [
      { t: "Pegar a mochila", d: "Confira se está tudo dentro.", arte: "mochila" },
      { t: "Despedida", d: "Tchau para quem ficou.", arte: "casa" },
    ] },

  { id: "licao", nome: "Lição de casa", momento: "noite", horario: "18:30", dias: SEMANA, duracao: 20, capa: "licao", figurinha: "📓",
    passos: [
      { t: "Separar o material", d: "Caderno, lápis e o que a professora pediu.", arte: "licao" },
      { t: "Fazer a lição", d: "Uma questão por vez. Pode parar e voltar.", arte: "licao", tempo: 900 },
      { t: "Guardar na mochila", d: "Lição feita já volta para a mochila.", arte: "mochila" },
    ] },
  { id: "estudar", nome: "Estudar para a prova", momento: "noite", horario: "18:00", dias: SEMANA, prova: true, duracao: 40, capa: "estudar", figurinha: "📚",
    passos: [
      { t: "Abrir o material", d: "Só a matéria da prova, o resto fica fechado.", arte: "estudar" },
      { t: "Estudar um bloco", d: "Leia e diga em voz alta o que entendeu.", arte: "estudar", tempo: 900 },
      { t: "Pausa", d: "Levante, beba água, respire.", arte: "comer3", tempo: 300 },
      { t: "Mais um bloco", d: "Agora a parte que ficou difícil.", arte: "estudar", tempo: 900 },
    ] },
  { id: "manta", nome: "Manta", momento: "noite", horario: "19:30", dias: TODOS, duracao: 20, capa: "manta", figurinha: "🟪",
    passos: [{ t: "Sessão da manta", d: "Deite, ajeite a manta e fique quietinho até o tempo acabar.", arte: "manta", tempo: 1200 }] },
  { id: "bone", nome: "Boné", momento: "noite", horario: "19:55", dias: TODOS, duracao: 20, capa: "bone", figurinha: "🧢",
    passos: [{ t: "Sessão do boné", d: "Coloque o boné ajustado e espere o tempo passar.", arte: "bone", tempo: 1200 }] },
  { id: "ilib", nome: "ILIB", momento: "noite", horario: "20:20", dias: TODOS, duracao: 30, capa: "ilib", figurinha: "🔦",
    passos: [{ t: "Sessão de ILIB", d: "Braço apoiado e parado até o tempo terminar.", arte: "ilib", tempo: 1800 }] },
  { id: "placa", nome: "Colocar a placa", momento: "noite", horario: "20:50", dias: TODOS, capa: "placa", figurinha: "🦷",
    passos: [
      { t: "Lavar a placa", d: "Água corrente antes de colocar.", arte: "placa" },
      { t: "Encaixar a placa", d: "Morda devagar até encaixar sozinha.", arte: "placa" },
    ] },
  { id: "remedio_noite", nome: "Remédios da noite", momento: "noite", horario: "21:10", dias: TODOS, capa: "remedio", figurinha: "💊",
    passos: [{ t: "Tomar os remédios", d: "Confira com o adulto e beba água depois.", arte: "remedio" }] },
  { id: "separar_roupa", nome: "Separar a roupa de amanhã", momento: "noite", horario: "21:15", dias: SEMANA, capa: "roupa1", figurinha: "👖",
    passos: [
      { t: "Escolher a roupa", d: "Veja a previsão do tempo para amanhã.", arte: "roupa1" },
      { t: "Deixar separada", d: "Na cadeira, na ordem de vestir.", arte: "roupa1" },
    ] },

  { id: "pet", nome: "Passear com o pet", momento: "noite", horario: "17:45", dias: TODOS, duracao: 20, capa: "pet", figurinha: "🐕",
    passos: [
      { t: "Colocar a coleira", d: "Chame o pet com calma e prenda a guia.", arte: "pet" },
      { t: "Passear", d: "Segure a guia firme e volte no horário combinado.", arte: "pet" },
      { t: "Guardar a guia", d: "Coleira e guia no lugar de sempre.", arte: "pet" },
    ] },

  { id: "sapatos", nome: "Guardar os sapatos", momento: "fds", horario: "10:15", dias: FDS, capa: "sapatos", figurinha: "👟",
    passos: [
      { t: "Juntar os pares", d: "Cada sapato com o seu par.", arte: "roupa5" },
      { t: "Colocar na prateleira", d: "Lado a lado, com a ponta para fora.", arte: "sapatos" },
    ] },
  { id: "praia", nome: "Ir à praia", momento: "fds", horario: "16:00", dias: FDS, duracao: 30, capa: "praia", figurinha: "🏖️",
    passos: [
      { t: "Escolher o tempo de hoje", d: "Combine antes de sair de casa.", arte: "praia", opcoes: [900, 1800] },
      { t: "Voltar quando o tempo acabar", d: "O combinado vale, mesmo se estiver bom.", arte: "casa" },
    ] },
];

/* A escovação da noite reaproveita os mesmos passos da manhã. */
TAREFAS.push({
  ...TAREFAS.find((t) => t.id === "dentes"),
  id: "dentes_noite", momento: "noite", horario: "21:00", dias: TODOS,
});



/* ================= trilha ================= */
function Trilha({ total, atual, avatarId }) {
  const passoX = total > 1 ? 84 / (total - 1) : 0;
  const y = (i) => 52 + (i % 2 === 0 ? 0 : -9);
  const x = (i) => 8 + i * passoX;
  const i0 = Math.min(atual, total - 1);
  return (
    <div className="trilha" aria-hidden="true">
      <svg viewBox="0 0 100 78" preserveAspectRatio="none">
        <path d={`M${x(0)} ${y(0)} ` + Array.from({ length: total - 1 }, (_, i) => `L${x(i + 1)} ${y(i + 1)}`).join(" ")}
          stroke="#CFE0DC" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeDasharray="0.5 5" vectorEffect="non-scaling-stroke" />
        {Array.from({ length: total }, (_, i) => (
          <ellipse key={i} cx={x(i)} cy={y(i)} rx="3.1" ry="2.4"
            fill={i < atual ? "#78BE9B" : i === atual ? "#F2A65A" : "#DCE8E5"} />
        ))}
      </svg>
      <div className="andarilho" style={{
        position: "absolute", left: 0, top: 0,
        transform: `translateX(calc(${x(i0)}% - 17px)) translateY(${y(i0) - 40}px)`,
      }}>
        <Avatar id={avatarId} tam={34} />
      </div>
    </div>
  );
}

/* ================= ampulheta ================= */
function Ampulheta({ segundos, chave, som }) {
  const [resta, setResta] = useState(segundos);
  const somRef = useRef(som);
  somRef.current = som;
  useEffect(() => {
    /* Sem isto a tela apaga no meio de uma sessão de 20 ou 30 minutos. */
    KeepAwake.keepAwake().catch(() => {});
    return () => { KeepAwake.allowSleep().catch(() => {}); };
  }, []);

  useEffect(() => {
    setResta(segundos);
    const id = setInterval(() => {
      setResta((r) => {
        if (r <= 1) { clearInterval(id); tocar([[880, 0]], somRef.current); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [segundos, chave]);
  const R = 26, vol = 2 * Math.PI * R;
  const frac = segundos ? resta / segundos : 0;
  return (
    <div className="relogio">
      <svg width="66" height="66" viewBox="0 0 66 66" aria-hidden="true">
        <circle className="anel-fundo" cx="33" cy="33" r={R} fill="none" strokeWidth="7" />
        <circle className="anel-frente" cx="33" cy="33" r={R} fill="none" strokeWidth="7"
          strokeDasharray={vol} strokeDashoffset={vol * (1 - frac)} transform="rotate(-90 33 33)" />
        <text x="33" y="39" textAnchor="middle" fontFamily="Baloo 2, sans-serif"
          fontSize={resta >= 60 ? 15 : 18} fontWeight="700" fill="#2F6B62">
          {resta >= 60 ? `${Math.floor(resta / 60)}:${String(resta % 60).padStart(2, "0")}` : resta}
        </text>
      </svg>
      <span className="relogio-num">{resta > 0 ? "Continue até o zero" : "Pode seguir!"}</span>
    </div>
  );
}

/* ================= app ================= */
const PADRAO = {
  nome: "amigo", avatar: "a", nivel: null, estrelas: 0,
  feitos: {}, autonomia: {}, hoje: [], dia: "", calmo: false, som: true,
  ajustes: {}, custom: [], prova: false, diario: [],
};

/* A lista viva de tarefas: as de fábrica com os ajustes do responsável
   aplicados por cima, mais as que ele criou. */
function todasTarefas(d) {
  const base = TAREFAS.map((t) => ({ ...t, ...(d.ajustes || {})[t.id] }));
  return [...base, ...(d.custom || [])];
}
function passosDe(t, nivel) {
  const base = t.n ? t.n[nivel] : t.passos || [];
  if (!t.duracao) return base;
  /* A duração da tarefa vira o cronômetro do passo principal:
     o único passo, ou o primeiro que ainda não tem tempo próprio. */
  const jaTemTempo = base.some((p) => p.tempo);
  if (jaTemTempo) return base;
  const alvo = base.length === 1 ? 0 : Math.min(1, base.length - 1);
  return base.map((p, i) => (i === alvo ? { ...p, tempo: t.duracao * 60 } : p));
}
function minutos(seg) {
  if (seg < 60) return seg + "s";
  const m = Math.floor(seg / 60), r = seg % 60;
  return r ? `${m}min${r}` : `${m} min`;
}
function ordemHorario(a, b) {
  return (a.horario || "99:99").localeCompare(b.horario || "99:99");
}
function resumoDias(dias) {
  if (!dias || dias.length === 7) return "Todos os dias";
  if (dias.length === 5 && SEMANA.every((x) => dias.includes(x))) return "Dias de aula";
  if (dias.length === 2 && FDS.every((x) => dias.includes(x))) return "Fim de semana";
  return dias.map((i) => DIAS_NOME[i].slice(0, 3)).join(", ");
}
/* Tarefa de fábrica guarda só o ajuste; tarefa criada guarda tudo. */
function ehFixa(id) {
  return TAREFAS.some((t) => t.id === id);
}
function paraRascunho(t) {
  return {
    id: t.id, nome: t.nome, momento: t.momento, horario: t.horario || "08:00",
    dias: [...(t.dias || TODOS)], prova: !!t.prova, capa: t.capa, duracao: t.duracao || 0,
    passos: t.passos ? t.passos.map((p) => ({ ...p })) : [{ t: "", d: "" }],
    fixa: ehFixa(t.id), novo: false,
  };
}
function novaTarefa(momento) {
  return {
    id: "u" + Date.now(), nome: "", momento, horario: "08:00", dias: [...TODOS],
    prova: false, capa: "terapia", duracao: 0, passos: [{ t: "", d: "" }], fixa: false, novo: true,
  };
}
function gravar(d, r) {
  if (r.fixa) {
    return { ...d, ajustes: { ...d.ajustes, [r.id]: { ...(d.ajustes[r.id] || {}), momento: r.momento, horario: r.horario, dias: r.dias, prova: r.prova, duracao: r.duracao || undefined } } };
  }
  const limpa = {
    id: r.id, nome: r.nome.trim() || "Nova tarefa", momento: r.momento, horario: r.horario,
    dias: r.dias.length ? r.dias : [...TODOS], prova: r.prova, capa: r.capa, figurinha: "⭐",
    duracao: r.duracao || undefined,
    passos: r.passos.filter((p) => p.t.trim()).map((p) => ({ ...p, t: p.t.trim(), d: (p.d || "").trim() })),
  };
  if (!limpa.passos.length) limpa.passos = [{ t: limpa.nome, d: "" }];
  const custom = d.custom || [];
  const existe = custom.some((t) => t.id === r.id);
  return { ...d, custom: existe ? custom.map((t) => (t.id === r.id ? limpa : t)) : [...custom, limpa] };
}
function ajustar(d, t, mudanca) {
  if (ehFixa(t.id)) return { ajustes: { ...d.ajustes, [t.id]: { ...(d.ajustes[t.id] || {}), ...mudanca } } };
  return { custom: (d.custom || []).map((x) => (x.id === t.id ? { ...x, ...mudanca } : x)) };
}

export default function App() {
  const [d, setD] = useState(PADRAO);
  const [carregado, setCarregado] = useState(false);
  const [abertura, setAbertura] = useState("visivel");
  const [tela, setTela] = useState("casa");
  const [momento, setMomento] = useState("manha");
  const [rascunho, setRascunho] = useState(null);
  const [escolhido, setEscolhido] = useState(null);
  const [avisos, setAvisos] = useState(false);
  const [tarefaId, setTarefaId] = useState(null);
  const [passo, setPasso] = useState(0);
  const [marcados, setMarcados] = useState([]);
  const [cronometro, setCronometro] = useState(null);
  const [perguntaAuto, setPerguntaAuto] = useState(false);
  const [festa, setFesta] = useState(null);
  const [pulso, setPulso] = useState(false);
  const [faiscas, setFaiscas] = useState(0);
  const [modal, setModal] = useState(null);
  const [contatos, setContatos] = useState(PADRAO_CONTATOS);
  const [fichaContato, setFichaContato] = useState(null);
  const [apoio, setApoio] = useState(APOIO_PADRAO);
  const [pausa, setPausa] = useState(false);
  const [pausaIdx, setPausaIdx] = useState(0);
  /* A frase que a criança montou na prancha, para o pedido de ajuda sair com
     as palavras dela em vez da mensagem padrão. */
  const [fraseDita, setFraseDita] = useState("");

  const hojeStr = new Date().toISOString().slice(0, 10);
  const abertoEm = useRef(Date.now());

  useEffect(() => {
    (async () => {
      let calmo = false;
      try {
        const r = await storage.get("combinado_v1");
        if (r) {
          const s = JSON.parse(r.value);
          calmo = !!s.calmo;
          setD({ ...PADRAO, ...s, hoje: s.dia === hojeStr ? s.hoje || [] : [], dia: hojeStr });
        }
      } catch (e) {}
      try { setContatos(await carregarContatos()); } catch (e) {}
      try {
        const a = await carregarApoio();
        /* O "modo calmo" nasceu como chave do estado do app, antes de existir
           perfil de apoio. Agora o modo calmo tem uma fonte só — os ajustes —
           então a escolha antiga do responsável sobe para lá, uma vez. */
        if (calmo && !("calmo" in (a.manual || {}))) {
          const migrado = { ...a, manual: { ...(a.manual || {}), calmo: true } };
          setApoio(migrado);
          gravarApoio(migrado);
        } else {
          setApoio(a);
        }
        calmo = derivarAjustes(a).calmo || calmo;
      } catch (e) {}
      setCarregado(true);
      try { setAvisos(await avisosLigados()); } catch (e) {}
      /* A abertura também é animação: em modo calmo ela passa rápido. */
      const espera = calmo ? 700 : 2500;
      setTimeout(() => setAbertura("saindo"), espera);
      setTimeout(() => setAbertura("oculta"), espera + 600);
    })();
    const agora = new Date(), h = agora.getHours(), dia = agora.getDay();
    setMomento(dia === 0 || dia === 6 ? "fds" : h < 11 ? "manha" : h < 17.5 ? "clinica" : "noite");
  }, []);

  /* Gesto de voltar do Android: sem isto o app fecha no meio de uma tarefa. */
  useEffect(() => {
    let remover;
    AppNativo.addListener("backButton", () => {
      if (festa) { setFesta(null); setTela("casa"); }
      else if (modal) setModal(null);
      else if (perguntaAuto) setPerguntaAuto(false);
      else if (fichaContato) setFichaContato(null);
      else if (tela === "editar") { setRascunho(null); setTela("rotinas"); }
      else if (pausa) setPausa(false);
      else if (tela === "rotinas" || tela === "contatos" || tela === "apoio") setTela("pais");
      else if (tela === "prancha" || tela === "sentimentos") setTela("casa");
      else if (tela !== "casa") setTela("casa");
      else AppNativo.exitApp();
    }).then((h) => { remover = () => h.remove(); }).catch(() => {});
    return () => { if (remover) remover(); };
  }, [tela, festa, modal, perguntaAuto, fichaContato, pausa]);

  const salvar = useCallback((novo) => {
    setD(novo);
    (async () => {
      try { await storage.set("combinado_v1", JSON.stringify(novo)); } catch (e) {}
      try { reprogramar(todasTarefas(novo)); } catch (e) {}
    })();
  }, []);

  /* Contatos moram numa chave própria: telefone é dado de outra pessoa, e a
     chave separada deixa o apagamento ser uma operação só. */
  const salvarContatos = useCallback((novo) => {
    setContatos(novo);
    gravarContatos(novo);
  }, []);

  /* O perfil de apoio também tem chave própria, e pelo mesmo motivo com mais
     força: é informação de saúde de criança. Apagar tem de ser uma operação
     só, sem arrastar o resto do estado. */
  const salvarApoio = useCallback((novo) => {
    setApoio(novo);
    gravarApoio(novo);
  }, []);

  /* Liga ou desliga um ajuste à mão. Vira escolha do responsável e passa a
     vencer a derivação, hoje e depois de qualquer edição do perfil. */
  const mexerAjuste = useCallback((chave, valor) => {
    setApoio((a) => {
      const novo = { ...a, manual: { ...(a.manual || {}), [chave]: valor } };
      gravarApoio(novo);
      return novo;
    });
  }, []);

  /* Os ajustes do perfil de apoio. Nenhuma tela consulta a lista de condições:
     tudo que a interface vê é este objeto. */
  const aj = derivarAjustes(apoio);

  /* O nível por idade continua definindo o texto e o tamanho dos passos. O
     perfil de apoio mexe na estrutura e na recompensa, por cima dele. */
  const NBase = NIVEIS[d.nivel || 2];
  const N = {
    ...NBase,
    /* Um passo por tela derruba a lista livre do nível 3: a criança recebe a
       trilha guiada com o texto dela, não o texto de uma criança menor. */
    listaLivre: NBase.listaLivre && !aj.passoUnico,
    porPasso: aj.reforcoDenso ? NBase.porPasso * 2 : NBase.porPasso,
    bonus: aj.reforcoDenso ? NBase.bonus * 2 : NBase.bonus,
  };

  /* O botão de chamar só existe se houver alguém para chamar: um botão que não
     faz nada é pior do que botão nenhum para quem está pedindo ajuda. */
  const temAdultos = visiveisParaCrianca(comClinica(contatos, marca())).length > 0;
  const lista = todasTarefas(d);
  const tarefa = lista.find((t) => t.id === tarefaId);
  const passos = tarefa ? passosDe(tarefa, N.id) : [];
  const diaSemana = new Date().getDay();

  function abrir(id) {
    setTarefaId(id); setPasso(0); setMarcados([]); setCronometro(null); setEscolhido(null);
    setPerguntaAuto(false); setTela("tarefa");
  }

  /* A voz lê o passo que está na tela. Tudo que ela fala também está escrito:
     a narração é apoio, nunca o único caminho. */
  const passoAtual = passos[passo];
  useEffect(() => {
    if (!aj.voz || tela !== "tarefa" || N.listaLivre || !passoAtual) return;
    falar(passoAtual.d ? `${passoAtual.t}. ${passoAtual.d}` : passoAtual.t);
  }, [aj.voz, tela, N.listaLivre, passoAtual?.t, passoAtual?.d]);

  /* Sair da tarefa cala a voz: ninguém quer ouvir o passo anterior na casa. */
  useEffect(() => {
    if (tela !== "tarefa") calar();
  }, [tela]);

  function premiar(extra) {
    setPulso(true); setTimeout(() => setPulso(false), 500);
    return extra;
  }

  function fecharTarefa(comAutonomia) {
    const feitos = { ...d.feitos, [tarefa.id]: (d.feitos[tarefa.id] || 0) + 1 };
    const auto = { ...d.autonomia };
    if (comAutonomia !== undefined) {
      const a = auto[tarefa.id] || { sozinho: 0, total: 0 };
      auto[tarefa.id] = { sozinho: a.sozinho + (comAutonomia ? 1 : 0), total: a.total + 1 };
    }
    const hoje = d.hoje.includes(tarefa.id) ? d.hoje : [...d.hoje, tarefa.id];
    salvar({ ...d, estrelas: d.estrelas + N.bonus, feitos, autonomia: auto, hoje, dia: hojeStr });
    tocar(N.confete ? SOM_FESTA : SOM_SECO, d.som);
    setPerguntaAuto(false);
    setFesta(tarefa);
  }

  /* modo trilha — níveis 1 e 2 */
  function concluirPasso() {
    tocar(SOM_PASSO, d.som);
    premiar();
    if (N.faisca) setFaiscas((f) => f + 1);
    if (passo + 1 < passos.length) {
      salvar({ ...d, estrelas: d.estrelas + N.porPasso });
      setPasso(passo + 1);
    } else {
      fecharTarefa();
    }
  }

  /* modo lista — nível 3 */
  function alternar(i) {
    const novo = marcados.includes(i) ? marcados.filter((x) => x !== i) : [...marcados, i];
    setMarcados(novo);
    if (!marcados.includes(i)) {
      tocar(SOM_PASSO, d.som);
      premiar();
      salvar({ ...d, estrelas: d.estrelas + N.porPasso });
      if (novo.length === passos.length) setTimeout(() => setPerguntaAuto(true), 350);
    }
  }

  const doMomento = lista
    .filter((t) => t.momento === momento && !t.oculta)
    .filter((t) => !t.dias || t.dias.includes(diaSemana))
    .filter((t) => !t.prova || d.prova)
    .sort(ordemHorario);

  /* Limite de cartões por tela: as pendentes primeiro, para a tela cortar o
     que já foi feito antes de cortar o que falta fazer. */
  const daVez = aj.cartoes
    ? [
      ...doMomento.filter((t) => !d.hoje.includes(t.id)),
      ...doMomento.filter((t) => d.hoje.includes(t.id)),
    ].slice(0, aj.cartoes)
    : doMomento;

  const proxima = daVez.find((t) => !d.hoje.includes(t.id));
  const cls = "rt nv" + N.id
    + (aj.calmo ? " calmo" : "")
    + (aj.leitura ? " leitura" : "")
    + (aj.contraste ? " contraste" : "");

  const Abertura = abertura !== "oculta" && (
    <div className="abertura" data-saindo={abertura === "saindo" ? 1 : 0} aria-hidden="true">
      <div>
        <div className="logo-entra"><LogoMarca tamanho="grande" /></div>
        <p className="abertura-linha">
          Rotina passo a passo<br />
          <span style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase" }}>
            Apoio ao desenvolvimento
          </span>
        </p>
      </div>
    </div>
  );

  if (!carregado) return <div className="rt"><style>{CSS}</style>{Abertura}</div>;

  /* ---------- onboarding ---------- */
  if (!d.nivel) {
    return (
      <div className="rt nv2">
        <style>{CSS}</style>
        {Abertura}
        <div className="tela">
          <div style={{ paddingTop: 10 }}><LogoMarca tamanho="pequeno" /></div>
          <div style={{ textAlign: "center" }}>
            <Avatar id="a" tam={78} />
            <h1 className="nome" style={{ fontSize: 27, marginTop: 10 }}>Quantos anos tem a criança?</h1>
            <p className="folha-sub" style={{ marginTop: 8 }}>
              A idade define o tamanho de cada passo, o jeito de falar e como o jogo comemora.
              Dá para trocar depois.
            </p>
          </div>
          <div className="niveis">
            {[1, 2, 3].map((k) => (
              <button key={k} className="nivel" onClick={() => salvar({ ...d, nivel: k, dia: hojeStr })}>
                <span className="nivel-idade">{NIVEIS[k].idade}<small>ANOS</small></span>
                <span>
                  <span className="nivel-nome">{NIVEIS[k].nome}</span>
                  <span className="nivel-desc">{NIVEIS[k].resumo}</span>
                </span>
              </button>
            ))}
          </div>
          <p className="aviso">
            Na dúvida entre dois níveis, comece pelo menor. Subir de nível vira uma conquista;
            descer costuma frustrar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cls}>
      <style>{CSS}</style>
      {Abertura}

      {/* ---------- CASA ---------- */}
      {tela === "casa" && (
        <div className="tela">
          <header className="topo">
            <button className="btn-avatar" onClick={() => setModal("perfil")} aria-label="Trocar personagem">
              <Avatar id={d.avatar} tam={52} />
            </button>
            <div className="topo-txt">
              <div className="saudacao">Sua rotina</div>
              <h1 className="nome">Oi, {d.nome}!</h1>
              <span className="selo-nivel">{N.nome} · {N.idade} anos</span>
            </div>
            <div className={"pote" + (pulso ? " pulso" : "")} aria-label={`${d.estrelas} ${N.moeda}`}>
              <Estrela tam={21} /> {d.estrelas}
            </div>
          </header>

          <div className="abas" role="tablist">
            {MOMENTOS.map((p) => (
              <button key={p.id} role="tab" aria-selected={momento === p.id} data-on={momento === p.id ? 1 : 0}
                className="aba" onClick={() => setMomento(p.id)}>
                <span aria-hidden="true">{p.icone}</span>{p.nome}
              </button>
            ))}
          </div>

          {(aj.pausaCorpo || aj.sentimentos) && (
            <div className="atalhos">
              {aj.pausaCorpo && (
                <button className="btn-pausa" onClick={() => setPausa(true)}>
                  Preciso mexer o corpo
                </button>
              )}
              {aj.sentimentos && (
                <button className="btn-sentir" onClick={() => setTela("sentimentos")}>
                  Como eu estou
                </button>
              )}
            </div>
          )}

          {d.prova && momento === "noite" && (
            <div className="faixa-prova">📚 Semana de prova — o estudo entra na rotina</div>
          )}

          <div className="grade">
            {daVez.map((t, i) => {
              const ps = passosDe(t, N.id);
              return (
                <button key={t.id} className="cartao" data-agora={proxima && proxima.id === t.id ? 1 : 0}
                  style={{ animationDelay: `${i * 70}ms` }} onClick={() => abrir(t.id)}>
                  {d.hoje.includes(t.id) && <span className="selo-ok" aria-label="Feito hoje">✓</span>}
                  <div className="cartao-arte"><Cena nome={t.capa} /></div>
                  <div className="cartao-txt">
                    {t.horario && <span className="cartao-hora">{t.horario}</span>}
                    <span className="cartao-nome">{t.nome}</span>
                    <span className="cartao-rodape">
                      <Estrela tam={13} /> {ps.length * N.porPasso + N.bonus} {N.moeda}
                      {t.duracao ? ` · ${t.duracao} min` : ` · ${ps.length} ${ps.length === 1 ? "passo" : "passos"}`}
                    </span>
                  </div>
                </button>
              );
            })}
            {daVez.length === 0 && (
              <p className="vazio">
                Nada marcado para {MOMENTOS.find((m) => m.id === momento).nome.toLowerCase()} n{"a"} {DIAS_NOME[diaSemana]}.
                O responsável pode adicionar tarefas na área dele.
              </p>
            )}
          </div>

          <div className="rodape">
            <button className="btn-rodape" onClick={() => setTela("album")}>⭐ Meu álbum</button>
            <SegurarPais onAbrir={() => setTela("pais")} />
          </div>

          <div className="assinatura">
            <Monograma tam={26} />
            <span className="assinatura-txt">
              Organizador visual de rotinas<br />
              <b>{marca().nome}</b>{marca().rodape ? ` · ${marca().rodape}` : ""}
            </span>
          </div>

          {/* Os dois botões que precisam estar sempre no mesmo lugar: pedir
              ajuda e dizer o que quer. Nada de menu para encontrar. */}
          {(temAdultos || aj.prancha) && (
            <div className="fixos">
              {temAdultos && (
                <button className="chamar" onClick={() => setTela("adultos")}>
                  <Mao /> Chamar
                </button>
              )}
              {aj.prancha && (
                <button className="chamar prancha-btn" onClick={() => setTela("prancha")}>
                  <Grade /> Prancha
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ---------- MEUS ADULTOS ---------- */}
      {tela === "adultos" && (
        <Adultos contatos={contatos} nivel={N.id} frase={fraseDita}
          voltar={() => { setFraseDita(""); setTela("casa"); }} />
      )}

      {/* ---------- PRANCHA DE COMUNICAÇÃO ---------- */}
      {tela === "prancha" && (
        <Prancha temAdultos={temAdultos} alto={aj.contraste}
          voltar={() => setTela("casa")}
          aoChamar={(texto) => { setFraseDita(texto); setTela("adultos"); }} />
      )}

      {/* ---------- COMO EU ESTOU ---------- */}
      {tela === "sentimentos" && (
        <Sentimentos nivel={N.id} voz={aj.voz} temAdultos={temAdultos}
          voltar={() => setTela("casa")}
          aoChamar={(texto) => { setFraseDita(texto); setTela("adultos"); }}
          aoRegistrar={(id) => {
            const novo = [...(d.diario || []), { e: id, dia: hojeStr }].slice(-90);
            salvar({ ...d, diario: novo });
          }} />
      )}

      {/* ---------- TAREFA ---------- */}
      {tela === "tarefa" && tarefa && (
        <div className="tela">
          <div className="barra">
            <button className="btn-x" onClick={() => setTela("casa")} aria-label="Voltar para a lista">✕</button>
            <span className="barra-titulo">{tarefa.nome}</span>
            {/* Travar num passo é exatamente quando ela precisa de alguém. */}
            {temAdultos && (
              <button className="chamar-barra" onClick={() => setTela("adultos")} aria-label="Chamar um adulto">
                <Mao tam={22} cor="#E8879B" />
              </button>
            )}
            <span className="contador">
              {N.listaLivre ? `${marcados.length}/${passos.length}` : `${passo + 1}/${passos.length}`}
            </span>
          </div>

          {!N.listaLivre && (
            <>
              {aj.antecipacao && passos[passo] && (
                <Antecipacao
                  agora={passos[passo].t}
                  depois={passos[passo + 1] ? passos[passo + 1].t : "acabou"}
                />
              )}
              <Trilha total={passos.length} atual={passo} avatarId={d.avatar} />
              <div className="palco">
                <div className="quadro passo-troca" key={passo}><Cena nome={passos[passo].arte} /></div>
                <h2 className="passo-titulo">{passos[passo].t}</h2>
                <p className="passo-dica">{passos[passo].d}</p>
                {passos[passo].tempo && (
                  <Ampulheta segundos={passos[passo].tempo} chave={`${tarefa.id}-${passo}`} som={d.som} />
                )}
                {passos[passo].opcoes && (
                  <div className="opcoes">
                    {passos[passo].opcoes.map((seg) => (
                      <button key={seg} data-on={escolhido === seg ? 1 : 0} onClick={() => setEscolhido(seg)}>
                        {minutos(seg)}
                      </button>
                    ))}
                  </div>
                )}
                {passos[passo].opcoes && escolhido && (
                  <Ampulheta segundos={escolhido} chave={`op-${escolhido}`} som={d.som} />
                )}
              </div>
              <div className="acoes">
                {Array.from({ length: 7 }, (_, i) => (
                  <span key={`${faiscas}-${i}`} className="faisca" style={{
                    "--dx": `${(i - 3) * 26}px`, "--dy": `${-40 - (i % 3) * 22}px`,
                    display: faiscas ? "block" : "none",
                  }}><Estrela tam={16} /></span>
                ))}
                <button className="btn-feito" onClick={concluirPasso}>
                  <Estrela tam={22} cor="#FFD79A" /> {N.botao}
                </button>
                {passo > 0 && (
                  <button className="btn-voltar" onClick={() => setPasso(passo - 1)}>← Ver o passo anterior</button>
                )}
              </div>
            </>
          )}

          {N.listaLivre && (
            <>
              <div className="palco" style={{ paddingBottom: 8 }}>
                <div className="quadro"><Cena nome={passos[Math.min(marcados.length, passos.length - 1)].arte} /></div>
                <div className="barra-prog" style={{ margin: "12px 14px 6px" }}>
                  <i style={{ width: `${(marcados.length / passos.length) * 100}%` }} />
                </div>
                <p className="passo-dica" style={{ paddingTop: 2, fontSize: 13 }}>
                  Faça na ordem que preferir. Marque conforme terminar.
                </p>
              </div>
              <div className="lista">
                {passos.map((p, i) => (
                  <button key={i} className="item" data-ok={marcados.includes(i) ? 1 : 0}
                    onClick={() => alternar(i)}>
                    <span className="item-cx">{marcados.includes(i) ? "✓" : i + 1}</span>
                    <span className="item-txt"><b>{p.t}</b><small>{p.d}</small></span>
                    {/* Na lista livre a voz não narra sozinha: seriam sete frases
                        de uma vez. Cada passo tem o seu alto-falante, e quem
                        decide quando ouvir é a criança. */}
                    {aj.voz && (
                      <span className="item-voz" role="button" tabIndex={0}
                        aria-label={`Ouvir: ${p.t}`}
                        onClick={(e) => { e.stopPropagation(); falar(p.d ? `${p.t}. ${p.d}` : p.t); }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation(); e.preventDefault();
                            falar(p.d ? `${p.t}. ${p.d}` : p.t);
                          }
                        }}>
                        <Alto />
                      </span>
                    )}
                    {p.tempo && (
                      <span className="item-tempo" onClick={(e) => { e.stopPropagation(); setCronometro(cronometro === i ? null : i); }}>
                        {cronometro === i ? "parar" : `${p.tempo}s`}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {cronometro !== null && passos[cronometro] && (
                <div className="palco" style={{ padding: "4px 6px 18px" }}>
                  <Ampulheta segundos={passos[cronometro].tempo} chave={`c-${cronometro}`} som={d.som} />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ---------- LISTA DE ROTINAS ---------- */}
      {tela === "rotinas" && (
        <div className="tela">
          <div className="barra">
            <button className="btn-x" onClick={() => setTela("pais")} aria-label="Voltar">✕</button>
            <span className="barra-titulo">Rotinas</span>
            <span className="contador" />
          </div>

          <div className="linha">
            <div className="linha-txt">
              <div className="linha-nome">Semana de prova</div>
              <div className="linha-desc">Liga as tarefas marcadas como estudo.</div>
            </div>
            <button className="chave" data-on={d.prova ? 1 : 0} onClick={() => salvar({ ...d, prova: !d.prova })}
              aria-pressed={d.prova} aria-label="Semana de prova"><i /></button>
          </div>

          {MOMENTOS.map((m) => {
            const doMomento = lista.filter((t) => t.momento === m.id).sort(ordemHorario);
            return (
              <div key={m.id}>
                <div className="grupo-titulo"><span aria-hidden="true">{m.icone}</span> {m.nome}</div>
                {doMomento.length === 0 && <p className="linha-desc" style={{ marginBottom: 8 }}>Nenhuma tarefa aqui ainda.</p>}
                {doMomento.map((t) => (
                  <div className="linha-tarefa" key={t.id} data-off={t.oculta ? 1 : 0}>
                    <span className="hora-chip">{t.horario || "—"}</span>
                    <div className="tarefa-nome">
                      {t.nome}
                      <div className="tarefa-dias">
                        {resumoDias(t.dias)}{t.duracao ? ` · ${t.duracao} min` : ""}{t.prova ? " · só na prova" : ""}
                      </div>
                    </div>
                    <button className="btn-mini" data-on={t.oculta ? 0 : 1} aria-label={t.oculta ? "Ativar" : "Desativar"}
                      onClick={() => salvar({ ...d, ...ajustar(d, t, { oculta: !t.oculta }) })}>
                      {t.oculta ? "○" : "✓"}
                    </button>
                    <button className="btn-mini" aria-label="Editar" onClick={() => { setRascunho(paraRascunho(t)); setTela("editar"); }}>✎</button>
                  </div>
                ))}
              </div>
            );
          })}

          <button className="btn-plano" onClick={() => { setRascunho(novaTarefa(momento)); setTela("editar"); }}>
            + Nova tarefa
          </button>
          <p className="aviso">
            As tarefas ilustradas de fábrica podem ter horário, dias e momento mudados, ou ser desligadas.
            Os passos delas são fixos porque mudam sozinhos conforme o nível de idade. Para uma sequência
            própria, crie uma tarefa nova.
          </p>
        </div>
      )}

      {/* ---------- EDITOR DE TAREFA ---------- */}
      {tela === "editar" && rascunho && (
        <div className="tela">
          <div className="barra">
            <button className="btn-x" onClick={() => { setRascunho(null); setTela("rotinas"); }} aria-label="Cancelar">✕</button>
            <span className="barra-titulo">{rascunho.novo ? "Nova tarefa" : "Editar tarefa"}</span>
            <span className="contador" />
          </div>

          <div>
            <div className="campo-rot">Nome</div>
            <input className="campo" value={rascunho.nome} maxLength={32} disabled={rascunho.fixa}
              onChange={(e) => setRascunho({ ...rascunho, nome: e.target.value })} />
            {rascunho.fixa && <p className="linha-desc" style={{ marginTop: 6 }}>Tarefa de fábrica: só o agendamento é editável.</p>}
          </div>

          <div>
            <div className="campo-rot">Momento do dia</div>
            <div className="escolha">
              {MOMENTOS.map((m) => (
                <button key={m.id} data-on={rascunho.momento === m.id ? 1 : 0}
                  onClick={() => setRascunho({ ...rascunho, momento: m.id })}>{m.icone} {m.nome}</button>
              ))}
            </div>
          </div>

          <div>
            <div className="campo-rot">Horário</div>
            <input className="campo" type="time" value={rascunho.horario}
              onChange={(e) => setRascunho({ ...rascunho, horario: e.target.value })} />
          </div>

          <div>
            <div className="campo-rot">Duração</div>
            <div className="num-linha">
              <button className="btn-mini" aria-label="Menos 5 minutos"
                onClick={() => setRascunho({ ...rascunho, duracao: Math.max(0, (rascunho.duracao || 0) - 5) })}>−</button>
              <input className="campo num" type="number" min="0" max="180" inputMode="numeric"
                value={rascunho.duracao || 0}
                onChange={(e) => setRascunho({ ...rascunho, duracao: Math.max(0, Math.min(180, +e.target.value || 0)) })} />
              <span className="num-un">min</span>
              <button className="btn-mini" aria-label="Mais 5 minutos"
                onClick={() => setRascunho({ ...rascunho, duracao: Math.min(180, (rascunho.duracao || 0) + 5) })}>+</button>
            </div>
            <div className="escolha" style={{ marginTop: 7 }}>
              {[0, 10, 15, 20, 30, 45].map((v) => (
                <button key={v} data-on={(rascunho.duracao || 0) === v ? 1 : 0}
                  onClick={() => setRascunho({ ...rascunho, duracao: v })}>
                  {v ? `${v} min` : "sem tempo"}
                </button>
              ))}
            </div>
            <p className="linha-desc" style={{ marginTop: 7 }}>
              Vira o cronômetro do passo principal da tarefa. Deixe em zero para tarefas sem tempo marcado.
            </p>
          </div>

          <div>
            <div className="campo-rot">Dias da semana</div>
            <div className="dias-linha">
              {DIAS.map((rot, i) => (
                <button key={i} data-on={rascunho.dias.includes(i) ? 1 : 0} aria-label={DIAS_NOME[i]}
                  onClick={() => setRascunho({
                    ...rascunho,
                    dias: rascunho.dias.includes(i) ? rascunho.dias.filter((x) => x !== i) : [...rascunho.dias, i].sort(),
                  })}>{rot}</button>
              ))}
            </div>
            <div className="escolha" style={{ marginTop: 7 }}>
              <button onClick={() => setRascunho({ ...rascunho, dias: [...SEMANA] })}>Dias de aula</button>
              <button onClick={() => setRascunho({ ...rascunho, dias: [...FDS] })}>Fim de semana</button>
              <button onClick={() => setRascunho({ ...rascunho, dias: [...TODOS] })}>Todos os dias</button>
            </div>
          </div>

          <div className="linha" style={{ marginTop: 16 }}>
            <div className="linha-txt">
              <div className="linha-nome">Só na semana de prova</div>
              <div className="linha-desc">Aparece apenas com a chave de prova ligada.</div>
            </div>
            <button className="chave" data-on={rascunho.prova ? 1 : 0} aria-pressed={!!rascunho.prova}
              onClick={() => setRascunho({ ...rascunho, prova: !rascunho.prova })}><i /></button>
          </div>

          {!rascunho.fixa && (
            <>
              <div>
                <div className="campo-rot">Ilustração</div>
                <div className="artes">
                  {ARTES.map((a) => (
                    <button key={a.k} className="arte-op" data-on={rascunho.capa === a.k ? 1 : 0} aria-label={a.r}
                      onClick={() => setRascunho({ ...rascunho, capa: a.k })}>
                      <Cena nome={a.k} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="campo-rot">Passos</div>
                {rascunho.passos.map((ps, i) => (
                  <div className="passo-edit" key={i}>
                    <div style={{ flex: 1 }}>
                      <input className="campo" placeholder="O que fazer" value={ps.t}
                        onChange={(e) => setRascunho({ ...rascunho, passos: rascunho.passos.map((x, j) => j === i ? { ...x, t: e.target.value } : x) })} />
                      <input className="campo" placeholder="Dica de apoio (opcional)" style={{ marginTop: 6, fontSize: 14 }} value={ps.d || ""}
                        onChange={(e) => setRascunho({ ...rascunho, passos: rascunho.passos.map((x, j) => j === i ? { ...x, d: e.target.value } : x) })} />
                      <div className="num-linha" style={{ marginTop: 6 }}>
                        <span className="num-rot">Tempo deste passo</span>
                        <input className="campo num" type="number" min="0" max="120" inputMode="numeric"
                          value={Math.round((ps.tempo || 0) / 60)}
                          onChange={(e) => {
                            const m = Math.max(0, Math.min(120, +e.target.value || 0));
                            setRascunho({ ...rascunho, passos: rascunho.passos.map((x, j) => j === i ? { ...x, tempo: m ? m * 60 : undefined } : x) });
                          }} />
                        <span className="num-un">min</span>
                      </div>
                    </div>
                    {rascunho.passos.length > 1 && (
                      <button className="btn-mini perigo" aria-label="Remover passo"
                        onClick={() => setRascunho({ ...rascunho, passos: rascunho.passos.filter((x, j) => j !== i) })}>−</button>
                    )}
                  </div>
                ))}
                <button className="btn-rodape" style={{ width: "100%", marginTop: 4 }}
                  onClick={() => setRascunho({ ...rascunho, passos: [...rascunho.passos, { t: "", d: "" }] })}>
                  + Adicionar passo
                </button>
              </div>
            </>
          )}

          <button className="btn-plano" onClick={() => { salvar(gravar(d, rascunho)); setRascunho(null); setTela("rotinas"); }}>
            Salvar tarefa
          </button>
          {!rascunho.novo && !rascunho.fixa && (
            <button className="btn-plano fantasma"
              onClick={() => {
                salvar({ ...d, custom: (d.custom || []).filter((t) => t.id !== rascunho.id) });
                setRascunho(null); setTela("rotinas");
              }}>
              Excluir esta tarefa
            </button>
          )}
        </div>
      )}

      {/* ---------- ÁLBUM ---------- */}
      {tela === "album" && (
        <div className="tela">
          <div className="barra">
            <button className="btn-x" onClick={() => setTela("casa")} aria-label="Voltar">✕</button>
            <span className="barra-titulo">Meu álbum</span>
            <span className="contador" />
          </div>
          <p className="passo-dica" style={{ padding: "0 8px 4px" }}>
            Cada rotina completa ganha uma figurinha. Repita para deixá-la mais brilhante.
          </p>
          <div className="album">
            {TAREFAS.map((t) => {
              const n = d.feitos[t.id] || 0;
              return (
                <div key={t.id} className="figurinha" data-travada={n ? 0 : 1}>
                  <div className="fig-arte" style={{ fontSize: 34, lineHeight: 1 }} aria-hidden="true">{t.figurinha}</div>
                  <div className="fig-nome">{t.nome}</div>
                  <div className="fig-qtd">{n ? `${n}×` : "a conquistar"}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------- PAIS ---------- */}
      {tela === "pais" && (
        <div className="tela">
          <div className="barra">
            <button className="btn-x" onClick={() => { setModal(null); setTela("casa"); }} aria-label="Voltar">✕</button>
            <span className="barra-titulo">Área dos responsáveis</span>
            <span className="contador" />
          </div>

          <div>
            <div className="linha-nome" style={{ marginBottom: 8 }}>Nível por idade</div>
            <div className="niveis">
              {[1, 2, 3].map((k) => (
                <button key={k} className="nivel" data-on={d.nivel === k ? 1 : 0} onClick={() => salvar({ ...d, nivel: k })}>
                  <span className="nivel-idade">{NIVEIS[k].idade}<small>ANOS</small></span>
                  <span>
                    <span className="nivel-nome">{NIVEIS[k].nome}</span>
                    <span className="nivel-desc">{NIVEIS[k].resumo}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="linha-nome" style={{ marginBottom: 8 }}>Perfil de apoio</div>
            {temIdentificacao(apoio) ? (
              <>
                <div className="deriv" style={{ marginBottom: 11 }}>
                  <div className="deriv-tit">
                    {resumoApoio(apoio)}
                    {apoio.sensorial !== "nenhum"
                      ? ` · sensorial ${(SENSORIAL_NOMES[apoio.sensorial] || "").toLowerCase()}`
                      : ""}
                  </div>
                  {explicarAjustes(apoio).length === 0 ? (
                    <p className="opc-desc" style={{ margin: 0 }}>
                      Nada muda no app com o que foi informado.
                    </p>
                  ) : (
                    <ul className="deriv-lista">
                      {explicarAjustes(apoio).map((l, i) => (
                        <li key={i}>
                          <span className="d-txt">{l.texto}</span>
                          <span className="d-tag" data-manual={l.manual ? 1 : 0}>{l.origem}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button className="btn-plano" onClick={() => setTela("apoio")}>
                  Rever ou apagar a identificação
                </button>
              </>
            ) : (
              <>
                <p className="linha-desc" style={{ marginBottom: 10 }}>
                  Se a criança tem uma atipicidade fechada por profissional, informar aqui faz o
                  app ajustar linguagem, estímulo e ritmo. Fica só neste aparelho, e é opcional.
                </p>
                <button className="btn-plano" onClick={() => setTela("apoio")}>
                  Informar o perfil de apoio
                </button>
              </>
            )}
          </div>

          <div>
            <div className="linha-nome" style={{ marginBottom: 8 }}>Como a criança se chama</div>
            <input className="campo" value={d.nome} maxLength={14}
              onChange={(e) => salvar({ ...d, nome: e.target.value || "amigo" })} />
          </div>

          <div>
            <div className="linha-nome" style={{ marginBottom: 8 }}>Personagem</div>
            <div className="escolha-avatar">
              {AVATARES.map((a) => (
                <button key={a.id} className="op-avatar" data-on={d.avatar === a.id ? 1 : 0}
                  onClick={() => salvar({ ...d, avatar: a.id })} aria-label={`Personagem ${a.id}`}>
                  <Avatar id={a.id} tam={52} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="linha">
              <div className="linha-txt">
                <div className="linha-nome">Modo calmo</div>
                <div className="linha-desc">Desliga animações, faíscas e confete.</div>
              </div>
              <button className="chave" data-on={aj.calmo ? 1 : 0}
                onClick={() => mexerAjuste("calmo", !aj.calmo)}
                aria-pressed={aj.calmo} aria-label="Modo calmo"><i /></button>
            </div>
            <div className="linha">
              <div className="linha-txt">
                <div className="linha-nome">Avisos nos horários</div>
                <div className="linha-desc">O aparelho avisa quando chega a hora de cada tarefa.</div>
              </div>
              <button className="chave" data-on={avisos ? 1 : 0}
                onClick={async () => {
                  const novo = !avisos;
                  setAvisos(novo);
                  await definirAvisos(novo);
                  if (novo) reprogramar(todasTarefas(d));
                }}
                aria-pressed={avisos} aria-label="Avisos nos horários"><i /></button>
            </div>
            <div className="linha">
              <div className="linha-txt">
                <div className="linha-nome">Sons</div>
                <div className="linha-desc">Tons curtos e suaves a cada passo.</div>
              </div>
              <button className="chave" data-on={d.som ? 1 : 0} onClick={() => salvar({ ...d, som: !d.som })}
                aria-pressed={d.som} aria-label="Sons"><i /></button>
            </div>
            {/* Estas quatro também são derivadas do perfil de apoio. Mexer aqui
                vira escolha do responsável e passa a vencer a derivação. */}
            {[
              ["voz", "Ler os passos em voz alta", "A voz do aparelho narra o passo e a dica."],
              ["leitura", "Texto ampliado", "Letra maior e mais espaçada em todo o app."],
              ["contraste", "Alto contraste", "Fundo escuro, cores puras, contorno em tudo."],
              ["antecipacao", "Faixa agora / depois", "Mostra o passo atual e o seguinte."],
              ["prancha", "Prancha de comunicação", "Botão fixo na casa, com o vocabulário-núcleo."],
              ["sentimentos", "Como eu estou", "Atalho para nomear a emoção e respirar."],
            ].map(([k, nome, desc]) => (
              <div className="linha" key={k}>
                <div className="linha-txt">
                  <div className="linha-nome">
                    {nome}
                    {!(k in (apoio.manual || {})) && aj[k] ? <> <span className="selo-apoio">do perfil</span></> : null}
                  </div>
                  <div className="linha-desc">{desc}</div>
                </div>
                <button className="chave" data-on={aj[k] ? 1 : 0}
                  onClick={() => mexerAjuste(k, !aj[k])}
                  aria-pressed={!!aj[k]} aria-label={nome}><i /></button>
              </div>
            ))}
          </div>

          <div>
            <div className="linha-nome" style={{ marginBottom: 8 }}>Registro emocional</div>
            {(d.diario || []).length === 0 ? (
              <p className="linha-desc" style={{ marginBottom: 14 }}>
                {aj.sentimentos
                  ? "Ainda sem registro. Aparece aqui conforme a criança marcar como está."
                  : "O atalho \"como eu estou\" está desligado. Ligue acima para a criança poder marcar."}
              </p>
            ) : (
              <>
                <div className="contagem">
                  {EMOCOES.map((e) => {
                    const n = (d.diario || []).filter((x) => x.e === e.id).length;
                    if (!n) return null;
                    return (
                      <span className="conta-emo" key={e.id}>
                        <svg viewBox="0 0 64 64" width="26" height="26" aria-hidden="true">{e.arte}</svg>
                        {e.nome}: <b>{n}</b>
                      </span>
                    );
                  })}
                </div>
                <p className="linha-desc" style={{ margin: "9px 0 14px" }}>
                  Últimos:{" "}
                  {(d.diario || []).slice(-6).reverse()
                    .map((x) => `${(EMOCOES.find((e) => e.id === x.e) || {}).nome || x.e} (${x.dia.slice(8)}/${x.dia.slice(5, 7)})`)
                    .join(" · ")}
                </p>
                <div className="aviso" style={{ marginBottom: 14 }}>
                  Isto é contagem, não avaliação. Serve para você notar padrão — três dias
                  seguidos com medo, por exemplo — e levar isso a quem acompanha a criança.
                </div>
              </>
            )}
          </div>

          <div>
            <div className="linha-nome" style={{ marginBottom: 8 }}>Progresso</div>
            {TAREFAS.filter((t) => d.feitos[t.id]).length === 0 && (
              <p className="linha-desc" style={{ marginBottom: 10 }}>Ainda não há rotinas concluídas para mostrar.</p>
            )}
            {TAREFAS.filter((t) => d.feitos[t.id]).map((t) => {
              const a = d.autonomia[t.id];
              const pct = a && a.total ? Math.round((a.sozinho / a.total) * 100) : null;
              return (
                <div className="linha" key={t.id} style={{ display: "block" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <div className="linha-nome" style={{ flex: 1 }}>{t.nome}</div>
                    <div className="linha-desc">{d.feitos[t.id]}× concluída</div>
                  </div>
                  {pct !== null && (
                    <>
                      <div className="barra-prog"><i style={{ width: `${pct}%` }} /></div>
                      <div className="linha-desc" style={{ marginTop: 5 }}>{pct}% das vezes sem ajuda</div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="aviso">
            No nível 3, a criança responde sozinha se precisou de ajuda — a barra acima vem daí.
            Se um passo travar sempre no mesmo ponto, desça um nível só naquela rotina do dia
            e volte a subir depois.
          </div>

          <button className="btn-plano" onClick={() => setTela("rotinas")}>
            Editar rotinas, horários e dias
          </button>
          <button className="btn-plano" onClick={() => setTela("contatos")}>
            Adultos que a criança pode chamar
          </button>
          <button className="btn-plano" onClick={() => salvar({ ...d, hoje: [], dia: hojeStr })}>
            Liberar as rotinas de hoje de novo
          </button>
          <button className="btn-plano fantasma"
            onClick={() => {
              if (modal === "zerar") {
                salvar({ ...PADRAO, nome: d.nome, avatar: d.avatar, nivel: d.nivel, som: d.som, dia: hojeStr });
                setModal(null);
              } else setModal("zerar");
            }}>
            {modal === "zerar" ? "Toque de novo para apagar tudo" : "Zerar todo o progresso"}
          </button>

          <div className="institucional">
            <LogoMarca tamanho="medio" />
            <p>
              O {marca().nome} organiza e estimula a rotina diária como apoio ao
              desenvolvimento. Ele não substitui o acompanhamento de profissionais de
              saúde e educação.
            </p>
          </div>
        </div>
      )}

      {/* ---------- IDENTIFICAÇÃO DA ATIPICIDADE ---------- */}
      {tela === "apoio" && (
        <Identificacao
          apoio={apoio}
          aoSair={() => setTela("pais")}
          aoSalvar={(novo) => { salvarApoio(novo); setTela("pais"); }}
          aoApagar={async (atual) => {
            const limpo = await apagarIdentificacao(atual);
            setApoio(limpo);
            setTela("pais");
          }}
        />
      )}

      {/* ---------- PAUSA DO CORPO ---------- */}
      {pausa && (
        <>
          <div className="scrim" onClick={() => setPausa(false)} />
          <div className="folha" role="dialog" aria-label="Pausa do corpo">
            <Mao tam={56} cor="#78BE9B" />
            <h2 className="folha-titulo">{PAUSAS_CORPO[pausaIdx].nome}</h2>
            <p className="folha-sub" style={{ fontSize: 16 }}>{PAUSAS_CORPO[pausaIdx].dica}</p>
            <div className="folha-btns">
              <button className="btn-sim" onClick={() => { setPausa(false); abertoEm.current = Date.now(); }}>
                Já fiz
              </button>
              <button className="btn-nao" onClick={() => setPausaIdx((i) => (i + 1) % PAUSAS_CORPO.length)}>
                Quero outra
              </button>
            </div>
          </div>
        </>
      )}

      {/* ---------- ADULTOS E CONTATOS (responsável) ---------- */}
      {tela === "contatos" && (
        <div className="tela">
          <div className="barra">
            <button className="btn-x" onClick={() => setTela("pais")} aria-label="Voltar">←</button>
            <span className="barra-titulo">Adultos e contatos</span>
            <span className="contador" />
          </div>

          <div className="aviso">
            Os números ficam neste aparelho. Não vão para o servidor de licenças e não aparecem
            no painel da clínica.
          </div>

          <div className="campo-rot" style={{ marginTop: 4 }}>Quem a criança pode chamar</div>
          <div className="adultos">
            {comClinica(contatos, marca()).lista.map((c) => (
              <div className="pessoa" key={c.id}>
                <div className="pessoa-topo">
                  <Avatar id={c.avatar} tam={46} />
                  <div className="pessoa-txt">
                    <div className="linha-nome">
                      {c.nome}{c.relacao ? <span className="pessoa-rel" style={{ display: "inline", marginLeft: 6 }}>{c.relacao}</span> : null}
                    </div>
                    <div className="pessoa-fone">{exibirFone(c.fone)}</div>
                  </div>
                  {c.fixo ? (
                    <span className="trava">fixo</span>
                  ) : (
                    <button className="btn-mini" onClick={() => setFichaContato({ ...c })}
                      aria-label={`Editar ${c.nome}`}>✎</button>
                  )}
                </div>
                <div className="minis">
                  {[
                    ["ligar", "Ligar"],
                    ["whatsapp", "WhatsApp"],
                    ["sozinha", "Pode usar sozinha"],
                  ].map(([k, rot]) => (
                    <span className="mini-chave" key={k}>
                      <button className="chave sm" data-on={c[k] ? 1 : 0} aria-pressed={!!c[k]}
                        aria-label={`${rot} — ${c.nome}`} disabled={c.fixo}
                        onClick={() => salvarContatos({
                          ...contatos,
                          lista: contatos.lista.map((x) => (x.id === c.id ? { ...x, [k]: !x[k] } : x)),
                        })}><i /></button>
                      {rot}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {comClinica(contatos, marca()).lista.length === 0 && (
              <p className="linha-desc">
                Ninguém cadastrado ainda. Sem contatos, o botão de chamar não aparece para a criança.
              </p>
            )}
          </div>

          <button className="btn-add" style={{ marginTop: 13 }}
            onClick={() => setFichaContato(novoContato())}>
            + Adicionar adulto
          </button>

          <div className="campo-rot">Mensagem que vai pronta no WhatsApp</div>
          <p className="linha-desc" style={{ marginBottom: 8 }}>
            O texto chega digitado na conversa. Quem aperta enviar é quem está com o aparelho.
          </p>
          <input className="campo" value={contatos.mensagem} maxLength={60}
            onChange={(e) => salvarContatos({ ...contatos, mensagem: e.target.value })} />

          <div className="aviso" style={{ marginTop: 14 }}>
            Ligar e abrir o WhatsApp são saídas do app. Por isso o {marca().nome} é classificado
            4+ e fica fora da categoria infantil da App Store, que exige uma barreira de adulto
            antes de qualquer link para fora — barreira que não faz sentido na frente de um
            pedido de ajuda.
          </div>
        </div>
      )}

      {/* ---------- FICHA DE UM ADULTO ---------- */}
      {fichaContato && (
        <>
          <div className="scrim" onClick={() => setFichaContato(null)} />
          <div className="folha" style={{ textAlign: "left", alignItems: "stretch" }}>
            <div className="campo-rot" style={{ marginTop: 0 }}>Como a criança chama</div>
            <input className="campo" value={fichaContato.nome} maxLength={18} placeholder="Mamãe"
              onChange={(e) => setFichaContato({ ...fichaContato, nome: e.target.value })} />

            <div className="campo-rot">Quem é (só o responsável vê)</div>
            <input className="campo" value={fichaContato.relacao} maxLength={18} placeholder="mãe"
              onChange={(e) => setFichaContato({ ...fichaContato, relacao: e.target.value })} />

            <div className="campo-rot">Telefone com DDD</div>
            <input className="campo" value={fichaContato.fone} inputMode="tel" placeholder="11 98888-7777"
              onChange={(e) => setFichaContato({ ...fichaContato, fone: e.target.value })} />
            {fichaContato.fone && !telefoneValido(fichaContato.fone) && (
              <p className="linha-desc" style={{ color: "var(--coral)", marginTop: 6 }}>
                Faltam dígitos. Precisa ser DDD mais o número.
              </p>
            )}

            <div className="campo-rot">Carinha</div>
            <div className="escolha-avatar">
              {AVATARES.map((a) => (
                <button key={a.id} className="op-avatar" data-on={fichaContato.avatar === a.id ? 1 : 0}
                  onClick={() => setFichaContato({ ...fichaContato, avatar: a.id })}
                  aria-label={`Carinha ${a.id}`}>
                  <Avatar id={a.id} tam={46} />
                </button>
              ))}
            </div>

            <div className="folha-btns" style={{ marginTop: 2 }}>
              <button className="btn-plano" disabled={!telefoneValido(fichaContato.fone)}
                onClick={() => {
                  const c = limparContato(fichaContato);
                  const existe = contatos.lista.some((x) => x.id === c.id);
                  salvarContatos({
                    ...contatos,
                    lista: existe
                      ? contatos.lista.map((x) => (x.id === c.id ? c : x))
                      : [...contatos.lista, c],
                  });
                  setFichaContato(null);
                }}>
                Salvar
              </button>
              {contatos.lista.some((x) => x.id === fichaContato.id) && (
                <button className="btn-plano fantasma"
                  onClick={() => {
                    salvarContatos({
                      ...contatos,
                      lista: contatos.lista.filter((x) => x.id !== fichaContato.id),
                    });
                    setFichaContato(null);
                  }}>
                  Tirar da lista
                </button>
              )}
              <button className="btn-nao" onClick={() => setFichaContato(null)}>Cancelar</button>
            </div>
          </div>
        </>
      )}

      {/* ---------- PERGUNTA DE AUTONOMIA (nível 3) ---------- */}
      {perguntaAuto && tarefa && (
        <div className="festa" role="dialog" aria-label="Como foi a rotina">
          <div className="festa-caixa">
            <h2 className="festa-titulo" style={{ marginTop: 0 }}>Como foi desta vez?</h2>
            <p className="festa-texto">Sua resposta só serve para acompanhar seu progresso.</p>
            <div className="par">
              <button onClick={() => fecharTarefa(true)}>Fiz sozinho</button>
              <button onClick={() => fecharTarefa(false)}>Tive uma ajuda</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- FESTA ---------- */}
      {festa && (
        <div className="festa" role="dialog" aria-label="Rotina concluída">
          {N.confete && !aj.calmo && Array.from({ length: 26 }, (_, i) => (
            <span key={i} className="papelote" style={{
              left: `${(i * 3.8 + 3) % 97}%`,
              background: ["#F2A65A", "#78BE9B", "#E8879B", "#8E82D4", "#8FCBE8"][i % 5],
              animationDuration: `${1.8 + (i % 5) * 0.35}s`,
              animationDelay: `${(i % 7) * 0.12}s`,
            }} />
          ))}
          <div className="festa-caixa">
            <div className="premio"><Estrela tam={N.id === 3 ? 78 : 122} /></div>
            <h2 className="festa-titulo">{N.festaTitulo}</h2>
            <p className="festa-texto">{festa.nome}, do começo ao fim.</p>
            <p className="festa-texto" style={{ color: "var(--damasco)", fontFamily: "Baloo 2, sans-serif", fontSize: 19, marginTop: 10 }}>
              +{N.bonus} {N.moeda} · figurinha {festa.figurinha}
            </p>
            {/* Bloco de foco: a pausa é oferecida ao terminar a tarefa, nunca
                no meio dela — o app não interrompe quem está no passo 3 de 5. */}
            {aj.minutosFoco > 0 && Date.now() - abertoEm.current > aj.minutosFoco * 60000 && (
              <button className="btn-plano" style={{ background: "var(--folha)", color: "#15403A" }}
                onClick={() => { setFesta(null); setTela("casa"); setPausa(true); }}>
                Mexer o corpo antes de continuar
              </button>
            )}
            <button className="btn-plano" onClick={() => { setFesta(null); setTela("casa"); }}>
              Voltar para a rotina
            </button>
          </div>
        </div>
      )}

      {/* ---------- MODAL PERFIL ---------- */}
      {modal === "perfil" && (
        <div className="folha" onClick={() => setModal(null)}>
          <div className="folha-caixa" onClick={(e) => e.stopPropagation()}>
            <h2 className="folha-titulo">Escolha seu personagem</h2>
            <p className="folha-sub">Ele caminha com você pela trilha de cada rotina.</p>
            <div className="escolha-avatar">
              {AVATARES.map((a) => (
                <button key={a.id} className="op-avatar" data-on={d.avatar === a.id ? 1 : 0}
                  onClick={() => salvar({ ...d, avatar: a.id })} aria-label={`Personagem ${a.id}`}>
                  <Avatar id={a.id} tam={58} />
                </button>
              ))}
            </div>
            <button className="btn-plano" onClick={() => setModal(null)}>Pronto</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= peças pequenas ================= */
function Estrela({ tam = 20, cor = "#F2A65A" }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.6l2.7 5.9 6.4.7-4.8 4.3 1.3 6.3L12 16.6l-5.6 3.2 1.3-6.3-4.8-4.3 6.4-.7z"
        fill={cor} stroke={cor} strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  );
}

/* A faixa "agora / depois". Serve a quem precisa saber o que vem em seguida
   para conseguir começar — reduz imprevisibilidade, não é enfeite. */
function Antecipacao({ agora, depois }) {
  return (
    <div className="antecipa">
      <span className="antecipa-rot">agora</span>
      <b>{agora}</b>
      <span className="antecipa-seta" aria-hidden="true">→</span>
      <span className="antecipa-rot">depois</span>
      <b>{depois}</b>
    </div>
  );
}

/* Quatro casas: a prancha de comunicação. */
function Grade({ tam = 20, cor = "#FFFFFF" }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" aria-hidden="true">
      <g fill={cor}>
        <rect x="2.5" y="2.5" width="8" height="8" rx="2.4" />
        <rect x="13.5" y="2.5" width="8" height="8" rx="2.4" />
        <rect x="2.5" y="13.5" width="8" height="8" rx="2.4" />
        <rect x="13.5" y="13.5" width="8" height="8" rx="2.4" />
      </g>
    </svg>
  );
}

/* Alto-falante: "toque para ouvir este passo". */
function Alto({ tam = 19, cor = "#2F6B62" }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9.5h3.5L13 5v14l-5.5-4.5H4z" fill={cor} />
      <path d="M16.5 9a4.5 4.5 0 0 1 0 6" stroke={cor} strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const SENSORIAL_NOMES = {
  nenhum: "sem alteração marcante", hiper: "hiper-reativo",
  hipo: "hipo-reativo", misto: "misto",
};

const PAUSAS_CORPO = [
  { nome: "Aperto forte", dica: "Junte as mãos e aperte enquanto conta até dez." },
  { nome: "Cinco pulos", dica: "Pule cinco vezes, contando alto." },
  { nome: "Abraço apertado", dica: "Abrace o seu corpo e aperte um pouquinho." },
  { nome: "Empurrar a parede", dica: "Empurre a parede com as duas mãos, bem forte." },
];

/* Duas mãos: um adulto grande e uma criança. Marca o botão de chamar. */
function Mao({ tam = 21, cor = "#FFFFFF" }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="17" cy="14" r="7" fill={cor} />
      <path d="M6 40c0-7 5-11 11-11s11 4 11 11z" fill={cor} />
      <circle cx="34" cy="21" r="5.2" fill={cor} opacity=".72" />
      <path d="M26 40c0-5 3.6-8 8-8s8 3 8 8z" fill={cor} opacity=".72" />
    </svg>
  );
}

/* Porta dos responsáveis: exige toque contínuo, para a criança não entrar sem querer. */
function SegurarPais({ onAbrir }) {
  const [p, setP] = useState(0);
  const ref = useRef(null);
  const comeca = () => {
    const t0 = Date.now();
    ref.current = setInterval(() => {
      const f = Math.min(1, (Date.now() - t0) / 1500);
      setP(f);
      if (f >= 1) { clearInterval(ref.current); setP(0); onAbrir(); }
    }, 40);
  };
  const para = () => { clearInterval(ref.current); setP(0); };
  useEffect(() => () => clearInterval(ref.current), []);
  return (
    <button className="btn-rodape" style={{ position: "relative", overflow: "hidden" }}
      onPointerDown={comeca} onPointerUp={para} onPointerLeave={para} onPointerCancel={para}>
      <span style={{ position: "absolute", inset: 0, background: "#CFE3DE",
        transform: `scaleX(${p})`, transformOrigin: "left", transition: "transform .04s linear" }} />
      <span style={{ position: "relative" }}>🔒 {p > 0 ? "Segure..." : "Responsáveis"}</span>
    </button>
  );
}
