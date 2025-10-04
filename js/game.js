// >>> GAMEJS LOADED: v2025-10-04-3 - DATABASE FIX (Shiny + Click Forms)
console.log(">>> GAMEJS LOADED: v2025-10-04-3 - DATABASE FIX");

// =========================
// ESTADO GLOBAL
// =========================
let state = {
  pokedex: [],
  collection: [],
  candies: {},
  items: {},
  cpmTable: null
};
let currentEncounter = null;
const shinyChance = 0.001;

// =========================
// BOOT
// =========================
document.addEventListener("DOMContentLoaded", async () => {
  await loadCPM();
  load();
  showTab("explore");
  showSubTab("db-kanto");
  loadRegion("kanto");
  renderCollection();
  renderItems();
});

// =========================
// CARREGAR TABELA CPM
// =========================
async function loadCPM() {
  try {
    const res = await fetch('data/cpm.json');
    state.cpmTable = await res.json();
  } catch (e) {
    console.error("Erro ao carregar CPM:", e);
    // Fallback: cria tabela básica se não conseguir carregar
    state.cpmTable = {};
    for (let i = 0; i <= 100; i++) {
      state.cpmTable[i] = 0.094 + (i * 0.0158);
    }
  }
}

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
  let forms = state.pokedex.filter(p => p.dex === dex);
  if (!forms.length) return;

  // Remove duplicatas por nome (mantém só a primeira ocorrência)
  const seen = new Set();
  forms = forms.filter(f => {
    if (seen.has(f.name)) return false;
    seen.add(f.name);
    return true;
  });

  const dName = document.getElementById("dName");
  const dImg = document.getElementById("dImg");
  const dInfo = document.getElementById("dInfo");

  // Define a primeira forma como principal
  const mainForm = forms[0];
  dName.innerText = `${mainForm.name} - Todas as Formas`;
  dImg.src = mainForm.img || "";
  dInfo.innerHTML = "";

  // Adiciona cada forma UMA vez (normal e shiny lado a lado)
  forms.forEach(f => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.marginBottom = "10px";
    
    // Versão Normal
    const normalImg = document.createElement("img");
    normalImg.src = f.img;
    normalImg.width = 48;
    normalImg.height = 48;
    normalImg.style.marginRight = "10px";
    normalImg.style.cursor = "pointer";
    normalImg.style.border = "2px solid #444";
    normalImg.style.borderRadius = "8px";
    normalImg.onclick = () => setMainForm(f, false);
    
    // Versão Shiny (sempre aparece, mesmo que não tenha imgShiny ainda)
    const shinyImg = document.createElement("img");
    shinyImg.src = f.imgShiny || f.img; // Usa imgShiny se existir, senão usa normal
    shinyImg.width = 48;
    shinyImg.height = 48;
    shinyImg.style.marginRight = "10px";
    shinyImg.style.cursor = "pointer";
    shinyImg.style.border = "2px solid #FFD700";
    shinyImg.style.borderRadius = "8px";
    shinyImg.onclick = () => setMainForm(f, true);
    
    const label = document.createElement("span");
    label.innerHTML = `<b>${f.name}</b> - ${f.rarity || 'N/A'}`;
    
    row.appendChild(normalImg);
    row.appendChild(shinyImg);
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
  // Aguarda tabela CPM estar carregada
  if (!state.cpmTable) {
    console.warn("Tabela CPM não carregada ainda");
    return 10;
  }

  // Stats base
  const baseAtk = poke.stats?.atk || 100;
  const baseDef = poke.stats?.def || 100;
  const baseSta = poke.stats?.sta || 100;
  
  // IVs (Individual Values) - valores aleatórios 0-15 se não existirem
  const atkIV = poke.iv?.atk !== undefined ? poke.iv.atk : Math.floor(Math.random() * 16);
  const defIV = poke.iv?.def !== undefined ? poke.iv.def : Math.floor(Math.random() * 16);
  const staIV = poke.iv?.sta !== undefined ? poke.iv.sta : Math.floor(Math.random() * 16);
  
  // Armazena IVs no Pokémon se não existirem
  if (!poke.iv) {
    poke.iv = { atk: atkIV, def: defIV, sta: staIV };
  }
  
  // Level do Pokémon (1-100 normal, ou temporário 102/105/110)
  let level = poke.level || 1;
  
  // Aplica boost temporário baseado na forma
  if (poke.tempForm) {
    if (poke.tempForm === 'mega') level = 110;
    else if (poke.tempForm === 'gmax') level = 105;
    else if (poke.tempForm === 'dynamax') level = 102;
  }
  
  // Limita level entre 1-110
  level = Math.max(1, Math.min(110, level));
  
  // Busca CPM da tabela (se level > 100, extrapola linearmente)
  let CPM;
  if (level <= 100) {
    CPM = state.cpmTable[level.toString()] || state.cpmTable[Math.floor(level)];
  } else {
    // Extrapolação linear para levels 101-110
    const cpm100 = state.cpmTable["100"];
    const increment = 0.02; // Incremento estimado por level acima de 100
    CPM = cpm100 + ((level - 100) * increment);
  }
  
  // Stats totais (base + IV)
  const totalAtk = baseAtk + atkIV;
  const totalDef = baseDef + defIV;
  const totalSta = baseSta + staIV;
  
  // Fórmula oficial do Pokémon GO
  const cp = Math.floor(
    (totalAtk * Math.sqrt(totalDef) * Math.sqrt(totalSta) * Math.pow(CPM, 2)) / 10
  );
  
  // CP mínimo é 10
  return Math.max(10, cp);
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
  const currentLevel = p.baseLevel || p.level || 1;
  const isMaxLevel = currentLevel >= 100;

  dName.innerText = `${p.name} Lv.${currentLevel} (CP ${p.cp})`;
  dImg.src = p.img;
  dImg.alt = p.name;
  
  // Mostra IVs se existirem
  const ivText = p.iv ? `IVs: ${p.iv.atk}/${p.iv.def}/${p.iv.sta}` : '';
  
  dInfo.innerHTML = `
    <p>Raridade: ${p.rarity}</p>
    <p>Stats: Atk ${p.stats?.atk || 'N/A'}, Def ${p.stats?.def || 'N/A'}, Sta ${p.stats?.sta || 'N/A'}</p>
    ${ivText ? `<p>${ivText}</p>` : ''}
    <p>Doces de ${family}: ${candyCount}</p>
    <div style="margin:10px 0;">
      <button onclick="trainPokemon(${idx})" ${isMaxLevel ? 'disabled' : ''}>
        Treinar (+1 Level, 5 doces) ${isMaxLevel ? '(MAX)' : ''}
      </button>
      <button onclick="startEvolution(${idx})">Evoluir (se possível)</button>
    </div>
    ${isMaxLevel ? `
      <div style="margin-top:15px; padding:10px; background:#2c2c2c; border-radius:8px;">
        <h4 style="color:#FFD700; margin:5px 0;">Formas Especiais (Level 100)</h4>
        <button onclick="activateMega(${idx})" style="background:#9c27b0;">Mega Evolution</button>
        <button onclick="activateGmax(${idx})" style="background:#f44336;">Gigantamax</button>
        <button onclick="activateDynamax(${idx})" style="background:#ff9800;">Dynamax</button>
        ${p.tempForm ? `<button onclick="deactivateSpecialForm(${idx})" style="background:#666;">Desativar</button>` : ''}
      </div>
    ` : ''}
  `;
  modal.style.display = "flex";
}

