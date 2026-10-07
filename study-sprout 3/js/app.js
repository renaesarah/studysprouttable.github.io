/* Study Sprout app logic */
(function(){
const DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const START_H=6, SLOTS=34; // 6:00 am to 11:00 pm in 30-minute slots
const COLORS=[
  {bg:'#c9d3c5',ink:'#33402f'},{bg:'#e8c9bf',ink:'#5e3329'},{bg:'#ecd7ac',ink:'#4f3b12'},
  {bg:'#d6cfe0',ink:'#3f3556'},{bg:'#c4d4d6',ink:'#26403f'},{bg:'#d9bfa6',ink:'#4d3420'},
  {bg:'#d3d1aa',ink:'#42401b'},{bg:'#b3bcae',ink:'#2c3329'}
];
const THEMES={"main": {"name": "Main theme", "st": [{"bg": "#c9d3c5", "ink": "#33402f"}, {"bg": "#e8c9bf", "ink": "#5e3329"}, {"bg": "#ecd7ac", "ink": "#4f3b12"}, {"bg": "#d6cfe0", "ink": "#3f3556"}, {"bg": "#c4d4d6", "ink": "#26403f"}, {"bg": "#d9bfa6", "ink": "#4d3420"}, {"bg": "#d3d1aa", "ink": "#42401b"}, {"bg": "#b3bcae", "ink": "#2c3329"}]}, "spring": {"name": "Spring", "st": [{"bg": "#fcd894", "ink": "#5a4410"}, {"bg": "#f9dad7", "ink": "#6a3a35"}, {"bg": "#cdd8c2", "ink": "#2e3a29"}, {"bg": "#deeaf6", "ink": "#2c4460"}, {"bg": "#ece8dc", "ink": "#4a4536"}, {"bg": "#fbe3c0", "ink": "#5e4220"}, {"bg": "#e6def0", "ink": "#463a5c"}, {"bg": "#d5e8de", "ink": "#284634"}]}, "fall": {"name": "Fall", "st": [{"bg": "#f1c9a8", "ink": "#6b2f0e"}, {"bg": "#e7c1bd", "ink": "#5c2420"}, {"bg": "#efd9a3", "ink": "#4f3808"}, {"bg": "#dcc8b3", "ink": "#43301d"}, {"bg": "#ddd5aa", "ink": "#43380f"}, {"bg": "#eab8a0", "ink": "#5e2a14"}, {"bg": "#cfcfa8", "ink": "#3d3d1a"}, {"bg": "#e2d2c4", "ink": "#4a382a"}]}, "winter": {"name": "Winter", "st": [{"bg": "#cfe3ee", "ink": "#1d4a5e"}, {"bg": "#dcebf0", "ink": "#24414c"}, {"bg": "#ead9e3", "ink": "#4a3344"}, {"bg": "#dcd6ea", "ink": "#3b3456"}, {"bg": "#cfe6e6", "ink": "#1f4646"}, {"bg": "#f3e6cf", "ink": "#55431f"}, {"bg": "#f2dade", "ink": "#5a2f3a"}, {"bg": "#d5dde4", "ink": "#2e3c48"}]}, "summer": {"name": "Summer", "st": [{"bg": "#8fdcd6", "ink": "#0f3b3a"}, {"bg": "#ffa898", "ink": "#5c140a"}, {"bg": "#ffd77a", "ink": "#4a3200"}, {"bg": "#9fdcf2", "ink": "#0c3a50"}, {"bg": "#ffc2b8", "ink": "#6a1f15"}, {"bg": "#7fd0d6", "ink": "#0c3a40"}, {"bg": "#fff09a", "ink": "#4a3f00"}, {"bg": "#ffc79a", "ink": "#5a2a08"}]}};
const THEME_MSG={main:'Main theme.',spring:'Spring theme on.',fall:'Fall theme on.',winter:'Winter theme on.',summer:'Summer theme on.'};
const themeColor=i=>{const t=THEMES[state.theme]||THEMES.main;return t.st[((i%8)+8)%8]};
const pal=o=>o&&o.ci!=null?themeColor(o.ci):{bg:(o&&o.bg)||'#e7d8c9',ink:(o&&o.ink)||'#42362a'};
const DIFF_W={easy:1,medium:1.25,hard:1.5};
const KEY='study-sprout-v1';
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const toISO=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const fromISO=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const dow=d=>(d.getDay()+6)%7;
function fmtTime(min){let h=Math.floor(min/60)%24,m=min%60;const ap=h<12?'am':'pm';h=h%12||12;return `${h}:${pad(m)} ${ap}`}
const slotMin=i=>START_H*60+i*30;
const uid=()=>Math.random().toString(36).slice(2,9);

function defaults(){return{
  avail:[{},{},{},{},{},{},{}], subjects:[], colorIdx:0,
  settings:{start:toISO(new Date()),weeks:2,sessionMin:60,maxHours:4,breaks:true,revision:true},
  plan:null, week:0, done:{}, step:0
}}
let state=defaults();
try{const raw=localStorage.getItem(KEY);if(raw){const s=JSON.parse(raw);state=Object.assign(defaults(),s);state.settings=Object.assign(defaults().settings,s.settings||{});}}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}}

/* ---------- pages ---------- */
const PAGES=['today','week','subjects','timetable','how','print'];
const PAGE_TITLES={today:'Today',week:'My week',subjects:'My subjects',timetable:'My timetable',how:'How to use',print:'Printable timetable'};
function showPage(){
  let pg=location.hash.replace('#','');
  if(!PAGES.includes(pg)) pg=!state.visited?'how':(state.plan?'today':'week');
  state.visited=true;state.page=pg;save();
  document.querySelectorAll('[data-page-section]').forEach(s=>{s.hidden=s.dataset.pageSection!==pg});
  document.querySelectorAll('#pages a').forEach(a=>{
    if(a.dataset.page===pg) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
  });
  document.title=`${PAGE_TITLES[pg]} — Study Sprout`;
  if(pg==='timetable'){syncSettings();renderPlan()}
  if(pg==='today') renderToday();
  if(pg==='print') renderPrint();
  if(pg==='subjects') renderSubjects();
  if(carryId&&pg!=='timetable') carryId=null;
  window.scrollTo(0,0);
}
window.addEventListener('hashchange',showPage);

