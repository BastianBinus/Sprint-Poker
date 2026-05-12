/* global firebase */
firebase.initializeApp({
  apiKey:"AIzaSyDz0yM2Fsb7_sxKNqi_vfPDsZmf8ZfCyck",
  authDomain:"sprint-poker-pax.firebaseapp.com",
  databaseURL:"https://sprint-poker-pax-default-rtdb.firebaseio.com",
  projectId:"sprint-poker-pax",
  storageBucket:"sprint-poker-pax.firebasestorage.app",
  messagingSenderId:"175982266217",
  appId:"1:175982266217:web:74e4d301e955254db05ff8"
});
const db = firebase.database();
const dbRef    = p    => db.ref(p);
const dbSet    = (r,v) => r.set(v);
const dbGet    = r    => r.get();
const dbUpdate = (r,v) => r.update(v);
const dbRemove = r    => r.remove();
const onVal    = (r,cb) => { r.on('value',s=>cb(s)); return ()=>r.off('value'); };

// Fibonacci sequence + special values
const NUMBERS=[1,2,3,5,8,13,21,'☕','?'];
const SUITS=['♠','♥','♦','♣'];
// Stack colors match NUMBERS order (last two = coffee brown + dark for ?)
const STACK_COLORS=['#dc2626','#2563eb','#16a34a','#7c3aed','#ca8a04','#ea580c','#0284c7','#6b3a2a','#27272a'];
// Lucide coffee icon (inline SVG)
const COFFEE_SVG=`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5c89a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1z"/><path d="M16 13a4 4 0 0 0 0-8h-1"/></svg>`;
const START_CHIPS=1000, BONUS_CHIPS=200;

// Shared state — one active game at a time
let G = { mode:null, sessionId:null, isHost:false, myId:null, myName:null, myVote:null, voteLocked:false, spectator:false };
let unsub=null, lastSnap=null;

const genId=()=>Math.random().toString(36).slice(2,10);
const fmt=n=>Number(n).toLocaleString('de-CH');
const toast=msg=>{const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600);};

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── Modals ──
function storyModal(title,desc,def){
  return new Promise(r=>{
    document.getElementById('storyModalTitle').textContent=title;
    document.getElementById('storyModalDesc').textContent=desc;
    const inp=document.getElementById('storyModalInput'); inp.value=def||'';
    document.getElementById('storyModal').classList.remove('hidden');
    inp.focus(); inp.select();
    const ok=document.getElementById('storyModalOk'), cn=document.getElementById('storyModalCancel');
    const close=v=>{document.getElementById('storyModal').classList.add('hidden');ok.replaceWith(ok.cloneNode(true));cn.replaceWith(cn.cloneNode(true));r(v);};
    document.getElementById('storyModalOk').addEventListener('click',()=>close(inp.value));
    document.getElementById('storyModalCancel').addEventListener('click',()=>close(null));
    inp.addEventListener('keydown',e=>{if(e.key==='Enter')close(inp.value);if(e.key==='Escape')close(null);});
  });
}
function confirmModal(title,desc){
  return new Promise(r=>{
    document.getElementById('confirmTitle').textContent=title;
    document.getElementById('confirmDesc').textContent=desc;
    document.getElementById('confirmModal').classList.remove('hidden');
    const ok=document.getElementById('confirmOk'),cn=document.getElementById('confirmCancel');
    const close=v=>{document.getElementById('confirmModal').classList.add('hidden');ok.replaceWith(ok.cloneNode(true));cn.replaceWith(cn.cloneNode(true));r(v);};
    document.getElementById('confirmOk').addEventListener('click',()=>close(true));
    document.getElementById('confirmCancel').addEventListener('click',()=>close(false));
  });
}

// ── URL check on load ──
const urlSid=new URLSearchParams(window.location.search).get('s');
const urlMode=new URLSearchParams(window.location.search).get('m'); // m=classic or m=casino
if(urlSid){
  G.sessionId=urlSid; G.mode=urlMode||'casino';
  showScreen(urlMode==='classic'?'screenClassicTable':'screenCasinoTable');
  dbGet(dbRef(`sessions/${urlSid}`)).then(snap=>{
    if(!snap.exists()){toast('Session nicht gefunden.');return;}
    document.getElementById('nameModal').classList.remove('hidden');
    document.getElementById('guestNameInput').focus();
  });
}

// ── Mode selection ──
document.getElementById('screenMode').addEventListener('click',e=>{
  if(e.target.closest('#btnClassicMode'))showScreen('screenClassicSetup');
  if(e.target.closest('#btnCasinoMode'))showScreen('screenCasinoSetup');
});
document.getElementById('backFromClassic').addEventListener('click',()=>showScreen('screenMode'));
document.getElementById('backFromCasino').addEventListener('click',()=>showScreen('screenMode'));

