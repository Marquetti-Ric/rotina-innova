/* Dublê do @capacitor/app-launcher para os testes: em vez de abrir o discador
   ou o WhatsApp, guarda a URL que o app pediu para abrir. */

export const abertas = [];

export const AppLauncher = {
  async openUrl({ url }) {
    abertas.push(url);
    return { completed: true };
  },
  async canOpenUrl({ url }) {
    return { value: !String(url).includes('inexistente') };
  },
};

globalThis.__abertas = abertas;