/* ---------- availability grid ---------- */
const grid=$('#avail');
function buildGrid(){
  let h='<div class="dh" aria-hidden="true"></div>'+DAYS.map(d=>`<div class="dh">${d}</div>`).join('');
  for(let i=0;i<SLOTS;i++){
    h+=`<div class="tl">${i%2===0?fmtTime(slotMin(i)).replace(':00',''):''}</div>`;
    for(let d=0;d<7;d++) h+=`<button type="button" class="cell${i%2===1?' hr':''}" data-d="${d}" data-i="${i}" aria-label="${DAYS[d]} ${fmtTime(slotMin(i))}"></button>`;
  }
  grid.innerHTML=h;
}
function paintGrid(){
  let free=0;
  grid.querySelectorAll('.cell').forEach(c=>{
    const d=+c.dataset.d,i=+c.dataset.i,v=state.avail[d][i],prev=state.avail[d][i-1];
    c.classList.toggle('free',v?.t==='free');c.classList.toggle('busy',v?.t==='busy');
    if(v?.t==='free')free++;
    const showLabel=v?.t==='busy'&&!(prev?.t==='busy'&&prev.label===v.label);
    c.textContent=showLabel?(v.label||'Busy'):'';
    c.setAttribute('aria-pressed',v?'true':'false');
    c.title=v?(v.t==='free'?'Free':(v.label||'Busy')):'';
  });
  $('#tally').textContent=`${free/2} free hours a week`;
}
const brush=()=>document.querySelector('input[name=brush]:checked').value;
const busyLabel=()=>$('#busyLabel').value.trim()||'Busy';
document.querySelectorAll('input[name=brush]').forEach(r=>r.addEventListener('change',()=>{$('#busyLabel').hidden=brush()!=='busy'}));
let painting=null;
function applyCell(d,i){
  if(painting.mode==='erase') delete state.avail[d][i];
  else state.avail[d][i]=painting.brush==='busy'?{t:'busy',label:painting.label}:{t:'free'};
}
function startPaint(d,i){
  const b=brush(),cur=state.avail[d][i],lab=busyLabel();
  const same=cur&&cur.t===b&&(b!=='busy'||cur.label===lab);
  painting={brush:b,label:lab,mode:(b==='erase'||same)?'erase':'set'};
  applyCell(d,i);paintGrid();
}
grid.addEventListener('pointerdown',e=>{
  const c=e.target.closest('.cell');if(!c)return;
  e.preventDefault();startPaint(+c.dataset.d,+c.dataset.i);
});
window.addEventListener('pointermove',e=>{
  if(!painting)return;
  const el=document.elementFromPoint(e.clientX,e.clientY);const c=el&&el.closest&&el.closest('.cell');
  if(!c)return;applyCell(+c.dataset.d,+c.dataset.i);paintGrid();
});
window.addEventListener('pointerup',()=>{if(painting){painting=null;save();}});
grid.addEventListener('click',e=>{ // keyboard activation only
  const c=e.target.closest('.cell');if(!c||e.detail!==0)return;
  startPaint(+c.dataset.d,+c.dataset.i);painting=null;save();
});
$('#copyMon').addEventListener('click',()=>{for(let d=1;d<5;d++)state.avail[d]=JSON.parse(JSON.stringify(state.avail[0]));paintGrid();save()});
let clearArmed=null;
$('#clearWeek').addEventListener('click',e=>{
  const b=e.currentTarget;
  if(!clearArmed){b.textContent='Tap again to clear';clearArmed=setTimeout(()=>{b.textContent='Clear grid';clearArmed=null},3000);return}
  clearTimeout(clearArmed);clearArmed=null;b.textContent='Clear grid';
  state.avail=[{},{},{},{},{},{},{}];paintGrid();save();
});
const slotOf=(h,m=0)=>((h-START_H)*60+m)/30;
function fill(d,from,to,v){for(let i=from;i<to;i++)state.avail[d][i]=Object.assign({},v)}
$('#sampleWeek').addEventListener('click',()=>{
  state.avail=[{},{},{},{},{},{},{}];
  for(let d=0;d<5;d++){
    fill(d,slotOf(7,30),slotOf(14,30),{t:'busy',label:'School'});
    fill(d,slotOf(16),slotOf(18),{t:'free'});
    fill(d,slotOf(18),slotOf(19),{t:'busy',label:'Dinner'});
    fill(d,slotOf(19),slotOf(21,30),{t:'free'});
  }
  fill(2,slotOf(16),slotOf(17,30),{t:'busy',label:'Swim practice'});
  fill(5,slotOf(9),slotOf(11),{t:'busy',label:'Football'});
  fill(5,slotOf(11,30),slotOf(13,30),{t:'free'});
  fill(5,slotOf(15),slotOf(18),{t:'free'});
  fill(6,slotOf(10),slotOf(13),{t:'busy',label:'Family time'});
  fill(6,slotOf(16),slotOf(19),{t:'free'});
  paintGrid();save();
});

