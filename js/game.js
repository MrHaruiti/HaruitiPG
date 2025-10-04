// >>> GAMEJS LOADED: v2025-10-04-1 - COMPLETO E FUNCIONAL
console.log(">>> GAMEJS LOADED: v2025-10-04-1 - COMPLETO E FUNCIONAL");

// =========================
// ESTADO GLOBAL
// =========================
let state = {
  pokedex: [],
  collection: [],
  candies: {},
  items: {}
};
let currentEncounter = null;
const shinyChance = 0.001;

// =========================
// BOOT
// =========================
document.addEventListener("DOMContentLoaded", () => {
  console.log("[BOOT] Iniciando...");
  load();
  showTab("explore");
  showSubTab("db-kanto");
  loadRegion("kanto");
  renderCollection();
  renderItems();
  console.log("[BOOT] Completo - funções definidas: showTab =", typeof showTab);
});

// =========================
// PERSISTÊNCIA
// =========================
function save() {
  localStorage.setItem("pk_state", JSON.stringify(state));
  console.log("[SAVE] Estado salvo");
}

function load() {
  const s = localStorage.getItem("pk_state");
  if (s) {
    try {
      state = JSON.parse(s);
    } catch (e) {
      console.error("Erro parseando estado salvo:", e);
      state = { pokedex: [], collection: [], candies: {}, items: {} };
    }
    state.items = state.items || {};
    state.candies = state.candies || {};
    state.collection = state.collection || [];
    state.pokedex = state.pokedex || [];
  }
  console.log("[LOAD] Estado carregado");
}

// =========================
// NAVEGAÇÃO (TABS FUNCIONANDO 100%)
// =========================
function showTab(t) {
  console.log(`[NAV] Mostrando tab: ${t}`);
  document.querySelectorAll(".tab").forEach(el => el.style.display = "none");
  const tabEl = document.getElementById("tab-" + t);
  if (tabEl) {
    tabEl.style.display = "block";
  } else {
    console.warn(`[NAV] Tab ${t} não encontrada`);
  }
  closeDetails();
}

function showSubTab(id) {
  console.log(`[NAV] Mostrando subtabs: ${id}`);
  document.querySelectorAll(".subtab").forEach(el => el.style.display = "none");
  const sub = document.getElementById(id);
  if (sub) {
    sub.style.display = "block";
  } else {
    console.warn(`[NAV] Subtab ${id} não encontrada`);
  }
  closeDetails();
  if (id.startsWith("db-")) {
    const region = id.replace("db-", "");
    loadRegion(region);
  }
}

