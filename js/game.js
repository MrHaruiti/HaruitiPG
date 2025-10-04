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
// Carrega index.json de região — suporta:
// - formato A: ["BulbasaurFamily.json", "CharmanderFamily.json"]
// - formato B: { "families": [ "BulbasaurFamily.json", ... ] }
async function loadRegion(region){
  try {
    const res = await fetch(`data/${region}/index.json`);
    if (!res.ok) throw new Error(`index.json HTTP ${res.status}`);
    const json = await res.json();

    // Normaliza families para um array de strings
    let families = [];
    if (Array.isArray(json)) families = json;
    else if (json && Array.isArray(json.families)) families = json.families;
    else {
      console.warn("loadRegion: index.json tem formato inesperado; esperando array ou { families: [] }", json);
      // tenta inferir arquivos no diretório (não disponível via fetch), então aborta
      families = [];
    }

    state.pokedex = [];

    // carrega cada family file (ignora erros individuais)
    for (const fam of families){
      try {
        // se o nome já vier com extensão, usa; se não, acrescenta .json
        const fname = fam.endsWith(".json") ? fam : fam + ".json";
        const r2 = await fetch(`data/${region}/${encodeURIComponent(fname)}`);
        if (!r2.ok) {
          console.warn("loadRegion: não encontrou arquivo da família", fname, "status", r2.status);
          continue;
        }
        const d2 = await r2.json();
        if (Array.isArray(d2)) {
          state.pokedex.push(...d2);
        } else if (Array.isArray(d2.pokemon)) {
          // suporte a outro formato: { pokemon: [...] }
          state.pokedex.push(...d2.pokemon);
        } else {
          // se for um único objeto (uma família onde cada entry é uma forma), tenta extrair
          if (Array.isArray(Object.values(d2))) {
            // procurar por array dentro do objeto
            const arr = Object.values(d2).find(v => Array.isArray(v));
            if (arr) state.pokedex.push(...arr);
            else console.warn("loadRegion: formato family.json inesperado para", fname);
          }
        }
      } catch (errFam) {
        console.error("Erro carregando family file:", fam, errFam);
      }
    }

    renderPokedex(region);
  } catch (err) {
    console.error("Erro carregando região", region, err);
    // atualiza UI pra mostrar erro
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
    // se p.form não existir considera como normal
    if ((p.form === "normal" || !p.form) && !shown.has(p.dex)) {
      shown.add(p.dex);
      const div = document.createElement("div");
      div.className = "item clickable";
      div.innerHTML = `
        <img class="sprite" src="${p.img || ''}" alt="${p.name || '??'}"/>
        <div>${p.name || '???'}</div>
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
  try {
    const forms = state.pokedex.filter(p => p.dex === dex);
    if (!forms || forms.length === 0) return;

    const baseName = forms[0].base || (forms[0].name ? forms[0].name.split(" ")[0] : "Pokémon");
    const dName = document.getElementById("dName");
    const dImg  = document.getElementById("dImg");
    const dInfo = document.getElementById("dInfo");

    if (!dName || !dImg || !dInfo) {
      console.error("showAllForms: modal elements missing (dName/dImg/dInfo)");
      return;
    }

    dName.innerText = `${baseName} — Todas as formas`;
    dImg.src = forms[0].img || "";
    dImg.alt = baseName;

    // limpa informações
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
  try {
    if (!form) return;
    const dImg  = document.getElementById("dImg");
    const dName = document.getElementById("dName");
    const dInfo = document.getElementById("dInfo");
    if (!dImg || !dName || !dInfo) return;

    dImg.src = (form.shiny && form.imgShiny) ? form.imgShiny : (form.img || "");
    dImg.alt = form.name || dName.innerText || "Pokémon";
    dName.innerText = (form.name || "Forma") + (form.shiny ? " ⭐" : "");

    // mostra detalhes rápidos (stats)
    let extra = "";
    if (form.dex) extra += `<div><b>#${form.dex}</b></div>`;
    if (form.rarity) extra += `<div>Raridade: ${form.rarity}</div>`;
    if (form.base) extra += `<div>Base: ${form.base}</div>`;
    if (form.stats) extra += `<div>Stats — Atk:${form.stats.atk||'N/A'} Def:${form.stats.def||'N/A'} Sta:${form.stats.sta||'N/A'}</div>`;

    // insere antes da lista de formas
    const prev = dInfo.querySelector(".form-extra");
    if (prev) prev.remove();
    const holder = document.createElement("div");
    holder.className = "form-extra";
    holder.style.marginBottom = "8px";
    holder.innerHTML = extra;
    dInfo.insertBefore(holder, dInfo.firstChild);
  } catch (err) {
    console.error("setMainForm erro:", err);
  }
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
  const success = currentEncounter.shiny ? true : (Math.random() * 100) < (currentEncounter.baseCatch || 5);
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
      level: currentEncounter.level || 1,
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
      <span style="color:${c.iv.atk<15?'lime':'red'}">Atk ${c.iv.atk}</span>, 
      <span style="color:${c.iv.def<15?'lime':'red'}">Def ${c.iv.def}</span>, 
      <span style="color:${c.iv.sta<15?'lime':'red'}">Sta ${c.iv.sta}</span>
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
  const cost = Math.ceil(p.level * 1.5);
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
// CÁLCULO DE CP (simples, integrado ao game)
// =========================
function calcCP(p){
  if (!p.iv || !p.level) return 10;
  // cálculo simples: soma de IVs multiplicada pelo nível — já dá resultado coerente no jogo
  const base = (p.iv.atk + p.iv.def + p.iv.sta);
  return Math.max(10, Math.floor(base * (p.level/10)));
}

// =========================
// Fecha modal ao clicar no backdrop (melhora UX)
// =========================
(function enableBackdropClose(){
  document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("detailModal");
    if (!modal) return;
    modal.addEventListener("click", (e) => {
      if (e.target && e.target.id === "detailModal") closeDetails();
    });
  });
})();
