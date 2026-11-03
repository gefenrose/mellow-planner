/* Mellow calendar + habits. Additive v1 data fields keep existing backups valid. */
(()=>{
  const copy={
    en:{calendar:'Calendar',habits:'Habits',newHabit:'New habit',editHabit:'Edit habit',habitName:'Habit name',habitSchedule:'Repeat on',habitStart:'Start date',habitColor:'Color',todayHabits:"Today's habits",noHabits:'A little room for a new ritual',noHabitsSub:'Create a habit and choose the days it should appear.',doneToday:'done today',selectedDay:'Selected day',monthOverview:'Month overview',dayPlan:'Day plan',dailyRituals:'Daily rituals',allHabits:'All habits',weekProgress:'Last 7 days',habitData:'Habit data',habitDataText:'Habits and daily marks are saved locally with your tasks and included in backups.',openHabits:'Manage habits',noDayItems:'Nothing planned for this day yet.',taskLabel:'Task',eventLabel:'Google event',everyDay:'Every day',streak:'recent completions',schedule:'Schedule',calendarHint:'Tasks are shown across the month. Connected Google events appear for the selected day.',pink:'Blush',lavender:'Lavender',mint:'Mint',peach:'Peach'},
    he:{calendar:'לוח שנה',habits:'הרגלים',newHabit:'הרגל חדש',editHabit:'עריכת הרגל',habitName:'שם ההרגל',habitSchedule:'חזרה בימים',habitStart:'תאריך התחלה',habitColor:'צבע',todayHabits:'ההרגלים של היום',noHabits:'קצת מקום לטקס חדש',noHabitsSub:'אפשר ליצור הרגל ולבחור באילו ימים הוא יופיע.',doneToday:'הושלמו היום',selectedDay:'היום שנבחר',monthOverview:'תצוגת חודש',dayPlan:'תכנון יומי',dailyRituals:'טקסים יומיים',allHabits:'כל ההרגלים',weekProgress:'7 הימים האחרונים',habitData:'נתוני הרגלים',habitDataText:'הרגלים וסימונים יומיים נשמרים מקומית יחד עם המשימות ונכללים בגיבוי.',openHabits:'ניהול הרגלים',noDayItems:'אין עדיין משימות או אירועים ליום הזה.',taskLabel:'משימה',eventLabel:'אירוע Google',everyDay:'כל יום',streak:'השלמות אחרונות',schedule:'תדירות',calendarHint:'משימות מוצגות לאורך החודש. אירועי Google מחוברים מופיעים ביום שנבחר.',pink:'ורוד',lavender:'לבנדר',mint:'מנטה',peach:'אפרסק'}
  };
  const F=key=>(db.settings.lang==='he'?copy.he:copy.en)[key]||key;
  Object.assign(E,{calendar:copy.en.calendar,habits:copy.en.habits,newHabit:copy.en.newHabit});
  Object.assign(H,{calendar:copy.he.calendar,habits:copy.he.habits,newHabit:copy.he.newHabit});

  const colors=['pink','lavender','mint','peach'];
  const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(String(value||''));
  function normalizeHabit(h){
    const days=Array.isArray(h?.days)?[...new Set(h.days.map(Number).filter(n=>n>=0&&n<=6))]:[];
    return {id:h?.id||uid(),name:String(h?.name||'').slice(0,100),emoji:String(h?.emoji||'🌷').slice(0,16),color:colors.includes(h?.color)?h.color:'pink',days:days.length?days:[0,1,2,3,4,5,6],startDate:validDate(h?.startDate)?h.startDate:today(),createdAt:Number(h?.createdAt)||Date.now(),demo:!!h?.demo,demoKey:h?.demoKey||''};
  }
  db.habits=db.habits.map(normalizeHabit).filter(h=>h.name);
  for(const [id,dates] of Object.entries(db.habitLog))db.habitLog[id]=Array.isArray(dates)?[...new Set(dates.filter(validDate))].slice(-1000):[];
  if(!db.habits.length&&!localStorage.getItem('mellow-habit-samples-v1')){
    const d=today();
    db.habits=[
      normalizeHabit({name:'Drink water',emoji:'💧',color:'mint',days:[0,1,2,3,4,5,6],startDate:d,demo:true,demoKey:'water'}),
      normalizeHabit({name:'Read for ten minutes',emoji:'📖',color:'lavender',days:[0,1,2,3,4,5],startDate:d,demo:true,demoKey:'read'}),
      normalizeHabit({name:'A short walk',emoji:'🌿',color:'pink',days:[0,2,4,6],startDate:d,demo:true,demoKey:'walk'})
    ];
    localStorage.setItem('mellow-habit-samples-v1','1');
    persist();
  }
  const demoNames={water:['Drink water','שתיית מים'],read:['Read for ten minutes','עשר דקות קריאה'],walk:['A short walk','הליכה קצרה']};
  const habitName=h=>h.demoKey&&demoNames[h.demoKey]?demoNames[h.demoKey][db.settings.lang==='he'?1:0]:h.name;
  const dayDate=key=>fromKey(key);
  const due=(h,key)=>validDate(key)&&key>=h.startDate&&h.days.includes(dayDate(key).getDay());
  const marked=(h,key)=>(db.habitLog[h.id]||[]).includes(key);
  const dueHabits=key=>db.habits.filter(h=>due(h,key));
  const weekdayLabels=()=>Array.from({length:7},(_,i)=>new Intl.DateTimeFormat(locale(),{weekday:'short'}).format(new Date(2026,9,18+i)));
  const monthKey=()=>validDate(ui.calendarMonth+'-01')?ui.calendarMonth:ui.date.slice(0,7);
  ui.calendarMonth=monthKey();
  ui.mobilePanes=ui.mobilePanes||{};

  const reordered={today:icons.today,calendar:mellowIcon('calendar'),habits:mellowIcon('target'),tasks:icons.tasks,routines:icons.routines,ai:icons.ai,settings:icons.settings};
  Object.keys(icons).forEach(key=>delete icons[key]);
  Object.assign(icons,reordered);

  function shiftMonth(delta){
    const [y,m]=monthKey().split('-').map(Number),d=new Date(y,m-1+delta,1,12);
    ui.calendarMonth=dayKey(d).slice(0,7);
  }
  function calendarMonth(compact=false){
    const [year,month]=monthKey().split('-').map(Number),first=new Date(year,month-1,1,12),offset=first.getDay();
    const rtl=db.settings.lang==='he',labels=weekdayLabels();
    const cells=Array.from({length:42},(_,index)=>{
      const date=new Date(year,month-1,index-offset+1,12),key=dayKey(date),outside=date.getMonth()!==month-1;
      const tasks=db.tasks.filter(t=>t.date===key),events=key===ui.date?(window.MellowCalendar?.dayItems?.(key)||[]):[];
      const items=[...tasks.map(t=>({kind:'task',title:t.title,done:t.done})),...events.map(e=>({kind:'event',title:e.title}))];
      return '<button type="button" class="planner-date '+(outside?'outside ':'')+(key===ui.date?'selected ':'')+(key===today()?'today ':'')+'" data-action="setdate" data-date="'+key+'" aria-label="'+esc(dt(key,{weekday:'long',day:'numeric',month:'long'}))+'"><span class="planner-date-number">'+date.getDate()+'</span><span class="planner-date-items">'+items.slice(0,2).map(item=>'<span class="planner-date-item '+item.kind+' '+(item.done?'done':'')+'">'+esc(item.title)+'</span>').join('')+(items.length>2?'<span class="planner-date-more">+'+(items.length-2)+'</span>':'')+'</span></button>';
    }).join('');
    return '<section class="card planner-month '+(compact?'compact':'full')+'"><header class="planner-month-head"><button type="button" class="iconbtn" data-planner="month" data-step="-1" aria-label="'+(rtl?'החודש הקודם':'Previous month')+'">'+mellowIcon(rtl?'chevronRight':'chevronLeft',19)+'</button><strong>'+esc(new Intl.DateTimeFormat(locale(),{month:'long',year:'numeric'}).format(first))+'</strong><button type="button" class="iconbtn" data-planner="month" data-step="1" aria-label="'+(rtl?'החודש הבא':'Next month')+'">'+mellowIcon(rtl?'chevronLeft':'chevronRight',19)+'</button></header><div class="planner-weekdays">'+labels.map(label=>'<span>'+esc(label)+'</span>').join('')+'</div><div class="planner-month-grid">'+cells+'</div><button type="button" class="btn ghost small planner-today-button" data-planner="today">'+T('today')+'</button></section>';
  }
  function habitRow(h,key,manage=false){
    const isDone=marked(h,key),label=habitName(h),schedule=h.days.length===7?F('everyDay'):h.days.map(day=>weekdayLabels()[day]).join(' · ');
    return '<article class="habit-row habit-'+h.color+' '+(isDone?'is-done':'')+'"><button type="button" class="habit-check" data-planner="habit-toggle" data-id="'+esc(h.id)+'" data-date="'+key+'" aria-label="'+esc((isDone?(db.settings.lang==='he'?'ביטול סימון ':'Unmark '):(db.settings.lang==='he'?'סימון ':'Mark '))+label)+'" aria-pressed="'+isDone+'">'+(isDone?mellowIcon('check',18):'')+'</button><span class="habit-emoji" aria-hidden="true">'+esc(h.emoji)+'</span><div class="habit-copy"><strong>'+esc(label)+(h.demo?' <span class="demo">'+T('sample')+'</span>':'')+'</strong><small>'+esc(schedule)+'</small></div>'+(manage?'<button type="button" class="iconbtn" data-planner="habit-edit" data-id="'+esc(h.id)+'" aria-label="'+T('edit')+'">'+mellowIcon('pencil',16)+'</button><button type="button" class="iconbtn" data-planner="habit-delete" data-id="'+esc(h.id)+'" aria-label="'+T('delete')+'">'+mellowIcon('trash',16)+'</button>':'')+'</article>';
  }
  function habitsForDay(key,manage=false){
    const habits=manage?db.habits:dueHabits(key),done=habits.filter(h=>marked(h,key)).length;
    return '<section class="card habits-day-card"><header class="habit-panel-head"><div><span class="planner-eyebrow">'+esc(F('dailyRituals'))+'</span><h2>'+esc(F('todayHabits'))+'</h2><p>'+esc(dt(key,{weekday:'long',day:'numeric',month:'long'}))+'</p></div><span class="habit-score">'+done+'/'+habits.length+'</span></header><div class="habit-progress" aria-label="'+done+' '+F('doneToday')+'"><span style="width:'+(habits.length?Math.round(done/habits.length*100):0)+'%"></span></div><div class="habit-list">'+(habits.length?habits.map(h=>habitRow(h,key,manage)).join(''):'<div class="habit-empty"><img src="./assets/kawaii-bunny.png" alt=""><strong>'+esc(F('noHabits'))+'</strong><span>'+esc(F('noHabitsSub'))+'</span></div>')+'</div><button type="button" class="btn secondary small" data-planner="habit-new">'+mellowIcon('plus',16)+' '+esc(F('newHabit'))+'</button></section>';
  }
  function recentSummary(){
    const dates=Array.from({length:7},(_,i)=>{const d=dayDate(ui.date);d.setDate(d.getDate()-(6-i));return dayKey(d)}),count=dates.reduce((sum,key)=>sum+db.habits.filter(h=>marked(h,key)).length,0);
    return '<section class="card habit-summary"><span class="planner-eyebrow">'+esc(F('weekProgress'))+'</span><strong>'+count+'</strong><span>'+esc(F('streak'))+'</span><div class="habit-week-dots">'+dates.map(key=>'<span class="'+(db.habits.some(h=>marked(h,key))?'filled':'')+'" title="'+esc(dt(key,{day:'numeric',month:'short'}))+'"></span>').join('')+'</div><img src="./assets/kawaii-cozy.png" alt="" class="cozy-still-life"></section>';
  }
  function dayDetails(){
    const tasks=db.tasks.filter(t=>t.date===ui.date).sort((a,b)=>(a.start??1440)-(b.start??1440)),events=window.MellowCalendar?.dayItems?.(ui.date)||[];
    const taskHtml=tasks.map(t=>'<article class="calendar-agenda-item '+(t.done?'done':'')+'"><button class="check '+(t.done?'checked':'')+'" data-action="done" data-id="'+esc(t.id)+'" aria-label="'+esc(t.title)+'">'+(t.done?mellowIcon('check',14):'')+'</button><span class="agenda-accent task"></span><button type="button" class="calendar-agenda-copy" data-action="edit" data-id="'+esc(t.id)+'"><strong>'+esc(t.title)+'</strong><small>'+esc(F('taskLabel'))+(t.start!=null?' · '+fmt(t.start):'')+'</small></button></article>').join('');
    const eventHtml=events.map(e=>'<article class="calendar-agenda-item"><span class="agenda-accent event" style="background:'+esc(e.color||'#bba0de')+'"></span><div class="calendar-agenda-copy"><strong>'+esc(e.title)+'</strong><small>'+esc(F('eventLabel'))+(e.timeLabel?' · '+esc(e.timeLabel):'')+'</small></div>'+(e.href?'<a class="iconbtn" href="'+esc(e.href)+'" target="_blank" rel="noopener noreferrer" aria-label="'+esc(e.title)+'">'+mellowIcon('arrowUpRight',16)+'</a>':'')+'</article>').join('');
    return '<section class="card calendar-day-detail"><header><span class="planner-eyebrow">'+esc(F('selectedDay'))+'</span><h2>'+esc(dt(ui.date,{weekday:'long',day:'numeric',month:'long'}))+'</h2><p>'+esc(F('calendarHint'))+'</p></header><div class="calendar-agenda-list">'+(taskHtml+eventHtml||'<div class="calendar-empty"><img src="./assets/kawaii-bear.png" alt=""><p>'+esc(F('noDayItems'))+'</p></div>')+'</div><button type="button" class="btn secondary" data-unified-add="calendar">'+mellowIcon('plus',16)+' '+T('newTask')+'</button></section>';
  }
  function mobileTabs(active){
    return '<div class="planner-mobile-tabs" role="tablist" aria-label="'+esc(F('dayPlan'))+'">'+[['calendar',F('monthOverview'),'calendar'],['day',F('dayPlan'),'tasks'],['habits',F('dailyRituals'),'target']].map(([pane,label,icon])=>'<button type="button" role="tab" data-planner="pane" data-pane="'+pane+'" aria-selected="'+(active===pane)+'" class="'+(active===pane?'active':'')+'">'+mellowIcon(icon,17)+' '+esc(label)+'</button>').join('')+'</div>';
  }
  function paneFor(fallback){return ui.mobilePanes[ui.tab]||fallback}
  function threeColumns(center,centerClass,fallback='day',right=habitsForDay(ui.date),centerPane='day',rightPane='habits'){
    const active=paneFor(fallback);
    return mobileTabs(active)+'<div class="planner-three-column" data-active-pane="'+active+'"><aside class="planner-side planner-calendar-side '+(active==='calendar'?'mobile-active':'')+'" data-mobile-pane="calendar">'+calendarMonth(true)+'</aside><section class="planner-center '+centerClass+' '+(active===centerPane?'mobile-active':'')+'" data-mobile-pane="'+centerPane+'">'+center+'</section><aside class="planner-side planner-habit-side '+(active===rightPane?'mobile-active':'')+'" data-mobile-pane="'+rightPane+'">'+right+'</aside></div>';
  }

  const originalToday=renderToday;
  renderToday=function(){return threeColumns(originalToday(),'planner-today-center','day',habitsForDay(ui.date)+recentSummary())};
  renderCalendar=function(){return sectionHead(F('calendar'),F('calendarHint'),'<button type="button" class="page-title-add" data-unified-add="calendar-head" aria-label="'+esc(T('newTask'))+'">'+mellowIcon('plus',18)+'</button>')+threeColumns(dayDetails(),'planner-calendar-center','calendar')};
  renderHabits=function(){return sectionHead(F('habits'),F('habitDataText'),'<button type="button" class="page-title-add" data-planner="habit-new" aria-label="'+esc(F('newHabit'))+'">'+mellowIcon('plus',18)+'</button>')+threeColumns(habitsForDay(ui.date,true),'planner-habits-center','habits',recentSummary(),'habits','day')};

  const originalSettings=renderSettings;
  renderSettings=function(){
    const html=originalSettings(),at=html.lastIndexOf('</div>');
    const card='<section class="card habit-settings-card"><h3>'+mellowIcon('target',18)+' '+esc(F('habitData'))+'</h3><p>'+esc(F('habitDataText'))+'</p><strong>'+db.habits.length+' '+esc(F('habits'))+'</strong><button type="button" class="btn secondary" data-planner="open-habits">'+esc(F('openHabits'))+'</button></section>';
    return at<0?html+card:html.slice(0,at)+card+html.slice(at);
  };
  function habitModal(){
    const h=normalizeHabit(db.habits.find(x=>x.id===ui.editId)||{name:'',days:[0,1,2,3,4,5,6],startDate:ui.date});
    return '<div class="modal-bg"><section class="modal habit-modal" role="dialog" aria-modal="true" aria-labelledby="habitModalTitle"><div class="modalheader"><h2 id="habitModalTitle">'+esc(F(ui.editId?'editHabit':'newHabit'))+'</h2><button type="button" class="iconbtn" data-action="close" aria-label="'+T('close')+'">'+mellowIcon('x',18)+'</button></div><form id="habitForm"><div class="formgrid"><label class="field full">'+esc(F('habitName'))+'<input id="habitName" required maxlength="100" value="'+esc(habitName(h))+'"></label><label class="field">Emoji<input id="habitEmoji" maxlength="16" value="'+esc(h.emoji)+'"></label><label class="field">'+esc(F('habitStart'))+'<input id="habitStart" type="date" value="'+esc(h.startDate)+'"></label><div class="field full"><span>'+esc(F('habitSchedule'))+'</span><div class="habit-day-options">'+weekdayLabels().map((label,i)=>'<label><input type="checkbox" name="habitDay" value="'+i+'" '+(h.days.includes(i)?'checked':'')+'><span>'+esc(label)+'</span></label>').join('')+'</div></div><label class="field full">'+esc(F('habitColor'))+'<select id="habitColor">'+colors.map(color=>'<option value="'+color+'" '+(h.color===color?'selected':'')+'>'+esc(F(color))+'</option>').join('')+'</select></label></div><div class="formactions"><div>'+(ui.editId?'<button type="button" class="btn danger small" data-planner="habit-delete" data-id="'+esc(ui.editId)+'">'+T('delete')+'</button>':'')+'</div><div class="buttonrow"><button type="button" class="btn ghost" data-action="close">'+T('cancel')+'</button><button type="submit" class="btn">'+mellowIcon('check',16)+' '+T('save')+'</button></div></div></form></section></div>';
  }
  const originalModal=renderModal;
  renderModal=function(){return ui.modal==='habit'?habitModal():originalModal()};

  document.addEventListener('click',event=>{
    const dateButton=event.target.closest?.('.planner-month-grid [data-action="setdate"]');
    if(dateButton)ui.calendarMonth=dateButton.dataset.date.slice(0,7);
  },true);
  document.addEventListener('click',event=>{
    const control=event.target.closest?.('[data-planner]');
    if(!control)return;
    const action=control.dataset.planner;
    if(action==='month'){shiftMonth(Number(control.dataset.step)||0);render()}
    if(action==='today'){ui.date=today();ui.calendarMonth=ui.date.slice(0,7);render();window.MellowCalendar?.refresh?.()}
    if(action==='pane'){ui.mobilePanes[ui.tab]=control.dataset.pane;render()}
    if(action==='habit-new'){ui.editId=null;ui.modal='habit';render();document.querySelector('#habitName')?.focus()}
    if(action==='habit-edit'){ui.editId=control.dataset.id;ui.modal='habit';render();document.querySelector('#habitName')?.focus()}
    if(action==='habit-toggle'){
      const id=control.dataset.id,key=control.dataset.date||ui.date,list=db.habitLog[id]||(db.habitLog[id]=[]),index=list.indexOf(key);
      if(index>=0)list.splice(index,1);else list.push(key);
      db.habitLog[id]=[...new Set(list)].sort().slice(-1000);save();
    }
    if(action==='habit-delete'){
      const id=control.dataset.id;if(confirm(T('confirmDelete'))){db.habits=db.habits.filter(h=>h.id!==id);delete db.habitLog[id];ui.modal=null;ui.editId=null;save();toast(T('deleted'))}
    }
    if(action==='open-habits'){ui.tab='habits';ui.modal=null;render();window.scrollTo({top:0,behavior:'instant'})}
  });
  document.addEventListener('submit',event=>{
    if(event.target.id!=='habitForm')return;
    event.preventDefault();
    const name=document.querySelector('#habitName')?.value.trim(),days=[...document.querySelectorAll('input[name="habitDay"]:checked')].map(x=>Number(x.value));
    if(!name||!days.length)return toast(db.settings.lang==='he'?'צריך לבחור שם ולפחות יום אחד.':'Choose a name and at least one day.');
    const prior=db.habits.find(h=>h.id===ui.editId),habit=normalizeHabit({...prior,id:prior?.id||uid(),name,emoji:document.querySelector('#habitEmoji')?.value||'🌷',startDate:document.querySelector('#habitStart')?.value||today(),color:document.querySelector('#habitColor')?.value,days,demo:false,demoKey:''});
    db.habits=prior?db.habits.map(h=>h.id===prior.id?habit:h):[...db.habits,habit];ui.modal=null;ui.editId=null;save();toast(T('saved'));
  });
  render();
})();
