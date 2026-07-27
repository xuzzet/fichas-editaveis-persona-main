// =============================================
// SISTEMA DE PERFIS DE FICHA — camada de persistência
// Gerencia múltiplas fichas independentes (máx. 8) e migra o
// formato antigo (localStorage['ficha-yby-p3r-skin']) automaticamente.
//
// Esta camada NÃO altera o `state`, os cálculos, mecânicas ou a
// interface da ficha. Ela apenas armazena/recupera os "snapshots"
// (o mesmo objeto produzido por storage.js) associados a um perfil.
//
// Estrutura persistida em localStorage['personaProfiles']:
// {
//   activeId: "p_xxx",
//   profiles: [
//     { id, name, avatar, createdAt, updatedAt, sheetData: {...snapshot...} }
//   ]
// }
// =============================================

export const PROFILES_KEY = 'personaProfiles';
export const LEGACY_KEY = 'ficha-yby-p3r-skin';
export const MAX_PROFILES = 8;

// Estado em memória do repositório de perfis.
var store = { activeId: null, profiles: [] };

// Backup temporário do último estado válido salvo (recuperação contra perda).
var lastGoodSnapshot = null;

function nowISO() { return new Date().toISOString(); }

export function genId() {
  return 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

// ── Leitura ──────────────────────────────────────────────
export function getStore() { return store; }
export function getProfiles() { return store.profiles.slice(); }
export function getActiveId() { return store.activeId; }
export function getProfileCount() { return store.profiles.length; }
export function isFull() { return store.profiles.length >= MAX_PROFILES; }

export function getProfile(id) {
  for (var i = 0; i < store.profiles.length; i++) {
    if (store.profiles[i].id === id) return store.profiles[i];
  }
  return null;
}

export function getActiveProfile() {
  return getProfile(store.activeId);
}

// ── Utilitários internos ─────────────────────────────────
function deriveName(sheetData, fallback) {
  var n = sheetData && sheetData.acessoRapido && sheetData.acessoRapido.CharPlayer;
  return (n && String(n).trim()) || fallback || 'Novo Personagem';
}

function deriveAvatar(sheetData) {
  return (sheetData && sheetData.portrait && sheetData.portrait.src) || '';
}

function makeProfile(name, avatar, sheetData) {
  var ts = nowISO();
  return {
    id: genId(),
    name: (name && String(name).trim()) || 'Novo Personagem',
    avatar: avatar || '',
    createdAt: ts,
    updatedAt: ts,
    sheetData: sheetData || {}
  };
}

// ── Persistência ─────────────────────────────────────────
export function persist() {
  try {
    var json = JSON.stringify(store);
    localStorage.setItem(PROFILES_KEY, json);
    lastGoodSnapshot = json;
    return true;
  } catch (e) {
    console.warn('[Profiles] Erro ao persistir:', e);
    // Recuperação: tenta restaurar o último estado válido conhecido.
    if (lastGoodSnapshot) {
      try { localStorage.setItem(PROFILES_KEY, lastGoodSnapshot); } catch (e2) {}
    }
    return false;
  }
}

// Carrega o repositório do localStorage, migrando o formato antigo se
// necessário. Sempre deixa `store` em um estado válido. Retorna `store`.
export function loadProfileStore() {
  var raw = null;
  try { raw = localStorage.getItem(PROFILES_KEY); } catch (e) {}

  if (raw) {
    try {
      var parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.profiles)) {
        store = {
          activeId: parsed.activeId || (parsed.profiles[0] && parsed.profiles[0].id) || null,
          profiles: parsed.profiles
        };
        if (!getActiveProfile() && store.profiles.length) {
          store.activeId = store.profiles[0].id;
        }
        lastGoodSnapshot = raw;
        return store;
      }
    } catch (e) {
      console.warn('[Profiles] Repositório inválido — tentando migração legada.', e);
    }
  }

  // Migração do formato antigo (ficha única).
  var legacy = null;
  try { legacy = localStorage.getItem(LEGACY_KEY); } catch (e) {}
  if (legacy) {
    try {
      var data = JSON.parse(legacy);
      if (data && typeof data === 'object') {
        var prof = makeProfile(deriveName(data, 'Personagem 1'), deriveAvatar(data), data);
        store = { activeId: prof.id, profiles: [prof] };
        persist();
        try { localStorage.removeItem(LEGACY_KEY); } catch (e) {}
        return store;
      }
    } catch (e) {
      console.warn('[Profiles] Falha ao migrar ficha antiga:', e);
    }
  }

  store = { activeId: null, profiles: [] };
  return store;
}

