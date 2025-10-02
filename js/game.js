let state = {
  pokedex: [],
  collection: [],
  candies: {},
  items: {} // agora inclui mega stones
};
let currentEncounter = null;
const shinyChance = 0.001;

document.addEventListener("DOMContentLoaded", () => {
  showTab("explore");
  showSubTab("db-kanto");
  loadRegion("kanto");
});

function save(){ localStorage.setItem("pk_state", JSON.stringify(state)); }
function load(){ let s=localStorage.getItem("pk_state"); if(s) state=JSON.parse(s); }

function showTab(t){
  document.querySelectorAll(".tab").forEach(el=>el.style.display="none");
  document.getElementById("tab-"+t).style.display="block";
}
function showSubTab(id){
  document.querySelectorAll(".subtab").forEach(el=>el.style.display="none");
  document.getElementById(id).style.display="block";
  if(id.startsWith("db-")){
    const region = id.replace("db-","");
    loadRegion(region);
  }
}

function loadRegion(region){
  let file = "data/pokedex-" + region + ".json";
  fetch(file).then(r=>r.json()).then(data=>{
    state.pokedex=data;
    renderPokedex(region);
  }).catch(()=>{
    state.pokedex=[];
    const box=document.querySelector(`#db-${region} .list`);
    if(box) box.innerHTML="<div>Nenhum Pokémon cadastrado.</div>";
  });
}

function explore(){
  if(state.pokedex.length===0){
    document.getElementById("exploreResult").innerHTML="Nenhum Pokémon nesta região.";
    return;
  }
  const p=state.pokedex[Math.floor(Math.random()*state.pokedex.length)];
  currentEncounter={...p};
  currentEncounter.shiny=Math.random()<shinyChance;
  document.getElementById("exploreResult").innerHTML=
    `<div>Encontrou ${p.name}${currentEncounter.shiny?' ⭐ Shiny':''}!</div>
     <img src="${currentEncounter.shiny&&p.imgShiny?p.imgShiny:p.img}" width="72"><br>
     <button onclick="tryCatch()">Tentar Capturar</button>
     <div id="encResult"></div>`;
}

function tryCatch(){
  if(!currentEncounter) return;
  let success = currentEncounter.shiny ? true : Math.random()*100<currentEncounter.baseCatch;
  const res=document.getElementById("encResult");
  if(success){
    const iv={atk:randIV(),def:randIV(),sta:randIV()};
    const entry={
      id:"c"+Date.now(),
      base: currentEncounter.name.split(" ")[0],
      name:currentEncounter.name,
      rarity:currentEncounter.rarity,
      img:currentEncounter.img,
      imgShiny:currentEncounter.imgShiny,
      shiny:currentEncounter.shiny,
      iv:iv,
      capturedAt:new Date().toLocaleString()
    };
    state.collection.push(entry);
    state.candies[entry.base]=(state.candies[entry.base]||0)+3;
    save();renderCollection();renderItems();
    res.innerHTML="✨ Capturado!";
  } else res.innerHTML="💨 Escapou!";
  currentEncounter=null;
}
function randIV(){return Math.floor(Math.random()*16);}

function renderCollection(){
  const box=document.getElementById("collection"); box.innerHTML="";
  if(state.collection.length===0){box.innerHTML="Nenhum Pokémon ainda.";return;}
  state.collection.forEach(c=>{
    const div=document.createElement("div");div.className="item clickable";
    div.innerHTML=`<img class="sprite" src="${c.shiny&&c.imgShiny?c.imgShiny:c.img}"/> <b>${c.name}</b>`;
    div.onclick=()=>showDetails(c.id);
    box.appendChild(div);
  });
}

// Database em grid 10 por linha
function renderPokedex(region){
  const box=document.querySelector(`#db-${region} .list`);
  if(!box) return;
  box.innerHTML='';
  
  const sorted = [...state.pokedex].sort((a,b) => (a.dex||9999) - (b.dex||9999));

  box.style.display="grid";
  box.style.gridTemplateColumns="repeat(10, 1fr)";
  box.style.gap="10px";
  box.style.textAlign="center";

  const shown = [];
  sorted.forEach(p=>{
    if(p.form==="normal" && !shown.includes(p.dex)){
      shown.push(p.dex);
      const div=document.createElement("div");
      div.className="item clickable";
      div.innerHTML=`
        <img class="sprite" src="${p.img}" alt="${p.name}"/>
        <div>${p.name}</div>
      `;
      div.onclick=()=>showAllForms(p.dex);
      box.appendChild(div);
    }
  });
}

function showAllForms(dex){
  const forms = state.pokedex.filter(p=>p.dex===dex);
  if(forms.length===0) return;

  const baseName = forms[0].name.split(" ")[0];
  document.getElementById('dName').innerText = baseName+" — Todas as formas";
  
  let html="";
  forms.forEach(f=>{
    html+=`
      <div style="margin:6px 0; border-bottom:1px solid #333; padding:4px;">
        <img src="${f.img}" width="48"> 
        ${f.imgShiny?`<img src="${f.imgShiny}" width="48">`:''} 
        <b>${f.name}</b> — ${f.rarity}
      </div>
    `;
  });
  html+=`<div style="margin-top:10px;"><button onclick="closeDetails()">Fechar</button></div>`;
  
  document.getElementById('dImg').src=forms[0].img;
  document.getElementById('dInfo').innerHTML=html;
  document.getElementById('detailModal').style.display='flex';
}

function showDetails(id){
  const c=state.collection.find(x=>x.id===id); if(!c) return;
  const base = c.base;
  const candies = state.candies[base]||0;
  document.getElementById("dName").innerText=c.name+(c.shiny?" ⭐":"");
  document.getElementById("dImg").src=c.shiny&&c.imgShiny?c.imgShiny:c.img;

  let info=`<div>Raridade: ${c.rarity}</div>`;
  info+=`<div>IVs: Atk ${c.iv.atk} • Def ${c.iv.def} • Sta ${c.iv.sta}</div>`;
  info+=`<div>Doces: ${candies}</div>`;
  
  // botões dinâmicos
  info+=`
    <div style="margin-top:10px;">
      <button onclick="transferPokemon('${c.id}')">Transferir</button>
      <button onclick="closeDetails()">Fechar</button>
    </div>`;
  
  document.getElementById("dInfo").innerHTML=info;
  document.getElementById("detailModal").style.display="flex";
}

function transferPokemon(id){
  const idx = state.collection.findIndex(x=>x.id===id);
  if(idx>-1){
    const p = state.collection[idx];
    const base = p.base;
    state.collection.splice(idx,1);
    state.candies[base]=(state.candies[base]||0)+1;
    save();renderCollection();renderItems();
    closeDetails();
    alert(p.name+" transferido! +1 doce");
  }
}

function closeDetails(){document.getElementById("detailModal").style.display="none";}

// render itens da Bag (Mega Stones etc.)
function renderItems(){
  const box=document.getElementById("items"); if(!box) return;
  box.innerHTML="";
  if(Object.keys(state.items).length===0){
    box.innerHTML="Nenhum item.";
    return;
  }
  for(let k in state.items){
    box.innerHTML+=`<div>${k}: ${state.items[k]}</div>`;
  }
}

load();renderCollection();renderItems();