/* ---------- subjects ---------- */
const subWrap=$('#subjects');
function addSubject(name,extra){
  const c=state.colorIdx%COLORS.length;state.colorIdx++;
  state.subjects.push(Object.assign({id:uid(),name,color:c,diff:'medium',exam:'',portions:[],favs:[]},extra||{}));
}
function renderSubjects(){
  if(!state.subjects.length){
    subWrap.innerHTML=`<div class="empty" style="margin-top:18px"><svg class="dd c2 empty-dd" style="" aria-hidden="true" viewBox="0 0 64 64"><use href="#dd-books"/></svg><p>No subjects yet. Type one above, or start from an example.</p><button class="btn ghost small" id="sampleSubs">Add sample subjects</button></div>`;
    $('#sampleSubs').addEventListener('click',sampleSubjects);return;
  }
  subWrap.innerHTML='<div class="subjects">'+state.subjects.map(s=>{
    const col=themeColor(s.color);
    const total=s.portions.reduce((a,p)=>a+p.hours,0);
    return `<article class="subj" data-id="${s.id}">
      <div class="subj-head">
        <button class="blob" data-act="color" style="background:${col.bg}" aria-label="Change colour for ${esc(s.name)}" title="Change colour"></button>
        <input class="subj-name" data-f="name" value="${esc(s.name)}" aria-label="Subject name">
        <button class="x" data-act="remove" aria-label="Remove ${esc(s.name)}">×</button>
      </div>
      <div class="subj-meta">
        <div class="labelled">How hard?
          <div class="seg" role="radiogroup" aria-label="Difficulty">
            ${['easy','medium','hard'].map(v=>`<label><input type="radio" name="diff-${s.id}" value="${v}" data-f="diff" ${s.diff===v?'checked':''}>${v[0].toUpperCase()+v.slice(1)}</label>`).join('')}
          </div>
        </div>
        <label class="labelled">Exam date (optional)<input type="date" class="field" data-f="exam" value="${s.exam}"></label>
      </div>
      <div class="labelled">Portions ${s.portions.length?`<span style="font-weight:400;color:var(--ink-soft)">${total} hours in total</span>`:''}</div>
      ${s.portions.length?`<ul class="chips">${s.portions.map((p,k)=>`<li class="chip" style="background:${col.bg};color:${col.ink}">${esc(p.name)} <small>${p.hours} h</small><button class="x" data-act="rmp" data-p="${k}" aria-label="Remove ${esc(p.name)}">×</button></li>`).join('')}</ul>`:`<p style="margin:4px 0 10px;font-size:.9rem;color:var(--ink-soft)">Add the chapters or topics you need to cover.</p>`}
      <div class="add-portion">
        <input class="field" data-f="pname" placeholder="e.g. Chapter 4: Waves" aria-label="Portion name">
        <select class="field" data-f="phours" aria-label="Hours needed">
          ${[0.5,1,1.5,2,3,4,5,6,8].map(h=>`<option value="${h}" ${h===2?'selected':''}>${h} h</option>`).join('')}
        </select>
        <button class="btn small" data-act="addp">Add</button>
      </div>
      <div class="labelled fav-label">Favourite times</div>
      ${(s.favs||[]).length?`<ul class="chips">${s.favs.map((f,k)=>{const ok=favFree(f);return `<li class="chip fav-chip${ok?'':' off'}">${DD('heart')} ${DAYS[f.d]} ${fmtTime(slotMin(f.s))}${ok?'':' <small>not free in My week</small>'}<button class="x" data-act="rmfav" data-p="${k}" aria-label="Remove favourite time">×</button></li>`}).join('')}</ul>`:''}
      <div class="add-fav">
        <select class="field" data-f="fd" aria-label="Favourite day">${DAYS.map((d,i)=>`<option value="${i}">${d}</option>`).join('')}</select>
        <select class="field" data-f="fs" aria-label="Favourite start time">${Array.from({length:SLOTS},(_,i)=>`<option value="${i}" ${i===20?'selected':''}>${fmtTime(slotMin(i))}</option>`).join('')}</select>
        <button class="btn small ghost" data-act="addfav">Add</button>
      </div>
    </article>`}).join('')+'</div>';
}
function favFree(f){const L=state.settings.sessionMin/30;for(let q=f.s;q<f.s+L;q++){if(q>=SLOTS||state.avail[f.d][q]?.t!=='free')return false}return true}
const DD=(n,c='')=>`<svg class="dd ${c}" aria-hidden="true" viewBox="0 0 64 64"><use href="#dd-${n}"/></svg>`;
const findSub=el=>{const card=el.closest('.subj');return card&&state.subjects.find(s=>s.id===card.dataset.id)};
function addPortion(card){
  const s=findSub(card);const n=card.querySelector('[data-f=pname]');const name=n.value.trim();
  if(!name){n.focus();return}
  s.portions.push({name,hours:+card.querySelector('[data-f=phours]').value});save();renderSubjects();
  const again=subWrap.querySelector(`.subj[data-id="${s.id}"] [data-f=pname]`);again&&again.focus();
}
subWrap.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;const s=findSub(b);if(!s)return;
  const a=b.dataset.act;
  if(a==='color'){s.color=(s.color+1)%COLORS.length}
  else if(a==='remove'){state.subjects=state.subjects.filter(x=>x!==s)}
  else if(a==='rmp'){s.portions.splice(+b.dataset.p,1)}
  else if(a==='addp'){addPortion(b.closest('.subj'));return}
  else if(a==='addfav'){const card=b.closest('.subj');const f={d:+card.querySelector('[data-f=fd]').value,s:+card.querySelector('[data-f=fs]').value};s.favs=s.favs||[];if(!s.favs.some(x=>x.d===f.d&&x.s===f.s))s.favs.push(f);s.favs.sort((x,y)=>x.d-y.d||x.s-y.s)}
  else if(a==='rmfav'){s.favs.splice(+b.dataset.p,1)}
  save();renderSubjects();
});
subWrap.addEventListener('input',e=>{const s=findSub(e.target);if(s&&e.target.dataset.f==='name'){s.name=e.target.value;save()}});
subWrap.addEventListener('change',e=>{
  const s=findSub(e.target);if(!s)return;const f=e.target.dataset.f;
  if(f==='diff')s.diff=e.target.value;
  else if(f==='exam')s.exam=e.target.value;
  else return; save();
});
subWrap.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.dataset.f==='pname'){e.preventDefault();addPortion(e.target.closest('.subj'))}});
function addFromInput(){const i=$('#newSubject');const v=i.value.trim();if(!v){i.focus();return}addSubject(v);i.value='';save();renderSubjects()}
$('#addSubject').addEventListener('click',addFromInput);
$('#newSubject').addEventListener('keydown',e=>{if(e.key==='Enter')addFromInput()});
function sampleSubjects(){
  const t=fromISO(state.settings.start||toISO(new Date()));
  const P=a=>a.map(([name,hours])=>({name,hours}));
  addSubject('Maths',{diff:'medium',favs:[{d:5,s:11}],exam:toISO(addDays(t,9)),portions:P([['Algebra',2],['Quadratics',2],['Trigonometry',3],['Probability',1.5]])});
  addSubject('Physics',{diff:'hard',exam:toISO(addDays(t,12)),portions:P([['Motion',2],['Forces',2],['Energy',3],['Waves',2]])});
  addSubject('Literature',{diff:'medium',exam:toISO(addDays(t,15)),portions:P([['Poetry anthology',2],['Macbeth Acts 1–2',2],['Macbeth Acts 3–5',3],['Essay practice',1.5]])});
  addSubject('Geography',{diff:'easy',portions:P([['Rivers',1.5],['Coasts',1.5],['Population',1]])});
  save();renderSubjects();
}

/* ---------- settings ---------- */
function syncSettings(){
  const s=state.settings;
  $('#setStart').value=s.start;$('#setWeeks').value=s.weeks;$('#setSession').value=s.sessionMin;
  $('#setMax').value=s.maxHours;$('#setBreaks').checked=s.breaks;$('#setRevision').checked=s.revision;
}
[['#setStart','start',v=>v],['#setWeeks','weeks',Number],['#setSession','sessionMin',Number],['#setMax','maxHours',Number]].forEach(([sel,k,f])=>{
  $(sel).addEventListener('change',e=>{state.settings[k]=f(e.target.value);save()});
});
$('#setBreaks').addEventListener('change',e=>{state.settings.breaks=e.target.checked;save()});
$('#setRevision').addEventListener('change',e=>{state.settings.revision=e.target.checked;save()});

/* ---------- the planner ---------- */
const DAY_FULL=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const MONTH_FULL=['January','February','March','April','May','June','July','August','September','October','November','December'];
let carryId=null;

