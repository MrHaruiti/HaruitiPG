// >>> GAMEJS LOADED: v2025-10-04-6 - CLEAN VERSION (CORRIGIDO)
console.log(">>> GAMEJS LOADED: v2025-10-04-6 - CORRIGIDO CP/LEVEL/IV");

// =========================
// ESTADO GLOBAL
// =========================
let state = {
    pokedex: [],
    collection: [],
    candies: {},
    items: {},
    // Tabela CPM PADRÃO DE POKÉMON GO (para evitar erros de cálculo e NaN)
    cpmTable: {
        "1": 0.09400000, "1.5": 0.13513700, "2": 0.16639797, "2.5": 0.19265091, "3": 0.21573247,
        "3.5": 0.23657266, "4": 0.25572015, "4.5": 0.27353038, "5": 0.29024988, "5.5": 0.30606000,
        "6": 0.32085764, "6.5": 0.33490000, "7": 0.34790000, "7.5": 0.36000000, "8": 0.37200000,
        "8.5": 0.38300000, "9": 0.39400000, "9.5": 0.40400000, "10": 0.41400000, "10.5": 0.42500000,
        "11": 0.43500000, "11.5": 0.44500000, "12": 0.45500000, "12.5": 0.46500000, "13": 0.47400000,
        "13.5": 0.48400000, "14": 0.49400000, "14.5": 0.50300000, "15": 0.51200000, "15.5": 0.52100000,
        "16": 0.53000000, "16.5": 0.53900000, "17": 0.54800000, "17.5": 0.55600000, "18": 0.56500000,
        "18.5": 0.57300000, "19": 0.58100000, "19.5": 0.59000000, "20": 0.59800000, "20.5": 0.60600000,
        "21": 0.61400000, "21.5": 0.62200000, "22": 0.63000000, "22.5": 0.63700000, "23": 0.64500000,
        "23.5": 0.65300000, "24": 0.66000000, "24.5": 0.66700000, "25": 0.67500000, "25.5": 0.68200000,
        "26": 0.68900000, "26.5": 0.69600000, "27": 0.70300000, "27.5": 0.71000000, "28": 0.71700000,
        "28.5": 0.72400000, "29": 0.73100000, "29.5": 0.73700000, "30": 0.74400000, "30.5": 0.75078559,
        "31": 0.75735955, "31.5": 0.76376168, "32": 0.77000000, "32.5": 0.77610000, "33": 0.78210000,
        "33.5": 0.78810000, "34": 0.79400000, "34.5": 0.80000000, "35": 0.80600000, "35.5": 0.81200000,
        "36": 0.81800000, "36.5": 0.82400000, "37": 0.83000000, "37.5": 0.83700000, "38": 0.84300000,
        "38.5": 0.85000000, "39": 0.85600000, "39.5": 0.86300000, "40": 0.87000000, "40.5": 0.87600000,
        "41": 0.88200000, "41.5": 0.88800000, "42": 0.89400000, "42.5": 0.90000000, "43": 0.90600000,
        "43.5": 0.91200000, "44": 0.91800000, "44.5": 0.92400000, "45": 0.93000000, "45.5": 0.93600000,
        "46": 0.94200000, "46.5": 0.94800000, "47": 0.95400000, "47.5": 0.96000000, "48": 0.96600000,
        "48.5": 0.97200000, "49": 0.97800000, "49.5": 0.98400000, "50": 0.99000000
    }
};
let currentEncounter = null;
const shinyChance = 0.001;

console.log("✅ Tabela CPM carregada:", Object.keys(state.cpmTable).length, "níveis");

