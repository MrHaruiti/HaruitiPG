// >>> GAMEJS LOADED: v2025-10-04-1
console.log(">>> GAMEJS LOADED: v2025-10-04-1");

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
    try {
      state = JSON.parse(s);
    } catch(e) {
      console.error("Erro parseando estado salvo:", e);
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
// Suporta index.json como array ou { families: [] }
// Também faz logs claros para debug.
async function loadRegion(region){
  try {
    const res = await fetch(`data/${region}/index.json`);
    if (!res.ok) throw new Error(`index.json HTTP ${res.status}`);
    const json = await res.json();

    let families = [];
    if (Array.isArray(json)) families = json;
    else if (json && Array.isArray(json.families)) families = json.families;
    else {
      console.warn("loadRegion: index.json formato inesperado:", json);
      families = [];
    }

    // Normaliza strings (remove espaços estranhos)
    families = families.map(f => typeof f === "string" ? f : "").filter(Boolean);

    state.pokedex = [];

    for (const fam of families){
      const fname = fam.endsWith(".json") ? fam : fam + ".json";
      try {
        // use encodeURIComponent para nomes com espaços
        const url = `data/${region}/${encodeURIComponent(fname)}`;
        const r2 = await fetch(url);
        if (!r2.ok) {
          console.warn("loadRegion: não encontrou", fname, "status", r2.status);
          continue;
        }
        const d2 = await r2.json();
        if (Array.isArray(d2)) state.pokedex.push(...d2);
        else if (Array.isArray(d2.pokemon)) state.pokedex.push(...d2.pokemon);
        else {
          // Tenta extrair arrays dentro do objeto (fallback)
          const arr = Object.values(d2).find(v => Array.isArray(v));
          if (arr) state.pokedex.push(...arr);
          else console.warn("loadRegion: formato family.json inesperado para", fname);
        }
      } catch (eFam) {
        console.error("Erro lendo family file", fam, eFam);
      }
    }

    renderPokedex(region);
  } catch (err) {
    console.error("Erro carregando região", region, err);
    const box = document.querySelector(`#db-${region} .list`);
    if (box) box.innerHTML = "<div>Erro ao carregar Pokédex.</div>";
    state.pokedex = [];
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
    if ((p.form === "normal" || !p.form) && !shown.has(p.dex)) {
      shown.add(p.dex);
      const div = document.createElement("div");
      div.className = "item clickable";
      div.innerHTML = `
        <img class="sprite" src="${p.img || ''}" alt="${(p.name||'?')}"/>
        <div>${p.name || '???'}</div>
      `;
      div.onclick = () => showAllForms(p.dex);
      box.appendChild(div);
    }
  });
}

// =========================
// MODAL FORMAS
// =========================
function showAllForms(dex){
  // Check mínimo: verifica se modal existe (previne erro se HTML não carregou)
  if (!document.getElementById('detailModal')) {
    console.warn('Modal de detalhes não encontrado no DOM');
    return;
  }
  try {
    const forms = state.pokedex.filter(p => p.dex === dex);
    if (!forms || forms.length === 0) return;

    const baseName = forms[0].base || (forms[0].name ? forms[0].name.split(" ")[0] : "Pokémon");
    const dName = document.getElementById("dName");
    const dImg  = document.getElementById("dImg");
    const dInfo = document.getElementById("dInfo");
    if (!dName || !dImg || !dInfo) { console.error("Modal elements missing"); return; }

    dName.innerText = `${baseName} — Todas as formas`;
    dImg.src = forms[0].img || "";
    dImg.alt = baseName;
    dInfo.innerHTML = "";

    forms.forEach((f, idx) => {
      const row = document.createElement("div");
      row.style.margin = "6px 0";
      row.style.borderBottom = "1px solid #333";
      row.style.padding = "6px 4px";
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.justifyContent = "space-between";
      row.style.gap = "12px";

      const left = document.createElement("div");
      left.style.display = "flex";
      left.style.alignItems = "center";
      left.style.gap = "8px";

      const img = document.createElement("img");
      img.src = f.img || "";
      img.width = 48;
      img.alt = f.name || ("Forma " + (idx+1));
      img.style.cursor = "pointer";
      img.className = "clickable";
      img.addEventListener("click", () => setMainForm(f));
      left.appendChild(img);

      if (f.imgShiny) {
        const imgS = document.createElement("img");
        imgS.src = f.imgShiny;
        imgS.width = 48;
        imgS.alt = (f.name || "") + " shiny";
        imgS.style.cursor = "pointer";
        imgS.className = "clickable";
        imgS.addEventListener("click", () => setMainForm({...f, shiny:true}));
        left.appendChild(imgS);
      }

      const infoCol = document.createElement("div");
      infoCol.style.textAlign = "left";
      infoCol.innerHTML = `<b>${f.name || "?"}</b><div style="font-size:12px; color:#ccc">${f.rarity || ""}</div>`;
      left.appendChild(infoCol);
      row.appendChild(left);

      const btn = document.createElement("button");
      btn.textContent = "Ver";
      btn.style.cursor = "pointer";
      btn.addEventListener("click", () => setMainForm(f));
      row.appendChild(btn);

      dInfo.appendChild(row);
    });

    const modal = document.getElementById("detailModal");
    if (modal) modal.style.display = "flex";
  } catch (err) {
    console.error("showAllForms erro:", err);
  }
}

function setMainForm(form){
  // Check mínimo: verifica se modal existe
  if (!document.getElementById('detailModal')) {
    console.warn('Modal de detalhes não encontrado no DOM');
    return;
  }
  try {
    if (!form) return;
    const dImg  = document.getElementById("dImg");
    const dName = document.getElementById("dName");
    const dInfo = document.getElementById("dInfo");
    if (!dImg || !dName || !dInfo) return;

    dImg.src = (form.shiny && form.imgShiny) ? form.imgShiny : (form.img || "");
    dImg.alt = form.name || dName.innerText || "Pokémon";
    dName.innerText = (form.name || "Forma") + (form.shiny ? " ⭐" : "");

    const prev = dInfo.querySelector(".form-extra");
    if (prev) prev.remove();
    const holder = document.createElement("div");
    holder.className = "form-extra";
    holder.style.marginBottom = "8px";

    let extra = "";
    if (form.dex) extra += `<div><b>#${form.dex}</b></div>`;
    if (form.rarity) extra += `<div>Raridade: ${form.rarity}</div>`;
    if (form.base) extra += `<div>Base: ${form.base}</div>`;
    if (form.stats) extra += `<div>Stats — Atk:${form.stats.atk||'N/A'} Def:${form.stats.def||'N/A'} Sta:${form.stats.sta||'N/A'}</div>`;

    holder.innerHTML = extra;
    dInfo.insertBefore(holder, dInfo.firstChild);
  } catch (err) {
    console.error("setMainForm erro:", err);
  }
}

// =========================
// EXPLORAÇÃO
// =========================
function explore(){
  if (state.pokedex.length === 0){
    document.getElementById("exploreResult").innerHTML = "Nenhum Pokémon nesta região.";
    return;
  }
  const p = state.pokedex[Math.floor(Math.random() * state.pokedex.length)];
  currentEncounter = { ...p };
  currentEncounter.shiny = Math.random() < shinyChance;
 
