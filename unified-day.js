/* Mellow v8 unified Today view: tasks + Google Calendar events together.
   Original visual treatment; client-only render; calendar data never persisted here. */
(() => {
  const icon=(name,size=17)=>mellowIcon(name,size);
  const tr={
    en:{task:'Task',event:'Google event',allDay:'All day',scheduled:'Planned',anytime:'Anytime',untimed:'Without a time',
      choose:'What would you like to add?',chooseSub:'Create a Mellow task or a Google Calendar event.',
      makeTask:'Mellow task',makeTaskSub:'Checklist, reminders and focus',
      makeEvent:'Calendar event',makeEventSub:'Appears in Google Calendar',
      connected:'Google connected',disconnected:'Connect Google to show events',
      refresh:'Refresh',noEvent:'No calendar events',synced:'Linked to Google',legend:'In your plan',
      needGoogle:'Connect Google Calendar first to create an event.',
      linked:'Google linked',other:'Anytime',morning:'Morning',afternoon:'Afternoon',evening:'Evening',night:'Night',
      partsView:'Day sections',hoursView:'Hourly',now:'Now',noTasks:'Add a task or event',dayEvents:'All-day events',
      add:'Add',none:'Your day has room to breathe',calInfo:'Google events appear here once connected',empty_other:'Anytime today works',empty_morning:'A little room for the morning',empty_afternoon:'Leave a little space',empty_evening:'End the day your way',
      flexible:'Anytime',inbox:'Inbox'},
    he:{task:'משימה',event:'אירוע Google',allDay:'כל היום',scheduled:'מתוכנן',anytime:'בכל שעה',untimed:'ללא שעה',
      choose:'מה תרצי להוסיף?',chooseSub:'משימה ב-Mellow או אירוע ביומן Google.',
      makeTask:'משימה ב-Mellow',makeTaskSub:'רשימות, צעדים וריכוז',
      makeEvent:'אירוע ביומן',makeEventSub:'נוסף ל-Google Calendar',
      connected:'Google מחובר',disconnected:'יש להתחבר ל-Google כדי לראות אירועים',
      refresh:'רענון',noEvent:'אין אירועים ביומן',synced:'מקושר ליומן Google',legend:'בתוכנית שלך',
      needGoogle:'יש להתחבר ל-Google Calendar כדי ליצור אירוע.',
      linked:'מקושר ל-Google',other:'בכל שעה',morning:'בוקר',afternoon:'צהריים',evening:'ערב',night:'לילה',
      partsView:'חלקי היום',hoursView:'לפי שעות',now:'עכשיו',noTasks:'הוספת משימה או אירוע',dayEvents:'אירועים לכל היום',
      add:'הוספה',none:'יש לך זמן פנוי היום',calInfo:'אירועי Google יופיעו כאן אחרי התחברות',empty_other:'יש מקום לכל מה שיתאים',empty_morning:'להתחיל את הבוקר בנחת',empty_afternoon:'להשאיר קצת מקום',empty_evening:'לסיים את היום בדרך שלך',
      flexible:'בכל שעה',inbox:'תיבת המשימות'}};
  const L=k=>tr[db.settings.lang==='he'?'he':'en'][k]||T(k);
  const PARTS=['other','morning','afternoon','evening'];
  const pIcon={morning:'sun',afternoon:'cloudsun',evening:'moon',other:'clock'};
  const partFromTime=m=>m==null||m<300?'other':m<720?'morning':m<1020?'afternoon':'evening';
  const partOf=t=>t.kind==='event'?(t.allDay?'other':partFromTime(t.start)):t.start!=null?partFromTime(t.start):PARTS.includes(t.daypart)?t.daypart:'other';
  const findEvents=()=>window.MellowCalendar?.dayItems?.(ui.date)||[];
  function viewItems(){
    const planned=db.tasks.filter(t=>t.date===ui.date).map(t=>({...t,kind:'task'}));
    const inbox=ui.date===today()?db.tasks.filter(t=>!t.date&&!t.done).map(t=>({...t,kind:'task',inboxItem:true})):[];
    const events=findEvents();
    return {items:[...planned,...inbox,...events],tasks:planned,events};
  }
  function taskVisual(t){
    const time=t.start!=null?fmt(t.start)+' · '+fmtLength(t.minutes):fmtLength(t.minutes);
    return '<div class="daytask unified-item unified-task '+(t.done?'completed':'')+'" data-drag-item="task" data-drag-id="'+esc(t.id)+'">'+
      '<button class="daytask-icon '+esc(t.category)+'" data-action="edit" data-id="'+esc(t.id)+'" aria-label="'+esc(L('task')+' '+t.title)+'">'+esc(t.emoji||'🌿')+'</button>'+
      '<button class="daytask-body" data-action="edit" data-id="'+esc(t.id)+'"><strong>'+esc(t.title)+'</strong><small>'+esc(time)+'</small></button>'+
      '<button class="check daytask-check '+(t.done?'checked':'')+'" data-action="done" data-id="'+esc(t.id)+'" aria-label="'+esc(t.title)+'">'+(t.done?icon('check',15):'')+'</button></div>';
  }
  function eventVisual(e){
    const label=e.allDay?L('allDay'):e.timeLabel;
    const text='<strong>'+esc(e.title)+'</strong><small>'+esc(label)+'</small>';
    const detail=e.href?'<a class="daytask-body event-anchor" href="'+esc(e.href)+'" target="_blank" rel="noopener noreferrer" aria-label="'+esc(L('event')+': '+e.title)+'">'+text+'</a>':
      '<div class="daytask-body">'+text+'</div>';
    return '<div class="daytask unified-item unified-event" data-drag-item="event" data-drag-id="'+esc(e.id)+'" data-calendar-id="'+esc(e.calendarId)+'" data-all-day="'+e.allDay+'" style="--calendar-accent:'+esc(e.color)+'">'+
      '<span class="daytask-icon event-icon" aria-hidden="true">📅</span>'+detail+'</div>';
  }
  const itemVisual=t=>t.kind==='event'?eventVisual(t):taskVisual(t);
  const sorted=(a,b)=>(a.kind==='event'&&a.allDay?-2:0)-(b.kind==='event'&&b.allDay?-2:0)||
     (a.start??1800)-(b.start??1800)||String(a.title).localeCompare(String(b.title));
  function section(part,arr){
    const entries=arr.filter(t=>partOf(t)===part).sort(sorted);
    const closed=!!ui.groupCollapsed?.[part];
    return '<section class="part-section" data-drop-part="'+part+'" data-part="'+part+'"><div class="part-heading">'+
      '<button class="part-title" data-action="togglepart" data-part="'+part+'" aria-expanded="'+!closed+'"><span class="part-pill '+part+'">'+icon(pIcon[part],16)+' '+L(part)+
      ' <b>'+entries.length+'</b> <span class="part-caret">'+icon('chevronDown',14)+'</span></span></button>'+
      '<button class="part-add" data-unified-add="part" data-part="'+part+'" title="'+L('add')+' · '+L(part)+'" aria-label="'+L('add')+' · '+L(part)+'">'+icon('plus',18)+'</button></div>'+
      '<div class="part-list-wrap '+(closed?'is-collapsed':'')+'" aria-hidden="'+closed+'" '+(closed?'inert':'')+'><div class="part-list">'+
      (entries.length?entries.map(itemVisual).join(''):'<button class="part-empty" data-unified-add="part" data-part="'+part+'"><span>'+L('empty_'+part)+'</span><span class="part-empty-add">'+icon('plus',16)+'</span></button>')+
      '</div></div></section>';
  }
  // Give even five-minute activities space to show a wrapped title and its time.
  // Visual height is deliberately independent of the task's real duration.
  function visualHeight(item,lanes,px){
    const phone=(window.innerWidth||390)<=700;
    const viewport=window.innerWidth||390;
    const fullLaneWidth=phone?Math.max(230,viewport-110):Math.max(360,Math.min(860,viewport-300));
    const width=fullLaneWidth/Math.max(1,lanes);
    const reserved=phone?(lanes>1?54:68):80;
    const textWidth=Math.max(48,width-reserved);
    const charsPerLine=Math.max(6,Math.floor(textWidth/(phone?7.25:7.7)));
    const title=String(item.title||'');
    // Estimate word wrapping to reserve enough space before the browser lays out.
    let lines=1,position=0;
    for(const word of title.split(/\s+/)){
      if(!word)continue;
      if(position===0){lines+=Math.max(0,Math.ceil(word.length/charsPerLine)-1);position=word.length%charsPerLine||charsPerLine;continue}
      if(position+1+word.length<=charsPerLine)position+=1+word.length;
      else{lines++;lines+=Math.max(0,Math.ceil(word.length/charsPerLine)-1);position=word.length%charsPerLine||charsPerLine}
    }
    const contentHeight=lines*(phone?17:18)+31;
    return Math.ceil(Math.max(phone?65:62,contentHeight));
  }
  function allocateMobile(entries,px){
    // Phone screens cannot display readable titles in three or four skinny lanes.
    // Limit conflicting activities to two lanes, stacking overflow vertically.
    // Each card still displays its real scheduled time; dragging uses the ruler.
    const ordered=entries.slice().sort((a,b)=>a.start-b.start||(b.minutes-a.minutes));
    const groups=[];let group=null;
    for(const item of ordered){
      const top=item.start*px/60;
      const end=top+visualHeight(item,1,px)+7;
      if(!group||top>=group.end){
        group={end,items:[]};groups.push(group);
      }
      group.items.push(item);group.end=Math.max(group.end,end);
    }
    let bottom=-Infinity;
    const placed=[];
    for(const group of groups){
      const lanes=group.items.length>1?2:1;
      const firstScheduled=group.items[0].start*px/60;
      const offset=Math.max(0,bottom+8-firstScheduled);
      const laneEnd=Array(lanes).fill(-Infinity);
      for(const item of group.items){
        const scheduled=item.start*px/60+offset;
        const height=visualHeight(item,lanes,px);
        let lane=0,top=Math.max(scheduled,laneEnd[0]);
        for(let candidate=1;candidate<lanes;candidate++){
          const candidateTop=Math.max(scheduled,laneEnd[candidate]);
          if(candidateTop<top){lane=candidate;top=candidateTop}
        }
        placed.push({item,lane,lanes,height,displayTop:top});
        laneEnd[lane]=top+height+8;
      }
      bottom=Math.max(...laneEnd);
    }
    return placed;
  }
  function allocate(entries,px=120){
    if((window.innerWidth||390)<=700)return allocateMobile(entries,px);
    // Measure visual overlap, not only schedule overlap, so taller labels never
    // cover neighboring entries. Iterate as lane widths affect word wrapping.
    const ordered=entries.slice().sort((a,b)=>a.start-b.start||(b.minutes-a.minutes));
    const lanesExpected=new Map(ordered.map((t,i)=>[i,1]));
    let groups=[];
    for(let pass=0;pass<Math.min(ordered.length+2,16);pass++){
      groups=[];let group=null;
      ordered.forEach((item,i)=>{
        const start=item.start*px/60;
        const height=visualHeight(item,lanesExpected.get(i),px);
        if(!group||start>=group.end){
          group={end:start,rows:[],ends:[]};
          groups.push(group);
        }
        const slot=group.ends.findIndex(end=>end<=start);
        const lane=slot<0?group.ends.length:slot;
        const end=start+height+6;
        group.ends[lane]=end;
        group.end=Math.max(group.end,end);
        group.rows.push({item,index:i,lane});
      });
      let changed=false;
      for(const group of groups)for(const row of group.rows){
        if(group.ends.length>lanesExpected.get(row.index)){
          lanesExpected.set(row.index,group.ends.length);changed=true;
        }
      }
      if(!changed)break;
    }
    return groups.flatMap(g=>g.rows.map(({item,lane,index})=>{
      const lanes=g.ends.length;
      return {item,lane,lanes,height:visualHeight(item,lanes,px)};
    }));
  }
  function hourBlock({item,lane,lanes,height,displayTop},first,px){
    const t=item, y=(displayTop??t.start*px/60)-first*px+2;
    const isEvent=t.kind==='event',color=isEvent?t.color:null;
    const role=isEvent?L('event'):L('task');
    const label=isEvent?t.timeLabel:fmtLength(t.minutes);
    const props='style="top:'+y+'px;height:'+height+'px;left:'+(100*lane/lanes).toFixed(4)+'%;width:calc('+(100/lanes).toFixed(4)+'% - 3px)'+(color?';--calendar-accent:'+esc(color):'')+'"';
    const content='<strong>'+esc(t.title)+'</strong><small>'+esc(label)+'</small>';
    const body=isEvent?(t.href?'<a href="'+esc(t.href)+'" target="_blank" rel="noopener noreferrer" class="hour-info" aria-label="'+esc(role+': '+t.title)+'">'+content+'</a>':'<div class="hour-info">'+content+'</div>'):
      '<button data-action="edit" data-id="'+esc(t.id)+'" class="hour-info" aria-label="'+esc(role+': '+t.title)+'">'+content+'</button>';
    return '<div class="mellow-day-block '+(isEvent?'merged-calendar-block':'merged-task-block '+esc(t.category))+' '+(t.done?'completed':'')+
      '" data-lanes="'+lanes+'" data-drag-item="'+(isEvent?'event':'task')+'" data-drag-id="'+esc(t.id)+'" '+(isEvent?'data-calendar-id="'+esc(t.calendarId)+'"':'')+' '+props+'><span class="hour-color"></span><span class="hour-emoji" aria-hidden="true">'+(isEvent?esc(t.emoji||'📅'):esc(t.emoji||'🌿'))+'</span>'+body+
      (isEvent?'':'<button class="check hour-check '+(t.done?'checked':'')+'" data-action="done" data-id="'+esc(t.id)+'" aria-label="'+esc(t.title)+'">'+(t.done?icon('check',14):'')+'</button>')+
      '</div>';
  }
  function hourly(items){
    const timed=items.filter(t=>t.start!=null&&!(t.kind==='event'&&t.allDay)&&Number.isFinite(t.start)&&t.start>=0&&t.start<1440);
    const allDay=items.filter(t=>t.kind==='event'&&t.allDay);
    const flexible=items.filter(t=>t.kind==='task'&&t.start==null);
    const earliest=timed.length?Math.floor(Math.min(...timed.map(t=>t.start))/60):6;
    const first=timed.length?Math.max(0,ui.date===today()?Math.min(earliest,Math.floor(minNow()/60)):earliest):6;
    const px=(window.innerWidth||390)<=700?74:88;
    let hours='';
    for(let h=first;h<24;h++)hours+='<div class="hour" style="height:'+px+'px"><span>'+fmt(h*60)+'</span>'+
      '<button class="hour-add" data-unified-add="hour" data-start="'+h*60+'" aria-label="'+L('add')+' '+fmt(h*60)+'">'+icon('plus',16)+'</button></div>';
    const laidOut=allocate(timed,px);
    const blocks=laidOut.map(t=>hourBlock(t,first,px)).join('');
    const totalHeight=Math.max((24-first)*px+5,...laidOut.map(t=>(t.displayTop??t.item.start*px/60)-first*px+t.height+16));
    const now=ui.date===today()?minNow():null;
    const marker=now!=null&&now>=first*60?'<div class="nowline" style="top:'+((now-first*60)/60*px)+'px"><em>'+L('now')+'</em></div>':'';
    return '<div class="hour-section">'+
      (allDay.length?'<section class="merged-all-day card"><div class="sectionbar"><h3>'+icon('calendar',17)+' '+L('dayEvents')+'</h3></div>'+allDay.map(eventVisual).join('')+'</section>':'')+
      '<div class="flex-header merged-anytime-heading"><h3>'+icon('clock',16)+' '+L('flexible')+' ('+flexible.length+')</h3><button class="part-add" data-unified-add="part" data-part="other">'+icon('plus',18)+'</button></div>'+
      '<div class="daytask-list card" data-drop-part="other">'+(flexible.length?flexible.map(taskVisual).join(''):'')+
      '<button class="part-empty" data-unified-add="part" data-part="other"><span>'+L('empty_other')+'</span><span class="part-empty-add">'+icon('plus',16)+'</span></button></div>'+
      '<div class="sectionbar merged-planned-heading"><h3>'+icon('clock',16)+' '+L('scheduled')+' ('+timed.length+')</h3></div>'+
      '<div class="card hourly-shell"><div class="agenda hourly-agenda merged-hourly-agenda" data-drop-hours="true" data-first-minute="'+first*60+'" data-hour-px="'+px+'" style="height:'+totalHeight+'px">'+hours+
      '<div class="merged-hourly-overlay">'+blocks+'</div>'+marker+'</div></div></div>';
  }
  function legend(events){
    const c=window.MellowCalendar;
    const connected=c?.isConnected?.();
    return '<div class="merged-legend"><span>'+icon('tasks',15)+' '+L('task')+'</span><span>'+icon('calendar',15)+' '+L('event')+'</span>'+
      (connected?'<span class="gcal-live-status">'+L('connected')+(events.length?' · '+events.length:'')+'</span>'+
        '<button type="button" class="merged-refresh" data-gcal="refresh" aria-label="'+L('refresh')+'">'+icon('repeat',15)+'</button>':'<button type="button" class="merged-connect" data-gcal="open-tab">'+L('disconnected')+' '+icon('chevronRight',13)+'</button>')+
      '</div>';
  }
  renderToday=function(){
    const {items}=viewItems();
    const mode=db.settings.todayView==='hours'?'hours':'parts';
    const toggle='<div class="planner-view-toggle" role="group" aria-label="'+L('partsView')+'">'+
      '<button data-action="dayview" data-view="parts" class="'+(mode==='parts'?'selected':'')+'" aria-pressed="'+(mode==='parts')+'">'+icon('tasks',17)+' '+L('partsView')+'</button>'+
      '<button data-action="dayview" data-view="hours" class="'+(mode==='hours'?'selected':'')+'" aria-pressed="'+(mode==='hours')+'">'+icon('clock',17)+' '+L('hoursView')+'</button></div>';
    return '<div class="mellow-day-view merged-day-view"><header class="mellow-day-heading"><div class="overline">'+icon('sparkles',14)+' MELLOW / '+T('today')+'</div>'+
      '<div class="mellow-title-line"><div><h1>'+esc(dt(ui.date,{weekday:'long'}))+'</h1><p>'+esc(dt(ui.date,{day:'numeric',month:'long',year:'numeric'}))+'</p></div>'+
      '<button class="btn secondary small" data-action="gotoday">'+T('today')+'</button></div></header>'+
      '<div class="day-nav-card"><div class="day-nav-top"><button class="iconbtn" data-action="day" data-step="-7" aria-label="Previous week">'+icon('chevronLeft',20)+'</button>'+
      '<strong>'+esc(dt(ui.date,{month:'long',year:'numeric'}))+'</strong><button class="iconbtn" data-action="day" data-step="7" aria-label="Next week">'+icon('chevronRight',20)+'</button></div>'+
      '<div class="week dayticker">'+weekDays()+'</div></div>'+
      '<div class="day-planner-controls">'+toggle+'</div>'+
      (mode==='hours'?hourly(items):'<div class="day-sections">'+PARTS.map(part=>section(part,items)).join('')+'</div>')+
      '</div>';
  };
  function chooser(){
    return '<div class="modal-bg choice-modal-bg" data-unified-dismiss="true"><section class="modal create-choice-modal" role="dialog" aria-modal="true" aria-labelledby="choiceTitle">'+
      '<div class="modalheader"><div><h2 id="choiceTitle">'+L('choose')+'</h2><p class="subtle">'+L('chooseSub')+'</p></div>'+
      '<button type="button" class="iconbtn" data-unified-choice="cancel" aria-label="'+T('close')+'">'+icon('plus',20)+'</button></div>'+
      '<div class="choice-grid"><button class="choice-card choice-task" type="button" data-unified-choice="task"><span class="choice-symbol">'+icon('tasks',26)+'</span>'+
      '<span class="choice-text"><strong>'+L('makeTask')+'</strong><small>'+L('makeTaskSub')+'</small></span>'+icon('chevronRight',18)+'</button>'+
      '<button class="choice-card choice-calendar" type="button" data-unified-choice="event"><span class="choice-symbol">'+icon('calendar',26)+'</span>'+
      '<span class="choice-text"><strong>'+L('makeEvent')+'</strong><small>'+L('makeEventSub')+'</small></span>'+icon('chevronRight',18)+'</button></div></section></div>';
  }
  const previousModal=renderModal;
  renderModal=function(){return ui.modal==='chooseAdd'?chooser():previousModal()};
  function setContext(data){
    ui.createContext={
      date:ui.date,
      part:PARTS.includes(data.part)?data.part:'other',
      start:Number.isFinite(data.start)?data.start:null
    };
    ui.modal='chooseAdd';ui.editId=null;render();
  }
  function choose(kind){
    if(kind==='cancel'){ui.modal=null;ui.createContext=null;render();return}
    const context=ui.createContext||{date:ui.date,part:'other',start:null};
    if(kind==='task'){
      ui.newPart=context.part;ui.editId=null;ui.stepContext=null;ui.stepDraft=null;ui.stepCandidates=[];ui.modal='task';render();
      const date=document.querySelector('#taskDate');if(date)date.value=context.date;
      if(context.start!=null){const start=document.querySelector('#taskStart');if(start)start.value=fmt(context.start)}
      document.querySelector('#taskTitle')?.focus();
    }else if(kind==='event'){
      if(!window.MellowCalendar?.isConnected?.()){
        ui.modal=null;ui.tab='calendar';render();toast(L('needGoogle'));return;
      }
      ui.modal='calendarEvent';render();
      document.querySelector('#gcalTitle')?.focus();
    }
  }
  document.addEventListener('click',e=>{
    const action=e.target.closest?.('[data-unified-add]');
    if(action){
      e.preventDefault();e.stopImmediatePropagation();
      const part=action.dataset.part||'other',start=action.dataset.start!=null?Number(action.dataset.start):null;
      setContext({part,start});return;
    }
    const choice=e.target.closest?.('[data-unified-choice]');
    if(choice){e.preventDefault();e.stopImmediatePropagation();choose(choice.dataset.unifiedChoice);return}
    if(e.target?.dataset?.unifiedDismiss==='true'){
      e.preventDefault();e.stopImmediatePropagation();choose('cancel');return;
    }
  },true);
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&ui.modal==='chooseAdd'){ui.modal=null;ui.createContext=null;render()}
  },true);
  window.MellowUnified={viewItems,allocate,open:(part='other',start=null)=>setContext({part,start})};
  render();
})();
