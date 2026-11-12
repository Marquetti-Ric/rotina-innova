import { Preferences } from '@capacitor/preferences';

/* Mesma assinatura do window.storage do protótipo, para o App.jsx
   mudar em duas linhas apenas. Fora do app nativo (npm run dev no
   navegador) cai para um armazenamento em memória, suficiente para testar. */

const temNativo = typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();
const memoria = {};

export const storage = {
  async get(key) {
    if (temNativo) {
      const { value } = await Preferences.get({ key });
      return value ? { key, value } : null;
    }
    try {
      const v = window.localStorage.getItem(key);
      return v ? { key, value: v } : null;
    } catch {
      return memoria[key] ? { key, value: memoria[key] } : null;
    }
  },

  async set(key, value) {
    if (temNativo) {
      await Preferences.set({ key, value });
      return { key, value };
    }
    try {
      window.localStorage.setItem(key, value);
    } catch {
      memoria[key] = value;
    }
    return { key, value };
  },
};
