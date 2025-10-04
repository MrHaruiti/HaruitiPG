// >>> GAMEJS LOADED: v2025-10-04-3 - DATABASE FIX (Shiny + Click Forms)
console.log(">>> GAMEJS LOADED: v2025-10-04-3 - DATABASE FIX");

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
  load();
  showTab("explore");
  showSubTab("db-kanto");
  loadRegion("kanto");
  renderCollection();
  renderItems();
});

// =========================
// PERSISTÊNCIA
// =========================
function save() {
  localStorage.setItem("pk_state", JSON.stringify(state));
}

function load() {
  const s = localStorage.getItem("pk_state");
  if (s) {
    try {
      state = JSON.parse(s);
    } catch {
      state = { pokedex: [], collection: [], candies: {}, items: {} };
    }
    state.items = state.items || {};
    state.candies = state.candies || {};
    state.collection = state.collection || [];
    state.pokedex = state.pokedex || [];
  }
}

// =========================
// NAVEGAÇÃO
// =========================
function showTab(t) {
  document.querySelectorAll(".tab").forEach(el => el.style.display = "none");
  const tabEl = document.getElementById("tab-" + t);
  if (tabEl) tabEl.style.display = "block";
  closeDetails();
}

function showSubTab(id) {
  document.querySelectorAll(".subtab").forEach(el => el.style.display = "none");
  const sub = document.getElementById(id);
  if (sub) sub.style.display = "block";
  closeDetails();
  if (id.startsWith("db-")) loadRegion(id.replace("db-", ""));
}

