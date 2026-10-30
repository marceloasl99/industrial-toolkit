/* Minimal i18n: shell strings and shared tool vocabulary. Tool metadata carries its own `pt` block. */
const dictionaries = {
  en: {
    dashboard: 'Dashboard', search: 'Search tools…', favorites: 'FAVORITES', recent: 'RECENT', allTools: 'All tools', utilities: 'utilities', offlineTools: 'offline tools',
    runsLocally: 'Runs locally in your browser', noResults: 'No tool matches your search.', toggleFavorite: 'Toggle favorite', about: 'About & settings',
    heroEyebrow: 'ENGINEERING UTILITY SUITE', heroTitle: 'Practical tools for the systems that keep the world moving.',
    heroText: 'Fast, private utilities for IT operations, industrial networks, cyber defense, IoT deployments and everyday engineering. Nothing leaves your browser.',
    localNote: 'Nothing is sent to a server.', calculate: 'Calculate', copy: 'Copy', copied: 'Copied to clipboard', nothingToCopy: 'Nothing to copy yet', clipboardBlocked: 'Clipboard permission was unavailable',
    result: 'Result', input: 'Input', output: 'Output', theme: 'Theme', themeAuto: 'System', themeDark: 'Dark', themeLight: 'Light', language: 'Language', compact: 'Compact mode',
    exportSettings: 'Export favorites & settings', importSettings: 'Import', resetSettings: 'Reset everything', resetConfirm: 'Clear favorites, recents, saved inputs and settings?', imported: 'Settings imported', exported: 'Settings exported',
    version: 'Version', updateAvailable: 'A new version is available.', reload: 'Reload', shortcuts: 'Keyboard shortcuts', shortcutSearch: 'focus search', shortcutBack: 'back to dashboard', shortcutCalc: 'run the primary action', shortcutTheme: 'cycle theme',
    download: 'Download', clear: 'Clear', add: 'Add', remove: 'Remove', generate: 'Generate', decode: 'Decode', encode: 'Encode', error: 'Error', warning: 'Warning', ok: 'OK',
    tagsHint: 'Tip: search also matches tags such as "PLC", "CLP", "subnet" or "senha".', installApp: 'Install app', aboutText: 'ForgeTools is a dependency-free, offline-first utility suite. Every calculation runs in your browser; no account, no telemetry, no server.',
    changelog: 'Changelog', license: 'License', sourceCode: 'Source code', savedInputs: 'Inputs are remembered per tool on this device.', favorites_lc: 'favorites', recents_lc: 'recent tools',
  },
  'pt-BR': {
    dashboard: 'Painel', search: 'Buscar ferramentas…', favorites: 'FAVORITOS', recent: 'RECENTES', allTools: 'Todas as ferramentas', utilities: 'utilitários', offlineTools: 'ferramentas offline',
    runsLocally: 'Roda localmente no seu navegador', noResults: 'Nenhuma ferramenta corresponde à busca.', toggleFavorite: 'Alternar favorito', about: 'Sobre e configurações',
    heroEyebrow: 'SUÍTE DE UTILITÁRIOS DE ENGENHARIA', heroTitle: 'Ferramentas práticas para os sistemas que mantêm o mundo em movimento.',
    heroText: 'Utilitários rápidos e privados para operações de TI, redes industriais, defesa cibernética, IoT e engenharia do dia a dia. Nada sai do seu navegador.',
    localNote: 'Nada é enviado a um servidor.', calculate: 'Calcular', copy: 'Copiar', copied: 'Copiado para a área de transferência', nothingToCopy: 'Nada para copiar ainda', clipboardBlocked: 'Permissão da área de transferência indisponível',
    result: 'Resultado', input: 'Entrada', output: 'Saída', theme: 'Tema', themeAuto: 'Sistema', themeDark: 'Escuro', themeLight: 'Claro', language: 'Idioma', compact: 'Modo compacto',
    exportSettings: 'Exportar favoritos e configurações', importSettings: 'Importar', resetSettings: 'Redefinir tudo', resetConfirm: 'Apagar favoritos, recentes, entradas salvas e configurações?', imported: 'Configurações importadas', exported: 'Configurações exportadas',
    version: 'Versão', updateAvailable: 'Uma nova versão está disponível.', reload: 'Recarregar', shortcuts: 'Atalhos de teclado', shortcutSearch: 'focar a busca', shortcutBack: 'voltar ao painel', shortcutCalc: 'executar a ação principal', shortcutTheme: 'alternar tema',
    download: 'Baixar', clear: 'Limpar', add: 'Adicionar', remove: 'Remover', generate: 'Gerar', decode: 'Decodificar', encode: 'Codificar', error: 'Erro', warning: 'Aviso', ok: 'OK',
    tagsHint: 'Dica: a busca também encontra tags como "CLP", "PLC", "sub-rede" ou "senha".', installApp: 'Instalar aplicativo', aboutText: 'ForgeTools é uma suíte de utilitários sem dependências e offline-first. Todo cálculo roda no seu navegador; sem conta, sem telemetria, sem servidor.',
    changelog: 'Histórico de versões', license: 'Licença', sourceCode: 'Código-fonte', savedInputs: 'As entradas são lembradas por ferramenta neste dispositivo.', favorites_lc: 'favoritos', recents_lc: 'ferramentas recentes',
  },
};

export const languages = { en: 'English', 'pt-BR': 'Português (Brasil)' };
let current = 'en';

export function setLanguage(lang) { current = dictionaries[lang] ? lang : 'en'; document.documentElement.lang = current; }
export function getLanguage() { return current; }
export function t(key) { return dictionaries[current][key] ?? dictionaries.en[key] ?? key; }
/** Pick a localised field from a tool definition: tool.pt?.name when pt-BR is active. */
export function localized(tool, field) { return (current === 'pt-BR' && tool.pt && tool.pt[field]) || tool[field]; }
export function detectLanguage() { return (navigator.language || '').toLowerCase().startsWith('pt') ? 'pt-BR' : 'en'; }
