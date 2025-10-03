// Estado global
let state = {
  pokedex: [],
  collection: [],
  candies: {},
  items: {}
};
let currentEncounter = null;
const shinyChance = 0.001;

// Boot
document.addEventListener("DOMContentLoaded", () => {
  load();
  showTab("explore");
  showSubTab("db-kanto");
  loadRegion("kanto");
  renderCollection();
  renderItems();
});

// ---------------------------
// Persistência
// ---------------------------
function save(){ localStorage.setItem("pk_state", JSON.stringify(state)); }
function load(){
  const s = localStorage.getItem("pk_state");
  if (s){
    state = JSON.parse(s);
    state.items = state.items && typeof state.items === "object" ? state.items : {};
    state.candies = state.candies && typeof state.candies === "object" ? state.candies : {};
    state.collection = Array.isArray(state.collection) ? state.collection : [];
    state.pokedex = Array.isArray(state.pokedex) ? state.pokedex : [];
  }
}

// ---------------------------
// Tabs
// ---------------------------
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
  if (id.startsWith("db-")){
    const region = id.replace("db-","");
    loadRegion(region);
  }
}

// ---------------------------
//
//  📌 Normalização/Migração de Família
//
//  Objetivo: toda família usa a MESMA chave (nome base, ex. "Bulbasaur").
//  - canonicalFamilyKey(any): resolve string/numero (dex, nome, base) -> "BaseName"
//  - migrateFamiliesToBase(): consolida state.candies e corrige collection[*].family/base
//
// ---------------------------

// Resolve a chave canônica de família usando a pokédex carregada
function canonicalFamilyKey(any){
  if (any === undefined || any === null) return "";
  const key = String(any).trim();

  // Se for número (dex)
  const num = Number(key);
  if (!Number.isNaN(num) && Number.isFinite(num) && state.pokedex.length){
    const rec = state.pokedex.find(p => p.dex === num);
    if (rec) return (rec.base || rec.name.split(" ")[0]).trim();
  }

  if (state.pokedex.length){
    // 1) se 'key' já é exatamente um base existente
    if (state.pokedex.some(p => p.base === key)) return key;

    // 2) tenta por nome exato (ou 1ª palavra do nome)
    let rec = state.pokedex.find(p => p.name === key || p.name.split(" ")[0] === key);
    if (rec) return (rec.base || rec.name.split(" ")[0]).trim();

    // 3) tenta por "parecido": algum nome começa com key
    rec = state.pokedex.find(p => p.name.startsWith(key));
    if (rec) return (rec.base || rec.name.split(" ")[0]).trim();
  }

  // fallback: usa o que veio
  return key;
}

// Consolida chaves de candies e corrige collection[*].family/base
function migrateFamiliesToBase(){
  if (!state.pokedex || !state.pokedex.length) return;

  // Reagrupar candies por chave canônica
  const newCandies = {};
  for (const k in state.candies){
    const canon = canonicalFamilyKey(k);
    newCandies[canon] = (newCandies[canon] || 0) + (state.candies[k] || 0);
  }
  state.candies = newCandies;

  // Corrigir cada entry da coleção
  state.collection.forEach(c => {
    const canonFam = canonicalFamilyKey(c.family || c.base || c.dex);
    c.family = canonFam;
    // Garanta que "base" também reflita a chave canônica (somente para exibição)
    c.base = canonicalFamilyKey(c.base || (c.name ? c.name.split(" ")[0] : c.family));
  });

  save();
}

// ---------------------------
// Database / Pokédex
// ---------------------------
function loadRegion(region){
  const file = "data/pokedex-" + region + ".json";
  fetch(file)
    .then(r => r.json())
    .then(data => {
      state.pokedex = data || [];
      // ⚙️ roda migração sempre que a pokédex é carregada
      migrateFamiliesToBase();
      renderPokedex(region);
    })
    .catch(() => {
      state.pokedex = [];
      const box = document.querySelector(`#db-${region} .list`);
      if (box) box.innerHTML = "<div>Nenhum Pokémon cadastrado.</div>";
    });
}

function renderPokedex(region){
  const box = document.querySelector(`#db-${region} .list`);
  if (!box) return;
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

// ---------------------------
// Modal de todas as formas (com botão Fechar)
// ---------------------------
function showAllForms(dex){
  const forms = state.pokedex.filter(p => p.dex === dex);
  if (!forms.length) return;

  const detailBox = document.getElementById("detailBox");
  const modal = document.getElementById("detailModal");

  let html = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <h2>${forms[0].base || forms[0].name} — Todas as formas</h2>
      <button onclick="closeDetails()">Fechar ✖</button>
    </div>
    <hr>
  `;

  forms.forEach(f => {
    html += `
      <div style="margin:6px 0; border-bottom:1px solid #333; padding:4px;">
        <img src="${f.img}" width="48" class="clickable" onclick='setMainForm(${JSON.stringify(f)})'>
        ${f.imgShiny ? `<img src="${f.imgShiny}" width="48" class="clickable" onclick='setMainForm(${JSON.stringify({...f, shiny:true})})'>` : ""}
        <b>${f.name}</b> — ${f.rarity}
      </div>
    `;
  });

  if (detailBox) detailBox.innerHTML = html;
  if (modal) modal.classList.add("show");
}

// Modal de forma única (com botão Fechar)
function setMainForm(form){
  const detailBox = document.getElementById("detailBox");
  if (detailBox) {
    detailBox.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h2>${form.name} ${form.shiny ? "⭐" : ""}</h2>
        <button onclick="closeDetails()">Fechar ✖</button>
      </div>
      <hr>
      <img src="${form.shiny && form.imgShiny ? form.imgShiny : form.img}" width="96" style="margin:10px 0;">
    `;
  }
}

