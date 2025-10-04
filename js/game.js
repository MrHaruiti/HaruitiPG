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
function save(){ localStorage.setItem("pk_state", JSON.stringify(state)); }
function load(){
  const s = localStorage.getItem("pk_state");
  if(s) {
    state = JSON.parse(s);
    state.items = state.items || {};
    state.candies = state.candies || {};
    state.collection = state.collection || [];
    state.pokedex = state.pokedex || [];
  }
}

// =========================
// NAVEGAÇÃO
// =========================
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

// =========================
// DATABASE / POKEDEX
// =========================
async function loadRegion(region){
  try {
    const res = await fetch(`data/${region}/index.json`);
    const families = await res.json();
    state.pokedex = [];

    for (const fam of families) {
      try {
        const r2 = await fetch(`data/${region}/${fam}.json`);
        const d2 = await r2.json();
        state.pokedex.push(...d2);
      } catch (err) { console.error("Erro carregando familia", fam, err); }
    }
    renderPokedex(region);
  } catch (err) {
    console.error("Erro carregando região", region, err);
  }
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

// =========================
// MODAL TODAS AS FORMAS
// =========================
function showAllForms(dex){
  const forms = state.pokedex.filter(p => p.dex === dex);
  if (forms.length === 0) return;

  const baseName = forms[0].base || forms[0].name.split(" ")[0];
  const dName = document.getElementById("dName");
  const dImg  = document.getElementById("dImg");
  const dInfo = document.getElementById("dInfo");

  if (dName) dName.innerText = `${baseName} — Todas as formas`;
  if (dImg)  dImg.src = forms[0].img;

  dInfo.innerHTML = "";
  forms.forEach(f => {
    const row = document.createElement("div");
    row.style.margin = "6px 0";
    row.style.borderBottom = "1px solid #333";
    row.style.padding = "4px";

    const normal = document.createElement("img");
    normal.src = f.img;
    normal.width = 48;
    normal.className = "clickable";
    normal.onclick = () => setMainForm(f);

    row.appendChild(normal);

    if (f.imgShiny){
      const shiny = document.createElement("img");
      shiny.src = f.imgShiny;
      shiny.width = 48;
      shiny.className = "clickable";
      shiny.onclick = () => setMainForm({...f, shiny:true});
      row.appendChild(shiny);
    }

    const label = document.createElement("span");
    label.innerHTML = `<b>${f.name}</b> — ${f.rarity}`;
    row.appendChild(label);

    dInfo.appendChild(row);
  });

  document.getElementById("detailModal").style.display = "flex";
}
function setMainForm(form){
  const dImg  = document.getElementById("dImg");
  const dName = document.getElementById("dName");
  if (dImg)  dImg.src = form.shiny && form.imgShiny ? form.imgShiny : form.img;
  if (dName) dName.innerText = form.name + (form.shiny ? " ⭐" : "");
}

// =========================
// EXPLORAÇÃO E CAPTURA
// =========================
function explore(){
  if (state.pokedex.length === 0){
    document.getElementById("exploreResult").innerHTML = "Nenhum Pokémon nesta região.";
    return;
  }
  const p = state.pokedex[Math.floor(Math.random() * state.pokedex.length)];
  currentEncounter = { ...p };
  currentEncounter.shiny = Math.random() < shinyChance;
  currentEncounter.level = Math.floor(Math.random() * 50) + 1;

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
      dex: currentEncounter.dex,
      name: currentEncounter.name,
      rarity: currentEncounter.rarity,
      img: currentEncounter.img,
      imgShiny: currentEncounter.imgShiny,
      shiny: currentEncounter.shiny,
      iv,
      level: currentEncounter.level,
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

// =========================
// COLEÇÃO / BAG
// =========================
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

// =========================
// POPUP DETALHES
// =========================
function showDetails(id){
  const c = state.collection.find(x => x.id === id);
  if (!c) return;

  const candies = state.candies[c.family] || 0;
  const cp = calcCP(c);

  const detailBox = document.getElementById("detailBox");
  const modal = document.getElementById("detailModal");
  if (!detailBox || !modal) return;

  detailBox.innerHTML = `
    <div style="font-weight:bold; font-size:18px; margin-bottom:6px;">CP ${cp}</div>
    <img src="${c.shiny && c.imgShiny ? c.imgShiny : c.img}" style="width:96px; margin:10px 0;">
    <div style="font-weight:bold; font-size:16px;">#${c.dex || "???"} ${c.name}</div>
    <hr>
    <div><b>Nível:</b> ${c.level}</div>
    <div><b>IVs:</b> 
      <span style="color:${c.iv.atk<15?"lime":"red"}">Atk ${c.iv.atk}</span>, 
      <span style="color:${c.iv.def<15?"lime":"red"}">Def ${c.iv.def}</span>, 
      <span style="color:${c.iv.sta<15?"lime":"red"}">Sta ${c.iv.sta}</span>
    </div>
    <div><b>${c.base} Candy:</b> ${candies}</div>
    <div><b>Data de Captura:</b> ${c.capturedAt}</div>
    <div style="margin-top:10px;">
      <button onclick="trainPokemon('${c.id}')">Treinar</button>
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
function trainPokemon(id){
  const p = state.collection.find(x => x.id === id);
  if (!p) return;
  const cost = Math.floor(p.level * 1.5);
  if ((state.candies[p.family] || 0) < cost){
    alert("Não há doces suficientes!");
    return;
  }
  if (p.level >= 100){
    alert("Este Pokémon já está no nível máximo!");
    return;
  }
  state.candies[p.family] -= cost;
  p.level++;
  save();
  renderCollection();
  showDetails(id);
}
function closeDetails(){
  const modal = document.getElementById("detailModal");
  const detailBox = document.getElementById("detailBox");
  if (modal){
    modal.style.display = "none";
    if (detailBox) detailBox.innerHTML = "";
  }
}

// =========================
// ITENS
// =========================
function renderItems(){
  const box = document.getElementById("items");
  if (!box) return;
  box.innerHTML = "";
  if (!state.items || Object.keys(state.items).length === 0){
    box.innerHTML = "Nenhum item.";
    return;
  }
  for (const k in state.items){
    box.innerHTML += `<div>${k}: ${state.items[k]}</div>`;
  }
}

// =========================
// EVOLUÇÃO
// =========================
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

// =========================
// CÁLCULO DE CP
// =========================
function calcCP(p){
  if (!p.iv || !p.level) return 10;
  const base = (p.iv.atk + p.iv.def + p.iv.sta);
  return Math.floor(base * (p.level/10));
}
