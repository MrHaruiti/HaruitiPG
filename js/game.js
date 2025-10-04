// >>> GAMEJS LOADED: v2025-10-04-1 - FETCH SEUS JSONs DO GITHUB
console.log(">>> GAMEJS LOADED: v2025-10-04-1 - FETCH SEUS JSONs DO GITHUB");

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
// DATABASE / POKEDEX (FETCH SEUS JSONs + MOCK FALLBACK)
// =========================
async function loadRegion(region) {
  console.log(`[DB] Carregando seus JSONs de ${region}`);
  state.pokedex = []; // Limpa
  try {
    const indexUrl = `data/${region}/index.json`;
    console.log(`[DB] Fetch seus index.json: ${indexUrl}`);
    const res = await fetch(indexUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status} - Verifique data/${region}/index.json no GitHub`);
    const indexJson = await res.json();
    console.log(`[DB] Seu index.json carregado:`, indexJson);

    let families = [];
    if (Array.isArray(indexJson)) families = indexJson;
    else if (indexJson && Array.isArray(indexJson.families)) families = indexJson.families;
    else {
      console.warn("[DB] Formato do seu index.json inválido - deve ser array de nomes de arquivos");
      families = [];
    }

    families = families.map(f => typeof f === "string" ? f.trim() : "").filter(Boolean);
    console.log(`[DB] Families do seu index:`, families);

    for (const fam of families) {
      const fname = fam.endsWith(".json") ? fam : fam + ".json";
      const famUrl = `data/${region}/${fname}`;
      console.log(`[DB] Fetch seu family.json: ${famUrl}`);
      const famRes = await fetch(famUrl);
      if (!famRes.ok) {
        console.warn(`[DB] Seu ${fname} não encontrado (HTTP ${famRes.status}) - pule`);
        continue;
      }
      const famJson = await famRes.json();
      console.log(`[DB] Seu ${fname} carregado:`, famJson);
      if (Array.isArray(famJson)) state.pokedex.push(...famJson);
      else if (Array.isArray(famJson.pokemon)) state.pokedex.push(...famJson.pokemon);
      else {
        const arr = Object.values(famJson).find(v => Array.isArray(v));
        if (arr) state.pokedex.push(...arr);
        else console.warn(`[DB] Formato do seu ${fname} inválido - deve ser array de Pokémon`);
      }
    }

    console.log(`[DB] Seus JSONs carregados: ${state.pokedex.length} Pokémon totais`);
  } catch (err) {
    console.error(`[DB] Erro nos seus JSONs de ${region}:`, err.message);
    console.log("[DB] Usando mock temporário para teste (remova se JSONs ok)");
    // Mock temporário - remova ou comente se seus JSONs carregarem
    if (region === "kanto") {
      state.pokedex = [
        { dex: 1, name: "Bulbasaur", form: "normal", rarity: "Comum", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png", baseCatch: 45, family: "bulbasaur", stats: {atk: 118, def: 111, sta: 128}, evolvesTo: "Ivysaur" },
        { dex: 4, name: "Charmander", form: "normal", rarity: "Comum", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png", baseCatch: 45, family: "charmander", stats: {atk: 116, def: 93, sta: 118}, evolvesTo: "Charmeleon" },
        { dex: 7, name: "Squirtle", form: "normal", rarity: "Comum", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png", baseCatch: 45, family: "squirtle", stats: {atk: 94, def: 122, sta: 137}, evolvesTo: "Wartortle" },
        { dex: 25, name: "Pikachu", form: "normal", rarity: "Raro", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png", baseCatch: 20, family: "pikachu", stats: {atk: 112, def: 96, sta: 120}, evolvesTo: "Raichu" }
      ];
      console.log(`[DB] Mock ativado: ${state.pokedex.length} Pokémon (substitua pelos seus JSONs)`);
    }
  }
  renderPokedex(region);
}

function renderPokedex(region) {
  console.log(`[RENDER] Renderizando ${state.pokedex.length} Pokémon de ${region}`);
  const box = document.querySelector(`#db-${region} .list`);
  if (!box) {
    console.warn(`[RENDER] .list não encontrado para ${region}`);
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
        <img class="sprite" src="${p.img || 'https://via.placeholder.com/72?text=?'} " style="width:72px; height:72px; border-radius:8px;" alt="${p.name || '?'}"/>
        <div style="font-size:12px;">${p.name || '???'}</div>
      `;
      div.onclick = () => showAllForms(p.dex);
      box.appendChild(div);
      console.log(`[RENDER] Item clicável criado: ${p.name} (dex ${p.dex})`);
    }
  });

  if (sorted.length === 0) {
    box.innerHTML = "<div style='grid-column:1/-1; text-align:center; color:#ccc; padding:20px;'>Nenhum Pokémon carregado. Verifique seus JSONs em data/" + region + "/ no GitHub.</div>";
  }
}

// =========================
// MODAL FORMAS E DETALHES
// =========================
function showAllForms(dex) {
  console.log(`[MODAL] Formas para dex ${dex}`);
  const modal = document.getElementById('detailModal');
  if (!modal) {
    console.warn('[MODAL] Modal não encontrado - adicione <div id="detailModal"> no HTML');
    return;
  }
  const forms = state.pokedex.filter(p => p.dex === dex);
  if (!forms.length) {
    console.warn(`[MODAL] Nenhuma forma para dex ${dex}`);
    return;
  }

  const dName = document.getElementById("dName");
  const dImg = document.getElementById("dImg");
  const dInfo = document.getElementById("dInfo");
  if (!dName || !dImg || !dInfo) {
    console.error('[MODAL] Elementos dName/dImg/dInfo missing no HTML');
    return;
  }

  dName.innerText = `${forms[0].name || 'Pokémon'} - Todas as Formas`;
  dImg.src = forms[0].img || "";
  dImg.alt = forms[0].name;
  dInfo.innerHTML = "";

  forms.forEach(f => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.margin = "5px 0";
    row.style.padding = "5px";
    row.style.border = "1px solid #ccc";
    row.style.borderRadius = "5px";
    row.innerHTML = `
      <img src="${f.img}" width="48" height="48" style="cursor:pointer; margin-right:10px;" alt="${f.name}" onclick="setMainForm(${JSON.stringify(f).replace(/"/g, '&quot;')})" />
      <span><b>${f.name}</b> - ${f.rarity || 'N/A'}</span>
    `;
    dInfo.appendChild(row);
  });

  modal.style.display = "flex";
}

function setMainForm(formJsonString) {
  const form = JSON.parse(formJsonString);
  console.log(`[MODAL] Forma selecionada: ${form.name}`);
  const dImg = document.getElementById("dImg");
  const dName = document.getElementById("dName");
  const dInfo = document.getElementById("dInfo");
  if (!dImg || !dName || !dInfo) return;

  dImg.src = form.img || "";
  dName.innerText = form.name + (form.shiny ? " ⭐" : "");
  dInfo.innerHTML = `
    <div style="margin:10px 0;">
      <p><b>#${form.dex}</b> - Raridade: ${form.rarity || 'N/A'}</p>
      <p>Stats: Atk ${form.stats?.atk || 'N/A'} | Def ${form.stats?.def || 'N/A'} | Sta ${form.stats?.sta || 'N/A'}</p>
      <p>Family: ${form.family || 'N/A'} (Evolui para: ${form.evolvesTo || 'N/A'})</p>
    </div>
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
  console.log("[EXPLORE] Explorando...");
  if (state.pokedex.length === 0) {
    document.getElementById("exploreResult").innerHTML = "<p style='color:#f00; text-align:center;'>Carregue a Database primeiro para ter Pokémon disponíveis!</p>";
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
  console.log(`[EXPLORE] Encontrado: ${currentEncounter.name} (shiny: ${currentEncounter.shiny})`);
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
    const family = caught.family || caught.name.toLowerCase().replace(/\s+/g, "");
    state.candies[family] = (state.candies[family] || 0) + 3;
    save();
    result.innerHTML = `
      <div style="text-align:center; color:#4CAF50; margin:20px 0;">
        <h3>🎉 Capturado com sucesso!</h3>
        <p>${caught.name} ${caught.shiny ? '⭐' : ''} adicionado à coleção</p>
        <p>+3 doces de ${family}</p>
        <button onclick="explore()" style="background:#4CAF50; color:white; padding:10px 20px; border:none; border-radius:5px; cursor:pointer;">Explorar Mais</button>
      </div>
    `;
    renderCollection();
    renderItems();
    console.log(`[CATCH] Capturado: ${caught.name}`);
  } else {
    result.innerHTML += `
      <div style="text-align:center; color:#f44336; margin:20px 0;">
        <p>O Pokémon fugiu! 😞</p>
        <button onclick="tryCatch()" style="background:#f44336; color:white; padding:8px 16px; border:none; border-radius:5px; cursor:pointer;">Tentar Novamente</button>
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
      <button onclick="startEvolution(${idx})" style="background:#9C27B0; color:white; padding:8px; margin:5px; border:none; border-radius:5px;">Evoluir (se possível)</button>
    </div>
  `;
  modal.style.display = "flex";
}

