 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/js/game.js b/js/game.js
index 497698df8bc822738cf899ee61821dd2a1b39ded..114a38826cfaf4a38c5e9547fe5783d111daa5a2 100644
--- a/js/game.js
+++ b/js/game.js
@@ -1,102 +1,158 @@
 let state = {
   pokedex: [],
   collection: [],
   candies: {}
 };
 let currentEncounter = null;
+let selectedPokemonId = null;
 const shinyChance = 0.001;
 
+const moveSets = {
+  Bulbasaur: {
+    fast: ["Vine Whip", "Tackle"],
+    charged: ["Seed Bomb", "Sludge Bomb", "Power Whip"]
+  },
+  Ivysaur: {
+    fast: ["Razor Leaf", "Vine Whip"],
+    charged: ["Solar Beam", "Power Whip", "Sludge Bomb"]
+  },
+  Venusaur: {
+    fast: ["Vine Whip", "Razor Leaf"],
+    charged: ["Frenzy Plant", "Sludge Bomb", "Solar Beam"]
+  }
+};
+
 // garante carregamento inicial
 document.addEventListener("DOMContentLoaded", () => {
   showTab("explore");
   showSubTab("db-kanto");
   loadRegion("kanto");
 });
 
 function save(){ localStorage.setItem("pk_state", JSON.stringify(state)); }
 function load(){ let s=localStorage.getItem("pk_state"); if(s) state=JSON.parse(s); }
 
+function randomFrom(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
+function inferSpeciesName(name){ return name.includes(" (") ? name.split(" (")[0] : name; }
+function getSpeciesFromDex(enc){
+  if(!enc) return null;
+  const normal = state.pokedex.find(p=>p.dex===enc.dex && p.form==="normal");
+  if(normal) return normal.name;
+  return inferSpeciesName(enc.name);
+}
+function getMoveSet(species){
+  const set = moveSets[species];
+  if(!set) return { fast: "Ataque Ágil", charged: "Ataque Carregado" };
+  return {
+    fast: randomFrom(set.fast),
+    charged: randomFrom(set.charged)
+  };
+}
+
+function toggleTransferButton(show){
+  const btn = document.getElementById("transferBtn");
+  if(!btn) return;
+  btn.style.display = show ? "inline-block" : "none";
+}
+
+function ensureEntryData(entry){
+  if(!entry) return false;
+  let changed = false;
+  if(!entry.species){
+    entry.species = inferSpeciesName(entry.name);
+    changed = true;
+  }
+  if(!entry.moves || !entry.moves.fast || !entry.moves.charged){
+    entry.moves = getMoveSet(entry.species);
+    changed = true;
+  }
+  return changed;
+}
+
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
+    const speciesName=getSpeciesFromDex(currentEncounter) || inferSpeciesName(currentEncounter.name);
     const entry={
       id:"c"+Date.now(),
       name:currentEncounter.name,
       rarity:currentEncounter.rarity,
       img:currentEncounter.img,
       imgShiny:currentEncounter.imgShiny,
       shiny:currentEncounter.shiny,
       iv:iv,
+      dex:currentEncounter.dex,
+      species:speciesName,
+      moves:getMoveSet(speciesName),
       capturedAt:new Date().toLocaleString()
     };
     state.collection.push(entry);
-    const base=currentEncounter.name.split(" ")[0];
-    state.candies[base]=(state.candies[base]||0)+3;
+    state.candies[speciesName]=(state.candies[speciesName]||0)+3;
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
 
 // Database em grid 10 por linha
 function renderPokedex(region){
   const box=document.querySelector(`#db-${region} .list`);
   if(!box) return;
   box.innerHTML='';
   
   const sorted = [...state.pokedex].sort((a,b) => (a.dex||9999) - (b.dex||9999));
diff --git a/js/game.js b/js/game.js
index 497698df8bc822738cf899ee61821dd2a1b39ded..114a38826cfaf4a38c5e9547fe5783d111daa5a2 100644
--- a/js/game.js
+++ b/js/game.js
@@ -106,53 +162,89 @@ function renderPokedex(region){
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
-  
+
   let html="";
   forms.forEach(f=>{
     html+=`
       <div style="margin:6px 0; border-bottom:1px solid #333; padding:4px;">
-        <img src="${f.img}" width="48"> 
-        ${f.imgShiny?`<img src="${f.imgShiny}" width="48">`:''} 
+        <img src="${f.img}" width="48">
+        ${f.imgShiny?`<img src="${f.imgShiny}" width="48">`:''}
         <b>${f.name}</b> — ${f.rarity}
       </div>
     `;
   });
   document.getElementById('dImg').src=forms[0].img;
   document.getElementById('dInfo').innerHTML=html;
   document.getElementById('detailModal').style.display='flex';
+  selectedPokemonId = null;
+  toggleTransferButton(false);
 }
 
 function showDetails(id){
   const c=state.collection.find(x=>x.id===id); if(!c) return;
+  selectedPokemonId = id;
+  const updated = ensureEntryData(c);
   document.getElementById("dName").innerText=c.name+(c.shiny?" ⭐":"");
   document.getElementById("dImg").src=c.shiny&&c.imgShiny?c.imgShiny:c.img;
   let info=`<div>Raridade: ${c.rarity}</div>`;
   info+=`<div>IVs: Atk ${c.iv.atk} • Def ${c.iv.def} • Sta ${c.iv.sta}</div>`;
+  if(c.moves){
+    info+=`<div>Movimentos:</div>`;
+    info+=`<div>Ágil: <b>${c.moves.fast}</b></div>`;
+    info+=`<div>Carregado: <b>${c.moves.charged}</b></div>`;
+  }
+  if(c.capturedAt){
+    info+=`<div>Capturado em: ${c.capturedAt}</div>`;
+  }
   document.getElementById("dInfo").innerHTML=info;
   document.getElementById("detailModal").style.display="flex";
+  toggleTransferButton(true);
+  if(updated){ save(); }
+}
+function closeDetails(){
+  document.getElementById("detailModal").style.display="none";
+  selectedPokemonId = null;
+  toggleTransferButton(true);
+}
+
+function transferSelected(){
+  if(!selectedPokemonId) return;
+  const idx = state.collection.findIndex(c=>c.id===selectedPokemonId);
+  if(idx===-1) return;
+  const poke = state.collection[idx];
+  if(!confirm(`Transferir ${poke.name}?`)) return;
+  const candyKey = poke.species || inferSpeciesName(poke.name);
+  state.candies[candyKey]=(state.candies[candyKey]||0)+1;
+  state.collection.splice(idx,1);
+  save();
+  renderCollection();
+  closeDetails();
 }
-function closeDetails(){document.getElementById("detailModal").style.display="none";}
 
-load();renderCollection();
+load();
+let migrated=false;
+state.collection.forEach(c=>{ if(ensureEntryData(c)) migrated=true; });
+if(migrated) save();
+renderCollection();
 
EOF
)