// ---------------------------
// Explorar & Captura
// ---------------------------
function explore(){
  if (state.pokedex.length === 0){
    document.getElementById("exploreResult").innerHTML = "Nenhum Pokémon nesta região.";
    return;
  }
  const p = state.pokedex[Math.floor(Math.random() * state.pokedex.length)];
  currentEncounter = { ...p };
  currentEncounter.shiny = Math.random() < shinyChance;

  document.getElementById("exploreResult").innerHTML = `
    <div>Encontrou ${p.name}${currentEncounter.shiny ? ' ⭐ Shiny' : ''}!</div>
    <img src="${currentEncounter.shiny && p.imgShiny ? p.imgShiny : p.img}" width="72"><br>
    <button onclick="tryCatch()">Tentar Capturar</button>
    <div id="encResult"></div>
  `;
}

function tryCatch(){
  if (!currentEncounter) return;
  const success = currentEncounter.shiny ? true : (Math.random() * 100) < currentEncounter.baseCatch;
  const res = document.getElementById("encResult");

  if (success){
    const iv = { atk: randIV(), def: randIV(), sta: randIV() };

    // 🔑 chave canônica de família para salvar e somar doces
    const familyKey = canonicalFamilyKey(
      currentEncounter.family || currentEncounter.base || currentEncounter.dex
    );
    const baseName = canonicalFamilyKey(currentEncounter.base || currentEncounter.name.split(" ")[0]);

    const entry = {
      id: "c" + Date.now(),
      family: familyKey,
      base: baseName,
      dex: currentEncounter.dex,
      name: currentEncounter.name,
      rarity: currentEncounter.rarity,
      img: currentEncounter.img,
      imgShiny: currentEncounter.imgShiny,
      shiny: currentEncounter.shiny,
      iv,
      capturedAt: new Date().toLocaleString()
    };

    state.collection.push(entry);
    state.candies[familyKey] = (state.candies[familyKey] || 0) + 3;

    save(); renderCollection(); renderItems();
    if (res) res.innerHTML = "✨ Capturado!";
  } else {
    if (res) res.innerHTML = "💨 Escapou!";
  }
  currentEncounter = null;
}
function randIV(){ return Math.floor(Math.random() * 16); }

// ---------------------------
// Bag / Coleção
// ---------------------------
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
    div.className = "item clickable";
    div.innerHTML = `
      <img class="sprite" src="${c.shiny && c.imgShiny ? c.imgShiny : c.img}" alt="${c.name}"/>
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

  // usa SEMPRE a chave canônica para ler doces
  const famKey = canonicalFamilyKey(c.family || c.base || c.dex);
  const candies = state.candies[famKey] || 0;
  const cp = Math.floor((c.iv.atk + c.iv.def + c.iv.sta) * 10);

  const detailBox = document.getElementById("detailBox");
  const modal = document.getElementById("detailModal");
  if (!detailBox || !modal) return;

  detailBox.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <div style="font-weight:bold; font-size:18px;">CP ${cp}</div>
      <button onclick="closeDetails()">Fechar ✖</button>
    </div>
    <img src="${c.shiny && c.imgShiny ? c.imgShiny : c.img}" style="width:96px; margin:10px 0;">
    <div style="font-weight:bold; font-size:16px;">#${c.dex || "???"} ${c.name}</div>
    <hr>
    <div><b>Forma:</b> ${c.shiny ? "Shiny" : "Normal"}</div>
    <div><b>Ataques:</b> (em breve)</div>
    <div><b>${c.base} Candy:</b> ${candies}</div>
    <div><b>Data de Captura:</b> ${c.capturedAt}</div>
    <div style="margin-top:10px;">
      <button onclick="transferPokemon('${c.id}')">Transferir</button>
    </div>
  `;

  modal.classList.add("show");
}

function transferPokemon(id){
  const idx = state.collection.findIndex(x => x.id === id);
  if (idx > -1){
    const p = state.collection[idx];
    const famKey = canonicalFamilyKey(p.family || p.base || p.dex);

    state.collection.splice(idx, 1);
    state.candies[famKey] = (state.candies[famKey] || 0) + 1; // +1 doce por transferência

    save(); renderCollection(); renderItems();
    closeDetails();
    alert(p.name + " transferido! +1 doce");
  }
}

function closeDetails(){
  const modal = document.getElementById("detailModal");
  const detailBox = document.getElementById("detailBox");
  if (modal){
    modal.classList.remove("show");
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

// ---------------------------
// Evolução (manual/temporizada)
// ---------------------------
function startEvolution(pokemon){
  if (!pokemon || !pokemon.name || !pokemon.img) return;

  const evoText = document.getElementById("evoText");
  const evoImg  = document.getElementById("evoImg");
  const evoMod  = document.getElementById("evolutionModal");
  if (!evoText || !evoImg || !evoMod) return;

  evoText.innerText = pokemon.name + " está evoluindo...";
  evoImg.src = pokemon.img;
  evoMod.classList.add("show");
  setTimeout(() => { evoMod.classList.remove("show"); }, 3000);
}
