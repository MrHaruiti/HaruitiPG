// >>> GAMEJS LOADED: v2025-10-04-10 - COMPLETO C/ LÓGICA DE EXIBIÇÃO CORRIGIDA
console.log(">>> GAMEJS LOADED: v2025-10-04-10 - COMPLETO C/ LÓGICA DE EXIBIÇÃO CORRIGIDA");

// =========================
// ESTADO GLOBAL
// =========================
let state = {
    pokedex: [],
    collection: [],
    candies: {},
    items: {},
    // TABELA CPM CORRIGIDA PARA NÍVEIS INTEIROS (1 a 100)
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

// Função para determinar a chave de doce (Família Base do Pokémon)
function getCandyFamily(p) {
    const baseName = p.base || p.name;
    // Força para minúsculas e pega apenas a primeira palavra 
    return baseName.toLowerCase().split(' ')[0]; 
}

// Funções de limpeza de estado
function normalizeCandies() {
    const newCandies = {};
    for (const key in state.candies) {
        if (state.candies.hasOwnProperty(key)) {
            const lowerKey = key.toLowerCase();
            // Soma o valor do doce atual ao valor existente na nova chave minúscula
            newCandies[lowerKey] = (newCandies[lowerKey] || 0) + state.candies[key];
        }
    }
    state.candies = newCandies;
}

// Gerar nível aleatório entre 1 e 50 (se necessário)
function getRandomLevel(min = 1, max = 50) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Gerar IV aleatório (0 a 15)
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
            // Verifica e recarrega a tabela CPM se necessário (proteção contra dados antigos)
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
            state = { pokedex: [], collection: [], candies: {}, items: {} };
        }
        state.items = state.items || {};
        state.candies = state.candies || {};
        state.collection = state.collection || [];
        state.pokedex = state.pokedex || [];
        
        // CORREÇÃO: Normaliza as chaves de doces para minúsculas
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
        if (region === "kanto") {
            state.pokedex = [
                { dex: 1, name: "Bulbasaur", form: "normal", rarity: "Comum", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png", baseCatch: 45, base: "Bulbasaur", stats: {atk: 118, def: 111, sta: 128}, evolution: {to: "Ivysaur", cost: 25} }
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

// =========================
// MODAL DE DETALHES DA POKEDEX
// =========================
function showAllForms(dex) {
    const modal = document.getElementById('detailModal');
    if (!modal) return;
    let forms = state.pokedex.filter(p => p.dex === dex);
    if (!forms.length) return;

    const seen = new Set();
    forms = forms.filter(f => {
        if (seen.has(f.name)) return false;
        seen.add(f.name);
        return true;
    });

    const dName = document.getElementById("dName");
    const dImg = document.getElementById("dImg");
    const dInfo = document.getElementById("dInfo");

    const mainForm = forms[0];
    dName.innerText = `${mainForm.name} - Todas as Formas`;
    dImg.src = mainForm.img || "";
    dInfo.innerHTML = "";

    forms.forEach(f => {
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.marginBottom = "10px";
        
        const normalImg = document.createElement("img");
        normalImg.src = f.img;
        normalImg.width = 48;
        normalImg.height = 48;
        normalImg.style.marginRight = "10px";
        normalImg.style.cursor = "pointer";
        normalImg.style.border = "2px solid #444";
        normalImg.style.borderRadius = "8px";
        normalImg.onclick = () => setMainForm(f, false);
        
        const shinyImg = document.createElement("img");
        shinyImg.src = f.imgShiny || f.img;
        shinyImg.width = 48;
        shinyImg.height = 48;
        shinyImg.style.marginRight = "10px";
        shinyImg.style.cursor = "pointer";
        shinyImg.style.border = "2px solid #FFD700";
        shinyImg.style.borderRadius = "8px";
        shinyImg.onclick = () => setMainForm(f, true);
        
        const label = document.createElement("span");
        label.innerHTML = `<b>${f.name}</b> - ${f.rarity || 'N/A'}`;
        
        row.appendChild(normalImg);
        row.appendChild(shinyImg);
        row.appendChild(label);
        dInfo.appendChild(row);
    });

    modal.style.display = "flex";
}

function setMainForm(form, isShiny) {
    const dImg = document.getElementById("dImg");
    const dName = document.getElementById("dName");
    const dInfo = document.getElementById("dInfo");

    dImg.src = isShiny && form.imgShiny ? form.imgShiny : form.img;
    dName.innerText = form.name + (isShiny ? " ⭐ (Shiny)" : "");
    
    const infoDiv = document.createElement("div");
    infoDiv.style.marginTop = "15px";
    infoDiv.style.padding = "10px";
    infoDiv.style.background = "#2c2c2c";
    infoDiv.style.borderRadius = "8px";
    infoDiv.innerHTML = `
      <p><b>#${form.dex}</b> - Raridade: ${form.rarity || 'N/A'}</p>
      <p>Stats: Atk ${form.stats?.atk || 'N/A'} | Def ${form.stats?.def || 'N/A'} | Sta ${form.stats?.sta || 'N/A'}</p>
      <p>Base: ${form.base || 'N/A'} ${form.evolution ? `(Evolui para: ${form.evolution.to} - ${form.evolution.cost} doces)` : ''}</p>
    `;
    
    const existingInfo = dInfo.querySelector('div[style*="margin-top: 15px"]');
    if (existingInfo) existingInfo.remove();
    dInfo.appendChild(infoDiv);
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
        <button onclick="tryCatch()" style="background:#ff5722; color:white; padding:10px 20px; border:none; border-radius:5px; cursor:pointer; font-size:16px;">Tentar Capturar</button>
      </div>
    `;
}

function calcCP(poke) {
    if (!state.cpmTable) {
        console.warn("Tabela CPM não carregada");
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
    
    // Aplica modificadores de nível (para formas especiais)
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
        console.error(`CPM indefinido (ou zero) para o nível ${level}. Usando valor de Nível 1.`);
        CPM = state.cpmTable["1"] || 0.094;
    }
    
    const totalAtk = baseAtk + atkIV;
    const totalDef = baseDef + defIV;
    const totalSta = baseSta + staIV;
    
    // Fórmula de CP
    const cp = Math.floor(
        (totalAtk * Math.sqrt(totalDef) * Math.sqrt(totalSta) * Math.pow(CPM, 2)) / 10
    );
    
    return Math.max(10, cp);
}

function tryCatch() {
    if (!currentEncounter) return;
    const baseRate = currentEncounter.baseCatch || 30;
    const catchRate = currentEncounter.shiny ? 100 : baseRate;
    const success = Math.random() * 100 < catchRate;

    const result = document.getElementById("exploreResult");
    if (success) {
        const caught = { ...currentEncounter, caughtAt: Date.now() };
        state.collection.push(caught);
        
        const family = getCandyFamily(caught);
        
        // Lógica de doces (simplificada, mas funcional)
        let candyAmount = 5;
        const canEvolve = caught.evolution && caught.evolution.to;
        const isEvolution = state.pokedex.some(p => 
            p.base === caught.base && p.evolution && p.evolution.to === caught.name
        );
        
        if (canEvolve) {
            if (isEvolution) {
                candyAmount = 10;
            } else {
                candyAmount = 5;
            }
        } else if (isEvolution) {
            candyAmount = 15;
        } else {
            candyAmount = 5;
        }
        
        state.candies[family] = (state.candies[family] || 0) + candyAmount;
        save();
        result.innerHTML = `<div style="text-align:center; color:#4CAF50; margin:20px 0;">
          <h3>🎉 Capturado com sucesso!</h3>
          <p>${caught.name} ${caught.shiny ? '⭐' : ''} (CP ${caught.cp}) adicionado à coleção</p>
          <p>+${candyAmount} doces de ${family}</p>
          <button onclick="explore()" style="background:#4CAF50; color:white; padding:10px 20px; border:none; border-radius:5px; cursor:pointer;">Explorar Mais</button>
        </div>`;
        renderCollection();
        renderItems();
    } else {
        result.innerHTML += `<div style="text-align:center; color:#f44336; margin:20px 0;">
          <p>O Pokémon fugiu! 😞</p>
          <button onclick="tryCatch()" style="background:#f44336; color:white; padding:8px 16px; border:none; border-radius:5px; cursor:pointer;">Tentar Novamente</button>
        </div>`;
    }
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

    if (candyKeys.length === 0 && Object.keys(state.items).length === 0) {
        box.innerHTML = "<div style='color:#ccc;'>Nenhum item ou doce disponível</div>";
        return;
    }
    
    let html = "<div style='text-align:left;'>";
    
    // Itens
    Object.entries(state.items).forEach(([item, count]) => {
        html += `<p>• ${item}: ${count}</p>`;
    });

    // Doces
    candyKeys.forEach(family => {
        const displayName = family.charAt(0).toUpperCase() + family.slice(1);
        html += `<p>🍬 ${displayName} doces: ${state.candies[family]}</p>`;
    });

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
    
    // NOVO TESTE: Se tem 'evolution.to', NÃO é a forma final.
    const isFinalForm = !(p.evolution && p.evolution.to);

    dName.innerText = `${p.name} Lv.${currentLevel} (CP ${p.cp}) ${p.shiny ? '⭐' : ''}`;
    dImg.src = p.img;
    dImg.alt = p.name;
    
    const ivText = p.iv ? `IVs: ${p.iv.atk}/${p.iv.def}/${p.iv.sta}` : '';
    
    dInfo.innerHTML = `
      <p>Raridade: ${p.rarity}</p>
      <p>Stats: Atk ${p.stats?.atk || 'N/A'}, Def ${p.stats?.def || 'N/A'}, Sta ${p.stats?.sta || 'N/A'}</p>
      ${ivText ? `<p>${ivText}</p>` : ''}
      <p>Doces de ${displayName}: ${candyCount}</p>
      <div style="margin:10px 0; display: flex; flex-direction: column; gap: 5px;">
        <button onclick="trainPokemon(${idx})" ${isMaxLevel ? 'disabled' : ''}>
          Treinar (+1 Level, 5 doces) ${isMaxLevel ? '(MAX)' : ''}
        </button>
        <button onclick="startEvolution(${idx})">Evoluir (se possível)</button>
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

// =========================
// AÇÕES NA COLEÇÃO
// =========================
function transferPokemon(idx) {
    const p = state.collection[idx];
    if (!p) return;

    if (!confirm(`Tem certeza que deseja transferir ${p.name} (CP ${p.cp})? Você receberá 1 doce.`)) {
        return;
    }
    
    const family = getCandyFamily(p); 
    state.candies[family] = (state.candies[family] || 0) + 1;
    state.collection.splice(idx, 1);

    save();
    renderCollection();
    renderItems();
    closeDetails();

    alert(`✅ ${p.name} transferido com sucesso. Você recebeu 1 doce de ${family}!`);
}

function trainPokemon(idx) {
    const p = state.collection[idx];
    if (!p) return;
    
    const family = getCandyFamily(p);
    
    if ((state.candies[family] || 0) < 5) {
        alert(`Você precisa de pelo menos 5 doces de ${family} para treinar!`);
        return;
    }
    
    const currentLevel = p.baseLevel || p.level || 1;
    if (currentLevel >= 100) {
        alert("Este Pokémon já atingiu o level máximo (100)!");
        return;
    }
    
    state.candies[family] -= 5;
    p.baseLevel = currentLevel + 1;
    p.level = p.baseLevel;
    p.cp = calcCP(p);
    save();
    renderCollection();
    showDetails(idx);
}

function startEvolution(idx) {
    const p = state.collection[idx];
    if (!p || !p.evolution) {
        alert(`${p?.name || 'Este Pokémon'} não pode evoluir.`);
        return;
    }
    
    const family = getCandyFamily(p);
    
    const cost = p.evolution.cost || 50;
    if ((state.candies[family] || 0) < cost) {
        alert(`Você precisa de ${cost} doces de ${family} para evoluir ${p.name}!`);
        return;
    }
    const nextEvolution = state.pokedex.find(
        poke => poke.name === p.evolution.to && (poke.form === "normal" || !poke.form)
    );
    if (!nextEvolution) return;
    
    state.candies[family] -= cost;
    
    // Transfere dados mantendo IVs e Level
    p.name = nextEvolution.name;
    p.dex = nextEvolution.dex;
    p.img = nextEvolution.img;
    p.rarity = nextEvolution.rarity;
    p.stats = nextEvolution.stats;
    p.evolution = nextEvolution.evolution;
    p.cp = calcCP(p); 
    
    save();
    renderCollection();
    showDetails(idx);
}

// =========================
// FORMAS ESPECIAIS (MEGA/GMAX/DMAX)
// =========================
function activateMega(idx) {
    const p = state.collection[idx];
    if (!p) return;
    
    if ((p.baseLevel || p.level) < 100) {
        alert("Apenas Pokémon nível 100 podem Mega Evoluir!");
        return;
    }
    
    // CHECAGEM CRÍTICA: Apenas Formas Finais podem Mega Evoluir.
    if (p.evolution && p.evolution.to) {
        alert(`${p.name} ainda pode evoluir para ${p.evolution.to} e não pode Mega Evoluir!`);
        return;
    }
    
    const megaForm = state.pokedex.find(pk => 
        pk.base === p.base && (pk.form === 'mega' || pk.form === 'mega-x' || pk.form === 'mega-y')
    );
    
    if (!megaForm) {
        alert(`${p.name} não possui Mega Evolução!`);
        return;
    }
    
    if (!p.originalData) {
        p.originalData = {
            name: p.name,
            img: p.img,
            stats: {...p.stats},
            level: p.level,
            cp: p.cp, 
            baseLevel: p.baseLevel || p.level 
        };
    }
    
    p.tempForm = 'mega';
    p.name = megaForm.name;
    p.img = megaForm.img;
    p.stats = {...megaForm.stats};
    p.level = 110;
    p.cp = calcCP(p);
    
    save();
    renderCollection();
    showDetails(idx);
}


function activateGmax(idx) {
    const p = state.collection[idx];
    if (!p) return;
    
    if ((p.baseLevel || p.level) < 100) {
        alert("Apenas Pokémon nível 100 podem usar Gigantamax!");
        return;
    }
    
    // CHECAGEM CRÍTICA: Apenas Formas Finais (ou as que têm a forma GMax) podem usar Gigantamax.
    if (p.evolution && p.evolution.to) {
        alert(`${p.name} ainda pode evoluir e não pode usar Gigantamax!`);
        return;
    }


    const gmaxForm = state.pokedex.find(pk => 
        pk.base === p.base && pk.form === 'gmax'
    );
    
    if (!gmaxForm) {
        alert(`${p.name} não possui forma Gigantamax!`);
        return;
    }
    
    if (!p.originalData) {
        p.originalData = {
            name: p.name,
            img: p.img,
            stats: {...p.stats},
            level: p.level,
            cp: p.cp, 
            baseLevel: p.baseLevel || p.level
        };
    }
    
    p.tempForm = 'gmax';
    p.name = gmaxForm.name;
    p.img = gmaxForm.img;
    p.stats = {...gmaxForm.stats};
    p.level = 105;
    p.cp = calcCP(p);
    
    save();
    renderCollection();
    showDetails(idx);
}

function activateDynamax(idx) {
    const p = state.collection[idx];
    if (!p || (p.baseLevel || p.level) < 100) {
        alert("Apenas Pokémon nível 100 podem usar Dynamax!");
        return;
    }
    
    // Dynamax é universal, não precisa checar a forma final.
    
    if (!p.originalData) {
        p.originalData = {
            stats: {...p.stats},
            level: p.level,
            sta: p.stats.sta, 
            cp: p.cp, 
            baseLevel: p.baseLevel || p.level
        };
    }
    
    p.tempForm = 'dynamax';
    p.level = 102;
    p.stats.sta = (p.originalData.sta || p.stats.sta) * 2; 
    p.cp = calcCP(p);
    
    save();
    renderCollection();
    showDetails(idx);
}

function deactivateSpecialForm(idx) {
    const p = state.collection[idx];
    if (!p || !p.tempForm) return;
    
    if (p.originalData) {
        if (p.originalData.name) p.name = p.originalData.name;
        if (p.originalData.img) p.img = p.originalData.img;
        p.stats = {...p.originalData.stats};
        p.level = p.originalData.baseLevel; 
        p.baseLevel = p.originalData.baseLevel;
    }
    
    p.tempForm = null;
    delete p.originalData;
    p.cp = calcCP(p);
    
    save();
    renderCollection();
    showDetails(idx);
}