// =========================
// DATABASE / POKEDEX (COM MOCK PARA TESTE)
// =========================
async function loadRegion(region) {
  console.log(`[DB] Carregando região: ${region}`);
  try {
    const indexUrl = `data/${region}/index.json`;
    console.log(`[DB] Tentando fetch: ${indexUrl}`);
    const res = await fetch(indexUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    console.log(`[DB] Dados reais carregados:`, json);
    // Lógica para families (simplificada - expanda se JSON real)
    state.pokedex = json.pokemon || json || []; // Assume formato simples
  } catch (err) {
    console.warn(`[DB] Fetch falhou para ${region} - usando mock`);
    state.pokedex = [];
    if (region === "kanto") {
      state.pokedex = [
        { dex: 1, name: "Bulbasaur", form: "normal", rarity: "Comum", img: "https://via.placeholder.com/72x72/4CAF50/FFFFFF?text=B", baseCatch: 45, family: "bulbasaur", stats: {atk: 118, def: 111, sta: 128} },
        { dex: 4, name: "Charmander", form: "normal", rarity: "Comum", img: "https://via.placeholder.com/72x72/FF5722/FFFFFF?text=C", baseCatch: 45, family: "charmander", stats: {atk: 116, def: 93, sta: 118} },
        { dex: 7, name: "Squirtle", form: "normal", rarity: "Comum", img: "https://via.placeholder.com/72x72/2196F3/FFFFFF?text=S", baseCatch: 45, family: "squirtle", stats: {atk: 94, def: 122, sta: 137} },
        { dex: 25, name: "Pikachu", form: "normal", rarity: "Raro", img: "https://via.placeholder.com/72x72/FFEB3B/000000?text=P", baseCatch: 20, family: "pikachu", stats: {atk: 112, def: 96, sta: 120} }
      ];
      console.log(`[DB] Mock Kanto carregado: ${state.pokedex.length} Pokémon`);
    }
  }
  renderPokedex(region);
}

function renderPokedex(region) {
  console.log(`[RENDER] Pokédex para ${region}: ${state.pokedex.length} itens`);
  const box = document.querySelector(`#db-${region} .list`);
  if (!box) {
    console.warn(`[RENDER] Box .list não encontrado para ${region}`);
    return;
  }
  box.innerHTML = "";
  box.style.display = "grid";
  box.style.gridTemplateColumns = "repeat(auto-fit, minmax(80px, 1fr))";
  box.style.gap = "10px";
  box.style.textAlign = "center";

  const sorted = [...state.pokedex].sort((a, b) => (a.dex || 9999) - (b.dex || 9999));
  const shown = new Set();

  sorted.forEach(p => {
    if ((p.form === "normal" || !p.form) && !shown.has(p.dex)) {
      shown.add(p.dex);
      const div = document.createElement("div");
      div.className = "item clickable";
      div.style.cursor = "pointer";
      div.innerHTML = `
        <img class="sprite" src="${p.img || ''}" alt="${p.name || '?'} " style="width:72px; height:72px;"/>
        <div>${p.name || '???'}</div>
      `;
      div.onclick = () => showAllForms(p.dex);
      box.appendChild(div);
      console.log(`[RENDER] Item clicável: ${p.name} (dex ${p.dex})`);
    }
  });

  if (sorted.length === 0) {
    box.innerHTML = "<div style='grid-column:1/-1; text-align:center; color:#ccc;'>Nenhum Pokémon - adicione data/kanto/index.json</div>";
  }
}

// =========================
// MODAL FORMAS E DETALHES
// =========================
function showAllForms(dex) {
  console.log(`[MODAL] Mostrando formas para dex ${dex}`);
  const modal = document.getElementById('detailModal');
  if (!modal) {
    console.warn('[MODAL] Modal não encontrado no HTML');
    return;
  }
  const forms = state.pokedex.filter(p => p.dex === dex);
  if (!forms.length) {
    console.warn(`[MODAL] Nenhuma forma para ${dex}`);
    return;
  }

  const dName = document.getElementById("dName");
  const dImg = document.getElementById("dImg");
  const dInfo = document.getElementById("dInfo");
  if (!dName || !dImg || !dInfo) {
    console.error('[MODAL] Elementos missing');
    return;
  }

  dName.innerText = `${forms[0].name} - Formas`;
  dImg.src = forms[0].img || "";
  dImg.alt = forms[0].name;
  dInfo.innerHTML = forms.map(f => `
    <div style="display:flex; align-items:center; margin:5px 0; padding:5px; border:1px solid #ccc;">
      <img src="${f.img}" width="48" alt="${f.name}" style="cursor:pointer;" onclick="setMainForm(${JSON.stringify(f)})" />
      <span>${f.name} (${f.rarity})</span>
    </div>
  `).join('');

  modal.style.display = "flex";
}

function setMainForm(form) {
  console.log(`[MODAL] Forma principal: ${form.name}`);
  const dImg = document.getElementById("dImg");
  const dName = document.getElementById("dName");
  const dInfo = document.getElementById("dInfo");
  if (!dImg || !dName || !dInfo) return;

  dImg.src = form.img || "";
  dName.innerText = form.name + (form.shiny ? " ⭐" : "");
  dInfo.innerHTML = `
    <p><b>#${form.dex}</b> - ${form.rarity}</p>
    <p>Stats: Atk ${form.stats?.atk || 'N/A'}, Def ${form.stats?.def || 'N/A'}, Sta ${form.stats?.sta || 'N/A'}</p>
  `;
}

function closeDetails() {
  const modal = document.getElementById("detailModal");
  if (modal) modal.style.display = "none";
}

// =========================
// EXPLORAÇÃO E CAPTURA
// =========================
function explore() {
  console.log("[EXPLORE] Iniciando exploração");
  if (state.pokedex.length === 0) {
    document.getElementById("exploreResult").innerHTML = "<p style='color:#f00;'>Nenhum Pokémon disponível - use Database primeiro.</p>";
    return;
  }
  const p = state.pokedex[Math.floor(Math.random() * state.pokedex.length)];
  currentEncounter = { ...p };
  currentEncounter.shiny = Math.random() < shinyChance;
  currentEncounter.cp = calcCP(currentEncounter);
  currentEncounter.level = 1;

  const result = document.getElementById("exploreResult");
  result.innerHTML = `
    <div style="text-align:center; margin:20px;">
      <img src="${currentEncounter.img}" alt="${currentEncounter.name}" style="width:120px; height:120px; border-radius:50%; border:3px solid ${currentEncounter.shiny ? '#FFD700' : '#4CAF50'};" />
      <h3>${currentEncounter.name} ${currentEncounter.shiny ? '⭐' : ''} (CP ${currentEncounter.cp})</h3>
      <p>Raridade: ${currentEncounter.rarity}</p>
      <button onclick="tryCatch()" style="background:#ff5722; color:white; padding:10px 20px; border:none; border-radius:5px; cursor:pointer; font-size:16px;">Capturar!</button>
    </div>
  `;
  console.log(`[EXPLORE] Encontrado: ${currentEncounter.name} (shiny: ${currentEncounter.shiny})`);
}

function calcCP(poke) {
  const base = (poke.stats?.atk || 100) + (poke.stats?.def || 100) + (poke.stats?.sta || 100);
  return Math.floor(base * (poke.level || 1) / 10) + Math.floor(Math.random() * 50);
}

function tryCatch() {
  if (!currentEncounter) {
    console.warn("[CATCH] Nenhum encounter");
    return;
  }
  const baseRate = currentEncounter.baseCatch || 30;
  const catchRate = currentEncounter.shiny ? 100 : baseRate;
  const success = Math.random() * 100 < catchRate;

  const result = document.getElementById("exploreResult");
  if (success) {
    const caught = { ...currentEncounter, caughtAt: Date.now() };
    state.collection.push(caught);
    const family = caught.family || caught.name.toLowerCase().replace(/\s+/g, "");
    state.candies[family] = (state.candies[family] || 0) + 3; // 3 doces por captura
    save();
    result.innerHTML = `
      <div style="text-align:center; color:#4CAF50;">
        <h3>🎉 Capturado! ${caught.name} ${caught.shiny ? '⭐' : ''}</h3>
        <p>+3 doces de ${family}</p>
        <button onclick="explore()" style="background:#4CAF50; color:white; padding:10px 20px; border:none; border-radius:5px;">Explorar mais</button>
      </div>
    `;
    renderCollection();
    console.log(`[CATCH] Sucesso: ${caught.name} adicionado à coleção`);
  } else {
    result.innerHTML += `
      <div style="text-align:center; color:#f44336; margin-top:20px;">
        <p>😞 Fugiu! Tente de novo.</p>
        <button onclick="tryCatch()" style="background:#f44336; color:white; padding:8px 16px; border:none; border-radius:5px;">Tentar novamente</button>
      </div>
    `;
    console.log(`[CATCH] Falha: ${currentEncounter.name} fugiu`);
  }
}

// =========================
// BAG / COLEÇÃO
// =========================
function renderCollection() {
  const box = document.getElementById("collection");
  if (!box) return;
  box.innerHTML = "";
  box.style.display = "grid";
  box.style.gridTemplateColumns = "repeat(auto-fit, minmax(120px, 1fr))";
  box.style.gap = "10px";

  if (state.collection.length === 0) {
    box.innerHTML = "<div style='grid-column:1/-1; text-align:center; color:#ccc;'>Coleção vazia - explore e capture!</div>";
    return;
  }

  state.collection.forEach((p, idx) => {
    const div = document.createElement("div");
    div.className = "item clickable";
    div.style.cursor = "pointer";
    div.innerHTML = `
      <img src="${p.img}" alt="${p.name}" style="width:72px; height:72px;" />
      <div>${p.name} Lv.${p.level || 1}</div>
      <div>CP ${p.cp}</div>
    `;
    div.onclick = () => showDetails(idx);
    box.appendChild(div);
  });
  console.log(`[BAG] Renderizada coleção: ${state.collection.length} Pokémon`);
}

function renderItems() {
  const box = document.getElementById("items");
  if (!box) return;
  let html = "<div style='text-align:left;'>";
  Object.entries(state.candies).forEach(([family, count]) => {
    html += `<p>${family}: ${count} doces <button onclick="useCandy('${family}')" style="background:#9C27B0; color:white; padding:2px 6px; border:none; border-radius:3px;">Usar</button></p>`;
  });
  html += "</div>";
  box.innerHTML = html || "<div>Nenhum item - capture para ganhar doces!</div>";
}

function showDetails(idx) {
  console.log(`[BAG] Detalhes para índice ${idx}`);
  const p = state.collection[idx];
  if (!p) return;

  const modal = document.getElementById('detailModal');
  if (!modal) return;
  const dName = document.getElementById("dName");
  const dImg = document.getElementById("dImg");
  const dInfo = document.getElementById("dInfo");
  if (!dName || !dImg || !dInfo) return;

  dName.innerText = `${p.name} Lv.${p.level || 1} (CP ${p.cp})`;
  dImg.src = p.img;
  dImg.alt = p.name;
  dInfo.innerHTML = `
    <p>Raridade: ${p.rarity}</p>
    <p>Stats: Atk ${p.stats?.atk || 'N/A'}, Def ${p.stats?.def || 'N/A'}, Sta ${p.stats?.sta || 'N/A'}</p>
    <div style="margin:10px 0;">
      <button onclick="trainPokemon(${idx})" style="background:#FF9800; color:white; padding:8px; margin:5px; border:none; border-radius:5px;">Treinar (+1 Level, 5 doces)</button>
      <button onclick="startEvolution(${idx})" style="background:#9C27B0; color:white; padding:
