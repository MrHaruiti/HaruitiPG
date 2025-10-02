
// Fixed game.js - safe and minimal changes, preserves original structure
// Estado global
let state = {
  pokedex: [],
  collection: [],
  candies: {},
  items: {}
};
let cpmTable = {};
let cpmLoaded = false;
let cpmLoadPromise = null;
const shinyChance = 0.001;

// Carregar tabela CPM (inicia carregamento, não bloqueia)
function loadCpm() {
  if (cpmLoadPromise) return cpmLoadPromise;
  cpmLoadPromise = fetch("data/cpm.json")
    .then(r => r.json())
    .then(data => { cpmTable = data; cpmLoaded = true; })
    .catch(err => { console.warn("Não carregou cpm.json, usando fallback", err); cpmLoaded = false; });
  return cpmLoadPromise;
}
loadCpm();

// Persistência
function save(){ localStorage.setItem("pk_state", JSON.stringify(state)); }
function load(){ 
  const s = localStorage.getItem("pk_state"); 
  if(s) {
    try { state = JSON.parse(s); } catch(e){ console.warn("erro parse state", e); }
    state.items = state.items && typeof state.items === "object" ? state.items : {};
    state.candies = state.candies && typeof state.candies === "object" ? state.candies : {};
    state.collection = Array.isArray(state.collection) ? state.collection : [];
    state.pokedex = Array.isArray(state.pokedex) ? state.pokedex : [];
  }
}

// Navegação de abas
function showTab(t){
  document.querySelectorAll(".tab").forEach(el => el.style.display = "none");
  const tabEl = document.getElementById("tab-"+t);
  if (tabEl) tabEl.style.display = "block";
  closeDetails();
}

function showSubTab(id){
  document.querySelectorAll(".subtab").forEach(el => el.style.display = "none");
  const sub = document.getElementById(id);
  if (sub) sub.style.display = "block";
  closeDetails();
  if(id.startsWith("db-")){
    const region = id.replace("db-","");
    loadRegion(region);
  }
}

// Database / Pokédex - modular por famílias
function loadRegion(region){
  const familiesByRegion = {
    kanto: [
      "Bulbasaur Family",
      "Charmander Family",
      "Squirtle Family",
      "Pikachu Family",
      "Eevee Family",
      "Mew Family"
      // adicione as outras famílias conforme for criando os arquivos
    ],
    // outras regiões vazias por padrão
  };

  const families = familiesByRegion[region] || [];
  state.pokedex = [];

  if (families.length === 0){
    const box = document.querySelector(`#db-${region} .list`);
    if (box) box.innerHTML = "<div>Nenhuma família cadastrada para essa região.</div>";
    return;
  }

  Promise.all(
    families.map(f => fetch(`data/${region}/${encodeURIComponent(f)}.json`).then(r => {
      if (!r.ok) return []; 
      return r.json();
    }).catch(()=>[]))
  )
  .then(results => {
    results.forEach(fam => {
      if (Array.isArray(fam)) state.pokedex.push(...fam);
    });
    renderPokedex(region);
  })
  .catch(err => {
    console.error("Erro ao carregar região:", err);
    const box = document.querySelector(`#db-${region} .list`);
    if (box) box.innerHTML = "<div>Erro ao carregar os Pokémon dessa região.</div>";
  });
}

function renderPokedex(region){
  const box = document.querySelector(`#db-${region} .list`);
  if(!box) return;
  box.innerHTML = "";
  box.style.display = "grid";
  box.style.gridTemplateColumns = "repeat(10, 1fr)";
  box.style.gap = "10px";
  box.style.textAlign = "center";

  const sorted = [...state.pokedex].sort((a,b) => (a.dex||9999) - (b.dex||9999));
  const shown = new Set();

  sorted.forEach(p => {
    if (p.form === "normal" && !shown.has(p.dex)) {
      shown.add(p.dex);
      const div = document.createElement("div");
      div.className = "item clickable";
      div.innerHTML = `
        <img class="sprite" src="${p.img}" alt="${p.name}"/>
        <div>${p.name}</div>
      `;
      div.onclick = () => showAllForms(p.dex);
      box.appendChild(div);
    }
  });
}

// Modal de todas as formas
function showAllForms(dex){
  const forms = state.pokedex.filter(p => p.dex === dex);
  if (forms.length === 0) return;

  const baseName = forms[0].base || forms[0].name.split(" ")[0];
  const dName = document.getElementById("dName");
  const dImg  = document.getElementById("dImg");
  const dInfo = document.getElementById("dInfo");

  if (dName) dName.innerText = `${baseName} — Todas as formas`;
  if (dImg)  dImg.src = forms[0].img;

  let html = "";
  forms.forEach(f => {
    // safe JSON stringify for onclick - avoid errors if object large
    const fg = JSON.stringify(f).replace(/'/g,"\\'");
    html += `
      <div style="margin:6px 0; border-bottom:1px solid #333; padding:4px;">
        <img src="${f.img}" width="48" class="clickable" onclick="setMainForm(${fg})">
        ${f.imgShiny ? `<img src="${f.imgShiny}" width="48" class="clickable" onclick="setMainForm(${JSON.stringify({...f, shiny:true}).replace(/'/g,'\\'')})'>` : ""}
        <b>${f.name}</b> — ${f.rarity || ''}
      </div>
    `;
  });

  const dInfoEl = document.getElementById("dInfo");
  if (dInfoEl) dInfoEl.innerHTML = html;
  const modal = document.getElementById("detailModal");
  if (modal) modal.style.display = "flex";
}

function setMainForm(form){
  try {
    const dImg  = document.getElementById("dImg");
    const dName = document.getElementById("dName");
    if (dImg)  dImg.src = form.shiny && form.imgShiny ? form.imgShiny : form.img;
    if (dName) dName.innerText = form.name + (form.shiny ? " ⭐" : "");
  } catch(e){ console.warn("setMainForm error", e); }
}

// Explorar & Captura
function explore(){
  if (state.pokedex.length === 0){
    const el = document.getElementById("exploreResult");
    if (el) el.innerHTML = "Nenhum Pokémon nesta região.";
    return;
  }
  const p = state.pokedex[Math.floor(Math.random() * state.pokedex.length)];
  currentEncounter = { ...p };
  currentEncounter.shiny = Math.random() < shinyChance;

  const resEl = document.getElementById("exploreResult");
  if (resEl) {
    resEl.innerHTML = `
      <div>Encontrou ${p.name}${currentEncounter.shiny ? ' ⭐ Shiny' : ''}!</div>
      <img src="${currentEncounter.shiny && p.imgShiny ? currentEncounter.imgShiny : p.img}" width="72"><br>
      <button id="tryCatchBtn">Tentar Capturar</button>
      <div id="encResult"></div>
    `;
    const btn = document.getElementById("tryCatchBtn");
    if (btn) btn.onclick = tryCatch;
  }
}

function randIV(){ return Math.floor(Math.random() * 16); }

async function tryCatch(){
  if (!currentEncounter) return;
  const success = currentEncounter.shiny ? true : (Math.random() * 100) < (currentEncounter.baseCatch || 50);
  const res = document.getElementById("encResult");

  if (success){
    const iv = { atk: randIV(), def: randIV(), sta: randIV() };
    const family = currentEncounter.family || currentEncounter.base || currentEncounter.dex;
    const baseName = currentEncounter.base || (currentEncounter.name && currentEncounter.name.split(" ")[0]);

    // ensure CPM loaded (but don't block forever)
    try {
      await Promise.race([loadCpm(), new Promise(resr => setTimeout(resr, 300))]);
    } catch(e){ /* passthrough */ }

    // choose level (0-100)
    const level = Math.floor(Math.random() * 101);
    // pick stats (fallback if missing)
    const baseStats = currentEncounter.stats || { atk: 10, def: 10, sta: 10 };
    const cpm = (cpmTable[level] !== undefined) ? cpmTable[level] : 0.5974;

    const Atk = baseStats.atk + iv.atk;
    const Def = baseStats.def + iv.def;
    const Sta = baseStats.sta + iv.sta;
    const cp = Math.floor(((Atk) * Math.sqrt(Def) * Math.sqrt(Sta) * (cpm ** 2)) / 10);

    const entry = {
      id: "c" + Date.now(),
      family: family,
      base: baseName,
      dex: currentEncounter.dex,
      name: currentEncounter.name,
      rarity: currentEncounter.rarity,
      img: currentEncounter.img,
      imgShiny: currentEncounter.imgShiny,
      shiny: currentEncounter.shiny,
      iv,
      level,
      cp,
      capturedAt: new Date().toISOString()
    };

    state.collection.push(entry);
    state.candies[family] = (state.candies[family] || 0) + 3;
    save(); renderCollection(); renderItems();
    if (res) res.innerHTML = "✨ Capturado!";
  } else {
    if (res) res.innerHTML = "💨 Escapou!";
  }
  currentEncounter = null;
}

// Coleção / Bag
function renderCollection(){
  const box = document.getElementById("collection");
  if (!box) return;
  box.innerHTML = "";
  box.style.display = "grid";
  box.style.gridTemplateColumns = "repeat(10, 1fr)";
  box.style.gap = "10px";
  box.style.textAlign = "center";

  if (state.collection.length === 0){
    box.innerHTML = "Nenhum Pokémon ainda.";
    return;
  }

  state.collection.forEach(c => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <img class="sprite" src="${c.shiny && c.imgShiny ? c.imgShiny : c.img}" alt="${c.name}"/>
      <div class="cp-level-small">CP ${c.cp} – Lv ${c.level}</div>
      <div>${c.name}</div>
    `;
    div.onclick = () => showDetails(c.id); 
    box.appendChild(div);
  });
}

// Pop-up de detalhes
function showDetails(id){
  const c = state.collection.find(x => x.id === id);
  if (!c) return;

  const candies = state.candies[c.family] || 0;

  const detailBox = document.getElementById("detailBox");
  const modal = document.getElementById("detailModal");
  if (!detailBox || !modal) return;

  detailBox.innerHTML = `
    <div style="font-weight:bold; font-size:18px; margin-bottom:6px;">CP ${c.cp} – Level ${c.level}</div>
    <img src="${c.shiny && c.imgShiny ? c.imgShiny : c.img}" style="width:96px; margin:10px 0;">
    <div style="font-weight:bold; font-size:16px;">#${c.dex || "???"} ${c.name}</div>
    <hr>
    <div><b>Forma:</b> ${c.shiny ? "Shiny" : "Normal"}</div>
    <div><b>Ataques:</b> (em breve)</div>
    <div><b>${c.base} Candy:</b> ${candies}</div>
    <div><b>Data de Captura:</b> ${new Date(c.capturedAt).toLocaleString()}</div>
    <div style="margin-top:10px;">
      <button onclick="transferPokemon('${c.id}')">Transferir</button>
      <button onclick="closeDetails()">Fechar</button>
    </div>
  `;

  modal.style.display = "flex";
}

function transferPokemon(id){
  const idx = state.collection.findIndex(x => x.id === id);
  if (idx > -1){
    const p = state.collection[idx];
    state.collection.splice(idx, 1);
    state.candies[p.family] = (state.candies[p.family] || 0) + 1;
    save(); renderCollection(); renderItems();
    closeDetails();
    alert(p.name + " transferido! +1 doce");
  }
}

function closeDetails(){
  const modal = document.getElementById("detailModal");
  const detailBox = document.getElementById("detailBox");
  if (modal){
    modal.style.display = "none";
    if (detailBox) detailBox.innerHTML = "";
  }
}

function renderItems(){
  const box = document.getElementById("items");
  if (!box) return;
  box.innerHTML = "";
  if (!state.items || typeof state.items !== "object" || Object.keys(state.items).length === 0){
    box.innerHTML = "Nenhum item.";
    return;
  }
  for (const k in state.items){
    box.innerHTML += `<div>${k}: ${state.items[k]}</div>`;
  }
}

function startEvolution(pokemon){
  const evoText = document.getElementById("evoText");
  const evoImg  = document.getElementById("evoImg");
  const evoMod  = document.getElementById("evolutionModal");
  if (!evoText || !evoImg || !evoMod) return;

  evoText.innerText = pokemon.name + " está evoluindo...";
  evoImg.src = pokemon.img;
  evoMod.style.display = "flex";
  setTimeout(() => { evoMod.style.display = "none"; }, 3000);
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  load();
  // show initial tab same as original behavior if exists
  const firstTab = document.querySelector(".tab");
  if (firstTab) firstTab.style.display = "block";
  renderCollection();
  renderItems();
});