// ── Guest join ──
document.getElementById('joinGuestBtn').addEventListener('click',joinAsGuest);
document.getElementById('guestNameInput').addEventListener('keydown',e=>{if(e.key==='Enter')joinAsGuest();});

async function joinAsGuest(){
  const name=document.getElementById('guestNameInput').value.trim();
  if(!name){toast('Bitte Namen eingeben.');return;}
  const myId=genId();
  G.myId=myId; G.myName=name; G.isHost=false;
  const chips = G.mode==='casino' ? START_CHIPS : undefined;
  const playerData={name,vote:null,locked:false,isHost:false,spectator:false};
  if(chips!==undefined) playerData.chips=chips;
  await dbUpdate(dbRef(`sessions/${G.sessionId}/players/${myId}`),playerData);
  document.getElementById('nameModal').classList.add('hidden');
  if(G.mode==='classic') switchToClassicTable();
  else switchToCasinoTable();
}

// ─────────────────────────────────────
// CLASSIC MODE
// ─────────────────────────────────────
document.getElementById('classicCreateBtn').addEventListener('click',async()=>{
  const story=document.getElementById('classicStoryInput').value.trim();
  const name=document.getElementById('classicNameInput').value.trim();
  if(!story){toast('Bitte Story-Name.');return;} if(!name){toast('Bitte Namen.');return;}
  const btn=document.getElementById('classicCreateBtn'); btn.disabled=true; btn.textContent='Erstelle...';
  const sid=genId(),myId=genId();
  G.mode='classic'; G.sessionId=sid; G.isHost=true; G.myId=myId; G.myName=name;
  await dbSet(dbRef(`sessions/${sid}`),{
    mode:'classic',storyName:story,hostId:myId,revealed:false,createdAt:Date.now(),
    players:{[myId]:{name,vote:null,locked:false,isHost:true,spectator:false}}
  });
  switchToClassicTable();
});

function switchToClassicTable(){
  showScreen('screenClassicTable');
  document.getElementById('classicConnecting').classList.add('hidden');
  document.getElementById('classicTableContent').classList.remove('hidden');
  if(G.isHost){
    const url=window.location.origin+window.location.pathname+'?s='+G.sessionId+'&m=classic';
    document.getElementById('classicInviteUrl').textContent=url;
    document.getElementById('classicInviteBox').classList.remove('hidden');
    document.getElementById('classicEditStoryBtn').style.display='block';
    document.getElementById('classicHostControls').classList.remove('hidden');
  } else { document.getElementById('classicGuestControls').classList.remove('hidden'); }
  unsub=onVal(dbRef(`sessions/${G.sessionId}`),snap=>{if(!snap.exists())return;lastSnap=snap.val();renderClassic(lastSnap);});
}

function renderClassic(data){
  document.getElementById('classicStoryTitle').textContent=data.storyName||'–';
  const players=data.players||{}, me=players[G.myId];
  if(me){G.voteLocked=me.locked||false;if(me.vote!==null&&me.vote!==undefined)G.myVote=me.vote;}
  const active=Object.values(players).filter(p=>!p.spectator);
  const voted=active.filter(p=>p.locked).length;
  document.getElementById('classicStatus').innerHTML=`<span class="hi">${voted}</span> von ${active.length} abgestimmt`;
  renderClassicPlayers(players,data.revealed);
  if(!data.revealed&&!G.spectator){
    document.getElementById('classicVoteArea').classList.remove('hidden');
    document.getElementById('classicResultsPanel').classList.add('hidden');
    renderClassicVote();
  } else if(data.revealed){
    document.getElementById('classicVoteArea').classList.add('hidden');
    document.getElementById('classicResultsPanel').classList.remove('hidden');
    renderClassicResults(players);
  } else {
    document.getElementById('classicVoteArea').classList.add('hidden');
    document.getElementById('classicResultsPanel').classList.add('hidden');
  }
  if(G.isHost){
    const allVoted=active.length>0&&active.every(p=>p.locked);
    const rv=document.getElementById('classicRevealBtn'),rs=document.getElementById('classicResetBtn');
    if(data.revealed){rv.classList.add('hidden');rs.classList.remove('hidden');}
    else{rv.classList.remove('hidden');rs.classList.add('hidden');rv.disabled=!allVoted;}
    document.getElementById('classicSpectatorBtn').textContent=G.spectator?'Mitspielen':'Zuschauen';
  }
}