// =========================
// FORMAS ESPECIAIS (LEVEL 100+)
// =========================
function activateMega(idx) {
  const p = state.collection[idx];
  if (!p || (p.baseLevel || p.level) < 100) {
    alert("Apenas Pokémon level 100 podem Mega Evoluir!");
    return;
  }
  
  // Verifica se tem forma mega disponível
  const megaForm = state.pokedex.find(pk => 
    pk.base === p.base && (pk.form === 'mega' || pk.form === 'mega-x' || pk.form === 'mega-y')
  );
  
  if (!megaForm) {
    alert(`${p.name} não possui Mega Evolução!`);
    return;
  }
  
  // Salva dados originais e aplica mega
  if (!p.originalData) {
    p.originalData = {
      name: p.name,
      img: p.img,
      stats: {...p.stats},
      level: p.level
    };
  }
  
  p.tempForm = 'mega';
  p.name = megaForm.name;
  p.img = megaForm.img;
  p.stats = {...megaForm.stats};
  p.level = 110;
  p.cp = calcCP(p);
  
  save();
  renderCollection();
  showDetails(idx);
}

function activateGmax(idx) {
  const p = state.collection[idx];
  if (!p || (p.baseLevel || p.level) < 100) {
    alert("Apenas Pokémon level 100 podem usar Gigantamax!");
    return;
  }
  
  const gmaxForm = state.pokedex.find(pk => 
    pk.base === p.base && pk.form === 'gmax'
  );
  
  if (!gmaxForm) {
    alert(`${p.name} não possui forma Gigantamax!`);
    return;
  }
  
  if (!p.originalData) {
    p.originalData = {
      name: p.name,
      img: p.img,
      stats: {...p.stats},
      level: p.level
    };
  }
  
  p.tempForm = 'gmax';
  p.name = gmaxForm.name;
  p.img = gmaxForm.img;
  p.stats = {...gmaxForm.stats};
  p.level = 105;
  p.cp = calcCP(p);
  
  save();
  renderCollection();
  showDetails(idx);
}

function activateDynamax(idx) {
  const p = state.collection[idx];
  if (!p || (p.baseLevel || p.level) < 100) {
    alert("Apenas Pokémon level 100 podem usar Dynamax!");
    return;
  }
  
  // Dynamax não muda aparência, só aumenta stats
  if (!p.originalData) {
    p.originalData = {
      stats: {...p.stats},
      level: p.level
    };
  }
  
  p.tempForm = 'dynamax';
  p.level = 102;
  // Dynamax aumenta HP (sta) em 2x
  p.stats.sta = (p.originalData.stats.sta || p.stats.sta) * 2;
  p.cp = calcCP(p);
  
  save();
  renderCollection();
  showDetails(idx);
}

function deactivateSpecialForm(idx) {
  const p = state.collection[idx];
  if (!p || !p.tempForm) return;
  
  // Restaura dados originais
  if (p.originalData) {
    if (p.originalData.name) p.name = p.originalData.name;
    if (p.originalData.img) p.img = p.originalData.img;
    p.stats = {...p.originalData.stats};
    p.level = p.baseLevel || p.originalData.level;
  }
  
  p.tempForm = null;
  delete p.originalData;
  p.cp = calcCP(p);
  
  save();
  renderCollection();
  showDetails(idx);
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
  
  // Verifica level máximo (100 para treino normal)
  const currentLevel = p.baseLevel || p.level || 1;
  if (currentLevel >= 100) {
    alert("Este Pokémon já atingiu o level máximo (100)!");
    return;
  }
  
  state.candies[family] -= 5;
  p.baseLevel = currentLevel + 1;  // Armazena level real
  p.level = p.baseLevel;  // Level atual (pode ser temporário com mega/gmax)
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