function trainPokemon(idx) {
  const p = state.collection[idx];
  if (!p) return;
  const family = p.family || p.name.toLowerCase().replace(/\s+/g, "");
  if ((state.candies[family] || 0) < 5) {
    alert("Você precisa de pelo menos 5 doces para treinar!");
    return;
  }
  state.candies[family] -= 5;
  p.level = (p.level || 1) + 1;
  p.cp = calcCP(p);
  save();
  renderCollection();
  renderItems();
  alert(`${p.name} treinado para nível ${p.level}!`);
  showDetails(idx);
}

function startEvolution(idx) {
  const p = state.collection[idx];
  if (!p) return;
  if (!p.evolvesTo) {
    alert(`${p.name} não tem mais evoluções.`);
    return;
  }

  const family = p.family || p.name.toLowerCase().replace(/\s+/g, "");
  if ((state.candies[family] || 0) < 50) {
    alert(`Você precisa de 50 doces de ${family} para evoluir ${p.name}!`);
    return;
  }

  const nextEvolution = state.pokedex.find(
    poke => poke.name === p.evolvesTo && (poke.form === "normal" || !poke.form)
  );

  if (!nextEvolution) {
    alert(`Não foi possível encontrar a próxima evolução para ${p.name}.`);
    return;
  }

  state.candies[family] -= 50;
  p.name = nextEvolution.name;
  p.dex = nextEvolution.dex;
  p.img = nextEvolution.img;
  p.rarity = nextEvolution.rarity;
  p.stats = nextEvolution.stats;
  p.evolvesTo = nextEvolution.evolvesTo; // Atualiza para a próxima evolução
  p.cp = calcCP(p); // Recalcula CP com novos stats

  save();
  renderCollection();
  renderItems();
  alert(`Parabéns! Seu ${family} evoluiu para ${p.name}!`);
  showDetails(idx);
}
