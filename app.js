const SB_URL = 'https://kdxwgeocimmdfemwqnty.supabase.co';
const SB_KEY = 'sb_publishable_NSRd-Sq4PlVHNztHDsvXNA_kLHza0HN';
const sb = supabase.createClient(SB_URL, SB_KEY);

let currentUser = null;
let currentProfile = null;

// ===== AUTH =====
async function getSession() {
  // Use dynamic storage key based on project URL
  const storageKey = `sb-${SB_URL.replace('https://','').split('.')[0]}-auth-token`;
  const stored = localStorage.getItem(storageKey);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    return parsed?.user || null;
  } catch { return null; }
}

async function getToken() {
  const storageKey = `sb-${SB_URL.replace('https://','').split('.')[0]}-auth-token`;
  const stored = localStorage.getItem(storageKey);
  return stored ? JSON.parse(stored)?.access_token : null;
}

async function loadProfile(userId) {
  const token = await getToken();
  const r = await fetch(`${SB_URL}/rest/v1/user_profiles?id=eq.${userId}&select=*,schools(name)`, {
    headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${token}` }
  });
  const data = await r.json();
  return data?.[0] || null;
}

async function logout() {
  localStorage.removeItem('sb-uygjcopyohzslvrzvrmv-auth-token');
  window.location.href = 'index.html';
}

// ===== FETCH HELPER =====
async function dbFetch(table, query = '') {
  const token = await getToken();
  const r = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, {
    headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
  });
  return await r.json();
}

async function dbInsert(table, data) {
  const token = await getToken();
  const r = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
    body: JSON.stringify(data)
  });
  return await r.json();
}

async function dbUpdate(table, id, data) {
  const token = await getToken();
  const r = await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
    body: JSON.stringify(data)
  });
  return await r.json();
}

async function dbDelete(table, id) {
  const token = await getToken();
  await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'DELETE',
    headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${token}` }
  });
}

// ===== USERNAME HELPERS =====
function generateUsername(firstName, lastName) {
  const clean = str => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
  return `${clean(firstName)}.${clean(lastName)}`;
}

async function getUniqueUsername(firstName, lastName) {
  const base = generateUsername(firstName, lastName);
  const existing = await dbFetch('usernames', `username=like.${base}*&select=username`);
  if (!existing.length) return base;
  let i = 1;
  while (existing.find(u => u.username === `${base}${i}`)) i++;
  return `${base}${i}`;
}

// ===== UTILS =====
function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function fmt(d) { if (!d) return '—'; return new Date(d + 'T00:00:00').toLocaleDateString('sr-Latn', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
function closeMo(id) { document.getElementById(id).style.display = 'none'; }
function openMo(id) { document.getElementById(id).style.display = 'flex'; }

const ROLE_LABELS = {
  admin: 'Administrator',
  nastavnik: 'Nastavnik',
  strucna_sluzba: 'Stručna služba',
  staresina: 'Razredni starešina',
  ucenik: 'Učenik',
  roditelj: 'Roditelj'
};

const ROLE_BADGES = {
  admin: 'badge-purple',
  nastavnik: 'badge-blue',
  strucna_sluzba: 'badge-orange',
  staresina: 'badge-green',
  ucenik: 'badge-gray',
  roditelj: 'badge-gray'
};

const SUBJECT_TYPE_LABELS = {
  obavezan: 'Obavezan',
  obavezan_izborni: 'Obavezno izborni',
  izborni: 'Izborni',
  dopunski: 'Dopunski rad',
  dodatni: 'Dodatni rad',
  pripremni: 'Pripremni rad',
  sekcija: 'Sekcija',
  teorija: 'Teorija',
  praksa: 'Praksa',
  blok: 'Blok nastava',
  slobodna: 'Slobodna aktivnost'
};
