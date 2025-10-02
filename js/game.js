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

// Persistência
function save(){ localStorage.setItem("pk_state", JSON.stringify(state)); }
function load(){ 
  const s = localStorage.getItem("pk_state"); 
  if(s) {
    state = JSON.parse(s);
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

// Database / Pokédex
function loadRegion(region){
  const file = "data/pokedex-" + region + ".json";
  fetch(file)
    .then(r => r.json())
    .then(data => {
      state.pokedex = data;
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
    html += `
      <div style="margin:6px 0; border-bottom:1px solid #333; padding:4px;">
        <img src="${f.img}" width="48" class="clickable" onclick='setMainForm(${JSON.stringify(f)})'>
        ${f.imgShiny ? `<img src="${f.imgShiny}" width="48" class="clickable" onclick='setMainForm(${JSON.stringify({...f, shiny:true})})'>` : ""}
        <b>${f.name}</b> — ${f.rarity}
      </div>
    `;
  });

  if (dInfo) dInfo.innerHTML = html;
  document.getElementById("detailModal").style.display = "flex";
}

function setMainForm(form){
  const dImg  = document.getElementById("dImg");
  const dName = document.getElementById("dName");
  if (dImg)  dImg.src = form.shiny && form.imgShiny ? form.imgShiny : form.img;
  if (dName) dName.innerText = form.name + (form.shiny ? " ⭐" : "");
}

// Explorar & Captura
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
    const family = currentEncounter.family || currentEncounter.base || currentEncounter.dex;
    const baseName = currentEncounter.base || currentEncounter.name.split(" ")[0];

    const entry = {
      id: "c" + Date.now(),
      family: family,
      base: baseName,
      name: currentEncounter.name,
      rarity: currentEncounter.rarity,
      img: currentEncounter.img,
      imgShiny: currentEncounter.imgShiny,
      shiny: currentEncounter.shiny,
      iv,
      capturedAt: new Date().toLocaleString()
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
function randIV(){ return Math.floor(Math.random() * 16); }

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
    div.className = "item clickable";
    div.innerHTML = `
      <img class="sprite" src="${c.shiny && c.imgShiny ? c.imgShiny : c.img}" alt="${c.name}"/>
      <div>${c.name}</div>
    `;
    div.onclick = () => showDetails(c.id); 
    box.appendChild(div);
  });
}

function showDetails(id){
  const c = state.collection.find(x => x.id === id);
  if (!c) return;
  const candies = state.candies[c.family] || 0;

  document.getElementById("dName").innerText = c.name + (c.shiny ? " ⭐" : "");
  document.getElementById("dImg").src       = c.shiny && c.imgShiny ? c.imgShiny : c.img;

  let info = "";
  info += `<div>Raridade: ${c.rarity}</div>`;
  info += `<div>IVs: Atk ${c.iv.atk} • Def ${c.iv.def} • Sta ${c.iv.sta}</div>`;
  // ✅ Novo formato
  info += `<div>${c.base} Candy: ${candies}</div>`;
  info += `<div style="margin-top:10px;"><button onclick="transferPokemon('${c.id}')">Transferir</button></div>`;

  document.getElementById("dInfo").innerHTML = info;
  document.getElementById("detailModal").style.display = "flex";
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
  if (modal) modal.style.display = "none";
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