function generate(){
  const s=state.settings,L=s.sessionMin/30,maxSlots=s.maxHours*2;
  if(!s.start) return {error:'Pick a start date for your plan.'};
  const free=state.avail.some(d=>Object.values(d).some(v=>v.t==='free'));
  if(!free) return {error:'Your week has no free time yet. Paint the hours you can study on My week.'};
  const subs=state.subjects.filter(x=>x.portions.length);
  if(!subs.length) return {error:'Add at least one subject with a portion to study on My subjects.'};

  const favRules=[];subs.forEach(sub=>(sub.favs||[]).forEach(f=>favRules.push({sid:sub.id,d:f.d,s:f.s})));
  const start=fromISO(s.start),days=s.weeks*7,sessions=[];
  for(let k=0;k<days;k++){
    const date=addDays(start,k),iso=toISO(date),wd=dow(date),av=state.avail[wd];
    const occ=new Array(SLOTS+1).fill(false),day=[];let used=0;
    const isFree=i=>i>=0&&i<SLOTS&&av[i]?.t==='free'&&!occ[i];
    const take=(p,fav)=>{
      day.push({date:iso,s:p,len:L,fav});used+=L;
      for(let q=p;q<p+L;q++)occ[q]=true;
      if(s.breaks){if(p+L<SLOTS)occ[p+L]=true;if(p>0)occ[p-1]=true}
    };
    favRules.filter(r=>r.d===wd).sort((a,b)=>a.s-b.s).forEach(r=>{
      if(used+L>maxSlots)return;
      for(let q=r.s;q<r.s+L;q++)if(!isFree(q))return;
      take(r.s,r.sid);
    });
    let i=0;
    while(i<SLOTS){
      if(isFree(i)){
        let j=i;while(j<SLOTS&&isFree(j))j++;
        let p=i;while(p+L<=j&&used+L<=maxSlots){take(p,null);p+=L+(s.breaks?1:0)}
        i=j;
      }else i++;
    }
    day.sort((a,b)=>a.s-b.s);sessions.push(...day);
  }
  if(!sessions.length) return {error:`None of your free stretches is long enough for a ${s.sessionMin}-minute session. Try a shorter session length.`};

  const work=subs.map(sub=>{
    const queue=[];
    sub.portions.forEach(p=>{const n=Math.max(1,Math.round(p.hours*60/s.sessionMin));for(let k=1;k<=n;k++)queue.push(n>1?`${p.name} (part ${k} of ${n})`:p.name)});
    let cutoff=sessions.length;
    if(sub.exam){const idx=sessions.findIndex(x=>x.date>=sub.exam);cutoff=idx===-1?sessions.length:idx}
    return {sub,queue,cutoff,rev:0};
  });
  const revLabel=w=>w.sub.exam?'Revision before the exam':'Revision and practice';

  let prev=null;const planned=[];
  sessions.forEach((ss,i)=>{
    const sameDayPrev=prev&&prev.date===ss.date?prev.sid:null;
    let item=null;
    if(ss.fav){
      const w=work.find(w=>w.sub.id===ss.fav);
      if(w&&i<w.cutoff){
        if(w.queue.length)item={kind:'study',label:w.queue.shift(),w,fav:true};
        else if(s.revision){w.rev++;item={kind:'rev',label:revLabel(w),w,fav:true}}
      }
    }
    if(!item){
      let best=null,bestScore=-1;
      work.forEach(w=>{
        if(!w.queue.length||i>=w.cutoff)return;
        let sc=w.queue.length/(w.cutoff-i)*DIFF_W[w.sub.diff];
        if(w.sub.id===sameDayPrev)sc*=0.55;
        if(sc>bestScore){bestScore=sc;best=w}
      });
      if(best)item={kind:'study',label:best.queue.shift(),w:best};
      else if(s.revision){
        work.forEach(w=>{
          if(i>=w.cutoff)return;
          let sc=(1/(w.cutoff-i))*DIFF_W[w.sub.diff]/(1+w.rev);
          if(w.sub.id===sameDayPrev)sc*=0.4;
          if(sc>bestScore){bestScore=sc;best=w}
        });
        if(best){best.rev++;item={kind:'rev',label:revLabel(best),w:best}}
      }
    }
    if(item){
      planned.push({id:uid(),date:ss.date,s:ss.s,len:ss.len,kind:item.kind,label:item.label,sid:item.w.sub.id,name:item.w.sub.name,ci:item.w.sub.color,fav:!!item.fav,done:false});
      prev={date:ss.date,sid:item.w.sub.id};
    }
  });

  return {plan:{
    start:s.start,weeks:s.weeks,end:toISO(addDays(start,days-1)),maxSlots,sessions:planned,
    unscheduled:work.filter(w=>w.queue.length).map(w=>({name:w.sub.name,n:w.queue.length,exam:w.sub.exam})),
    pastExams:subs.filter(x=>x.exam&&x.exam<=s.start).map(x=>x.name),
    exams:subs.filter(x=>x.exam).map(x=>({date:x.exam,name:x.name,sid:x.id})),
    subjects:work.map(w=>({id:w.sub.id,name:w.sub.name,ci:w.sub.color}))
  }};
}

/* migrate plans saved by the earlier version */
(function migrate(){
  const p=state.plan;if(!p)return;
  if(!p.end)p.end=toISO(addDays(fromISO(p.start),p.weeks*7-1));
  if(!p.maxSlots)p.maxSlots=state.settings.maxHours*2;
  p.sessions.forEach(x=>{
    if(!x.id){x.id=uid();x.done=!!(state.done&&state.done[`${x.date}|${x.s}|${x.sid}|${x.label}`])}
  });
  p.exams.forEach(e=>{if(!e.sid){const sb=p.subjects.find(s=>s.name===e.name);if(sb)e.sid=sb.id}});
  [...p.sessions,...p.subjects].forEach(o=>{if(o.ci==null&&o.bg){const i=COLORS.findIndex(c=>c.bg===o.bg);if(i>=0)o.ci=i}});
  delete state.done;
})();

$('#grow').addEventListener('click',()=>{
  const r=generate(),err=$('#growError');
  if(r.error){err.textContent=r.error;err.hidden=false;return}
  err.hidden=true;
  const old=state.plan?state.plan.sessions:[];
  const doneSet=new Set(old.filter(x=>x.done).map(x=>`${x.date}|${x.s}|${x.sid}|${x.label}`));
  r.plan.sessions.forEach(x=>{if(doneSet.has(`${x.date}|${x.s}|${x.sid}|${x.label}`))x.done=true});
  state.plan=r.plan;state.week=0;carryId=null;save();renderPlan();
  const sp=$('#sprout');sp.classList.remove('wiggle');void sp.offsetWidth;sp.classList.add('grown','wiggle');
  const sw=document.querySelector('.sprout-wrap');sw.classList.remove('burst');void sw.offsetWidth;sw.classList.add('burst');
  toast('Your timetable has been created!');
  $('#result').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
});

