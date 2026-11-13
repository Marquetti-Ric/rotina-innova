#!/usr/bin/env bash
# Gera a chave de assinatura do app e imprime o que colar nos secrets do GitHub.
#
# Rode UMA VEZ, no seu Mac. A chave não deve ser gerada por terceiros nem
# trafegar por e-mail ou chat: quem tem este arquivo consegue publicar
# atualizações assinadas como se fosse o Instituto.
set -e

ARQUIVO=combinado.keystore
ALIAS=rotina

if [ -f "$ARQUIVO" ]; then
  echo "Já existe $ARQUIVO aqui. Apague ou mova antes de gerar outro."
  exit 1
fi

echo "Escolha uma senha forte. Você vai precisar dela só uma vez, para os secrets."
keytool -genkeypair -v \
  -keystore "$ARQUIVO" \
  -alias "$ALIAS" \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=Combinado, OU=Combinado, O=Combinado, L=, ST=, C=BR"

echo
echo "==================================================================="
echo " Guarde $ARQUIVO e a senha no cofre do Instituto, com cópia."
echo " Perdendo qualquer um dos dois, nenhuma atualização futura instala"
echo " por cima — as famílias teriam que desinstalar e perder os dados."
echo "==================================================================="
echo
echo "Agora cadastre os quatro secrets em:"
echo "  github.com/Marquetti-Ric/combinado → Settings → Secrets and variables → Actions"
echo
echo "ANDROID_KEY_ALIAS      = $ALIAS"
echo "ANDROID_STORE_PASSWORD = (a senha que você digitou)"
echo "ANDROID_KEY_PASSWORD   = (a mesma senha)"
echo "ANDROID_KEYSTORE_BASE64 = o texto abaixo, inteiro:"
echo
base64 -i "$ARQUIVO" 2>/dev/null || base64 "$ARQUIVO"
echo
if command -v pbcopy >/dev/null; then
  base64 -i "$ARQUIVO" | pbcopy
  echo "(já copiado para a área de transferência)"
fi