// =========================
// DATABASE / POKEDEX
// =========================
async function loadRegion(region) {
  state.pokedex = [];
  try {
    const res = await fetch(`data/${region}/index.json`);
    const indexJson = await res.json();
    let families = Array.isArray(indexJson) ? indexJson : indexJson.families || [];
    families = families.map(f => typeof f === "string" ? f.trim() : "").filter(Boolean);
    for (const fam of families) {
      const fname = fam.endsWith(".json") ? fam : fam + ".json";
      const famRes = await fetch(`data/${region}/${fname}`);
      if (!famRes.ok) continue;
      const famJson = await famRes.json();
      if (Array.isArray(famJson)) state.pokedex.push(...famJson);
      else if (Array.isArray(famJson.pokemon)) state.pokedex.push(...famJson.pokemon);
      else {
        const arr = Object.values(famJson).find(v => Array.isArray(v));
        if (arr) state.pokedex.push(...arr);
      }
    }
  } catch {
    if (region === "kanto") {
      state.pokedex = [
        { dex: 1, name: "Bulbasaur", form: "normal", rarity: "Comum", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png", baseCatch: 45, family: "bulbasaur", stats: {atk: 118, def: 111, sta: 128}, evolvesTo: "Ivysaur" }
      ];
    }
  }
  renderPokedex(region);
}

function renderPokedex(region) {
  const box = document.querySelector(`#db-${region} .list`);
  if (!box) return;
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
        <img class="sprite" src="${p.img || 'https://via.placeholder.com/72?text=?'}" style="width:72px; height:72px; border-radius:8px;" alt="${p.name || '?'}"/>
        <div style="font-size:12px;">${p.name || '???'}</div>
      `;
      div.onclick = () => showAllForms(p.dex);
      box.appendChild(div);
    }
  });
}

// =========================
// MODAL - CORRIGIDO
// =========================
function showAllForms(dex) {
  const modal = document.getElementById('detailModal');
  if (!modal) return;
  const forms = state.pokedex.filter(p => p.dex === dex);
  if (!forms.length) return;

  const dName = document.getElementById("dName");
  const dImg = document.getElementById("dImg");
  const dInfo = document.getElementById("dInfo");

  // Define a primeira forma como principal
  const mainForm = forms[0];
  dName.innerText = `${mainForm.name} - Todas as Formas`;
  dImg.src = mainForm.img || "";
  dInfo.innerHTML = "";

  // Adiciona todas as formas (normal + shiny)
  forms.forEach(f => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.marginBottom = "10px";
    row.style.cursor = "pointer";
    
    // Versão Normal
    const normalImg = document.createElement("img");
    normalImg.src = f.img;
    normalImg.width = 48;
    normalImg.height = 48;
    normalImg.style.marginRight = "10px";
    normalImg.style.cursor = "pointer";
    normalImg.onclick = () => setMainForm(f, false);
    
    // Versão Shiny (se existir)
    let shinyImg = null;
    if (f.imgShiny) {
      shinyImg = document.createElement("img");
      shinyImg.src = f.imgShiny;
      shinyImg.width = 48;
      shinyImg.height = 48;
      shinyImg.style.marginRight = "10px";
      shinyImg.style.cursor = "pointer";
      shinyImg.style.border = "2px solid #FFD700";
      shinyImg.style.borderRadius = "8px";
      shinyImg.onclick = () => setMainForm(f, true);
    }
    
    const label = document.createElement("span");
    label.innerHTML = `<b>${f.name}</b> - ${f.rarity || 'N/A'}`;
    
    row.appendChild(normalImg);
    if (shinyImg) row.appendChild(shinyImg);
    row.appendChild(label);
    dInfo.appendChild(row);
  });

  modal.style.display = "flex";
}

function setMainForm(form, isShiny) {
  const dImg = document.getElementById("dImg");
  const dName = document.getElementById("dName");
  const dInfo = document.getElementById("dInfo");

  // Atualiza imagem principal
  dImg.src = isShiny && form.imgShiny ? form.imgShiny : form.img;
  dName.innerText = form.name + (isShiny ? " ⭐ (Shiny)" : "");
  
  // Atualiza informações
  const infoDiv = document.createElement("div");
  infoDiv.style.marginTop = "15px";
  infoDiv.style.padding = "10px";
  infoDiv.style.background = "#2c2c2c";
  infoDiv.style.borderRadius = "8px";
  infoDiv.innerHTML = `
    <p><b>#${form.dex}</b> - Raridade: ${form.rarity || 'N/A'}</p>
    <p>Stats: Atk ${form.stats?.atk || 'N/A'} | Def ${form.stats?.def || 'N/A'} | Sta ${form.stats?.sta || 'N/A'}</p>
    <p>Base: ${form.base || 'N/A'} ${form.evolution ? `(Evolui para: ${form.evolution.to} - ${form.evolution.cost} doces)` : ''}</p>
  `;
  
  // Mantém a lista de formas, apenas adiciona as infos
  const existingInfo = dInfo.querySelector('div[style*="margin-top: 15px"]');
  if (existingInfo) existingInfo.remove();
  dInfo.appendChild(infoDiv);
}

function closeDetails() {
  const modal = document.getElementById("detailModal");
  if (modal) modal.style.display = "none";
}

// =========================
// EXPLORAÇÃO
// =========================
function explore() {
  if (state.pokedex.length === 0) {
    document.getElementById("exploreResult").innerHTML = "<p style='color:#f00; text-align:center;'>Carregue a Database primeiro!</p>";
    return;
  }
  const p = state.pokedex[Math.floor(Math.random() * state.pokedex.length)];
  currentEncounter = { ...p, level: 1 };
  currentEncounter.shiny = Math.random() < shinyChance;
  currentEncounter.cp = calcCP(currentEncounter);

  const result = document.getElementById("exploreResult");
  result.innerHTML = `
    <div style="text-align:center; margin:20px 0;">
      <img src="${currentEncounter.img}" alt="${currentEncounter.name}" style="width:120px; height:120px; border-radius:50%; border:3px solid ${currentEncounter.shiny ? '#FFD700' : '#4CAF50'};" />
      <h3>${currentEncounter.name} ${currentEncounter.shiny ? '⭐' : ''}</h3>
      <p>CP: ${currentEncounter.cp} | Raridade: ${currentEncounter.rarity}</p>
      <button onclick="tryCatch()" style="background:#ff5722; color:white; padding:10px 20px; border:none; border-radius:5px; cursor:pointer; font-size:16px;">Tentar Capturar</button>
    </div>
  `;
}

function calcCP(poke) {
  const atk = poke.stats?.atk || 100;
  const def = poke.stats?.def || 100;
  const sta = poke.stats?.sta || 100;
  const base = atk + def + sta;
  return Math.floor((base / 10) * (poke.level || 1)) + Math.floor(Math.random() * 20);
}

function tryCatch() {
  if (!currentEncounter) return;
  const baseRate = currentEncounter.baseCatch || 30;
  const catchRate = currentEncounter.shiny ? 100 : baseRate;
  const success = Math.random() * 100 < catchRate;

  const result = document.getElementById("exploreResult");
  if (success) {
    const caught = { ...currentEncounter, caughtAt: Date.now() };
    state.collection.push(caught);
    const family = caught.base || caught.name.toLowerCase().replace(/\s+/g, "");
    state.candies[family] = (state.candies[family] || 0) + 3;
    save();
    result.innerHTML = `<div style="text-align:center; color:#4CAF50; margin:20px 0;">
      <h3>🎉 Capturado com sucesso!</h3>
      <p>${caught.name} ${caught.shiny ? '⭐' : ''} adicionado à coleção</p>
      <p>+3 doces de ${family}</p>
      <button onclick="explore()" style="background:#4CAF50; color:white; padding:10px 20px; border:none; border-radius:5px; cursor:pointer;">Explorar Mais</button>
    </div>`;
    renderCollection();
    renderItems();
  } else {
    result.innerHTML += `<div style="text-align:center; color:#f44336; margin:20px 0;">
      <p>O Pokémon fugiu! 😞</p>
      <button onclick="tryCatch()" style="background:#f44336; color:white; padding:8px 16px; border:none; border-radius:5px; cursor:pointer;">Tentar Novamente</button>
    </div>`;
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
    div.innerHTML = `
      <img src="${p.img}" alt="${p.name}" style="width:72px; height:72px;" />
      <div>${p.name} Lv.${p.level || 1}</div>
      <div>CP ${p.cp}</div>
    `;
    div.onclick = () => showDetails(idx);
    box.appendChild(div);
  });
}

function renderItems() {
  const box = document.getElementById("items");
  if (!box) return;
  if (Object.keys(state.items).length === 0) {
    box.innerHTML = "<div style='color:#ccc;'>Nenhum item disponível</div>";
    return;
  }
  let html = "<div style='text-align:left;'>";
  Object.entries(state.items).forEach(([item, count]) => {
    html += `<p>${item}: ${count}</p>`;
  });
  html += "</div>";
  box.innerHTML = html;
}

function showDetails(idx) {
  const p = state.collection[idx];
  if (!p) return;

  const modal = document.getElementById('detailModal');
  const dName = document.getElementById("dName");
  const dImg = document.getElementById("dImg");
  const dInfo = document.getElementById("dInfo");

  const family = p.base || p.name.toLowerCase().replace(/\s+/g, "");
  const candyCount = state.candies[family] || 0;

  dName.innerText = `${p.name} Lv.${p.level || 1} (CP ${p.cp})`;
  dImg.src = p.img;
  dImg.alt = p.name;
  dInfo.innerHTML = `
    <p>Raridade: ${p.rarity}</p>
    <p>Stats: Atk ${p.stats?.atk || 'N/A'}, Def ${p.stats?.def || 'N/A'}, Sta ${p.stats?.sta || 'N/A'}</p>
    <p>Doces de ${family}: ${candyCount}</p>
    <div style="margin:10px 0;">
      <button onclick="trainPokemon(${idx})">Treinar (+1 Level, 5 doces)</button>
      <button onclick="startEvolution(${idx})">Evoluir (se possível)</button>
    </div>
  `;
  modal.style.display = "flex";
}

// =========================
// TREINO / EVOLUÇÃO
// =========================
function trainPokemon(idx) {
  const p = state.collection[idx];
  if (!p) return;
  const family = p.base || p.name.toLowerCase().replace(/\s+/g, "");
  if ((state.candies[family] || 0) < 5) {
    alert("Você precisa de pelo menos 5 doces para treinar!");
    return;
  }
  state.candies[family] -= 5;
  p.level = (p.level || 1) + 1;
  p.cp = calcCP(p);
  save();
  renderCollection();
  showDetails(idx);
}

function startEvolution(idx) {
  const p = state.collection[idx];
  if (!p || !p.evolution) {
    alert(`${p?.name || 'Este Pokémon'} não pode evoluir.`);
    return;
  }
  const family = p.base || p.name.toLowerCase().replace(/\s+/g, "");
  const cost = p.evolution.cost || 50;
  if ((state.candies[family] || 0) < cost) {
    alert(`Você precisa de ${cost} doces de ${family} para evoluir ${p.name}!`);
    return;
  }
  const nextEvolution = state.pokedex.find(
    poke => poke.name === p.evolution.to && (poke.form === "normal" || !poke.form)
  );
  if (!nextEvolution) return;
  state.candies[family] -= cost;
  p.name = nextEvolution.name;
  p.dex = nextEvolution.dex;
  p.img = nextEvolution.img;
  p.rarity = nextEvolution.rarity;
  p.stats = nextEvolution.stats;
  p.evolution = nextEvolution.evolution;
  p.cp = calcCP(p);
  save();
  renderCollection();
  showDetails(idx);
}