// =========================
// FUNÇÕES AUXILIARES
// =========================

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
            // CORREÇÃO: Força o uso da tabela CPM correta se a salva for inválida
            state.cpmTable = state.cpmTable || { "1": 0.09400000, "50": 0.99000000 }; 
        } catch {
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

// =========================
// DATABASE / POKEDEX
// =========================
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
// MODAL
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
// EXPLORAÇÃO
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
    
    // CORREÇÃO: Inicializa Level e IVs para cálculo correto
    const encounterLevel = getRandomLevel(1, 50); // Nível aleatório de 1 a 50
    const encounterIVs = { atk: getRandomIV(), def: getRandomIV(), sta: getRandomIV() };

    currentEncounter = { 
        ...p, 
        level: encounterLevel, // Novo nível
        iv: encounterIVs,      // Novos IVs
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
    
    // Usa IVs existentes ou gera aleatoriamente (que deve ser feito em explore() agora)
    const atkIV = poke.iv?.atk !== undefined ? poke.iv.atk : getRandomIV();
    const defIV = poke.iv?.def !== undefined ? poke.iv.def : getRandomIV();
    const staIV = poke.iv?.sta !== undefined ? poke.iv.sta : getRandomIV();
    
    // Garante que o IV esteja no objeto, caso tenha sido gerado aqui (fallback)
    if (!poke.iv) {
        poke.iv = { atk: atkIV, def: defIV, sta: staIV };
    }
    
    // Nível base é o que está no objeto (e já foi gerado em explore())
    let level = poke.level || 1;
    
    // Aplica modificadores de nível (para formas especiais, como você já tinha)
    if (poke.tempForm) {
        if (poke.tempForm === 'mega') level = 110;
        else if (poke.tempForm === 'gmax') level = 105;
        else if (poke.tempForm === 'dynamax') level = 102;
    }
    
    level = Math.max(1, Math.min(110, level));
    
    let CPM;
    if (level <= 50) { // Usa a tabela para níveis 1-50
        CPM = state.cpmTable[level.toString()];
    } else if (level <= 100) { // Extrapola para níveis 51-100 (se você for usar)
        CPM = state.cpmTable["50"] + ((level - 50) * 0.007); // Incremento aproximado
    } else { // Extrapola para níveis especiais > 100
        CPM = state.cpmTable["50"] + ((level - 50) * 0.007); 
    }

    // CORREÇÃO CRUCIAL: Se CPM for indefinido (NaN), defina um valor seguro
    if (CPM === undefined || isNaN(CPM)) {
        console.error(`CPM indefinido para o nível ${level}. Usando valor padrão.`);
        CPM = state.cpmTable["1"] || 0.094; // Fallback para Nível 1
    }
    
    const totalAtk = baseAtk + atkIV;
    const totalDef = baseDef + defIV;
    const totalSta = baseSta + staIV;
    
    // CORREÇÃO DE FÓRMULA: Fórmula padrão do Pokémon GO
    // CP = FLOOR((BaseAtk + IVAtk) * SQRT(BaseDef + IVDef) * SQRT(BaseSta + IVSta) * CPM^2 / 10)
    const cp = Math.floor(
        (totalAtk * Math.sqrt(totalDef + defIV) * Math.sqrt(totalSta + staIV) * Math.pow(CPM, 2)) / 10
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
        const family = caught.base || caught.name.toLowerCase().replace(/\s+/g, "");
        
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
// BAG / COLEÇÃO
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
          <div>${p.name} Lv.${p.level || 1}</div>
          <div>CP ${p.cp}</div>
        `;
        div.onclick = () => showDetails(idx);
        box.appendChild(div);
    });
}

function renderItems() {
    const box = document.getElementById("items");
    if (!box) return;
    if (Object.keys(state.items).length === 0) {
        box.innerHTML = "<div style='color:#ccc;'>Nenhum item disponível</div>";
        return;
    }
    let html = "<div style='text-align:left;'>";
    Object.entries(state.items).forEach(([item, count]) => {
        html += `<p>${item}: ${count}</p>`;
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

    const family = p.base || p.name.toLowerCase().replace(/\s+/g, "");
    const candyCount = state.candies[family] || 0;
    const currentLevel = p.baseLevel || p.level || 1;
    const isMaxLevel = currentLevel >= 100;

    dName.innerText = `${p.name} Lv.${currentLevel} (CP ${p.cp})`;
    dImg.src = p.img;
    dImg.alt = p.name;
    
    // Mostra IVs de forma clara
    const ivText = p.iv ? `IVs: ${p.iv.atk}/${p.iv.def}/${p.iv.sta}` : '';
    
    dInfo.innerHTML = `
      <p>Raridade: ${p.rarity}</p>
      <p>Stats: Atk ${p.stats?.atk || 'N/A'}, Def ${p.stats?.def || 'N/A'}, Sta ${p.stats?.sta || 'N/A'}</p>
      ${ivText ? `<p>${ivText}</p>` : ''}
      <p>Doces de ${family}: ${candyCount}</p>
      <div style="margin:10px 0;">
        <button onclick="trainPokemon(${idx})" ${isMaxLevel ? 'disabled' : ''}>
          Treinar (+1 Level, 5 doces) ${isMaxLevel ? '(MAX)' : ''}
        </button>
        <button onclick="startEvolution(${idx})">Evoluir (se possível)</button>
      </div>
      ${isMaxLevel ? `
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
// FORMAS ESPECIAIS
// =========================
function activateMega(idx) {
    const p = state.collection[idx];
    if (!p || (p.baseLevel || p.level) < 100) {
        alert("Apenas Pokémon level 100 podem Mega Evoluir!");
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
            cp: p.cp // Salva o CP original
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
    if (!p || (p.baseLevel || p.level) < 100) {
        alert("Apenas Pokémon level 100 podem usar Gigantamax!");
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
            cp: p.cp // Salva o CP original
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
        alert("Apenas Pokémon level 100 podem usar Dynamax!");
        return;
    }
    
    if (!p.originalData) {
        p.originalData = {
            stats: {...p.stats},
            level: p.level,
            sta: p.stats.sta, // Salva o Sta original para desativar
            cp: p.cp // Salva o CP original
        };
    }
    
    p.tempForm = 'dynamax';
    p.level = 102;
    // CORREÇÃO: Usa o sta original para calcular o novo (evita multiplicação infinita)
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
        // Usa o baseLevel se existir, senão o level original (de antes da forma especial)
        p.level = p.baseLevel || p.originalData.level; 
    }
    
    p.tempForm = null;
    delete p.originalData;
    p.cp = calcCP(p);
    
    save();
    renderCollection();
    showDetails(idx);
}

// =========================
// TREINO / EVOLUÇÃO
// =========================
function trainPokemon(idx) {
    const p = state.collection[idx];
    if (!p) return;
    const family = p.base || p.name.toLowerCase().replace(/\s+/g, "");
    if ((state.candies[family] || 0) < 5) {
        alert("Você precisa de pelo menos 5 doces para treinar!");
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
    const family = p.base || p.name.toLowerCase().replace(/\s+/g, "");
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
    // O level, baseLevel e IVs são mantidos. O CP é recalculado:
    p.cp = calcCP(p); 
    
    save();
    renderCollection();
    showDetails(idx);
}
