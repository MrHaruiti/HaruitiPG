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
async function loadRegion(region){
  console.log(`[DEBUG] Iniciando loadRegion para ${region}`);
  try {
    const indexUrl = `data/${region}/index.json`;
    console.log(`[DEBUG] Tentando fetch: ${indexUrl}`);
    const res = await fetch(indexUrl);
    if (!res.ok) throw new Error(`index.json HTTP ${res.status}`);
    const json = await res.json();
    console.log(`[DEBUG] index.json carregado:`, json);

    let families = [];
    if (Array.isArray(json)) families = json;
    else if (json && Array.isArray(json.families)) families = json.families;
    else {
      console.warn("loadRegion: index.json formato inesperado:", json);
      families = [];
    }

    families = families.map(f => typeof f === "string" ? f : "").filter(Boolean);
    console.log(`[DEBUG] Families normalizadas:`, families);

    state.pokedex = [];

    for (const fam of families){
      const fname = fam.endsWith(".json") ? fam : fam + ".json";
      try {
        const url = `data/${region}/${encodeURIComponent(fname)}`;
        console.log(`[DEBUG] Tentando fetch family: ${url}`);
        const r2 = await fetch(url);
        if (!r2.ok) {
          console.warn("loadRegion: não encontrou", fname, "status", r2.status);
          continue;
        }
        const d2 = await r2.json();
        console.log(`[DEBUG] Family ${fname} carregada:`, d2);
        if (Array.isArray(d2)) state.pokedex.push(...d2);
        else if (Array.isArray(d2.pokemon)) state.pokedex.push(...d2.pokemon);
        else {
          const arr = Object.values(d2).find(v => Array.isArray(v));
          if (arr) state.pokedex.push(...arr);
          else console.warn("loadRegion: formato family.json inesperado para", fname);
        }
      } catch (eFam) {
        console.error("Erro lendo family file", fam, eFam);
      }
    }

    console.log(`[DEBUG] Pokédex final: ${state.pokedex.length} Pokémon carregados`);
    renderPokedex(region);
  } catch (err) {
    console.error("Erro carregando região", region, err);
    state.pokedex = [];
    const box = document.querySelector(`#db-${region} .list`);
    if (box) box.innerHTML = "<div>Erro ao carregar Pokédex. Verifique console para detalhes. Crie data/" + region + "/index.json.</div>";
    // Mock temporário para teste (descomente se quiser itens clicáveis sem JSONs reais)
    // if (region === "kanto") {
    //   state.pokedex = [
    //     { dex: 1, name: "Bulbasaur", form: "normal", rarity: "Comum", img: "https://via.placeholder.com/72?text=B", baseCatch: 45, family: "bulbasaur" },
    //     { dex: 4, name: "Charmander", form: "normal", rarity: "Comum", img: "https://via.placeholder.com/72?text=C", baseCatch: 45, family: "charmander" },
    //     { dex: 25, name: "Pikachu", form: "normal", rarity: "Raro", img: "https://via.placeholder.com/72?text=P", baseCatch: 20, family: "pikachu" }
    //   ];
    //   console.log("[DEBUG] Mock carregado para teste");
    //   renderPokedex(region);
    // }
  }
}

function renderPokedex(region){
  console.log(`[DEBUG] Renderizando Pokédex para ${region}, com ${state.pokedex.length} itens`);
  const box = document.querySelector(`#db-${region} .list`);
  if(!box) {
    console.warn("[DEBUG] Box .list não encontrado para", region);
    return;
  }
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
      console.log(`[DEBUG] Item criado e clicável: ${p.name} (dex ${p.dex})`);
    }
  });
  
  if (sorted.length === 0) {
    console.log("[DEBUG] Nenhum Pokémon para renderizar - lista vazia");
  }
}

// =========================
// MODAL FORMAS
// =========================
function showAllForms(dex){
  if (!document.getElementById('detailModal')) {
    console.warn('Modal de detalhes não encontrado no DOM');
    return;
  }
  const forms = state.pokedex.filter(p => p.dex === dex);
  if (!forms || forms.length === 0) {
    console.warn(`[DEBUG] Nenhuma forma encontrada para dex ${dex}`);
    return;
  }

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
    row.appendChild
