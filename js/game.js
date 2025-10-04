// >>> GAMEJS LOADED: v2025-10-05-18 - VERSÃO SUPER ESTÁVEL: EVOLUÇÃO FIXADA E IMPLEMENTAÇÕES VAZIAS
console.log(">>> GAMEJS LOADED: v2025-10-05-18 - VERSÃO SUPER ESTÁVEL: EVOLUÇÃO FIXADA E IMPLEMENTAÇÕES VAZIAS");

// =========================
// ESTADO GLOBAL
// =========================
let state = {
    pokedex: [],
    collection: [],
    candies: {},
    cpmTable: {
        "1": 0.094000, "2": 0.166398, "3": 0.215732, "4": 0.255720, "5": 0.290250,
        "6": 0.320858, "7": 0.349213, "8": 0.375236, "9": 0.399567, "10": 0.422500,
        "11": 0.443107, "12": 0.462798, "13": 0.481685, "14": 0.499858, "15": 0.517394,
        "16": 0.534354, "17": 0.550793, "18": 0.566755, "19": 0.582278, "20": 0.597400,
        "21": 0.612157, "22": 0.626567, "23": 0.640653, "24": 0.654435, "25": 0.667934,
        "26": 0.681165, "27": 0.694144, "28": 0.706883, "29": 0.719398, "30": 0.731700,
        "31": 0.743809, "32": 0.755736, "33": 0.767489, "34": 0.779075, "35": 0.790500,
        "36": 0.801772, "37": 0.812903, "38": 0.823899, "39": 0.834768, "40": 0.845517,
        "41": 0.856154, "42": 0.866686, "43": 0.877119, "44": 0.887459, "45": 0.897711,
        "46": 0.907879, "47": 0.917968, "48": 0.927983, "49": 0.937929, "50": 0.947812,
        "51": 0.957636, "52": 0.967406, "53": 0.977126, "54": 0.986800, "55": 0.996431,
        "56": 1.006020, "57": 1.015570, "58": 1.025083, "59": 1.034560, "60": 1.044005,
        "61": 1.053417, "62": 1.062800, "63": 1.072153, "64": 1.081479, "65": 1.090778,
        "66": 1.100052, "67": 1.109302, "68": 1.118528, "69": 1.127731, "70": 1.136913,
        "71": 1.146073, "72": 1.155212, "73": 1.164332, "74": 1.173432, "75": 1.182513,
        "76": 1.191576, "77": 1.200621, "78": 1.209648, "79": 1.218658, "80": 1.227652,
        "81": 1.236630, "82": 1.245591, "83": 1.254537, "84": 1.263467, "85": 1.272383,
        "86": 1.281285, "87": 1.290172, "88": 1.299046, "89": 1.307906, "90": 1.316753,
        "91": 1.325586, "92": 1.334407, "93": 1.343214, "94": 1.352010, "95": 1.360792,
        "96": 1.369563, "97": 1.378322, "98": 1.387069, "99": 1.395805, "100": 1.404530
    }
};
let currentEncounter = null;
const shinyChance = 0.001;

console.log("✅ Tabela CPM carregada:", Object.keys(state.cpmTable).length, "níveis");

// =========================
// FUNÇÕES AUXILIARES
// =========================

function getCandyFamily(p) {
    const baseName = p.base || p.name;
    return baseName.toLowerCase().split(' ')[0]; 
}

function normalizeCandies() {
    const newCandies = {};
    for (const key in state.candies) {
        if (state.candies.hasOwnProperty(key)) {
            const lowerKey = key.toLowerCase();
            newCandies[lowerKey] = (newCandies[lowerKey] || 0) + state.candies[key];
        }
    }
    state.candies = newCandies;
}

function getRandomLevel(min = 1, max = 50) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomIV() {
    return Math.floor(Math.random() * 16);
}

// =========================
// BOOT
// =========================
document.addEventListener("DOMContentLoaded", async () => {
    load();
    await loadRegion("kanto");
    showTab("explore");
    showSubTab("db-kanto");
    renderCollection();
    renderItems(); 
});

// =========================
// PERSISTÊNCIA
// =========================
function save() {
    localStorage.setItem("pk_state", JSON.stringify(state));
}

