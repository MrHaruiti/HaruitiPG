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

  // Fecha modal ao clicar fora do conteúdo
  const detailModal = document.getElementById("detailModal");
  if (detailModal) {
    detailModal.addEventListener("click", (e) => {
      if (e.target === detailModal) closeDetails();
    });
  }
  const evoMod = document.getElementById("evolutionModal");
  if (evoMod) {
    evoMod.addEventListener("click", (e) => {
      if (e.target === evoMod) evoMod.style.display = "none";
    });
  }
});

// Persistência
function save(){ localStorage.setItem("pk_state", JSON.stringify(state)); }
function load(){
  const s = localStorage.getItem("pk_state");
  if (s){
    try {
      state = JSON.parse(s);
    } catch (e) {
      console.error("Erro ao parsear state:", e);
      state = { pokedex:[], collection:[], candies:{}, items:{} };
    }
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
  if (id.startsWith("db-")){
    const region = id.replace("db-","");
    loadRegion(region);
  }
}

// Database / Pokédex
function loadRegion(region){
  const indexFile = `data/${region}/index.json`;
  console.log("Carregando index:", indexFile);

  fetch(indexFile)
    .then(r => r.json())
    .then(indexData => {
      if (!indexData || !Array.isArray(indexData.families)) {
        throw new Error("index.json inválido");
      }

      const promises = indexData.families.map(fname =>
        fetch(`data/${region}/${encodeURIComponent(fname)}`)
          .then(r => r.json())
      );

      return Promise.all(promises)
        .then(familiesArr => {
          const merged = [];
          familiesArr.forEach(fam => {
            if (Array.isArray(fam)) merged.push(...fam);
          });
          state.pokedex = merged;
          console.log(`Pokédex carregada (${region}):`, state.pokedex.length);
          renderPokedex(region);
        });
    })
    .catch(err => {
      console.error("Erro ao carregar região:", err);
      state.pokedex = [];
      const box = document.querySelector(`#db-${region} .list`);
      if (box) box.innerHTML = "<div>Erro ao carregar Pokédex.</div>";
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
    const form = p.form || "normal";
    if (form === "normal" && !shown.has(p.dex)) {
      shown.add(p.dex);
      const div = document.createElement("div");
      div.className = "item clickable";
      div.innerHTML = `
        <img class="sprite" src="${p.img}" alt="${p.name}" />
        <div>${p.name}</div>
      `;
      div.onclick = () => showAllForms(p.dex);
      box.appendChild(div);
    }
  });

  if (shown.size === 0) {
    box.innerHTML = "<div>Nenhum Pokémon cadastrado.</div>";
  }
}

// Modal de todas as formas
function showAllForms(dex){
  const forms = state.pokedex.filter(p => p.dex === dex);
  if (!forms.length) return;

  const baseName = forms[0].base || forms[0].name.split(" ")[0];

  let html = `
    <div style="text-align:center;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h2>${baseName} — Todas as formas</h2>
        <button onclick="closeDetails()">Fechar ✖</button>
      </div>
      <div style="margin:8px 0;">
        <img src="${forms[0].img}" width="72">
      </div>
      <div style="text-align:left; max-height:320px; overflow:auto; padding:6px;">
  `;

  forms.forEach(f => {
    html += `
      <div style="display:flex; align-items:center; gap:8px; padding:6px; border-bottom:1px solid #333;">
        <img src="${f.img}" width="48" class="clickable" onclick='setMainForm(${JSON.stringify(f)})'>
        ${f.imgShiny ? `<img src="${f.imgShiny}" width="48" class="clickable" onclick='setMainForm(${JSON.stringify({...f, shiny:true})})'>` : ""}
        <div>
          <div><b>${f.name}</b></div>
          <div style="font-size:12px; color:#bbb;">${f.rarity || ""}</div>
        </div>
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;

  const detailBox = document.getElementById("detailBox");
  const modal = document.getElementById("detailModal");
  if (detailBox) detailBox.innerHTML = html;
  if (modal) modal.style.display = "flex";
}

function setMainForm(form){
  const detailBox = document.getElementById("detailBox");
  const modal = document.getElementById("detailModal");
  if (!detailBox || !modal) return;

  const imgSrc = (form.shiny && form.imgShiny) ? form.imgShiny : form.img;

  detailBox.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <h2>${form.name} ${form.shiny ? "⭐" : ""}</h2>
      <button onclick="closeDetails()">Fechar ✖</button>
    </div>
    <div style="text-align:center; margin:10px 0;">
      <img src="${imgSrc}" width="120">
    </div>
    <div style="text-align:left;">
      <div><b>Dex:</b> ${form.dex}</div>
      <div><b>Forma:</b> ${form.form || "normal"}</div>
      <div><b>Raridade:</b> ${form.rarity}</div>
    </div>
  `;
  modal.style.display = "flex";
}

// Explorar & Captura
function explore(){
  if (!state.pokedex.length){
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
  const success = currentEncounter.shiny ? true : (Math.random() * 100) < (currentEncounter.baseCatch || 50);
  const res = document.getElementById("encResult");

  if (success){
    const iv = { atk: randIV(), def: randIV(), sta: randIV() };
    const family = currentEncounter.family || currentEncounter.base || currentEncounter.dex;

    const entry = {
      id: "c" + Date.now(),
      family: family,
      base: currentEncounter.base || currentEncounter.name.split(" ")[0],
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

  if (!state.collection.length){
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
    <div><b>Forma:</b> ${c.shiny ? "Shiny" : "Normal"}</div>
    <div><b>${c.base} Candy:</b> ${candies}</div>
    <div><b>Data de Captura:</b> ${c.capturedAt}</div>
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
  if (!state.items || !Object.keys(state.items).length){
    box.innerHTML = "Nenhum item.";
    return;
  }
  for (const k in state.items){
    box.innerHTML += `<div>${k}: ${state.items[k]}</div>`;
  }
}

function startEvolution(pokemon){
  if (!pokemon || !pokemon.name || !pokemon.img) return;
  const evoText = document.getElementById("evoText");
  const evoImg  = document.getElementById("evoImg");
  const evoMod  = document.getElementById("evolutionModal");
  if (!evoText || !evoImg || !evoMod) return;
  evoText.innerText = pokemon.name + " está evoluindo...";
  evoImg.src = pokemon.img;
  evoMod.style.display = "flex";
  setTimeout(() => { evoMod.style.display = "none"; }, 3000);
}
