// game.js - versão completa e robusta
// Substitua seu game.js por este arquivo (faça backup primeiro)

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
      // se clicou no overlay (não no modal-content), fecha
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
      console.error("Erro ao parsear state do localStorage:", e);
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

// Database / Pokédex - Carrega por index.json que lista arquivos family
function loadRegion(region){
  const indexFile = `data/${region}/index.json`;
  console.log("Carregando index:", indexFile);

  fetch(indexFile)
    .then(r => {
      if (!r.ok) throw new Error(`index.json não encontrado (${r.status})`);
      return r.json();
    })
    .then(indexData => {
      if (!indexData || !Array.isArray(indexData.families)) {
        throw new Error("index.json inválido (esperado: { families: [...] })");
      }

      // monta promises para cada family (usando encodeURIComponent por segurança)
      const promises = indexData.families.map(fname =>
        fetch(`data/${region}/${encodeURIComponent(fname)}`)
          .then(r => {
            if (!r.ok) throw new Error(`Falha ao carregar ${fname} (${r.status})`);
            return r.json();
          })
      );

      return Promise.all(promises)
        .then(familiesArr => {
          // familiesArr é array de arrays (cada arquivo é um array de pokémon)
          const merged = [];
          familiesArr.forEach((fam, idx) => {
            if (!Array.isArray(fam)) {
              console.warn("Arquivo de family não retornou array:", indexData.families[idx]);
              return;
            }
            merged.push(...fam);
          });

          state.pokedex = merged;
          console.log(`Pokédex carregada (${region}):`, state.pokedex.length, "entradas");
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
    // Se o JSON estiver sem form, assume "normal" para compatibilidade
    const form = p.form ? p.form : "normal";
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

// Modal de todas as formas (garante conteúdo e botão fechar)
function showAllForms(dex){
  try {
    const forms = state.pokedex.filter(p => p.dex === dex);

    if (!forms || forms.length === 0) {
      alert("Nenhuma forma encontrada para este Pokémon.");
      return;
    }

    const baseName = forms[0].base || forms[0].name.split(" ")[0];

    let html = `
      <div style="text-align:center;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h2 style="margin:0;">${baseName} — Todas as formas</h2>
          <button onclick="closeDetails()" style="margin-left:10px;">Fechar ✖</button>
        </div>
        <div style="margin:8px 0;">
          <img src="${forms[0].img}" width="72" alt="${forms[0].name}">
        </div>
        <div style="text-align:left; max-height:320px; overflow:auto; padding:6px;">
    `;

    forms.forEach(f => {
      // fallback de nomes de imagem para evitar undefined
      const imgNormal = f.img || "";
      const imgShiny = f.imgShiny || "";
      const safeName = f.name || ("#" + (f.dex||"?"));

      html += `
        <div style="display:flex; align-items:center; gap:8px; padding:6px; border-bottom:1px solid #333;">
          <img src="${imgNormal}" width="48" class="clickable" style="cursor:pointer;" onclick='setMainForm(${JSON.stringify(f)})' alt="${safeName}">
          ${imgShiny ? `<img src="${imgShiny}" width="48" class="clickable" style="cursor:pointer;" onclick='setMainForm(${JSON.stringify({...f, shiny:true})})' alt="${safeName} Shiny">` : ""}
          <div style="flex:1;">
            <div style="font-weight:bold;">${safeName}</div>
            <div style="font-size:12px; color:#bbb;">${f.rarity || ""}</div>
          </div>
        </div>
      `;
    });

    html += `
        </div>
        <div style="margin-top:10px; text-align:center;">
          <button onclick="closeDetails()">Fechar</button>
        </div>
      </div>
    `;

    const detailBox = document.getElementById("detailBox");
    const modal = document.getElementById("detailModal");
    if (detailBox) detailBox.innerHTML = html;
    if (modal) modal.style.display = "flex";
  } catch (e) {
    console.error("Erro em showAllForms:", e);
    alert("Erro ao abrir formas. Veja console para detalhes.");
  }
}

function setMainForm(form){
  try {
    const detailBox = document.getElementById("detailBox");
    const modal = document.getElementById("detailModal");
    if (!detailBox || !modal) return;

    const imgSrc = (form.shiny && form.imgShiny) ? form.imgShiny : form.img;
    const name = form.name || "Desconhecido";

    const html = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h2 style="margin:0;">${name} ${form.shiny ? "⭐" : ""}</h2>
        <button onclick="closeDetails()">Fechar ✖</button>
      </div>
      <hr style="border-color:#333;">
      <div style="text-align:center; margin:10px 0;">
        <img src="${imgSrc}" width="120" alt="${name}">
      </div>
      <div style="text-align:left;">
        <div><b>Dex:</b> ${form.dex || "???"}</div>
        <div><b>Forma:</b> ${form.form || "normal"}</div>
        <div><b>Raridade:</b> ${form.rarity || "-"}</div>
        ${form.evolution ? `<div><b>Evolução:</b> ${JSON.stringify(form.evolution)}</div>` : ""}
      </div>
      <div style="margin-top:10px; text-align:center;">
        <button onclick="closeDetails()">Fechar</button>
      </div>
    `;
    detailBox.innerHTML = html;
    modal.style.display = "flex";
  } catch (e) {
    console.error("Erro em setMainForm:", e);
  }
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

  const el = document.getElementById("exploreResult");
  if (el) {
    el.innerHTML = `
      <div>Encontrou ${p.name}${currentEncounter.shiny ? ' ⭐ Shiny' : ''}!</div>
      <img src="${currentEncounter.shiny && p.imgShiny ? p.imgShiny : p.img}" width="72"><br>
      <button onclick="tryCatch()">Tentar Capturar</button>
      <div id="encResult"></div>
    `;
  }
}

function tryCatch(){
  if (!currentEncounter) return;
  const success = currentEncounter.shiny ? true : (Math.random() * 100) < (currentEncounter.baseCatch || 0);
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

// Detalhes com botão fechar
function showDetails(id){
  const c = state.collection.find(x => x.id === id);
  if (!c) return;

  const famKey = c.family || c.base || c.dex;
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
      <button onclick="closeDetails()">Fechar</button>
    </div>
  `;

  modal.style.display = "flex";
}

function transferPokemon(id){
  const idx = state.collection.findIndex(x => x.id === id);
  if (idx > -1){
    const p = state.collection[idx];
    const famKey = p.family || p.base || p.dex;
    state.collection.splice(idx, 1);
    state.candies[famKey] = (state.candies[famKey] || 0) + 1;
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