/* ---------- helpers ---------- */
const res=$('#result');
function fmtShort(d){return `${d.getDate()} ${MONTHS[d.getMonth()]}`}
const dayLabel=iso=>{const d=fromISO(iso);return `${DAYS[dow(d)]} ${fmtShort(d)}`};
const endMin=x=>slotMin(x.s+x.len);
const fmtDur=len=>len===1?'30-minute':len%2===0?`${len/2}-hour`:`${len/2}-hour`;
function nowInfo(){const n=new Date();return{iso:toISO(n),min:n.getHours()*60+n.getMinutes()}}
const daysUntil=iso=>Math.round((fromISO(iso)-fromISO(nowInfo().iso))/864e5);
const getSess=id=>state.plan&&state.plan.sessions.find(x=>x.id===id);
const baseLabel=l=>l.replace(/ \(part \d+ of \d+\)$/,'');
function isMissed(x){if(x.done)return false;const n=nowInfo();return x.date<n.iso||(x.date===n.iso&&endMin(x)<=n.min)}
function examOf(sid){const e=state.plan.exams.find(e=>e.sid===sid);return e?e.date:''}
const sessionsOn=(iso,exceptId)=>state.plan.sessions.filter(x=>x.date===iso&&x.id!==exceptId);
function busyRuns(av){
  const runs=[];let i=0;
  while(i<SLOTS){const v=av[i];if(v?.t==='busy'){let j=i;while(j<SLOTS&&av[j]?.t==='busy'&&av[j].label===v.label)j++;runs.push({s:i,e:j,label:v.label||'Busy'});i=j}else i++}
  return runs;
}
function fitsAt(x,iso,s){
  const av=state.avail[dow(fromISO(iso))];
  if(s<0||s+x.len>SLOTS)return false;
  for(let q=s;q<s+x.len;q++)if(av[q]?.t!=='free')return false;
  return !sessionsOn(iso,x.id).some(o=>s<o.s+o.len&&o.s<s+x.len);
}
function findSlot(x,{from,to,respectMax,afterMin}){
  const exam=examOf(x.sid);
  for(let d=fromISO(from);toISO(d)<=to;d=addDays(d,1)){
    const iso=toISO(d);
    if(exam&&iso>=exam)break;
    if(respectMax&&sessionsOn(iso,x.id).reduce((a,o)=>a+o.len,0)+x.len>state.plan.maxSlots)continue;
    for(let s=0;s+x.len<=SLOTS;s++){
      if(iso===from&&afterMin!=null&&slotMin(s)<afterMin)continue;
      if(fitsAt(x,iso,s))return{date:iso,s};
    }
  }
  return null;
}

/* ---------- actions ---------- */
function rescue(x){
  const n=nowInfo(),p=state.plan,o={from:n.iso,to:p.end,afterMin:n.min};
  const slot=findSlot(x,{...o,respectMax:true})||findSlot(x,{...o,respectMax:false});
  if(!slot)return{ok:false,msg:examOf(x.sid)?`No free time is left before the ${x.name} exam. Paint more free time on My week.`:'No free time is left in this plan. Paint more free time or grow a longer plan.'};
  x.date=slot.date;x.s=slot.s;x.rescued=true;
  return{ok:true,msg:`Rescheduled! ${x.name} is now ${dayLabel(slot.date)} at ${fmtTime(slotMin(slot.s))}.`};
}
function rescueAll(){
  const list=state.plan.sessions.filter(isMissed).sort((a,b)=>a.date.localeCompare(b.date)||a.s-b.s);
  let ok=0;list.forEach(x=>{if(rescue(x).ok)ok++});
  const fail=list.length-ok;
  return{msg:fail?`Rescheduled ${ok} of ${list.length}. The rest had no free time before their exam.`:`Rescued all ${ok}! Fresh start.`};
}
function moveToDay(x,iso){
  const exam=examOf(x.sid);
  if(exam&&iso>=exam)return{msg:`That's on or after the ${x.name} exam, so it can't go there.`};
  if(iso===x.date)return{msg:null};
  const slot=findSlot(x,{from:iso,to:iso,respectMax:false});
  if(!slot)return{msg:`${DAY_FULL[dow(fromISO(iso))]} has no free ${fmtDur(x.len)} gap left. Paint more free time on My week.`};
  x.date=slot.date;x.s=slot.s;
  return{msg:`Moved to ${dayLabel(iso)} at ${fmtTime(slotMin(slot.s))}.`};
}
function swap(x,y){
  const ex=examOf(x.sid),ey=examOf(y.sid);
  if(ex&&y.date>=ex)return{msg:`That would put ${x.name} on or after its exam.`};
  if(ey&&x.date>=ey)return{msg:`That would put ${y.name} on or after its exam.`};
  if(x.len!==y.len)return{msg:'Those sessions are different lengths, so they can\'t swap.'};
  [x.date,y.date]=[y.date,x.date];[x.s,y.s]=[y.s,x.s];
  return{msg:`Swapped ${x.name} and ${y.name}.`};
}
function dropOn(id,el){
  const x=getSess(id);if(!x)return{msg:null};
  if(el.classList.contains('sticker'))return swap(x,getSess(el.dataset.id));
  return moveToDay(x,el.dataset.date);
}
function after(r){if(r&&r.msg)toast(r.msg);save();refresh()}
function refresh(){renderPlan();renderToday()}

