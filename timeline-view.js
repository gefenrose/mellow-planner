/* Mellow day view: an original design with flexible groups and hour blocks. */
(()=>{
const PARTS=['other','morning','afternoon','evening','night'];
const words={
en:{partsView:'Day sections',hoursView:'Hourly',partLabel:'Part of day',morning:'Morning',afternoon:'Afternoon',evening:'Evening',night:'Night',other:'Other · anytime',flexible:'Flexible plans',emptyPart:'Nothing here yet',addTo:'Add to',toInbox:'In your inbox',now:'Now',partHelp:'Choose a part of your day without setting an exact time.',timeOptional:'Exact time (optional)',allHours:'Hourly schedule',noTimeHint:'Tasks without exact times appear here.'},
he:{partsView:'חלקי היום',hoursView:'לפי שעות',partLabel:'חלק ביום',morning:'בוקר',afternoon:'צהריים',evening:'ערב',night:'לילה',other:'אחר · בכל שעה',flexible:'תוכניות גמישות',emptyPart:'עדיין אין משימות כאן',addTo:'הוספה ל',toInbox:'בתיבת המשימות',now:'עכשיו',partHelp:'אפשר לבחור חלק ביום בלי לקבוע שעה מדויקת.',timeOptional:'שעה מדויקת (לא חובה)',allHours:'התוכנית לפי שעות',noTimeHint:'משימות ללא שעה מדויקת מופיעות כאן.'}};
const L=k=>(words[db.settings.lang==='he'?'he':'en'][k]||T(k));
const at=m=>m<300?'night':m<720?'morning':m<1020?'afternoon':m<1260?'evening':'night';
const of=t=>t.start!=null?at(t.start):(PARTS.includes(t.daypart)?t.daypart:'other');
const partsIcons={other:'sparkles',morning:'sun',afternoon:'cloudsun',evening:'sunset',night:'moon'};
const icon=mellowIcon;
ui.groupCollapsed??={};ui.newPart??='other';
db.settings.todayView=db.settings.todayView==='hours'?'hours':'parts';
const oldNormalize=normalizeTask;
normalizeTask=function(t){return {...oldNormalize(t),daypart:PARTS.includes(t.daypart)?t.daypart:(t.start!=null?at(t.start):'other')}};
function taskLine(t,extra=''){
 const n=t.steps?.length||0,complete=(t.steps||[]).filter(x=>x.done).length;
 const info=(t.start!=null?fmt(t.start)+' · ':'')+fmtLength(t.minutes)+(extra?' · '+extra:'')+(n?' · '+complete+'/'+n+' '+T('subtasks'):'');
 return '<div class="daytask '+(t.done?'completed':'')+'"><span class="daytask-accent '+esc(t.category)+'"></span>'+
 '<button class="daytask-icon '+esc(t.category)+'" data-action="edit" data-id="'+esc(t.id)+'">'+icon(mellowCategoryIcons[t.category]||'book',21)+'</button>'+
 '<button class="daytask-body" data-action="edit" data-id="'+esc(t.id)+'"><strong>'+esc(t.title)+(t.demo?' <span class="demo">'+T('sample')+'</span>':'')+'</strong><small>'+esc(info)+'</small></button>'+
 '<button class="check daytask-check '+(t.done?'checked':'')+'" data-action="done" data-id="'+esc(t.id)+'" aria-label="'+esc((t.done?'Undo':'Complete')+' '+t.title)+'">'+(t.done?icon('check',16):'')+'</button></div>';
}
function group(part,items){
 const closed=!!ui.groupCollapsed[part];
 return '<section class="part-section" data-part="'+part+'"><div class="part-heading">'+
 '<button class="part-title" data-action="togglepart" data-part="'+part+'" aria-expanded="'+!closed+'"><span class="part-pill '+part+'">'+icon(partsIcons[part],16)+' '+L(part)+' <b>'+items.length+'</b> <span class="part-caret">'+icon('chevronDown',14)+'</span></span></button>'+
 '<button class="part-add" data-action="newpart" data-part="'+part+'" title="'+esc(L('addTo')+' '+L(part))+'">'+icon('plus',18)+'</button></div>'+
 '<div class="part-list-wrap '+(closed?'is-collapsed':'')+'" aria-hidden="'+closed+'" '+(closed?'inert':'')+'><div class="part-list">'+(items.length?items.map(t=>taskLine(t,t.date?'':L('toInbox'))).join(''):'<button class="part-empty" data-action="newpart" data-part="'+part+'">'+icon('plus',16)+' '+L('emptyPart')+'</button>')+'</div></div></section>';
}
function timeline(tasks){
 const timed=tasks.filter(t=>t.start!=null).sort((a,b)=>a.start-b.start),loose=tasks.filter(t=>t.start==null);
 const first=timed.length?Math.max(0,Math.min(6,Math.floor(timed[0].start/60))):6;
 const last=24;
 const hourPx=61;let grid='';
 for(let h=first;h<last;h++)grid+='<div class="hour" style="height:'+hourPx+'px"><span>'+fmt(h*60)+'</span><button class="hour-add" data-action="addhour" data-start="'+h*60+'" aria-label="'+L('addTo')+' '+fmt(h*60)+'">'+icon('plus',16)+'</button></div>';
 const blocks=timed.map(t=>{
 const y=(t.start-first*60)/60*hourPx+2,height=Math.max(34,t.minutes/60*hourPx-4);
 return '<div class="mellow-hour-block '+esc(t.category)+' '+(t.done?'completed':'')+' '+(height<48?'compact':'')+'" style="top:'+y+'px;height:'+height+'px">'+
 '<span class="hour-color"></span><span class="hour-emoji">'+icon(mellowCategoryIcons[t.category]||'book',19)+'</span><button class="hour-info" data-action="edit" data-id="'+esc(t.id)+'"><strong>'+esc(t.title)+'</strong><small>'+fmt(t.start)+' – '+fmt(Math.min(1439,t.start+t.minutes))+' · '+fmtLength(t.minutes)+'</small></button>'+
 '<button class="check hour-check '+(t.done?'checked':'')+'" data-action="done" data-id="'+esc(t.id)+'" aria-label="'+esc(t.title)+'">'+(t.done?icon('check',16):'')+'</button></div>';
 }).join('');
 const now=ui.date===today()?minNow():null;
 return '<div class="hour-section"><div class="sectionbar"><h3>'+L('allHours')+'</h3><span class="subtle small">'+timed.length+' '+T('planned')+'</span></div>'+
 '<div class="card hourly-shell"><div class="agenda hourly-agenda" style="height:'+((last-first)*hourPx+5)+'px">'+grid+blocks+
 (now!=null&&now>=first*60&&now<=last*60?'<div class="nowline" style="top:'+((now-first*60)/60*hourPx)+'px"><em>'+L('now')+'</em></div>':'')+
 '</div></div><div class="flex-header"><h3>'+L('flexible')+'</h3><button class="part-add" data-action="newpart" data-part="other" aria-label="'+T('newTask')+'">'+icon('plus',18)+'</button></div>'+
 '<div class="daytask-list card">'+(loose.length?loose.map(t=>taskLine(t,L(of(t)))).join(''):'<div class="empty"><span class="big">🌿</span>'+L('noTimeHint')+'</div>')+'</div></div>';
}
renderToday=function(){
 const day=db.tasks.filter(t=>t.date===ui.date),others=ui.date===today()?db.tasks.filter(t=>!t.date&&!t.done):[];
 const visible=[...day,...others],finished=day.filter(t=>t.done).length;
 const percent=day.length?Math.round(finished/day.length*100):0;
 const current=db.settings.todayView;
 const toggle='<div class="planner-view-toggle" role="group" aria-label="'+L('partsView')+'"><button data-action="dayview" data-view="parts" class="'+(current==='parts'?'selected':'')+'" aria-pressed="'+(current==='parts')+'">'+icon('tasks',17)+' <span>'+L('partsView')+'</span></button><button data-action="dayview" data-view="hours" class="'+(current==='hours'?'selected':'')+'" aria-pressed="'+(current==='hours')+'">'+icon('clock',17)+' <span>'+L('hoursView')+'</span></button></div>';
 return '<div class="mellow-day-view"><header class="mellow-day-heading"><div class="overline">'+icon('sparkles',14)+' MELLOW / '+T('today')+'</div>'+
 '<div class="mellow-title-line"><div><h1>'+esc(dt(ui.date,{weekday:'long'}))+'</h1><p class="subtle">'+esc(dt(ui.date,{day:'numeric',month:'long',year:'numeric'}))+'</p></div><button class="btn secondary small" data-action="gotoday">'+T('today')+'</button></div></header>'+
 '<div class="day-nav-card"><div class="day-nav-top"><button class="iconbtn" data-action="day" data-step="-7" aria-label="Previous week">'+icon('chevronLeft',20)+'</button><strong>'+esc(dt(ui.date,{month:'long',year:'numeric'}))+'</strong><button class="iconbtn" data-action="day" data-step="7" aria-label="Next week">'+icon('chevronRight',20)+'</button></div><div class="week dayticker">'+weekDays()+'</div></div>'+
 '<div class="day-planner-controls"><div><span class="small subtle">'+finished+' / '+day.length+' '+T('tasksDone')+'</span><div class="day-progress"><span style="width:'+percent+'%"></span></div></div>'+toggle+'</div>'+
 (current==='hours'?timeline(visible):'<div class="day-sections">'+PARTS.map(p=>group(p,visible.filter(t=>of(t)===p).sort((a,b)=>(a.start??9999)-(b.start??9999)||Number(a.done)-Number(b.done)))).join('')+'</div>')+
 '<div class="day-footer"><button class="btn secondary" data-action="newtask">'+icon('plus',16)+' '+T('newTask')+'</button></div><p class="footnote">'+T('appInfo')+'</p></div>';
};
const originalTaskModal=taskModal;
taskModal=function(){
 const current=findTask(ui.editId);
 const selected=PARTS.includes(current?.daypart)?current.daypart:(current?.start!=null?at(current.start):ui.newPart||'other');
 const field='<div class="field"><label for="taskPart">'+L('partLabel')+'</label><select id="taskPart">'+PARTS.map(p=>'<option value="'+p+'" '+(selected===p?'selected':'')+'>'+L(p)+'</option>').join('')+'</select><span class="hint">'+L('partHelp')+'</span></div>';
 return originalTaskModal().replace('<div class="field"><label for="taskMin">',field+'<div class="field"><label for="taskMin">').replace('<label for="taskStart">'+T('time')+'</label>','<label for="taskStart">'+L('timeOptional')+'</label>');
};
document.addEventListener('submit',e=>{
 if(e.target.id!=='taskForm')return;
 e.preventDefault();e.stopImmediatePropagation();
 const title=$('#taskTitle')?.value.trim();if(!title)return;
 const before=findTask(ui.editId),date=$('#taskDate').value||null,start=convertStart($('#taskStart').value);
 const steps=Array.isArray(ui.stepDraft) ? ui.stepDraft.map(x=>({id:x.id||uid(),title:String(x.title||'').trim().slice(0,160),done:!!x.done})).filter(x=>x.title).slice(0,20) : $('#taskSteps').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,20).map(title=>({id:before?.steps?.find(s=>s.title===title)?.id||uid(),title,done:!!before?.steps?.find(s=>s.title===title)?.done}));
 const task=normalizeTask({...before,id:before?.id||uid(),title,emoji:$('#taskEmoji').value||'🌿',category:$('#taskCat').value,priority:$('#taskPriority').value,minutes:Number($('#taskMin').value),date,start:date?start:null,daypart:$('#taskPart').value,notes:$('#taskNotes').value,steps});
 if(before)db.tasks=db.tasks.map(t=>t.id===before.id?task:t);else db.tasks.push(task);
 ui.modal=null;ui.newPart='other';save();toast(T('saved'));
},true);
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-action]');if(!el)return;
 const a=el.dataset.action;
 if(a==='newtask'){ui.newPart='other';return}
 if(a==='dayview'){e.preventDefault();e.stopImmediatePropagation();const view=el.dataset.view==='hours'?'hours':'parts';if(db.settings.todayView===view)return;const swap=()=>{db.settings.todayView=view;save()};if(typeof document.startViewTransition==='function'&&!matchMedia('(prefers-reduced-motion: reduce)').matches)document.startViewTransition(swap);else swap()}
 if(a==='togglepart'){e.preventDefault();e.stopImmediatePropagation();const p=el.dataset.part;const closed=ui.groupCollapsed[p]=!ui.groupCollapsed[p];const section=el.closest('.part-section'),wrap=section?.querySelector('.part-list-wrap');el.setAttribute('aria-expanded',String(!closed));if(wrap){wrap.classList.toggle('is-collapsed',closed);wrap.setAttribute('aria-hidden',String(closed));wrap.inert=closed}}
 if(a==='newpart'){e.preventDefault();e.stopImmediatePropagation();ui.newPart=el.dataset.part;ui.editId=null;ui.modal='task';render();$('#taskTitle')?.focus()}
 if(a==='addhour'){e.preventDefault();e.stopImmediatePropagation();const start=Number(el.dataset.start);ui.newPart=at(start);ui.editId=null;ui.modal='task';render();$('#taskStart').value=fmt(start);$('#taskTitle')?.focus()}
},true);
render();
})();