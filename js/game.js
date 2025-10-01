let state = {
  pokedex: [],
  collection: [],
  candies: {}
};
let currentEncounter = null;
const shinyChance = 0.001; // 0.1%

// carregar pokedex.json
fetch("data/pokedex.json")
  .then(r => r.json())
  .then(data => {
    state.pokedex = data;
    renderPokedex();
  });

function save() { localStorage.setItem('pk_state', JSON.stringify(state)); }
function load() { let s = localStorage.getItem('pk_state'); if(s) state = JSON.parse(s); }

function showTab(t){
  document.querySelectorAll('.tab').forEach(el=>el.style.display='none');
  document.getElementById('tab-'+t).style.display='block';
  document.querySelectorAll('nav button').forEach(b=>b.classList.remove('active'));
  document.querySelector(`nav button[onclick="showTab('`+t+`')"]`).classList.add('active');
}
function showSubTab(id){
  document.querySelectorAll('.subtab').forEach(el=>el.style.display='none');
  document.getElementById(id).style.display='block';
}

function explore(){
  const p=state.pokedex[Math.floor(Math.random()*state.pokedex.length)];
  currentEncounter={...p};
  currentEncounter.shiny=Math.random()<shinyChance;
  let html=`<div>Encontrou ${p.name}${currentEncounter.shiny?' ⭐ Shiny':''}!</div>
            <img src="${currentEncounter.shiny&&p.imgShiny?p.imgShiny:p.img}" style="width:72px;height:72px"><br>
            <button onclick="tryCatch()">Tentar Capturar</button>
            <div id="encResult"></div>`;
  document.getElementById('exploreResult').innerHTML=html;
}

function tryCatch(){
  if(!currentEncounter) return;
  let success=false;
  if(currentEncounter.shiny){ success=true; }
  else{
    const roll=Math.random()*100;
    success=roll<currentEncounter.baseCatch;
  }
  const res=document.getElementById('encResult');
  if(success){
    const iv={atk:Math.floor(Math.random()*16),def:Math.floor(Math.random()*16),sta:Math.floor(Math.random()*16)};
    const entry={
      id:'c'+Date.now()+Math.floor(Math.random()*1000),
      name:currentEncounter.name,
      rarity:currentEncounter.rarity,
      img:currentEncounter.img,
      imgShiny:currentEncounter.imgShiny,
      shiny:currentEncounter.shiny,
      iv:iv,
      moves:{fast:'Tackle',charged:'Hyper Beam'},
      evolution:currentEncounter.evolution||null,
      capturedAt:new Date().toLocaleString()
    };
    state.collection.push(entry);
    const base=currentEncounter.name.split(" ")[0];
    state.candies[base]=(state.candies[base]||0)+3;
    save();renderCollection();
    res.innerHTML='<span style="color:#7CFC9A">✨ Capturado!</span>';
  } else {
    res.innerHTML='<span style="color:#ff8080">💨 Escapou!</span>';
  }
  currentEncounter=null;
}

function renderCollection(){
  const box=document.getElementById('collection');box.innerHTML='';
  if(state.collection.length===0){box.innerHTML='<div>Nenhum Pokémon ainda.</div>';return;}
  state.collection.forEach(c=>{
    const div=document.createElement('div');div.className='item clickable';
    div.innerHTML=`<img class="sprite" src="${c.shiny&&c.imgShiny?c.imgShiny:c.img}"/> <b>${c.name}</b>`;
    div.onclick=()=>showDetails(c.id);
    box.appendChild(div);
  });
}

function renderPokedex(){
  const box=document.getElementById('pokedexList');box.innerHTML='';
  state.pokedex.forEach(p=>{
    const shinyMark=p.imgShiny?' ⭐':'';
    const div=document.createElement('div');div.className='item';
    div.innerHTML=`<img class="sprite" src="${p.img}"/> <b>${p.name}</b> — ${p.rarity}${shinyMark}`;
    box.appendChild(div);
  });
}

function showDetails(id){
  const c=state.collection.find(x=>x.id===id);if(!c)return;
  document.getElementById('dName').innerText=c.name+(c.shiny?' ⭐':'');
  document.getElementById('dImg').src=(c.shiny&&c.imgShiny)?c.imgShiny:c.img;
  const ivPct=Math.round(((c.iv.atk+c.iv.def+c.iv.sta)/45)*100);
  let info='';
  info+=`<div>Raridade: ${c.rarity}</div>`;
  info+=`<div>IVs: Atk ${c.iv.atk} • Def ${c.iv.def} • Sta ${c.iv.sta} (${ivPct}%)</div>`;
  info+=`<div>Moves: ${c.moves.fast} / ${c.moves.charged}</div>`;
  const base=c.name.split(" ")[0];
  info+=`<div>Candies: ${state.candies[base]||0} 🍬</div>`;
  if(c.evolution){
    const need=c.evolution.cost;
    const have=state.candies[base]||0;
    if(have>=need){
      info+=`<button onclick="evolve('${c.id}')">Evoluir → ${c.evolution.to} (${need} 🍬)</button>`;
    }else{
      info+=`<div>Precisa de ${need} 🍬 para evoluir</div>`;
    }
  }
  // botão de transferir
  info+=`<button onclick="transfer('${c.id}')">Transferir → +1 🍬</button>`;
  info+=`<div>Capturado em: ${c.capturedAt}</div>`;
  document.getElementById('dInfo').innerHTML=info;
  document.getElementById('detailModal').style.display='flex';
}
function closeDetails(){document.getElementById('detailModal').style.display='none';}

function evolve(id){
  const c=state.collection.find(x=>x.id===id);if(!c||!c.evolution)return;
  const base=c.name.split(" ")[0];
  const cost=c.evolution.cost;
  if((state.candies[base]||0)>=cost){
    state.candies[base]-=cost;
    c.name=c.evolution.to;
    c.evolution=null;
    save();renderCollection();closeDetails();
    alert("Evoluiu para "+c.name+"!");
  }
}

function transfer(id){
  const i = state.collection.findIndex(x => x.id === id);
  if(i >= 0){
    const c = state.collection[i];
    const base = c.name.split(" ")[0];
    state.candies[base] = (state.candies[base]||0) + 1;
    state.collection.splice(i,1); // remove da coleção
    save(); renderCollection(); closeDetails();
    alert(c.name+" foi transferido! Você ganhou +1 🍬");
  }
}

load();renderCollection();showTab('explore');
