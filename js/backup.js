// =============================================
// BACKUP DE SEGURANÇA
// Guarda o último estado válido ANTES de uma ação destrutiva
// (Resetar Ficha / Importar JSON) em uma chave dedicada do
// localStorage, permitindo restauração mesmo após recarregar a
// página. Camada aditiva — não interfere na persistência de perfis.
// =============================================

export const SAFETY_BACKUP_KEY = 'personaSafetyBackup';

// Salva um snapshot de ficha como backup de segurança.
export function saveSafetyBackup(sheetData) {
  if (!sheetData) return false;
  try {
    var payload = { savedAt: new Date().toISOString(), sheetData: sheetData };
    localStorage.setItem(SAFETY_BACKUP_KEY, JSON.stringify(payload));
    return true;
  } catch (e) {
    console.warn('[Backup] Não foi possível salvar o backup de segurança:', e);
    return false;
  }
}

// Recupera o backup salvo, ou null se não houver / estiver inválido.
export function getSafetyBackup() {
  try {
    var raw = localStorage.getItem(SAFETY_BACKUP_KEY);
    if (!raw) return null;
    var parsed = JSON.parse(raw);
    if (parsed && parsed.sheetData && typeof parsed.sheetData === 'object') return parsed;
    return null;
  } catch (e) {
    console.warn('[Backup] Backup de segurança inválido:', e);
    return null;
  }
}

export function hasSafetyBackup() {
  return !!getSafetyBackup();
}

export function clearSafetyBackup() {
  try { localStorage.removeItem(SAFETY_BACKUP_KEY); } catch (e) {}
}
