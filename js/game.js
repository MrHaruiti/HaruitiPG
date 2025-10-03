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
  const indexFile = `data/${region}/index.json`;

  fetch(indexFile)
    .then(r => r.json())
    .then(indexData => {
      if (!indexData.families) throw new Error("Index sem families");

      let promises = indexData.families.map(f => 
        fetch(`data/${region}/${f}`).then(r => r.json())
      );

      Promise.all(promises)
        .then(families => {
          state.pokedex = families.flat();
          renderPokedex(region);
        })
        .catch(err => {
          console.error("Erro carregando families:", err);
          state.pokedex = [];
          const box = document.querySelector(`#db-${region} .list`);
          if (box) box.innerHTML = "<div>Erro ao carregar famílias.</div>";
        });
    })
    .catch(err => {
      console.error("Erro carregando index:", err);
      state.pokedex = [];
      const box = document.querySelector(`#db-${region} .list`);
      if (box) box.innerHTML = "<div>Erro ao carregar Pokédex.</div>";
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

  if (forms.length === 0) {
    alert("Nenhuma forma encontrada para este Pokémon.");
    return;
  }

  const baseName = forms[0].base || forms[0].name.split(" ")[0];

  let html = `
    <h2>${baseName} — Todas as formas</h2>
    <div style="margin-bottom:10px;">
      <img src="${forms[0].img}" width="72">
    </div>
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

  html += `<div style="margin-top:10px;"><button onclick="closeDetails()">Fechar</button></div>`;

  document.getElementById("detailBox").innerHTML = html;
  document.getElementById("detailModal").style.display = "flex";
}

function setMainForm(form){
  const dImg  = document.getElementById("dImg");
  const dName = document.getEle