/* ---------- encouragement ---------- */
let toastT;
function toast(msg){
  const t=$('#toast');t.innerHTML=DD('sparkle')+`<span>${esc(msg)}</span>`;
  t.classList.remove('show');void t.offsetWidth;t.classList.add('show');
  clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),3400);
}
const GENERAL_NOTES=['One sesion at a time. That\'s the whole trick.','Future you is already saying thank you.','Tiny progress is still progress.','Water, a stretch, then the next session. Brains are plants too.','You don\'t have to be perfect, just consistent.','Hard topics get easier the second time around.'];
function cheerNote(){
  const p=state.plan;if(!p)return 'Every big plan starts with one small session.';
  const n=nowInfo(),specific=[];
  const todays=p.sessions.filter(x=>x.date===n.iso);
  if(todays.length&&todays.every(x=>x.done))specific.push('Everything for today is done. Go do something fun!');
  p.subjects.forEach(sb=>{
    const st=p.sessions.filter(x=>x.sid===sb.id&&x.kind==='study');if(!st.length)return;
    const r=st.filter(x=>x.done).length/st.length;
    if(r===1)specific.push(`All of ${sb.name} is covered. Revision from here.`);
    else if(r>=.5)specific.push(`Over halfway through ${sb.name}!`);
  });
  const groups={};
  p.sessions.filter(x=>x.kind==='study').forEach(x=>{const k=x.sid+'|'+baseLabel(x.label);(groups[k]=groups[k]||{name:baseLabel(x.label),all:[]}).all.push(x)});
  Object.values(groups).forEach(g=>{if(g.all.every(x=>x.done))specific.push(`${g.name} is finished. One less thing to carry.`)});
  p.exams.forEach(e=>{const dd=daysUntil(e.date);if(dd>=1&&dd<=3)specific.push(`${e.name} exam in ${dd} day${dd>1?'s':''}. You've prepared for this.`)});
  const pool=specific.length?specific:GENERAL_NOTES;
  const seed=[...n.iso].reduce((a,c)=>a+c.charCodeAt(0),0);
  return pool[seed%pool.length];
}
function doneCheer(x){
  const p=state.plan,n=nowInfo();
  const subj=p.sessions.filter(o=>o.sid===x.sid&&o.kind==='study');
  const group=subj.filter(o=>baseLabel(o.label)===baseLabel(x.label));
  if(x.kind==='study'&&subj.every(o=>o.done))return `That's all of ${x.name}! Amazing.`;
  if(x.kind==='study'&&group.every(o=>o.done))return `You finished ${baseLabel(x.label)}!`;
  if(x.date===n.iso&&p.sessions.filter(o=>o.date===n.iso).every(o=>o.done))return 'That\'s everything for today!';
  const r=['One more down!','Nice work!','Keep going.','Look at you go.','Your future self says thanks.'];
  return r[Math.floor(Math.random()*r.length)];
}
const noteHTML=()=>`<aside class="note">${DD('heart')}${esc(cheerNote())}</aside>`;
function countdownHTML(){
  const p=state.plan;if(!p)return'';
  const list=p.exams.map(e=>({...e,dd:daysUntil(e.date)})).filter(e=>e.dd>=0).sort((a,b)=>a.dd-b.dd);
  if(!list.length)return'';
  return `<div class="countdowns">${list.map(e=>{
    const sb=pal(p.subjects.find(s=>s.id===e.sid));
    const st=p.sessions.filter(x=>x.sid===e.sid),d=st.filter(x=>x.done).length;
    const big=e.dd===0?'Today':e.dd,unit=e.dd===0?'good luck!':e.dd===1?'day to go':'days to go';
    return `<div class="count" style="--cbg:${sb.bg};--cink:${sb.ink}"><div class="count-top">${esc(e.name)} exam</div><div class="count-num">${big}</div><div class="count-unit">${unit}</div><div class="count-foot">${d} of ${st.length} sessions done</div></div>`;
  }).join('')}</div>`;
}
function missedBannerHTML(){
  const m=state.plan.sessions.filter(isMissed).length;if(!m)return'';
  return `<div class="missed-banner"><span>${m} session${m>1?'s were':' was'} missed.</span><button class="btn small rescue-all">Rescue ${m>1?'all':'it'}</button></div>`;
}

/* ---------- stickers ---------- */
function stickerHTML(x,o={}){
  const missed=isMissed(x);
  return `<div class="sticker${x.kind==='rev'?' rev':''}${x.done?' is-done':''}${carryId===x.id?' lifted':''}" data-id="${x.id}" style="background-color:${pal(x).bg};color:${pal(x).ink};--tilt:${o.tilt||0}deg">
    ${o.grip?`<button type="button" class="grip" data-move="${x.id}" aria-label="Move ${esc(x.name)}: ${esc(x.label)}" title="Drag to move">${DD('grip')}</button>`:''}
    <div class="t">${fmtTime(slotMin(x.s))} – ${fmtTime(endMin(x))}${x.fav?` <svg class="dd fav-ic" viewBox="0 0 64 64" role="img" aria-label="Favourite time"><use href="#dd-heart"/></svg>`:''}</div>
    <div class="s">${esc(x.name)}</div><div class="p">${esc(x.label)}</div>
    ${missed?`<div class="missed-row"><span class="missed-tag">Missed</span><button type="button" class="rescue" data-rescue="${x.id}">Rescue</button></div>`:''}
    ${x.rescued&&!missed&&!x.done?'<div class="rescued-tag">Rescued</div>':''}
    <svg class="stamp" aria-hidden="true" viewBox="0 0 64 64"><use href="#dd-star"/></svg>
    <label class="done"><input type="checkbox" data-done="${x.id}" ${x.done?'checked':''}>Done</label>
  </div>`;
}

