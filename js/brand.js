/* ============================================================
   NIVORA - Identidade central (js/brand.js)
   Fonte única de verdade para nome, tagline e descrição.
   Use em todo frontend para evitar strings espalhadas.
   ============================================================ */
const NIVORA_BRAND = {
  APP_NAME: 'Nivora',
  APP_SHORT_NAME: 'NIVORA',
  APP_TAGLINE: 'Aprenda. Supere. Evolua.',
  APP_DESCRIPTION: 'Plataforma de estudos e simulados com foco em conhecimento, desempenho e evolução.',
  APP_URL: 'https://quiz-ake-v2.pages.dev', // manter URL até migrar domínio
  APP_THEME_COLOR: '#14213D',
  LOGO_ALT: 'Nivora — Aprenda. Supere. Evolua.'
};

// Expor globalmente para script.js / api.js sem import
if (typeof window !== 'undefined') {
  window.NIVORA_BRAND = NIVORA_BRAND;
}
