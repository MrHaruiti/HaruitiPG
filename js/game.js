let state = {
  pokedex: [],
  collection: [],
  candies: {}
};
let currentEncounter = null;
const shinyChance = 0.001;

// inicia mostrando Explorar e carrega Kanto
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
     <img src="${currentEncounter.shiny&&p.imgShiny?p.imgShiny:p.img}" style="width:72px;height:72px"><br>
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
      name:currentEncounter.name,
      rarity:currentEncounter.rarity,
      img:currentEncounter.img,
      imgShiny:currentEncounter.imgShiny,
      shiny:currentEncounter.shiny,
      iv:iv,
      capturedAt:new Date().toLocaleString()
    };
    state.collection.push(entry);
    const base=currentEncounter.name.split(" ")[0];
    state.candies[base]=(state.candies[base]||0)+3;
    save();renderCollection();
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

function renderPokedex(region){
  const box=document.querySelector(`#db-${region} .list`);
  if(!box) return;
  box.innerHTML="";
  state.pokedex.forEach(p=>{
    let shinySprite=p.imgShiny?`<img class="sprite" src="${p.imgShiny}">`:"";
    box.innerHTML+=`<div class="item"><img class="sprite" src="${p.img}"/> ${shinySprite} <b>${p.name}</b> — ${p.rarity}</div>`;
  });
}

function showDetails(id){
  const c=state.collection.find(x=>x.id===id); if(!c) return;
  document.getElementById("dName").innerText=c.name+(c.shiny?" ⭐":"");
  document.getElementById("dImg").src=c.shiny&&c.imgShiny?c.imgShiny:c.img;
  let info=`<div>Raridade: ${c.rarity}</div>`;
  info+=`<div>IVs: Atk ${c.iv.atk} • Def ${c.iv.def} • Sta ${c.iv.sta}</div>`;
  document.getElementById("dInfo").innerHTML=info;
  document.getElementById("detailModal").style.display="flex";
}
function closeDetails(){document.getElementById("detailModal").style.display="none";}

load();renderCollection();