/* ---------- timetable page ---------- */
function progressHTML(p){
  return p.subjects.map(sb=>{
    const mine=p.sessions.filter(x=>x.sid===sb.id);if(!mine.length)return'';
    const d=mine.filter(x=>x.done).length;
    return `<div class="prog" style="background:${pal(sb).bg};color:${pal(sb).ink}"><b>${esc(sb.name)}</b>${d} of ${mine.length} sessions done<div class="bar"><i style="width:${Math.round(d/mine.length*100)}%"></i></div></div>`;
  }).join('');
}
function renderPlan(){
  const p=state.plan;if(!p){res.hidden=true;return}
  res.hidden=false;
  const mins=p.sessions.reduce((a,x)=>a+x.len*30,0),hrs=Math.round(mins/6)/10;
  const nSubs=new Set(p.sessions.map(x=>x.sid)).size;
  let summary=`${hrs} hours of study across ${nSubs} subject${nSubs===1?'':'s'}, planted over ${p.weeks} week${p.weeks===1?'':'s'}.`;
  if(!p.unscheduled.length)summary+=' Every portion fits.';
  let warn='';
  if(p.unscheduled.length) warn=`<div class="warn"><b>Some portions didn't fit.</b> These sessions couldn't be placed${p.unscheduled.some(u=>u.exam)?' before their exam':''}:<ul>${p.unscheduled.map(u=>`<li>${esc(u.name)}: ${u.n} session${u.n===1?'':'s'} left${u.exam?`, exam ${fmtShort(fromISO(u.exam))}`:''}</li>`).join('')}</ul>To make room, paint more free time, raise the daily limit, turn off breaks, or lengthen the plan.</div>`;
  if(p.pastExams.length) warn+=`<div class="warn">The exam date for ${p.pastExams.map(esc).join(', ')} is on or before your start date, so nothing could be planned for it. Check the date on My subjects.</div>`;
  const tabs=Array.from({length:p.weeks},(_,w)=>{
    const a=addDays(fromISO(p.start),w*7),b=addDays(a,6);
    return `<button role="tab" aria-selected="${w===state.week}" data-week="${w}">Week ${w+1}, ${fmtShort(a)} – ${fmtShort(b)}</button>`;
  }).join('');
  res.innerHTML=`${DD('sparkle','c1 peek')}
    <div class="plan-head"><div><h2>Your timetable</h2><p class="summary">${summary}</p></div>
    <a class="btn ghost small" href="#print" style="text-decoration:none">${DD('printer')}Printable version</a></div>
    ${warn}
    <div class="cheer-row">${noteHTML()}${countdownHTML()}</div>
    ${missedBannerHTML()}
    <div class="progress" id="progress">${progressHTML(p)}</div>
    <div class="weektabs" role="tablist" aria-label="Weeks">${tabs}</div>
    <div class="carry-bar" id="carryBar" hidden></div>
    <div class="board" id="board"></div>`;
  renderWeek();
}
function renderWeek(){
  const p=state.plan,board=$('#board');if(!board)return;
  const todayISO=nowInfo().iso,ws=addDays(fromISO(p.start),state.week*7);
  if(state.day==null||state.day<0||state.day>6){
    const ti=Math.round((fromISO(todayISO)-ws)/864e5);
    state.day=ti>=0&&ti<7?ti:0;
  }
  let tabs='';
  for(let k=0;k<7;k++){
    const date=addDays(ws,k),iso=toISO(date);
    const mine=p.sessions.filter(x=>x.date===iso),dn=mine.filter(x=>x.done).length;
    const exam=p.exams.some(e=>e.date===iso);
    const dd=['star','leaf','heart','sparkle','cloud','planet','spiral'][k];
    tabs+=`<button type="button" role="tab" class="daytab${iso===todayISO?' is-today':''}${mine.length&&dn===mine.length?' all-done':''}" data-day="${k}" data-date="${iso}" aria-selected="${k===state.day}">
      ${DD(dd,`c${k%3+1} daytab-dd`)}<span class="dt-name">${DAYS[dow(date)]}</span><span class="dt-date">${fmtShort(date)}</span>
      <span class="dt-count">${exam?'Exam':mine.length?`${dn}/${mine.length}`:'Rest'}</span></button>`;
  }
  const date=addDays(ws,state.day),iso=toISO(date),items=[];
  p.sessions.filter(x=>x.date===iso).forEach(x=>items.push({s:x.s,type:'sess',x}));
  busyRuns(state.avail[dow(date)]).forEach(r=>items.push({s:r.s,type:'busy',r}));
  items.sort((a,b)=>a.s-b.s);
  const exams=p.exams.filter(e=>e.date===iso),hasStudy=items.some(i=>i.type==='sess');
  let list='',n=0;
  exams.forEach(e=>list+=`<div class="exam">${esc(e.name)} exam</div>`);
  items.forEach(it=>{
    if(it.type==='busy')list+=`<div class="busyblock"><b>${esc(it.r.label)}</b> ${fmtTime(slotMin(it.r.s))} – ${fmtTime(slotMin(it.r.e))}</div>`;
    else list+=stickerHTML(it.x,{grip:true,tilt:(n++%3-1)*0.7});
  });
  if(!hasStudy&&!exams.length)list+=`<p class="restday">${DD('zzz','c3 rest-dd')}<br>No study planned. Enjoy it.</p>`;
  board.innerHTML=`<div class="daytabs" role="tablist" aria-label="Days">${tabs}</div>
    <div class="day day-panel${iso===todayISO?' today':''}" data-date="${iso}" role="tabpanel">
      <h3>${DAY_FULL[dow(date)]} ${date.getDate()} ${MONTH_FULL[date.getMonth()]}${iso===todayISO?'<span>Today</span>':''}</h3>
      <div class="stack day-list">${list}</div>
    </div>`;
  updateCarry();
}
function updateCarry(){
  const bar=$('#carryBar');if(!bar)return;
  const x=carryId&&getSess(carryId);
  res.classList.toggle('carrying',!!x);
  if(!x){bar.hidden=true;return}
  bar.hidden=false;
  bar.innerHTML=`<span>Moving <b>${esc(x.name)}: ${esc(x.label)}</b>. Pick a day tab, then tap the day or another session to put it there.</span><button class="btn ghost small" data-cancel-carry>Cancel</button>`;
}
function setCarry(id){carryId=id;renderWeek()}

/* ---------- today page ---------- */
function renderToday(){
  const tb=$('#todayBody');if(!tb)return;
  if(!state.plan){
    tb.innerHTML=`<div class="panel empty-today">${DD('sun','c2')}<p>Your timetable hasn't been grown yet.</p><a class="btn" href="#timetable" style="text-decoration:none">Go to my timetable</a></div>`;
    return;
  }
  const p=state.plan,n=nowInfo(),d=fromISO(n.iso);
  const inPlan=n.iso>=p.start&&n.iso<=p.end;
  const todays=p.sessions.filter(x=>x.date===n.iso).sort((a,b)=>a.s-b.s);
  const next=todays.find(x=>!x.done&&endMin(x)>n.min);
  const items=[...todays.map(x=>({s:x.s,x})),...busyRuns(state.avail[dow(d)]).map(r=>({s:r.s,r}))].sort((a,b)=>a.s-b.s);
  const exams=p.exams.filter(e=>e.date===n.iso);
  let agenda='';
  exams.forEach(e=>agenda+=`<div class="exam">${esc(e.name)} exam today. Good luck!</div>`);
  if(!inPlan) agenda+=`<p class="restday">${DD('cloud','c3 rest-dd')}<br>Today isn't part of your plan. It runs from ${dayLabel(p.start)} to ${dayLabel(p.end)}.</p>`;
  else if(!todays.length) agenda+=`<p class="restday">${DD('zzz','c3 rest-dd')}<br>No study today. Rest is part of the plan.</p>`;
  else items.forEach(it=>{
    if(it.r) agenda+=`<div class="busyblock"><b>${esc(it.r.label)}</b> ${fmtTime(slotMin(it.r.s))} – ${fmtTime(slotMin(it.r.e))}</div>`;
    else agenda+=`<div class="today-row${it.x===next?' next':''}">${it.x===next?'<span class="next-tag">Up next</span>':''}${stickerHTML(it.x)}</div>`;
  });
  const doneN=todays.filter(x=>x.done).length;
  tb.innerHTML=`<p class="today-date">${DAY_FULL[dow(d)]} ${d.getDate()} ${MONTH_FULL[d.getMonth()]}</p>
    ${countdownHTML()}
    <div class="today-grid">
      <div class="panel">${DD('sun','c2 peek','--r:10deg')}
        <h2>Today's plan</h2>
        <p class="today-count">${todays.length?`${doneN} of ${todays.length} session${todays.length>1?'s':''} done`:''}</p>
        ${missedBannerHTML()}
        <div class="today-list">${agenda}</div>
      </div>
    </div>`;
}

