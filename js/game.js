// ... (todo o restante igual ao que você já tem)

function closeDetails(){document.getElementById("detailModal").style.display="none";}

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

// --- NOVO: controle do modal de evolução ---
function startEvolution(pokemon){
  document.getElementById("evoText").innerText = pokemon.name + " está evoluindo...";
  document.getElementById("evoImg").src = pokemon.img;
  document.getElementById("evolutionModal").style.display="flex";

  setTimeout(()=>{
    document.getElementById("evolutionModal").style.display="none";
  }, 3000);
}