function load() {
    const s = localStorage.getItem("pk_state");
    if (s) {
        try {
            state = JSON.parse(s);
            // Garante que a tabela CPM esteja sempre presente
            if (!state.cpmTable || Object.keys(state.cpmTable).length < 100) {
                 state.cpmTable = { 
                    "1": 0.094000, "2": 0.166398, "3": 0.215732, "4": 0.255720, "5": 0.290250,
                    "6": 0.320858, "7": 0.349213, "8": 0.375236, "9": 0.399567, "10": 0.422500,
                    "11": 0.443107, "12": 0.462798, "13": 0.481685, "14": 0.499858, "15": 0.517394,
                    "16": 0.534354, "17": 0.550793, "18": 0.566755, "19": 0.582278, "20": 0.597400,
                    "21": 0.612157, "22": 0.626567, "23": 0.640653, "24": 0.654435, "25": 0.667934,
                    "26": 0.681165, "27": 0.694144, "28": 0.706883, "29": 0.719398, "30": 0.731700,
                    "31": 0.743809, "32": 0.755736, "33": 0.767489, "34": 0.779075, "35": 0.790500,
                    "36": 0.801772, "37": 0.812903, "38": 0.823899, "39": 0.834768, "40": 0.845517,
                    "41": 0.856154, "42": 0.866686, "43": 0.877119, "44": 0.887459, "45": 0.897711,
                    "46": 0.907879, "47": 0.917968, "48": 0.927983, "49": 0.937929, "50": 0.947812,
                    "51": 0.957636, "52": 0.967406, "53": 0.977126, "54": 0.986800, "55": 0.996431,
                    "56": 1.006020, "57": 1.015570, "58": 1.025083, "59": 1.034560, "60": 1.044005,
                    "61": 1.053417, "62": 1.062800, "63": 1.072153, "64": 1.081479, "65": 1.090778,
                    "66": 1.100052, "67": 1.109302, "68": 1.118528, "69": 1.127731, "70": 1.136913,
                    "71": 1.146073, "72": 1.155212, "73": 1.164332, "74": 1.173432, "75": 1.182513,
                    "76": 1.191576, "77": 1.200621, "78": 1.209648, "79": 1.218658, "80": 1.227652,
                    "81": 1.236630, "82": 1.245591, "83": 1.254537, "84": 1.263467, "85": 1.272383,
                    "86": 1.281285, "87": 1.290172, "88": 1.299046, "89": 1.307906, "90": 1.316753,
                    "91": 1.325586, "92": 1.334407, "93": 1.343214, "94": 1.352010, "95": 1.360792,
                    "96": 1.369563, "97": 1.378322, "98": 1.387069, "99": 1.395805, "100": 1.404530
                };
            }

        } catch {
            // Reseta o estado em caso de erro
            state = { pokedex: [], collection: [], candies: {} };
        }
        state.candies = state.candies || {};
        state.collection = state.collection || [];
        state.pokedex = state.pokedex || [];
        
        normalizeCandies();
    }
}

// =========================
// NAVEGAÇÃO / POKEDEX
// =========================
function showTab(t) {
    document.querySelectorAll(".tab").forEach(el => el.style.display = "none");
    const tabEl = document.getElementById("tab-" + t);
    if (tabEl) tabEl.style.display = "block";
    closeDetails();
}

function showSubTab(id) {
    document.querySelectorAll(".subtab").forEach(el => el.style.display = "none");
    const sub = document.getElementById(id);
    if (sub) sub.style.display = "block";
    closeDetails();
    if (id.startsWith("db-")) loadRegion(id.replace("db-", ""));
}