function renderClassicPlayers(players,revealed){
  const ring=document.getElementById('classicPlayersRing');
  const entries=Object.entries(players);
  const active=entries.filter(([,p])=>!p.spectator), specs=entries.filter(([,p])=>p.spectator);
  if(!active.length&&!specs.length){ring.innerHTML='<div style="color:rgba(232,223,200,0.4);font-size:13px">Warte auf Spieler...</div>';return;}
  ring.innerHTML=[...active,...specs].map(([id,p],i)=>{
    const isMe=id===G.myId,suit=SUITS[i%4];
    let card;
    if(p.spectator){
      card=`<div style="width:60px;height:84px;border-radius:8px;background:rgba(255,255,255,0.025);border:1.5px dashed rgba(201,168,76,0.15);display:flex;align-items:center;justify-content:center;font-size:10px;color:rgba(232,223,200,0.3)">ZS</div>`;
    } else if(revealed&&p.vote!==null){
      const cardInner=p.vote==='☕'?`<div style="display:flex;flex-direction:column;align-items:center;gap:2px">${COFFEE_SVG}<div style="font-size:7px;color:#92400e;font-weight:700">Pause</div></div>`:p.vote==='?'?`<div style="display:flex;flex-direction:column;align-items:center;gap:2px"><span style="font-family:'Playfair Display',serif;font-size:26px;color:#f59e0b;font-style:italic">?</span><div style="font-size:6px;color:#78716c;font-weight:700">Nochmal</div></div>`:`<div style="position:absolute;top:5px;left:7px;font-size:10px">${p.vote}<br>${suit}</div>${p.vote}<div style="position:absolute;bottom:5px;right:7px;font-size:10px;transform:rotate(180deg)">${p.vote}<br>${suit}</div>`;
      card=`<div style="width:60px;height:84px;border-radius:8px;border:1.5px solid #d4cdb8;background:#faf8f0;display:flex;align-items:center;justify-content:center;font-family:'DM Mono',monospace;font-size:20px;font-weight:500;color:#1a1a2e;position:relative;animation:flipIn 0.4s ease">${cardInner}</div>`;
    } else if(p.locked){
      card=`<div style="width:60px;height:84px;border-radius:8px;background:#1a1a2e;background-image:repeating-linear-gradient(45deg,rgba(255,255,255,0.025) 0px,rgba(255,255,255,0.025) 1px,transparent 1px,transparent 8px);display:flex;align-items:center;justify-content:center;position:relative"><div style="width:7px;height:7px;border-radius:50%;position:absolute;top:4px;right:4px;background:#4ade80;box-shadow:0 0 5px #4ade80"></div><span style="font-family:'Playfair Display',serif;font-size:24px;color:rgba(201,168,76,0.35)">?</span></div>`;
    } else {
      card=`<div style="width:60px;height:84px;border-radius:8px;background:rgba(255,255,255,0.025);border:1.5px dashed rgba(201,168,76,0.15);display:flex;align-items:center;justify-content:center;position:relative"><div style="width:7px;height:7px;border-radius:50%;position:absolute;top:4px;right:4px;background:rgba(255,255,255,0.2)"></div></div>`;
    }
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:8px">
      ${card}
      <div style="font-size:11px;color:rgba(232,223,200,${isMe?'0.9':'0.5'});max-width:72px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.name}</div>
      ${p.isHost?'<div style="font-size:9px;background:rgba(201,168,76,0.12);color:#c9a84c;border-radius:4px;padding:1px 5px">HOST</div>':''}
    </div>`;
  }).join('');
}

function renderClassicVote(){
  document.getElementById('classicChipRow').innerHTML=NUMBERS.map(v=>{
    const sel=String(G.myVote)===String(v);
    const label=v==='☕'?COFFEE_SVG:(v==='?'?`<span style="color:var(--gold);font-size:20px;font-family:'Playfair Display',serif">?</span>`:`${v}`);
    const title=v==='☕'?' title="Pause"':v==='?'?' title="Nochmal besprechen"':'';
    return `<div class="classic-chip${sel?' selected':''}"${title} onclick="window.classicSelectChip('${v}')">${label}</div>`;
  }).join('');
  document.getElementById('classicLockBtn').classList.toggle('hidden',G.voteLocked);
  document.getElementById('classicChangeBtn').classList.toggle('hidden',!G.voteLocked);
}
window.classicSelectChip=function(v){if(G.voteLocked)return;G.myVote=v;renderClassicVote();};

function renderClassicResults(players){
  const votes=Object.values(players).filter(p=>p.locked&&p.vote!==null);
  if(!votes.length)return;
  const groups={};
  votes.forEach(p=>{const k=String(p.vote);if(!groups[k])groups[k]={value:p.vote,names:[]};groups[k].names.push(p.name);});
  const voteLabel=v=>v==='☕'?COFFEE_SVG:v==='?'?`<span style="color:var(--gold);font-family:'Playfair Display',serif">?</span>`:v;
  document.getElementById('classicVoteBreakdown').innerHTML=Object.values(groups)
    .sort((a,b)=>(parseFloat(a.value)||0)-(parseFloat(b.value)||0))
    .map(g=>`<div class="vote-group"><div class="vote-val" style="display:flex;align-items:center;justify-content:center;min-height:32px">${voteLabel(g.value)}</div><div class="vote-cnt">${g.names.length} Vote${g.names.length!==1?'s':''}</div><div class="vote-names">${g.names.join(', ')}</div></div>`).join('');
  const nums=votes.map(p=>parseFloat(p.vote)).filter(v=>!isNaN(v));
  let avg='–',med='–';
  if(nums.length){
    const a=nums.reduce((a,b)=>a+b,0)/nums.length;
    const s=[...nums].sort((a,b)=>a-b),m=Math.floor(s.length/2);
    avg=a.toFixed(1); med=(s.length%2===0?(s[m-1]+s[m])/2:s[m]);
    med=med%1===0?String(med):med.toFixed(1);
  }
  document.getElementById('classicStatsRow').innerHTML=`
    <div class="stat-box"><div class="stat-label">Ø Durchschnitt</div><div class="stat-value">${avg}</div></div>
    <div class="stat-box"><div class="stat-label">Median</div><div class="stat-value">${med}</div></div>`;
  const max=Math.max(...Object.values(groups).map(g=>g.names.length));
  const agr=Math.round(max/votes.length*100);
  document.getElementById('classicAgreementPct').textContent=agr+'%';
  const f=document.getElementById('classicAgreementFill');
  f.style.width=agr+'%';f.className='bar-fill '+(agr>=80?'bar-high':agr>=50?'bar-mid':'bar-low');
}

// Classic listeners
document.getElementById('classicLockBtn').addEventListener('click',async()=>{
  if(G.myVote===null){toast('Bitte wählen.');return;}
  G.voteLocked=true;
  await dbUpdate(dbRef(`sessions/${G.sessionId}/players/${G.myId}`),{vote:G.myVote,locked:true});
  toast('Stimme eingelockt ✓');
});
document.getElementById('classicChangeBtn').addEventListener('click',async()=>{
  G.voteLocked=false;
  await dbUpdate(dbRef(`sessions/${G.sessionId}/players/${G.myId}`),{vote:null,locked:false});
});
document.getElementById('classicRevealBtn').addEventListener('click',async()=>{
  await dbUpdate(dbRef(`sessions/${G.sessionId}`),{revealed:true});
});
document.getElementById('classicResetBtn').addEventListener('click',async()=>{
  const n=await storyModal('Neue Runde','Story-Name:',lastSnap?.storyName||'');
  if(n===null)return;
  const name=n.trim()||lastSnap?.storyName||'Neue Story';
  const reset={};
  Object.entries(lastSnap?.players||{}).forEach(([id,p])=>{reset[id]={...p,vote:null,locked:false};});
  await dbUpdate(dbRef(`sessions/${G.sessionId}`),{storyName:name,revealed:false,players:reset});
  G.myVote=null;G.voteLocked=false;
});
document.getElementById('classicEditStoryBtn').addEventListener('click',async()=>{
  const n=await storyModal('Story ändern','Neuer Titel:',lastSnap?.storyName||'');
  if(!n||!n.trim())return;
  await dbUpdate(dbRef(`sessions/${G.sessionId}`),{storyName:n.trim()});
});
document.getElementById('classicSpectatorBtn').addEventListener('click',async()=>{
  G.spectator=!G.spectator;
  if(G.spectator){G.myVote=null;G.voteLocked=false;await dbUpdate(dbRef(`sessions/${G.sessionId}/players/${G.myId}`),{vote:null,locked:false,spectator:true});}
  else await dbUpdate(dbRef(`sessions/${G.sessionId}/players/${G.myId}`),{spectator:false});
  if(lastSnap)renderClassic(lastSnap);
});
document.getElementById('classicLeaveBtn').addEventListener('click',async()=>{
  const ok=await confirmModal('Session verlassen','Wirklich verlassen?');
  if(!ok)return; if(unsub)unsub();
  await dbRemove(dbRef(`sessions/${G.sessionId}/players/${G.myId}`));
  window.location.href=window.location.pathname;
});
document.getElementById('classicCopyBtn').addEventListener('click',()=>{
  navigator.clipboard.writeText(document.getElementById('classicInviteUrl').textContent).then(()=>{
    const b=document.getElementById('classicCopyBtn');b.textContent='✓ Kopiert!';b.classList.add('copied');
    setTimeout(()=>{b.textContent='Kopieren';b.classList.remove('copied');},2000);
  });
});

// ─────────────────────────────────────
// CASINO MODE
// ─────────────────────────────────────
document.getElementById('casinoCreateBtn').addEventListener('click',async()=>{
  const story=document.getElementById('casinoStoryInput').value.trim();
  const name=document.getElementById('casinoNameInput').value.trim();
  if(!story){toast('Bitte Story-Name.');return;} if(!name){toast('Bitte Namen.');return;}
  const btn=document.getElementById('casinoCreateBtn');btn.disabled=true;btn.textContent='Erstelle...';
  const sid=genId(),myId=genId();
  G.mode='casino';G.sessionId=sid;G.isHost=true;G.myId=myId;G.myName=name;
  await dbSet(dbRef(`sessions/${sid}`),{
    mode:'casino',storyName:story,hostId:myId,revealed:false,createdAt:Date.now(),
    players:{[myId]:{name,vote:null,locked:false,isHost:true,spectator:false,chips:START_CHIPS}}
  });
  switchToCasinoTable();
});

function switchToCasinoTable(){
  showScreen('screenCasinoTable');
  document.getElementById('casinoConnecting').classList.add('hidden');
  document.getElementById('casinoTableContent').classList.remove('hidden');
  if(G.isHost){
    const url=window.location.origin+window.location.pathname+'?s='+G.sessionId+'&m=casino';
    document.getElementById('casinoInviteUrl').textContent=url;
    document.getElementById('casinoInviteBox').classList.remove('hidden');
    document.getElementById('casinoEditStoryBtn').classList.remove('hidden');
    document.getElementById('casinoHostControls').classList.remove('hidden');
  } else {document.getElementById('casinoGuestControls').classList.remove('hidden');}
  unsub=onVal(dbRef(`sessions/${G.sessionId}`),snap=>{if(!snap.exists())return;lastSnap=snap.val();renderCasino(lastSnap);});
}

function renderCasino(data){
  document.getElementById('casinoStoryTitle').textContent=data.storyName||'–';
  const players=data.players||{},me=players[G.myId];
  if(me){G.voteLocked=me.locked||false;if(me.vote!==null&&me.vote!==undefined)G.myVote=me.vote;}
  const active=Object.values(players).filter(p=>!p.spectator);
  const voted=active.filter(p=>p.locked).length;
  document.getElementById('casinoStatus').innerHTML=`<span class="hi">${voted}</span> von ${active.length} gesetzt`;
  renderCasinoTable(players,data.revealed);
  if(!data.revealed&&!G.spectator){
    document.getElementById('casinoVoteArea').classList.remove('hidden');
    document.getElementById('casinoResultsPanel').classList.add('hidden');
    renderCasinoVote();
  } else if(data.revealed){
    document.getElementById('casinoVoteArea').classList.add('hidden');
    document.getElementById('casinoResultsPanel').classList.remove('hidden');
    renderCasinoResults(players);
  } else {
    document.getElementById('casinoVoteArea').classList.add('hidden');
    document.getElementById('casinoResultsPanel').classList.add('hidden');
  }
  if(G.isHost){
    const allVoted=active.length>0&&active.every(p=>p.locked);
    const rv=document.getElementById('casinoRevealBtn'),rs=document.getElementById('casinoResetBtn');
    if(data.revealed){rv.classList.add('hidden');rs.classList.remove('hidden');}
    else{rv.classList.remove('hidden');rs.classList.add('hidden');rv.disabled=!allVoted;}
    document.getElementById('casinoSpectatorBtn').textContent=G.spectator?'Mitspielen':'Zuschauen';
  }
}

function buildStack(color,revealed,vote,isMe){
  const has=vote!==null&&vote!==undefined;
  let frontContent;
  if(revealed&&has){
    if(vote==='☕') frontContent=`<span style="display:flex;align-items:center;justify-content:center">${COFFEE_SVG}</span>`;
    else if(vote==='?') frontContent=`<span class="cl" style="color:var(--gold);font-family:'Playfair Display',serif;font-size:18px">?</span>`;
    else frontContent=`<span class="cl${color==='#27272a'?' dk':''}">${vote}</span>`;
  } else if(isMe&&has){
    if(vote==='☕') frontContent=`<span style="display:flex;align-items:center;justify-content:center">${COFFEE_SVG}</span>`;
    else if(vote==='?') frontContent=`<span class="cl" style="color:var(--gold);font-family:'Playfair Display',serif;font-size:18px">?</span>`;
    else frontContent=`<span class="cl">${vote}</span>`;
  } else {
    frontContent=`<span class="cl" style="color:#f59e0b;font-size:15px">?</span>`;
  }
  const ciIdx=NUMBERS.findIndex(n=>String(n)===String(vote));
  const ciClass=(revealed&&has&&ciIdx!==-1)?`ci${ciIdx}`:'';
  const bg=(revealed&&has)?``:'background:#111';
  const bd=(revealed&&has)?``:'border-color:#3f3f46';
  const chip=(cls)=>`<div class="chip-disc ${cls} ${ciClass}" ${(revealed&&has)?'':`style="${bg};${bd}"`}><div class="ir"></div>${cls==='chip-front'?frontContent:''}</div>`;
  return `<div class="scattered-stack">${chip('chip-back-l')}${chip('chip-back-r')}${chip('chip-front')}</div>`;
}

function renderCasinoTable(players,revealed){
  const entries=Object.entries(players);
  const active=entries.filter(([,p])=>!p.spectator);
  const specs=entries.filter(([,p])=>p.spectator);
  let houseVal=null,winnerId=null;
  if(revealed){
    const nums=active.map(([,p])=>parseFloat(p.vote)).filter(v=>!isNaN(v));
    if(nums.length){
      houseVal=Math.round(nums.reduce((a,b)=>a+b,0)/nums.length*10)/10;
      let md=Infinity;
      active.forEach(([id,p])=>{const d=Math.abs(parseFloat(p.vote)-houseVal);if(d<md){md=d;winnerId=id;}});
    }
  }
  const houseHTML=revealed
    ?`<div class="house-card revealed" style="display:flex;align-items:center;justify-content:center"><span style="font-family:'Playfair Display',serif;font-size:32px;color:#fca5a5">${houseVal}</span></div>`
    :`<div class="house-card"><span class="q">?</span></div>`;
  const stacks=active.map(([id,p],i)=>{
    const voteIdx=NUMBERS.indexOf(p.vote);const col=STACK_COLORS[voteIdx!==-1?voteIdx:i%STACK_COLORS.length],isMe=id===G.myId,isW=id===winnerId;
    return `<div class="chip-stack-wrap">${buildStack(col,revealed,p.vote,isMe)}<div class="chip-name" style="${isW&&revealed?'color:var(--win)':''}">${p.name}</div></div>`;
  }).join('');
  document.getElementById('casinoCenterRow').innerHTML=`
    <div class="house-card-wrap">${houseHTML}<div class="house-label">The House</div></div>
    <div class="chip-stacks-row">${stacks}</div>`;

  // Avatars
  const allSeats=[...active,...specs],n=allSeats.length;
  const cont=document.getElementById('casinoAvatars'); cont.innerHTML='';
  allSeats.forEach(([id,p],i)=>{
    const isMe=id===G.myId,isW=id===winnerId,chips=p.chips||START_CHIPS;
    const xPct=n===1?50:8+(84/(n-1))*i;
    const div=document.createElement('div'); div.className='player-avatar-wrap';
    const angle = n===1 ? Math.PI/2 : Math.PI + (Math.PI * i/(n-1));
    const rx=42, ry=38;
    const cx=50, cy=50;
    const x=cx+rx*Math.cos(angle);
    const y=cy+ry*Math.sin(angle);
div.style.cssText=`left:${x}%;top:${y}%;transform:translate(-50%,-50%);position:absolute;`;
    div.innerHTML=`<div class="player-avatar${isMe?' me':''}"><span class="av-i">${p.name.slice(0,2).toUpperCase()}</span><div class="av-dot${p.locked?'':' w'}"></div></div>
      <div class="av-name">${p.name}</div>
      <div class="av-chips${isW&&revealed?' win':''}">${fmt(chips)}</div>
      ${p.isHost?'<div class="av-badge">Host</div>':''}
      ${isW&&revealed?'<div class="av-badge wb">Winner</div>':''}`;
    cont.appendChild(div);
  });
}

function renderCasinoVote(){
  document.getElementById('casinoChipsRow').innerHTML=NUMBERS.map((n,i)=>{
    const sel=String(G.myVote)===String(n);
    const label=n==='☕'?COFFEE_SVG:(n==='?'?`<span style="color:var(--gold);font-size:20px;font-family:'Playfair Display',serif">?</span>`:`<span>${n}</span>`);
    const subLabel=n==='☕'?`<span class="chip-special-label" style="color:#f5c89a">Pause</span>`:n==='?'?`<span class="chip-special-label" style="color:var(--gold)">Nochmal</span>`:'';
    const title=n==='☕'?' title="Pause"':n==='?'?' title="Nochmal besprechen"':'';
    return `<button class="poker-chip-btn ci${i}${sel?' selected':G.myVote!==null?' unsel':''}"${title} style="position:relative" onclick="window.casinoSelectChip('${n}')"><div class="dash"></div>${label}${subLabel}</button>`;
  }).join('');
  document.getElementById('casinoLockBtn').classList.toggle('hidden',G.voteLocked);
  document.getElementById('casinoChangeBtn').classList.toggle('hidden',!G.voteLocked);
}
window.casinoSelectChip=function(v){if(G.voteLocked)return;G.myVote=v;renderCasinoVote();};


function renderCasinoResults(players){
  const active=Object.values(players).filter(p=>!p.spectator&&p.locked&&p.vote!==null);
  if(!active.length)return;
  const nums=active.map(p=>parseFloat(p.vote)).filter(v=>!isNaN(v));
  const onlySpecial=nums.length===0;
  const houseVal=onlySpecial?null:Math.round(nums.reduce((a,b)=>a+b,0)/nums.length*10)/10;
  let md=Infinity;
  if(!onlySpecial) active.forEach(p=>{const n=parseFloat(p.vote);if(!isNaN(n)){const d=Math.abs(n-houseVal);if(d<md)md=d;}});
  const winners=onlySpecial?[]:active.filter(p=>!isNaN(parseFloat(p.vote))&&Math.abs(parseFloat(p.vote)-houseVal)===md);
  const houseDisplay=onlySpecial
    ?`<div style="font-size:22px;display:flex;align-items:center;gap:8px">${active.every(p=>p.vote==='☕')?COFFEE_SVG:'<span style="color:var(--gold);font-family:\'Playfair Display\',serif;font-size:28px">?</span>'}</div>`
    :`<div style="font-size:28px;color:#fca5a5;font-family:'DM Mono',monospace;font-weight:700;min-width:48px;text-align:center">${houseVal}</div>`;
  const summaryText=onlySpecial
    ?`<div style="font-size:13px;color:var(--text-muted)">Alle haben Sonderwert gewählt — kein Gewinner, keine Chips.</div>`
    :`<div style="font-size:13px;color:var(--text-muted)"><strong style="color:var(--text)">${winners.map(p=>p.name).join(' & ')}</strong> ist am nächsten <span style="color:var(--win)">+${BONUS_CHIPS} Chips</span></div>`;
  document.getElementById('casinoHouseSummary').innerHTML=`
    ${houseDisplay}
    <div><div style="font-size:9px;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:3px">The House</div>${summaryText}</div>`;
  const groups={};
  active.forEach(p=>{const k=String(p.vote);if(!groups[k])groups[k]={value:p.vote,names:[]};groups[k].names.push(p.name);});
  const cv=String(winners[0]?.vote);
  const voteLabel=v=>v==='☕'?COFFEE_SVG:v==='?'?`<span style="color:var(--gold);font-family:'Playfair Display',serif">?</span>`:v;
  document.getElementById('casinoVoteBreakdown').innerHTML=Object.values(groups)
    .sort((a,b)=>(parseFloat(a.value)||0)-(parseFloat(b.value)||0))
    .map(g=>`<div class="vote-group${String(g.value)===cv?' closest':''}"><div class="vote-val" style="display:flex;align-items:center;justify-content:center;min-height:32px">${voteLabel(g.value)}</div><div class="vote-cnt">${g.names.length} Vote${g.names.length!==1?'s':''}</div><div class="vote-names">${g.names.join(', ')}</div></div>`).join('');
  const max=Math.max(...Object.values(groups).map(g=>g.names.length));
  const agr=Math.round(max/active.length*100);
  document.getElementById('casinoAgreementPct').textContent=agr+'%';
  const f=document.getElementById('casinoAgreementFill');f.style.width=agr+'%';
  f.className='bar-fill '+(agr>=80?'bar-high':agr>=50?'bar-mid':'bar-low');
  const lb=Object.values(players).filter(p=>!p.spectator).sort((a,b)=>(b.chips||START_CHIPS)-(a.chips||START_CHIPS));
  const isW=p=>winners.some(w=>w.name===p.name);
  document.getElementById('casinoLeaderboard').innerHTML=`<div class="lb-title">Chip-Rangliste</div>
    ${lb.map((p,i)=>`<div class="lb-row${isW(p)?' lbw':''}">
      <div class="lb-rank">#${i+1}</div><div class="lb-name">${p.name}${p.isHost?' <span style="font-size:9px;color:#34d399">[host]</span>':''}</div>
      <div class="lb-chips">${fmt(p.chips||START_CHIPS)}${isW(p)?`<span class="lb-delta">+${BONUS_CHIPS}</span>`:''}</div>
    </div>`).join('')}`;
}

// Casino listeners
document.getElementById('casinoLockBtn').addEventListener('click',async()=>{
  if(G.myVote===null){toast('Bitte Chip wählen.');return;}
  G.voteLocked=true;
  await dbUpdate(dbRef(`sessions/${G.sessionId}/players/${G.myId}`),{vote:G.myVote,locked:true});
  toast('Chip gesetzt ✓');
});
document.getElementById('casinoChangeBtn').addEventListener('click',async()=>{
  G.voteLocked=false;
  await dbUpdate(dbRef(`sessions/${G.sessionId}/players/${G.myId}`),{vote:null,locked:false});
});
// NEU:
document.getElementById('casinoRevealBtn').addEventListener('click',async()=>{
  const players=lastSnap?.players||{};
  const active=Object.values(players).filter(p=>!p.spectator&&p.locked&&p.vote!==null);
  if(!active.length)return;
  const nums=active.map(p=>parseFloat(p.vote)).filter(v=>!isNaN(v));
  let wid=null;
  if(nums.length){
    const hv=nums.reduce((a,b)=>a+b,0)/nums.length;
    let md=Infinity;
    Object.entries(players).forEach(([id,p])=>{
      const n=parseFloat(p.vote);if(isNaN(n)||p.spectator||p.vote===null)return;
      const d=Math.abs(n-hv);if(d<md){md=d;wid=id;}
    });
  }
  const upd={};
  Object.entries(players).forEach(([id,p])=>{upd[id]={...p,chips:(p.chips||START_CHIPS)+(id===wid?BONUS_CHIPS:0)};});
  await dbUpdate(dbRef(`sessions/${G.sessionId}`),{revealed:true,players:upd,winnerId:wid});
  // Sonderwert-Popup
  const coffeeVoters=active.filter(p=>p.vote==='☕').map(p=>p.name);
  const questionVoters=active.filter(p=>p.vote==='?').map(p=>p.name);
  const lines=[];
  if(coffeeVoters.length) lines.push(`☕ <strong>${coffeeVoters.join(', ')}</strong> möchte${coffeeVoters.length>1?'n':''} eine Pause`);
  if(questionVoters.length) lines.push(`? <strong>${questionVoters.join(', ')}</strong> möchte${questionVoters.length>1?'n':''} nochmals besprechen`);
  if(lines.length) showSpecialVotePopup(lines);
});

function showSpecialVotePopup(lines){
  const existing=document.getElementById('specialVotePopup');
  if(existing)existing.remove();
  const bg=document.createElement('div');
  bg.id='specialVotePopup';
  bg.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:600';
  bg.innerHTML=`
    <div style="background:#0d2b1d;border:1px solid rgba(245,158,11,0.3);border-radius:20px;padding:36px 32px;max-width:400px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.8)">
      <div style="font-size:28px;margin-bottom:12px">🃏</div>
      <h2 style="font-family:'Playfair Display',serif;font-size:20px;color:var(--gold);margin-bottom:16px">Sonderwerte</h2>
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:24px">
        ${lines.map(l=>`<div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:12px 16px;font-size:14px;color:var(--text);line-height:1.5">${l}</div>`).join('')}
      </div>
      <button id="specialVoteClose" class="btn btn-gold" style="width:100%">Verstanden</button>
    </div>`;
  document.body.appendChild(bg);
  document.getElementById('specialVoteClose').addEventListener('click',()=>bg.remove());
  bg.addEventListener('click',e=>{if(e.target===bg)bg.remove();});
}
document.getElementById('casinoResetBtn').addEventListener('click',async()=>{
  const n=await storyModal('Neue Runde','Story-Name:',lastSnap?.storyName||'');
  if(n===null)return;
  const name=n.trim()||lastSnap?.storyName||'Neue Story';
  const reset={};
  Object.entries(lastSnap?.players||{}).forEach(([id,p])=>{reset[id]={...p,vote:null,locked:false};});
  await dbUpdate(dbRef(`sessions/${G.sessionId}`),{storyName:name,revealed:false,winnerId:null,players:reset});
  G.myVote=null;G.voteLocked=false;
});
document.getElementById('casinoEditStoryBtn').addEventListener('click',async()=>{
  const n=await storyModal('Story ändern','Neuer Titel:',lastSnap?.storyName||'');
  if(!n||!n.trim())return;
  await dbUpdate(dbRef(`sessions/${G.sessionId}`),{storyName:n.trim()});
});
document.getElementById('casinoSpectatorBtn').addEventListener('click',async()=>{
  G.spectator=!G.spectator;
  if(G.spectator){G.myVote=null;G.voteLocked=false;await dbUpdate(dbRef(`sessions/${G.sessionId}/players/${G.myId}`),{vote:null,locked:false,spectator:true});}
  else await dbUpdate(dbRef(`sessions/${G.sessionId}/players/${G.myId}`),{spectator:false});
  if(lastSnap)renderCasino(lastSnap);
});
document.getElementById('casinoLeaveBtn').addEventListener('click',async()=>{
  const ok=await confirmModal('Session verlassen','Wirklich verlassen?');
  if(!ok)return; if(unsub)unsub();
  await dbRemove(dbRef(`sessions/${G.sessionId}/players/${G.myId}`));
  window.location.href=window.location.pathname;
});
document.getElementById('casinoCopyBtn').addEventListener('click',()=>{
  navigator.clipboard.writeText(document.getElementById('casinoInviteUrl').textContent).then(()=>{
    const b=document.getElementById('casinoCopyBtn');b.textContent='✓ Kopiert!';b.classList.add('copied');
    setTimeout(()=>{b.textContent='Kopieren';b.classList.remove('copied');},2000);
  });
});

window.addEventListener('beforeunload',()=>{
  if(unsub)unsub();
  if(G.sessionId&&G.myId&&!G.isHost) dbRemove(dbRef(`sessions/${G.sessionId}/players/${G.myId}`));
});