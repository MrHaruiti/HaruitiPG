// == Estado Global ==
let state = {
  pokedex: [],
  collection: [],
  candies: {},
  items: {}
};

let cpmTable = {}; // tabela CPM

// Carregar tabela CPM
fetch("data/cpm.json")
  .then(r => r.json())
  .then(data => { cpmTable = data; });

// == Salvar / Carregar ==
function saveState() {
  localStorage.setItem("gameState", JSON.stringify(state));
}
function loadState() {
  const saved = localStorage.getItem("gameState");
  if (saved) state = JSON.parse(saved);
}

// == Calcular CP ==
function calculateCP(baseStats, iv, level) {
  const cpm = cpmTable[level] || 0;
  const Atk = baseStats.atk + iv.atk;
  const Def = baseStats.def + iv.def;
  const Sta = baseStats.sta + iv.sta;
  return Math.floor(((Atk) * Math.sqrt(Def) * Math.sqrt(Sta) * (cpm ** 2)) / 10);
}

// == Renderizar Database ==
function renderPokedex(region) {
  const box = document.querySelector(`#db-${region} .list`);
  if (!box) return;
  box.innerHTML = "";
  state.pokedex.forEach(p => {
    const div = document.createElement("div");
    div.className = "pokemon";
    div.innerHTML = `<img src="${p.img}" alt="${p.name}"><span>${p.name}</span>`;
    div.onclick = () => showPokemonDetails(p);
    box.appendChild(div);
  });
}

// == Detalhes Database ==
function showPokemonDetails(pokemon) {
  const modal = document.getElementById("detailModal");
  const content = modal.querySelector(".modal-content");
  content.innerHTML = `
    <h3>${pokemon.name}</h3>
    <img src="${pokemon.img}" class="sprite-large">
    <div class="forms">
      ${pokemon.imgShiny ? `
        <button onclick="swapSprite('${pokemon.img}')">Normal</button>
        <button onclick="swapSprite('${pokemon.imgShiny}')">Shiny</button>
      ` : ""}
    </div>
    <button onclick="closeModal('detailModal')">Fechar</button>
  `;
  modal.style.display = "flex";
}

function swapSprite(src) {
  const modal = document.getElementById("detailModal");
  const img = modal.querySelector(".sprite-large");
  img.src = src;
}

function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

// == Exploração ==
function explore(region) {
  if (!state.pokedex.length) return alert("Carregue a região primeiro!");
  const randomIndex = Math.floor(Math.random() * state.pokedex.length);
  const pokemon = state.pokedex[randomIndex];
  const shiny = Math.random() < 0.001;

  const div = document.getElementById("exploreResult");
  div.innerHTML = `
    <h3>Um ${pokemon.name} selvagem apareceu!</h3>
    <img src="${shiny ? pokemon.imgShiny : pokemon.img}" class="sprite-large">
    <button onclick="catchPokemon(${randomIndex}, ${shiny})">Tentar Capturar</button>
  `;
}

function catchPokemon(index, shiny) {
  const pokemon = state.pokedex[index];

  // gerar IVs
  const iv = {
    atk: Math.floor(Math.random() * 16),
    def: Math.floor(Math.random() * 16),
    sta: Math.floor(Math.random() * 16)
  };

  // gerar Level
  const level = Math.floor(Math.random() * 101);

  // calcular CP
  const cp = calculateCP(pokemon.stats, iv, level);

  const caught = {
    name: pokemon.name,
    dex: pokemon.dex,
    form: pokemon.form,
    shiny: shiny,
    iv: iv,
    level: level,
    cp: cp,
    base: pokemon.base,
    caughtAt: new Date().toISOString()
  };

  state.collection.push(caught);
  state.candies[caught.base] = (state.candies[caught.base] || 0) + 3;

  saveState();
  renderBag();
  alert(`${pokemon.name} capturado!`);
}

// == Renderizar Bag ==
function renderBag() {
  const box = document.querySelector("#collection");
  if (!box) return;
  box.innerHTML = "";
  state.collection.forEach((p, idx) => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <img class="sprite" src="${p.shiny 
        ? "https://img.pokemondb.net/sprites/go/shiny/" + p.name.toLowerCase() + ".png" 
        : "https://img.pokemondb.net/sprites/go/normal/" + p.name.toLowerCase() + ".png"}">
      <div class="cp-level-small">CP ${p.cp} – Lv ${p.level}</div>
    `;
    div.onclick = () => showBagDetails(p, idx);
    box.appendChild(div);
  });
}

// == Detalhes Bag ==
function showBagDetails(p, idx) {
  const modal = document.getElementById("detailModal");
  const content = modal.querySelector(".modal-content");
  content.innerHTML = `
    <div class="cp-level">CP ${p.cp} – Level ${p.level}</div>
    <img src="${p.shiny ? "https://img.pokemondb.net/sprites/go/shiny/" + p.name.toLowerCase() + ".png" : "https://img.pokemondb.net/sprites/go/normal/" + p.name.toLowerCase() + ".png"}" class="sprite-large">
    <div class="dex-name">#${p.dex} ${p.name}</div>
    <p>Forma: ${p.form || "Normal"} ${p.shiny ? "(Shiny)" : ""}</p>
    <p>IVs: Atk ${p.iv.atk} / Def ${p.iv.def} / Sta ${p.iv.sta}</p>
    <p>${p.base} Candy: ${state.candies[p.base] || 0}</p>
    <p>Data de Captura: ${new Date(p.caughtAt).toLocaleString()}</p>
    <button onclick="transferPokemon(${idx})">Transferir</button>
    <button onclick="closeModal('detailModal')">Fechar</button>
  `;
  modal.style.display = "flex";
}

function transferPokemon(idx) {
  const p = state.collection[idx];
  state.candies[p.base] = (state.candies[p.base] || 0) + 1;
  state.collection.splice(idx, 1);
  saveState();
  renderBag();
  closeModal('detailModal');
}

// == Renderizar Itens ==
function renderItems() {
  const box = document.querySelector("#items");
  if (!box) return;
  box.innerHTML = "";
  if (Object.keys(state.items).length === 0) {
    box.innerHTML = "<div>Nenhum item.</div>";
  } else {
    Object.keys(state.items).forEach(k => {
      box.innerHTML += `<div>${k}: ${state.items[k]}</div>`;
    });
  }
}

// == Inicialização ==
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  renderBag();
  renderItems();
});