/* ---------- print page ---------- */
function renderPrint(){
  const pb=$('#printBody'),p=state.plan;
  if(!p){pb.innerHTML=`<div class="panel empty-today"><p>Grow a timetable first, then come back here to print it.</p><a class="btn" href="#timetable" style="text-decoration:none">Go to my timetable</a></div>`;return}
  const legend=`<div class="plegend">${p.subjects.map(s=>`<span><i style="background:${pal(s).bg};border:1px solid ${pal(s).ink}"></i>${esc(s.name)}</span>`).join('')}</div>`;
  let h='';
  for(let w=0;w<p.weeks;w++){
    const ws=addDays(fromISO(p.start),w*7);
    h+=`<section class="pweek"><h2>Study Sprout, week ${w+1}: ${fmtShort(ws)} – ${fmtShort(addDays(ws,6))}</h2><div class="pgrid">`;
    for(let k=0;k<7;k++){
      const date=addDays(ws,k),iso=toISO(date),items=[];
      p.sessions.filter(x=>x.date===iso).forEach(x=>items.push({s:x.s,x}));
      busyRuns(state.avail[dow(date)]).forEach(r=>items.push({s:r.s,r}));
      items.sort((a,b)=>a.s-b.s);
      h+=`<div class="pday"><h3>${DAYS[dow(date)]}<span>${fmtShort(date)}</span></h3>`;
      p.exams.filter(e=>e.date===iso).forEach(e=>h+=`<div class="pexam">${esc(e.name)} exam</div>`);
      items.forEach(it=>{
        if(it.r)h+=`<div class="pbusy">${esc(it.r.label)}, ${fmtTime(slotMin(it.r.s))} – ${fmtTime(slotMin(it.r.e))}</div>`;
        else{const x=it.x;h+=`<div class="psess" style="--c:${pal(x).ink};--cb:${pal(x).bg}"><span class="pbox">${x.done?'✓':''}</span>${fmtTime(slotMin(x.s))} – ${fmtTime(endMin(x))}<b>${esc(x.name)}</b>${esc(x.label)}</div>`}
      });
      h+='</div>';
    }
    h+=`</div>${legend}</section>`;
  }
  pb.innerHTML=h;
}
$('#doPrint').addEventListener('click',()=>{try{window.print()}catch(e){}});

/* ---------- events ---------- */
let suppressUntil=0;
document.addEventListener('change',e=>{
  const c=e.target.closest('input[data-done]');if(!c)return;
  const x=getSess(c.dataset.done);if(!x)return;
  x.done=c.checked;save();
  if(c.checked)toast(doneCheer(x));
  refresh();
  const again=document.querySelector(`[data-page-section]:not([hidden]) input[data-done="${x.id}"]`);
  again&&again.focus({preventScroll:true});
});
document.addEventListener('click',e=>{
  const r=e.target.closest('[data-rescue]');if(r){after(rescue(getSess(r.dataset.rescue)));return}
  if(e.target.closest('.rescue-all')){after(rescueAll());return}
  if(e.target.closest('[data-cancel-carry]')){setCarry(null);return}
  const g=e.target.closest('.grip');
  if(g){if(e.detail===0)setCarry(carryId===g.dataset.move?null:g.dataset.move);return}
  const wk=e.target.closest('[data-week]');
  const dt=e.target.closest('#board [data-day]');
  if(dt){state.day=+dt.dataset.day;save();renderWeek();return}
  if(wk){state.week=+wk.dataset.week;state.day=null;save();res.querySelectorAll('[data-week]').forEach(b=>b.setAttribute('aria-selected',String(+b.dataset.week===state.week)));renderWeek();return}
  if(carryId&&Date.now()>suppressUntil&&e.target.closest('#board')){
    if(e.target.closest('input,label,button'))return;
    const st=e.target.closest('.sticker[data-id]'),day=e.target.closest('.day[data-date]');
    const tgt=st&&st.dataset.id!==carryId?st:(st?null:day);
    if(tgt){const id=carryId;carryId=null;after(dropOn(id,tgt))}
  }
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&carryId)setCarry(null)});

/* drag and drop with the grip handle (mouse and touch) */
let drag=null;
document.addEventListener('pointerdown',e=>{
  const g=e.target.closest('#board .grip');if(!g||e.button>0)return;
  e.preventDefault();
  drag={id:g.dataset.move,x0:e.clientX,y0:e.clientY,moved:false,src:g.closest('.sticker'),ghost:null,over:null};
});
document.addEventListener('pointermove',e=>{
  if(!drag)return;
  if(!drag.moved){
    if(Math.hypot(e.clientX-drag.x0,e.clientY-drag.y0)<6)return;
    drag.moved=true;
    const r=drag.src.getBoundingClientRect();drag.dx=e.clientX-r.left;drag.dy=e.clientY-r.top;
    const gh=drag.src.cloneNode(true);gh.classList.add('ghost');gh.style.width=r.width+'px';
    document.body.appendChild(gh);drag.ghost=gh;drag.src.classList.add('lifting');res.classList.add('dragging');
  }
  drag.ghost.style.left=(e.clientX-drag.dx)+'px';drag.ghost.style.top=(e.clientY-drag.dy)+'px';
  const el=document.elementFromPoint(e.clientX,e.clientY);
  let t=el&&el.closest('#board .sticker[data-id]');if(t===drag.src)t=null;
  if(!t)t=el&&el.closest('#board .day[data-date],#board .daytab[data-date]');
  if(drag.over!==t){drag.over&&drag.over.classList.remove('drop-hover');t&&t.classList.add('drop-hover');drag.over=t}
  if(e.clientY<70)window.scrollBy(0,-14);else if(e.clientY>innerHeight-70)window.scrollBy(0,14);
});
function endDrag(drop){
  if(!drag)return;const d=drag;drag=null;suppressUntil=Date.now()+250;
  if(!d.moved){if(drop)setCarry(carryId===d.id?null:d.id);return}
  d.ghost.remove();res.classList.remove('dragging');d.src.classList.remove('lifting');d.over&&d.over.classList.remove('drop-hover');
  if(drop&&d.over){carryId=null;after(dropOn(d.id,d.over))}
}
document.addEventListener('pointerup',()=>endDrag(true));
document.addEventListener('pointercancel',()=>endDrag(false));

/* ---------- themes ---------- */
function applyTheme(announce){
  const t=THEMES[state.theme]?state.theme:'main';
  if(t==='main')delete document.documentElement.dataset.season;else document.documentElement.dataset.season=t;
  THEMES[t].st.forEach((c,i)=>{document.documentElement.style.setProperty(`--st${i}bg`,c.bg);document.documentElement.style.setProperty(`--st${i}ink`,c.ink)});
  $('#themeName').textContent=THEMES[t].name;
  document.querySelectorAll('input[name=theme]').forEach(r=>{r.checked=r.value===t});
  if(announce){
    renderSubjects();refresh();
    if(state.page==='print')renderPrint();
    toast(THEME_MSG[t]);
  }
}
document.querySelectorAll('input[name=theme]').forEach(r=>r.addEventListener('change',()=>{
  state.theme=r.value;save();applyTheme(true);
  setTimeout(()=>{$('#themePick').open=false},250);
}));
document.addEventListener('click',e=>{const tp=$('#themePick');if(tp.open&&!e.target.closest('#themePick'))tp.open=false});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#themePick').open){$('#themePick').open=false;$('#themePick summary').focus()}});

/* ---------- boot ---------- */
applyTheme(false);
buildGrid();paintGrid();renderSubjects();syncSettings();
if(state.plan){$('#sprout').classList.add('grown')}
showPage();
})();
