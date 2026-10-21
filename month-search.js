/* Mellow v15: fast month jump and all-date search.
   Local tasks are searched entirely offline. Connected Google Calendar search is
   opt-in and paginated. Search results and tokens never leave this browser session. */
(()=>{
  const i=(name,size=18)=>mellowIcon(name,size);
  const glass='<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.5"/><path d="m16 16 5 5"/></svg>';
  const pencil='<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 5 4 4M4 20l4.5-1 10-10a2.12 2.12 0 0 0-3-3l-10 10L4 20Z"/></svg>';  const w={
    en:{search:'Search everything',searchHint:'Find tasks and Google events from any date',
      monthTitle:'Jump to a date',today:'Today',close:'Close',previous:'Previous month',next:'Next month',
      all:'All',past:'Past',future:'Upcoming',searchPlaceholder:'Search tasks and events…',
      start:'Type at least 2 characters to search.',local:'Saved Mellow tasks',
      connected:'Google Calendar events included',disconnected:'Connect Google Calendar to include its events',
      searching:'Searching Google Calendar…',noMatches:'No matching tasks or events',
      results:'results',task:'Task',event:'Google event',open:'Open',edit:'Edit',view:'View in Google',
      noDate:'Anytime / no date',more:'Showing the closest matches. Refine your search for more results.',
      partial:'Google returned partial results. Try a more specific search.',
      error:'Google search unavailable. Your local task results are still shown.',
      dayHint:'Dots show days containing saved Mellow tasks.',jump:'Jump to day',
      searchAll:'Search tasks and calendar events',month:'Open monthly calendar'},
    he:{search:'חיפוש בכל המשימות והאירועים',searchHint:'איתור משימות ואירועי Google מכל תאריך',
      monthTitle:'מעבר לתאריך',today:'היום',close:'סגירה',previous:'החודש הקודם',next:'החודש הבא',
      all:'הכול',past:'בעבר',future:'בעתיד',searchPlaceholder:'חיפוש משימות ואירועים…',
      start:'יש להקליד לפחות שתי אותיות כדי לחפש.',local:'משימות שמורות ב-Mellow',
      connected:'כולל אירועים מיומן Google',disconnected:'כדי לחפש גם ביומן Google, יש להתחבר ליומן',
      searching:'מחפשת ביומן Google…',noMatches:'לא נמצאו משימות או אירועים',
      results:'תוצאות',task:'משימה',event:'אירוע Google',open:'פתיחה',edit:'עריכה',view:'פתיחה ב-Google',
      noDate:'ללא תאריך',more:'מוצגות התוצאות הקרובות ביותר. לחיפוש רחב יותר, נסי לדייק את הטקסט.',
      partial:'התקבלו רק חלק מהתוצאות מ-Google. כדאי לדייק את החיפוש.',
      error:'החיפוש ב-Google לא זמין. תוצאות המשימות המקומיות עדיין מופיעות.',
      dayHint:'נקודות מסמנות ימים עם משימות שמורות ב-Mellow.',jump:'מעבר ליום',
      searchAll:'חיפוש בכל התאריכים',month:'פתיחת לוח חודשי'}
  };
  const W=x=>w[db.settings.lang==='he'?'he':'en'][x]||x;
  const lookup={query:'',filter:'all',remote:[],loading:false,partial:false,error:'',serial:0,timer:null};
  let monthShown='';
  const connected=()=>!!window.MellowCalendar?.isConnected?.();
  const keyDay=s=>/^\d{4}-\d{2}-\d{2}$/.test(String(s||''))?s:null;
  const firstOf=d=>{const x=fromKey(d);return dayKey(new Date(x.getFullYear(),x.getMonth(),1,12))};
  const monthMove=(d,delta)=>{const x=fromKey(d);return dayKey(new Date(x.getFullYear(),x.getMonth()+delta,1,12))};
  const titleDate=date=>dt(date,{weekday:'short',day:'numeric',month:'short',year:'numeric'});
  const yearTime=s=>s?fromKey(s).getTime():Number.POSITIVE_INFINITY;
  const matchesLocal=()=>{
    const q=lookup.query.trim().toLocaleLowerCase();
    if(q.length<2)return [];
    return db.tasks.filter(t=>{
      const combined=[t.title,t.notes,T(t.category),...(t.steps||[]).map(s=>s.title)].join(' ').toLocaleLowerCase();
      return combined.includes(q);
    }).map(t=>({kind:'task',id:t.id,title:t.title,date:t.date||null,start:t.start,category:t.category,done:t.done}));
  };
  const resultsAll=()=>{
    const existingLinked=new Set(db.tasks.map(t=>t.googleCalendar?.eventId&&t.googleCalendar?.calendarId?
      t.googleCalendar.calendarId+':'+t.googleCalendar.eventId:null).filter(Boolean));
    const merged=[...matchesLocal(),...lookup.remote.filter(e=>!existingLinked.has(e.calendarId+':'+e.id))];
    const todayNum=yearTime(today());
    return merged.filter(x=>{
      if(lookup.filter==='all'||!x.date)return lookup.filter==='all';
      const t=yearTime(x.date);return lookup.filter==='past'?t<todayNum:t>=todayNum;
    }).sort((a,b)=>{
      const da=Math.abs(yearTime(a.date)-todayNum),dbb=Math.abs(yearTime(b.date)-todayNum);
      const aD=Number.isFinite(da)?da:-1,bD=Number.isFinite(dbb)?dbb:-1;
      return aD-bD||(a.date||'').localeCompare(b.date||'')||(a.start??1440)-(b.start??1440);
    });
  };
  const monthCounts=()=>{
    const m=new Map();
    for(const t of db.tasks)if(t.date)m.set(t.date,(m.get(t.date)||0)+1);
    return m;
  };
  const monthGrid=()=>{
    const base=fromKey(monthShown||firstOf(ui.date)),year=base.getFullYear(),month=base.getMonth();
    const first=new Date(year,month,1,12),offset=first.getDay();
    const count=new Date(year,month+1,0).getDate();
    const columns=Array.from({length:7},(_,j)=>{
      const d=new Date(2026,9,18+j,12);
      return '<span class="jump-weekday">'+esc(new Intl.DateTimeFormat(locale(),{weekday:'short'}).format(d))+'</span>';
    }).join('');
    const counts=monthCounts();
    let days='';
    for(let idx=0;idx<42;idx++){
      const d=new Date(year,month,idx-offset+1,12),key=dayKey(d);
      const outside=d.getMonth()!==month,selected=key===ui.date,now=key===today(),has=counts.get(key)||0;
      days+='<button type="button" class="jump-date'+(outside?' outside':'')+(selected?' selected':'')+(now?' is-today':'')+
        '" data-planner-date="'+key+'" aria-label="'+esc(titleDate(key)+(has?' · '+has+' tasks':''))+'" aria-pressed="'+selected+'">'+
        '<span>'+d.getDate()+'</span>'+(has?'<b class="jump-task-dot" aria-hidden="true"></b>':'')+'</button>';
    }
    return '<div class="jump-calendar-weekdays">'+columns+'</div><div class="jump-calendar-grid">'+days+'</div>';
  };
  function monthModal(){
    monthShown=monthShown||firstOf(ui.date);
    return '<div class="modal-bg jump-overlay" data-planner-dismiss="month">'+
      '<section class="modal jump-month-modal" role="dialog" aria-modal="true" aria-labelledby="jumpMonthTitle">'+
      '<div class="jump-modal-header"><div><p class="jump-eyebrow">MELLOW</p><h2 id="jumpMonthTitle">'+W('monthTitle')+'</h2></div>'+
      '<button type="button" class="jump-close" data-planner-close="true" aria-label="'+W('close')+'">'+i('plus',19)+'</button></div>'+
      '<div class="jump-month-toolbar"><button type="button" data-planner-shift="-1" aria-label="'+W('previous')+'">'+i('chevronLeft',19)+'</button>'+
      '<h3>'+esc(dt(monthShown,{month:'long',year:'numeric'}))+'</h3>'+
      '<button type="button" data-planner-shift="1" aria-label="'+W('next')+'">'+i('chevronRight',19)+'</button></div>'+
      '<div id="jumpMonthGrid">'+monthGrid()+'</div>'+
      '<div class="jump-bottom"><span class="jump-help">'+W('dayHint')+'</span>'+
      '<button type="button" class="btn secondary small" data-planner-date="'+today()+'">'+W('today')+'</button></div>'+
      '</section></div>';
  }
  function displayEntry(r){
    const kind=r.kind==='event'?'event':'task';
    const timing=r.date?titleDate(r.date)+(r.start!=null?' · '+fmt(r.start):''):W('noDate');
    const meta=r.kind==='event'?r.calendarName:T(r.category);
    const subtitle=timing+(meta?' · '+meta:'');
    const edit=r.kind==='task'?'<button class="jump-edit" type="button" data-planner-edit="'+esc(r.id)+'" aria-label="'+W('edit')+'">'+pencil+'</button>':
      (r.href?'<a class="jump-edit" href="'+esc(r.href)+'" target="_blank" rel="noopener noreferrer" aria-label="'+W('view')+'">'+i('chevronRight',18)+'</a>':'');
    const title=esc(r.title);
    return '<div class="jump-result '+kind+'">'+
      '<span class="jump-result-icon">'+i(kind==='event'?'calendar':'tasks',20)+'</span>'+
      '<button type="button" class="jump-result-main" '+(r.date?'data-planner-date="'+esc(r.date)+'"':'data-planner-edit="'+esc(r.id)+'"')+'>'+
      '<strong>'+title+'</strong><span>'+esc(subtitle)+'</span></button>'+edit+'</div>';
  }
  function resultsHTML(){
    const term=lookup.query.trim();
    if(term.length<2)return '<p class="jump-state">'+W('start')+'</p>';
    const all=resultsAll(),limited=all.slice(0,120);
    let status='<p class="jump-count">'+all.length+' '+W('results')+'</p>';
    if(lookup.loading)status+='<p class="jump-state jump-loading">'+i('clock',15)+' '+W('searching')+'</p>';
    if(lookup.error)status+='<p class="jump-warning">'+W('error')+' '+esc(lookup.error)+'</p>';
    if(lookup.partial)status+='<p class="jump-warning">'+W('partial')+'</p>';
    if(all.length>limited.length)status+='<p class="jump-warning">'+W('more')+'</p>';
    return status+(limited.length?'<div class="jump-result-list">'+limited.map(displayEntry).join('')+'</div>':
      (!lookup.loading?'<p class="jump-state">'+W('noMatches')+'</p>':''));
  }
  function searchModal(){
    const chosen=lookup.filter;
    return '<div class="modal-bg jump-overlay" data-planner-dismiss="search">'+
      '<section class="modal jump-search-modal" role="dialog" aria-modal="true" aria-labelledby="jumpSearchTitle">'+
      '<div class="jump-modal-header"><div><p class="jump-eyebrow">MELLOW</p><h2 id="jumpSearchTitle">'+W('search')+'</h2></div>'+
      '<button type="button" class="jump-close" data-planner-close="true" aria-label="'+W('close')+'">'+i('plus',19)+'</button></div>'+
      '<p class="jump-subtext">'+W('searchHint')+'</p>'+
      '<div class="jump-search-input">'+glass+'<input type="search" id="journeyQuery" autocomplete="off" spellcheck="false" value="'+esc(lookup.query)+'" placeholder="'+W('searchPlaceholder')+'" aria-label="'+W('search')+'"></div>'+
      '<div class="jump-search-filters">'+['all','past','future'].map(f=>
        '<button type="button" data-planner-filter="'+f+'" aria-pressed="'+(chosen===f)+'" class="'+(chosen===f?'selected':'')+'">'+W(f)+'</button>').join('')+'</div>'+
      '<div class="jump-source-label">'+i('tasks',14)+' '+W('local')+' · '+(connected()?W('connected'):W('disconnected'))+'</div>'+
      '<div id="journeySearchResults" class="jump-search-results" aria-live="polite">'+resultsHTML()+'</div>'+
      '</section></div>';
  }
  const prevModal=renderModal;
  renderModal=function(){
    if(ui.modal==='monthSpread')return monthModal();
    if(ui.modal==='globalSearch')return searchModal();
    return prevModal();
  };
  const searchIcon=()=>'<button class="jump-search-icon" type="button" data-planner-nav="search" aria-label="'+
    W('searchAll')+'" title="'+W('searchAll')+'">'+glass+'</button>';
  function insertIconInRow(html,rowClass){
    const start=html.indexOf('<div class="'+rowClass+'">');
    if(start<0)return html;
    const end=html.indexOf('</div>',start);
    if(end<0)return html;
    return html.slice(0,end)+searchIcon()+html.slice(end);
  }
  const prevToday=renderToday;
  renderToday=function(){
    let html=prevToday();
    const label=esc(dt(ui.date,{month:'long',year:'numeric'}));
    const original='<strong>'+label+'</strong>';
    if(html.includes(original)){
      html=html.replace(original,'<button class="jump-month-trigger" type="button" data-planner-nav="month" aria-label="'+W('month')+'">'+label+i('chevronDown',15)+'</button>');
    }
    // One quiet icon beside the month controls, not a full-width search button.
    return insertIconInRow(html,'day-nav-top');
  };
  const prevTasks=renderTasks;
  renderTasks=function(){
    // The global search covers tasks too, so avoid a second full-size search bar.
    return insertIconInRow(prevTasks(),'sectionbar');
  };
  if(window.MellowCalendar?.renderPage){
    const prevPage=window.MellowCalendar.renderPage;
    window.MellowCalendar.renderPage=function(){
      const html=prevPage();
      if(html.includes('<div class="gcal-toolbar">'))return insertIconInRow(html,'gcal-toolbar');
      return html.replace('<section class="card gcal-settings-card">',
        '<div class="jump-calendar-search-header">'+searchIcon()+'</div><section class="card gcal-settings-card">');
    };
  }
  function reloadList(){
    if(ui.modal==='globalSearch'){
      const node=document.querySelector('#journeySearchResults');
      if(node)node.innerHTML=resultsHTML();
    }
  }
  async function fetchSearch(serial,term){
    if(!connected()||!window.MellowCalendar?.searchEvents){
      lookup.loading=false;lookup.remote=[];reloadList();return;
    }
    try{
      const r=await window.MellowCalendar.searchEvents(term);
      if(serial!==lookup.serial||ui.modal!=='globalSearch')return;
      lookup.remote=r.items||[];lookup.partial=!!r.partial;lookup.error=r.error||'';
    }catch(e){
      if(serial!==lookup.serial||ui.modal!=='globalSearch')return;
      lookup.error=String(e.message||e);
    }finally{
      if(serial===lookup.serial){lookup.loading=false;reloadList()}
    }
  }
  function runSearch(){
    clearTimeout(lookup.timer);
    const serial=++lookup.serial,term=lookup.query.trim();
    lookup.remote=[];lookup.partial=false;lookup.error='';
    lookup.loading=term.length>=2&&connected();
    reloadList();
    if(term.length>=2&&connected())lookup.timer=setTimeout(()=>{void fetchSearch(serial,term)},360);
  }
  function close(){
    ui.modal=null;lookup.serial++;clearTimeout(lookup.timer);render();
  }
  function jump(date){
    const key=keyDay(date);
    if(!key)return;
    const changed=ui.date!==key||ui.tab!=='today';
    ui.date=key;ui.tab='today';ui.modal=null;
    clearTimeout(lookup.timer);lookup.serial++;
    render();
    if(changed)void window.MellowCalendar?.refresh?.();
    window.scrollTo?.({top:0,behavior:'instant'});
  }
  function edit(id){
    if(!findTask(id))return;
    lookup.serial++;clearTimeout(lookup.timer);
    ui.editId=id;ui.modal='task';render();
  }
  document.addEventListener('click',e=>{
    const target=e.target.closest?.('[data-planner-nav],[data-planner-close],[data-planner-shift],[data-planner-date],[data-planner-edit],[data-planner-filter]');
    if(target){
      e.preventDefault();e.stopImmediatePropagation();
      if(target.dataset.plannerNav==='month'){
        monthShown=firstOf(ui.date);ui.modal='monthSpread';render();return;
      }
      if(target.dataset.plannerNav==='search'){
        lookup.query='';lookup.filter='all';lookup.remote=[];lookup.loading=false;lookup.error='';lookup.partial=false;
        clearTimeout(lookup.timer);lookup.serial++;ui.modal='globalSearch';render();
        document.querySelector('#journeyQuery')?.focus();return;
      }
      if('plannerClose' in target.dataset){close();return}
      if('plannerShift' in target.dataset){
        monthShown=monthMove(monthShown,Number(target.dataset.plannerShift));render();return;
      }
      if('plannerDate' in target.dataset){jump(target.dataset.plannerDate);return}
      if('plannerEdit' in target.dataset){edit(target.dataset.plannerEdit);return}
      if('plannerFilter' in target.dataset){
        lookup.filter=target.dataset.plannerFilter;
        document.querySelectorAll('[data-planner-filter]').forEach(b=>{
          const chosen=b.dataset.plannerFilter===lookup.filter;
          b.classList.toggle('selected',chosen);b.setAttribute('aria-pressed',String(chosen));
        });
        reloadList();return;
      }
    }
    if(e.target?.dataset?.plannerDismiss){
      e.preventDefault();e.stopImmediatePropagation();close();
    }
  },true);
  document.addEventListener('input',e=>{
    if(e.target?.id!=='journeyQuery')return;
    lookup.query=e.target.value.slice(0,120);
    runSearch();
  },true);
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&['monthSpread','globalSearch'].includes(ui.modal)){
      e.preventDefault();e.stopImmediatePropagation();close();
    }
  },true);
  window.MellowJump={monthGrid,openMonth:()=>{monthShown=firstOf(ui.date);ui.modal='monthSpread';render()},openSearch:()=>{ui.modal='globalSearch';render()},testSearch:async q=>window.MellowCalendar?.searchEvents?.(q)};
  render();
})();