// Salva o snapshot atual no perfil ativo. Se ainda não houver perfil
// ativo, cria o primeiro perfil automaticamente. Retorna o perfil.
export function saveActiveSnapshot(sheetData) {
  var p = getActiveProfile();
  if (!p) {
    p = makeProfile(deriveName(sheetData), deriveAvatar(sheetData), sheetData);
    store.profiles.push(p);
    store.activeId = p.id;
  } else {
    p.sheetData = sheetData;
    p.name = deriveName(sheetData, p.name);
    p.avatar = deriveAvatar(sheetData);
    p.updatedAt = nowISO();
  }
  persist();
  return p;
}

// Cria um novo perfil com um sheetData já limpo. O novo perfil vira o ativo.
// Retorna { ok, profile } ou { ok:false, error:'limit' }.
export function createProfile(name, avatar, sheetData) {
  if (isFull()) return { ok: false, error: 'limit' };
  var p = makeProfile(name, avatar, sheetData);
  store.profiles.push(p);
  store.activeId = p.id;
  persist();
  return { ok: true, profile: p };
}

// Duplica um perfil existente (cópia completa e independente).
export function duplicateProfile(id) {
  if (isFull()) return { ok: false, error: 'limit' };
  var src = getProfile(id);
  if (!src) return { ok: false, error: 'notfound' };
  var copy = makeProfile(
    src.name + ' Clone',
    src.avatar,
    JSON.parse(JSON.stringify(src.sheetData || {}))
  );
  store.profiles.push(copy);
  persist();
  return { ok: true, profile: copy };
}

// Exclui um perfil. Se era o ativo, elege outro como ativo (se houver).
// Retorna { ok, switched, newActive }.
export function deleteProfile(id) {
  var idx = -1;
  for (var i = 0; i < store.profiles.length; i++) {
    if (store.profiles[i].id === id) { idx = i; break; }
  }
  if (idx < 0) return { ok: false, error: 'notfound' };
  store.profiles.splice(idx, 1);
  var switched = false;
  if (store.activeId === id) {
    store.activeId = store.profiles.length ? store.profiles[0].id : null;
    switched = true;
  }
  persist();
  return { ok: true, switched: switched, newActive: getActiveProfile() };
}

// Renomeia um perfil. Mantém o nome do personagem (CharPlayer) em sincronia
// dentro do sheetData armazenado.
export function renameProfile(id, name) {
  var p = getProfile(id);
  if (!p) return { ok: false, error: 'notfound' };
  var clean = (name && String(name).trim());
  if (!clean) return { ok: false, error: 'empty' };
  p.name = clean;
  if (p.sheetData && p.sheetData.acessoRapido) {
    p.sheetData.acessoRapido.CharPlayer = clean;
  }
  if (p.sheetData && p.sheetData.persona) {
    // não sobrescreve nome da persona; apenas identidade
  }
  p.updatedAt = nowISO();
  persist();
  return { ok: true, profile: p };
}

// Atualiza o retrato (avatar) de um perfil e do seu sheetData armazenado.
export function setProfileAvatar(id, avatar) {
  var p = getProfile(id);
  if (!p) return { ok: false, error: 'notfound' };
  p.avatar = avatar || '';
  if (p.sheetData) {
    p.sheetData.portrait = p.sheetData.portrait || {};
    p.sheetData.portrait.src = p.avatar;
  }
  p.updatedAt = nowISO();
  persist();
  return { ok: true, profile: p };
}

// Define o perfil ativo e retorna seu sheetData para ser aplicado à ficha.
export function switchProfile(id) {
  var p = getProfile(id);
  if (!p) return { ok: false, error: 'notfound' };
  store.activeId = id;
  persist();
  return { ok: true, profile: p, sheetData: p.sheetData };
}