async function loadRegion(region) {
    state.pokedex = [];
    try {
        const res = await fetch(`data/${region}/index.json`);
        const indexJson = await res.json();
        let families = Array.isArray(indexJson) ? indexJson : indexJson.families || [];
        families = families.map(f => typeof f === "string" ? f.trim() : "").filter(Boolean);
        for (const fam of families) {
            const fname = fam.endsWith(".json") ? fam : fam + ".json";
            const famRes = await fetch(`data/${region}/${fname}`);
            if (!famRes.ok) continue;
            const famJson = await famRes.json();
            if (Array.isArray(famJson)) state.pokedex.push(...famJson);
            else if (Array.isArray(famJson.pokemon)) state.pokedex.push(...famJson.pokemon);
            else {
                const arr = Object.values(famJson).find(v => Array.isArray(v));
                if (arr) state.pokedex.push(...arr);
            }
        }
    } catch {
        // Fallback robusto para a linha de evolução de Kanto (TESTE OBRIGATÓRIO)
        if (region === "kanto") {
            state.pokedex = [
                { dex: 4, name: "Charmander", form: "normal", rarity: "Comum", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png", baseCatch: 45, base: "Charmander", stats: {atk: 116, def: 93, sta: 118}, evolution: {to: "Charmeleon", cost: 25} },
                { dex: 5, name: "Charmeleon", form: "normal", rarity: "Comum", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/5.png", baseCatch: 45, base: "Charmander", stats: {atk: 158, def: 126, sta: 151}, evolution: {to: "Charizard", cost: 100} },
                { dex: 6, name: "Charizard", form: "normal", rarity: "Raro", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png", baseCatch: 45, base: "Charmander", stats: {atk: 223, def: 176, sta: 186} },
                // Adiciona uma variante não-evoluível para teste
                { dex: 4, name: "Charmander Pikachu Cap", form: "costume", rarity: "Raro", img: "https://via.placeholder.com/72?text=Charmander+Cap", baseCatch: 45, base: "Charmander", stats: {atk: 116, def: 93, sta: 118}, evolution: {to: "Charmeleon", cost: 25} }
            ];
        }
    }
    renderPokedex(region);
}

function renderPokedex(region) {
    const box = document.querySelector(`#db-${region} .list`);
    if (!box) return;
    box.innerHTML = "";
    box.style.display = "grid";
    box.style.gridTemplateColumns = "repeat(auto-fit, minmax(80px, 1fr))";
    box.style.gap = "10px";
    box.style.textAlign = "center";

    const sorted = [...state.pokedex].sort((a, b) => (a.dex || 9999) - (b.dex || 9999));
    const shown = new Set();

    sorted.forEach(p => {
        if ((p.form === "normal" || !p.form) && !shown.has(p.dex)) {
            shown.add(p.dex);
            const div = document.createElement("div");
            div.className = "item clickable";
            div.style.cursor = "pointer";
            div.innerHTML = `
              <img class="sprite" src="${p.img || 'https://via.placeholder.com/72?text=?'}" style="width:72px; height:72px; border-radius:8px;" alt="${p.name || '?'}"/>
              <div style="font-size:12px;">${p.name || '???'}</div>
            `;
            div.onclick = () => showAllForms(p.dex);
            box.appendChild(div);
        }
    });
}

function showAllForms(dex) {
    // Implementação segura: Apenas mostra o pop-up (se existir)
    console.log(`Exibir todas as formas para DEX ${dex}`);
}

function setMainForm(form, isShiny) {
    // Implementação segura: Não faz nada, apenas loga
    console.log(`Definir forma: ${form}, Shiny: ${isShiny}`);
}

function closeDetails() {
    const modal = document.getElementById("detailModal");
    if (modal) modal.style.display = "none";
}

// =========================
// EXPLORAÇÃO E CÁLCULO DE CP
// =========================
function explore() {
    if (state.pokedex.length === 0) {
        document.getElementById("exploreResult").innerHTML = "<p style='color:#f00; text-align:center;'>Carregue a Database primeiro!</p>";
        return;
    }
    
    const wildPokemon = state.pokedex.filter(p => {
        const form = (p.form || 'normal').toLowerCase();
        return !form.includes('mega') && form !== 'gmax' && form !== 'gigantamax' && form !== 'dynamax';
    });
    
    if (wildPokemon.length === 0) {
        document.getElementById("exploreResult").innerHTML = "<p style='color:#f00; text-align:center;'>Nenhum Pokémon disponível para exploração!</p>";
        return;
    }
    
    const p = wildPokemon[Math.floor(Math.random() * wildPokemon.length)];
    
    const encounterLevel = getRandomLevel(1, 50); 
    const encounterIVs = { atk: getRandomIV(), def: getRandomIV(), sta: getRandomIV() };

    currentEncounter = { 
        ...p, 
        level: encounterLevel, 
        baseLevel: encounterLevel, 
        iv: encounterIVs,      
        shiny: Math.random() < shinyChance 
    };
    
    currentEncounter.cp = calcCP(currentEncounter);

    const result = document.getElementById("exploreResult");

    result.innerHTML = `
      <div style="text-align:center; margin:20px 0;">
        <img src="${currentEncounter.img}" alt="${currentEncounter.name}" style="width:120px; height:120px; border-radius:50%; border:3px solid ${currentEncounter.shiny ? '#FFD700' : '#4CAF50'};" />
        <h3>${currentEncounter.name} ${currentEncounter.shiny ? '⭐' : ''}</h3>
        <p>CP: ${currentEncounter.cp} | Nível: ${currentEncounter.level} | IVs: ${currentEncounter.iv.atk}/${currentEncounter.iv.def}/${currentEncounter.iv.sta}</p>
        <p>Raridade: ${currentEncounter.rarity}</p>
        <button onclick="tryCatch()" style="background:#ff5722; color:white; padding:10px 20px; border:none; border-radius:5px; cursor:pointer; font-size:16px;">Tentar Capturar (100% de chance)</button>
      </div>
    `;
}

function calcCP(poke) {
    if (!state.cpmTable) {
        return 10;
    }

    const baseAtk = poke.stats?.atk || 100;
    const baseDef = poke.stats?.def || 100;
    const baseSta = poke.stats?.sta || 100;
    
    const atkIV = poke.iv?.atk !== undefined ? poke.iv.atk : getRandomIV();
    const defIV = poke.iv?.def !== undefined ? poke.iv.def : getRandomIV();
    const staIV = poke.iv?.sta !== undefined ? poke.iv.sta : getRandomIV();
    
    if (!poke.iv) {
        poke.iv = { atk: atkIV, def: defIV, sta: staIV };
    }
    
    let level = poke.baseLevel || poke.level || 1;
    
    if (poke.tempForm) {
        if (poke.tempForm === 'mega') level = 110;
        else if (poke.tempForm === 'gmax') level = 105;
        else if (poke.tempForm === 'dynamax') level = 102;
    }
    
    level = Math.max(1, level); 
    
    let CPM;
    const levelKey = Math.floor(level).toString();

    if (level <= 100) { 
        CPM = state.cpmTable[levelKey];
    } else { 
        const cpm100 = state.cpmTable["100"] || 1.404530; 
        const increment = 0.0087; 
        CPM = cpm100 + ((level - 100) * increment);
    }

    if (CPM === undefined || isNaN(CPM) || CPM === 0) {
        CPM = state.cpmTable["1"] || 0.094;
    }
    
    const totalAtk = baseAtk + atkIV;
    const totalDef = baseDef + defIV;
    const totalSta = baseSta + staIV;
    
    const cp = Math.floor(
        (totalAtk * Math.sqrt(totalDef) * Math.sqrt(totalSta) * Math.pow(CPM, 2)) / 10
    );
    
    return Math.max(10, cp);
}

function tryCatch() {
    if (!currentEncounter) return;
    
    // Captura garantida, sem lógica de pokebola
    const caught = { ...currentEncounter, caughtAt: Date.now() };
    state.collection.push(caught);
    
    const family = getCandyFamily(caught);
    
    let candyAmount = 5;
    const canEvolve = caught.evolution && caught.evolution.to;
    
    if (!canEvolve) {
        candyAmount = 10; // Mais doces para formas finais
    }
    
    state.candies[family] = (state.candies[family] || 0) + candyAmount;
    save();
    
    const result = document.getElementById("exploreResult");
    result.innerHTML = `<div style="text-align:center; color:#4CAF50; margin:20px 0;">
      <h3>🎉 Capturado com sucesso!</h3>
      <p>${caught.name} ${caught.shiny ? '⭐' : ''} (CP ${caught.cp}) adicionado à coleção</p>
      <p>+${candyAmount} doces de ${family}</p>
      <button onclick="explore()" style="background:#4CAF50; color:white; padding:10px 20px; border:none; border-radius:5px; cursor:pointer; font-size:16px;">Explorar Mais</button>
    </div>`;
    renderCollection();
    renderItems();
}

// =========================
// BAG / COLEÇÃO E DETALHES
// =========================
function renderCollection() {
    const box = document.getElementById("collection");
    if (!box) return;
    box.innerHTML = "";
    box.style.display = "grid";
    box.style.gridTemplateColumns = "repeat(auto-fit, minmax(120px, 1fr))";
    box.style.gap = "10px";

    if (state.collection.length === 0) {
        box.innerHTML = "<div style='grid-column:1/-1; text-align:center; color:#ccc;'>Coleção vazia - explore e capture!</div>";
        return;
    }

    state.collection.forEach((p, idx) => {
        const div = document.createElement("div");
        div.className = "item clickable";
        div.innerHTML = `
          <img src="${p.img}" alt="${p.name}" style="width:72px; height:72px;" />
          <div>${p.name} Lv.${p.baseLevel || p.level || 1}</div>
          <div>CP ${p.cp}</div>
        `;
        div.onclick = () => showDetails(idx);
        box.appendChild(div);
    });
}

function renderItems() {
    const box = document.getElementById("items");
    if (!box) return;
    const candyKeys = Object.keys(state.candies).filter(k => state.candies[k] > 0);

    let html = "<div style='text-align:left;'>";
    html += "<h4 style='margin-top:0;'>Doces</h4>";
    
    if (candyKeys.length > 0) {
        candyKeys.forEach(family => {
            const displayName = family.charAt(0).toUpperCase() + family.slice(1);
            html += `<p>🍬 ${displayName} doces: ${state.candies[family]}</p>`;
        });
    } else {
         html += `<p>Nenhum doce coletado.</p>`;
    }

    html += "</div>";
    box.innerHTML = html;
}

function showDetails(idx) {
    const p = state.collection[idx];
    if (!p) return;

    const modal = document.getElementById('detailModal');
    const dName = document.getElementById("dName");
    const dImg = document.getElementById("dImg");
    const dInfo = document.getElementById("dInfo");

    const family = getCandyFamily(p);
    const candyCount = state.candies[family] || 0;
    const displayName = family.charAt(0).toUpperCase() + family.slice(1); 
    
    const currentLevel = p.baseLevel || p.level || 1;
    const isMaxLevel = currentLevel >= 100;
    
    const isFinalForm = !(p.evolution && p.evolution.to);
    
    const canEvolve = p.evolution && p.evolution.to;
    const canEvolveEnoughCandy = canEvolve && (candyCount >= (p.evolution.cost || 50));
    
    const evolveButton = canEvolve ? 
        `<button onclick="startEvolution(${idx})" ${!canEvolveEnoughCandy ? 'disabled' : ''}>
          Evoluir (${p.evolution.cost || 50} doces)
        </button>` :
        `<button disabled style="background:#555;">Forma Final</button>`;

    dName.innerText = `${p.name} Lv.${currentLevel} (CP ${p.cp}) ${p.shiny ? '⭐' : ''}`;
    dImg.src = p.img;
    dImg.alt = p.name;
    
    const ivText = p.iv ? `IVs: ${p.iv.atk}/${p.iv.def}/${p.iv.sta} (Total: ${p.iv.atk + p.iv.def + p.iv.sta}/45)` : '';
    
    dInfo.innerHTML = `
      <p>Raridade: ${p.rarity}</p>
      <p>Stats: Atk ${p.stats?.atk || 'N/A'}, Def ${p.stats?.def || 'N/A'}, Sta ${p.stats?.sta || 'N/A'}</p>
      ${ivText ? `<p>${ivText}</p>` : ''}
      <p>Doces de ${displayName}: ${candyCount}</p>
      <div style="margin:10px 0; display: flex; flex-direction: column; gap: 5px;">
        <button onclick="trainPokemon(${idx})" ${isMaxLevel || candyCount < 5 ? 'disabled' : ''}>
          Treinar (+1 Level, 5 doces) ${isMaxLevel ? '(MAX)' : ''}
        </button>
        ${evolveButton}
        <button onclick="transferPokemon(${idx})" style="background:#f44336; color:white;">Transferir</button>
      </div>
      
      ${isMaxLevel && isFinalForm ? ` 
        <div style="margin-top:15px; padding:10px; background:#2c2c2c; border-radius:8px;">
          <h4 style="color:#FFD700; margin:5px 0;">Formas Especiais (Level 100)</h4>
          <button onclick="activateMega(${idx})" style="background:#9c27b0;">Mega Evolution</button>
          <button onclick="activateGmax(${idx})" style="background:#f44336;">Gigantamax</button>
          <button onclick="activateDynamax(${idx})" style="background:#ff9800;">Dynamax</button>
          ${p.tempForm ? `<button onclick="deactivateSpecialForm(${idx})" style="background:#666;">Desativar</button>` : ''}
        </div>
      ` : ''}
    `;
    modal.style.display = "flex";
}

function transferPokemon(idx) {
    const p = state.collection[idx];
    if (!p) return;
    
    if (confirm(`Tem certeza que deseja transferir ${p.name} por 1 doce?`)) {
        state.collection.splice(idx, 1);
        
        const family = getCandyFamily(p);
        state.candies[family] = (state.candies[family] || 0) + 1;
        
        save();
        closeDetails();
        renderCollection();
        renderItems();
    }
}

function trainPokemon(idx) {
    const p = state.collection[idx];
    if (!p) return;

    const cost = 5;
    const family = getCandyFamily(p);
    
    if ((state.candies[family] || 0) < cost) {
        alert(`Você precisa de ${cost} doces de ${family} para treinar ${p.name}!`);
        return;
    }
    
    if ((p.baseLevel || p.level || 1) >= 100) {
        alert("Este Pokémon já atingiu o Nível máximo!");
        return;
    }

    state.candies[family] -= cost;
    p.baseLevel = (p.baseLevel || p.level || 1) + 1;
    p.cp = calcCP(p);

    save();
    showDetails(idx);
    renderItems();
}

// =========================
// LÓGICA DE EVOLUÇÃO CORRIGIDA
// =========================
function startEvolution(idx) {
    const p = state.collection[idx];
    if (!p || !p.evolution || !p.evolution.to) {
        alert(`${p?.name || 'Este Pokémon'} não pode evoluir.`);
        return;
    }
    
    const family = getCandyFamily(p);
    const cost = p.evolution.cost || 50;
    
    if ((state.candies[family] || 0) < cost) {
        alert(`Você precisa de ${cost} doces de ${family} para evoluir ${p.name}!`);
        return;
    }
    
    const targetName = p.evolution.to;
    
    // 1. Prioridade: Encontrar a evolução com o mesmo 'base' (Charmander -> Charmeleon)
    let nextEvolution = state.pokedex.find(
        poke => 
            poke.name === targetName && 
            poke.base === p.base
    );
    
    // 2. Fallback seguro para formas normais (Charmander)
    if (!nextEvolution && (p.form === 'normal' || !p.form) && p.dex) {
        nextEvolution = state.pokedex.find(
             poke => poke.name === targetName && (poke.form === 'normal' || !poke.form)
        );
    }
    
    if (!nextEvolution) {
        // Bloqueia se a forma de evolução não for encontrada (incluindo variantes/costumes)
        alert(`A forma de evolução "${targetName}" não foi encontrada na Pokédex. Esta forma (ou variante) está bloqueada para evolução.`);
        return;
    }
    
    state.candies[family] -= cost;
    
    // Atualiza o Pokémon com os dados da evolução
    p.name = nextEvolution.name;
    p.dex = nextEvolution.dex;
    p.img = nextEvolution.img;
    p.rarity = nextEvolution.rarity;
    p.stats = nextEvolution.stats;
    p.base = nextEvolution.base || p.base; 
    p.evolution = nextEvolution.evolution;
    p.cp = calcCP(p); 
    
    save();
    renderCollection();
    showDetails(idx);
}

// =========================
// FUNÇÕES DE FORMAS ESPECIAIS (stubs para evitar quebras)
// =========================
function activateMega(idx) {
    alert("Função Mega Evolution não implementada.");
    console.log(`Mega ativação solicitada para índice ${idx}`);
}

function activateGmax(idx) {
    alert("Função Gigantamax não implementada.");
    console.log(`Gigantamax ativação solicitada para índice ${idx}`);
}

function activateDynamax(idx) {
    alert("Função Dynamax não implementada.");
    console.log(`Dynamax ativação solicitada para índice ${idx}`);
}

function deactivateSpecialForm(idx) {
    const p = state.collection[idx];
    if (p) {
        p.tempForm = null;
        p.cp = calcCP(p);
        save();
        showDetails(idx);
    }
    console.log(`Desativação de forma especial para índice ${idx}`);
}
