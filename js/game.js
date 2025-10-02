function showDetails(id){
  const c=state.collection.find(x=>x.id===id); if(!c) return;
  const base = c.base;
  const candies = state.candies[base]||0;
  
  document.getElementById("dName").innerText=c.name+(c.shiny?" ⭐":"");
  document.getElementById("dImg").src=c.shiny&&c.imgShiny?c.imgShiny:c.img;

  let info=`<div>Raridade: ${c.rarity}</div>`;
  info+=`<div>IVs: Atk ${c.iv.atk} • Def ${c.iv.def} • Sta ${c.iv.sta}</div>`;
  info+=`<div>Doces: ${candies}</div>`;
  
  // Botões controlados só aqui
  info+=`
    <div style="margin-top:10px;">
      <button onclick="transferPokemon('${c.id}')">Transferir</button>
      <button onclick="evolvePokemon('${c.id}')">Evoluir</button>
      <button onclick="closeDetails()">Fechar</button>
    </div>
  `;

  document.getElementById("dInfo").innerHTML=info;
  document.getElementById("detailModal").style.display="flex";
}
