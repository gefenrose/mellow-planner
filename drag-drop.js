/* Mellow v12 — pointer/touch/keyboard drag to reschedule tasks and events.
   No external drag library; handles protect normal iPhone scrolling and ordinary tapping. */
(()=>{
  const LABELS={
    en:{drag:'Drag to move',task:'task',event:'calendar event',drop:'Drop to move',category:'Change task category',
      moved:'Moved',other:'Other / Anytime',locked:'This calendar event cannot be edited.',allDay:'All-day events are not draggable.',
      noOther:'Calendar events need an exact time. Drag to Morning, Afternoon, Evening, or the hourly view.',
      failed:'Could not move this event in Google Calendar.',noTime:'Move to',linked:'Mellow saved the task. Reconnect Google Calendar to sync its time.',unscheduledLinked:'Task set to Anytime; the linked Google event kept its original time.',syncFailed:'Task saved in Mellow, but the linked Google event could not be updated.',
      keyboard:'Use the arrow keys to choose a time or section. Press C for task categories, Enter to save, or Escape to cancel.',
      categoryDock:'Drop here to change task category',cancel:'Move canceled',
      morning:'Morning',afternoon:'Afternoon',evening:'Evening',night:'Night',otherPart:'Other / Anytime',
      work:'Work',home:'Home',self:'Personal',health:'Health',social:'Social',errands:'Errands',
      section:'Move to',minute:'New time',savedGoogle:'Updated in Google Calendar',busy:'Saving change…'},
    he:{drag:'גרירה לשינוי מקום',task:'משימה',event:'אירוע ביומן',drop:'שחרור כדי להעביר',category:'שינוי קטגוריית המשימה',
      moved:'הועבר',other:'אחר / בכל שעה',locked:'אין הרשאת עריכה לאירוע זה.',allDay:'לא ניתן לגרור אירועים של יום שלם.',
      noOther:'אירוע ביומן צריך שעה מדויקת. גררי לבוקר, צהריים, ערב או לציר השעות.',
      failed:'אי אפשר לעדכן את האירוע ב-Google Calendar.',noTime:'העברה אל',linked:'המשימה נשמרה ב-Mellow. יש להתחבר ל-Google כדי לסנכרן את השעה.',unscheduledLinked:'המשימה הועברה ל״בכל שעה״. האירוע המקושר ב-Google נשאר בשעה המקורית.',syncFailed:'המשימה נשמרה ב-Mellow, אך לא ניתן לעדכן את האירוע המקושר ב-Google.',
      keyboard:'השתמשי בחצים לבחירת שעה או חלק ביום. C לשינוי קטגוריה, Enter לשמירה, Escape לביטול.',
      categoryDock:'שחררי כאן כדי לשנות קטגוריית משימה',cancel:'ההעברה בוטלה',
      morning:'בוקר',afternoon:'צהריים',evening:'ערב',night:'לילה',otherPart:'אחר / בכל שעה',
      work:'עבודה',home:'בית',self:'אישי',health:'בריאות',social:'חברה',errands:'סידורים',
      section:'העברה אל',minute:'שעה חדשה',savedGoogle:'עודכן ביומן Google',busy:'שומרת שינויים…'}
  };
  const L=k=>LABELS[db.settings.lang==='he'?'he':'en'][k]||k;
  const PARTS=['other','morning','afternoon','evening'];
  const CATS=['work','home','self','health','social','errands'];
  const anchor={morning:540,afternoon:840,evening:1080};
  const timeLabel=n=>fmt(Math.max(0,Math.min(1439,n)));
  const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
  let active=null,keyboard=null,scrollFrame=null,ghost=null,categoryDock=null,announceEl=null,busy=false,press=null,pressTimer=null;
  let preventTapUntil=0,timeBadge=null,timeGuide=null;
  const svg='<svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><circle cx="8" cy="5" r="1.7"/><circle cx="16" cy="5" r="1.7"/><circle cx="8" cy="12" r="1.7"/><circle cx="16" cy="12" r="1.7"/><circle cx="8" cy="19" r="1.7"/><circle cx="16" cy="19" r="1.7"/></svg>';
  const itemKey=item=>item?.dataset?.dragId||'';
  function getItem(item){
    if(!item)return null;
    const kind=item.dataset.dragItem,id=itemKey(item);
    if(kind==='task'){
      const task=findTask(id);
      return task?{kind,id,task,title:task.title,start:task.start,minutes:task.minutes,category:task.category}:null;
    }
    if(kind==='event'){
      const calendarId=item.dataset.calendarId;
      const event=window.MellowUnified?.viewItems?.().events.find(e=>e.id===id&&e.calendarId===calendarId);
      if(!event)return null;
      return {kind,id,calendarId,event,title:event.title,start:event.start,minutes:event.minutes,allDay:event.allDay,
        editable:!!window.MellowCalendar?.canMove?.(calendarId,id)};
    }
    return null;
  }
  function ensureAccessories(){
    if(!announceEl){
      announceEl=document.createElement('div');announceEl.className='dnd-screenreader';announceEl.setAttribute('aria-live','polite');announceEl.setAttribute('aria-atomic','true');
      document.body.appendChild(announceEl);
    }
    if(!categoryDock){
      categoryDock=document.createElement('div');categoryDock.className='dnd-category-dock';categoryDock.id='dnd-category-dock';
      categoryDock.setAttribute('role','group');categoryDock.setAttribute('aria-label',L('categoryDock'));
      categoryDock.innerHTML='<span class="dnd-dock-label"></span><div class="dnd-dock-options">'+CATS.map(c=>'<button type="button" data-drop-category="'+c+'" class="dnd-category-chip '+c+'">'+L(c)+'</button>').join('')+'</div>';
      document.body.appendChild(categoryDock);
    }
    categoryDock.querySelector('.dnd-dock-label').textContent=L('categoryDock');
    if(!ghost){
      ghost=document.createElement('div');ghost.className='dnd-ghost dnd-ghost-card';ghost.setAttribute('aria-hidden','true');
      document.body.appendChild(ghost);
    }
    if(!timeBadge){
      timeBadge=document.createElement('div');timeBadge.className='dnd-time-badge';
      timeBadge.setAttribute('aria-hidden','true');document.body.appendChild(timeBadge);
    }
    if(!timeGuide){
      timeGuide=document.createElement('div');timeGuide.className='dnd-time-guide';
      timeGuide.setAttribute('aria-hidden','true');
    }
  }
  function announce(s){if(announceEl)announceEl.textContent=s}
  function clearPress(){
    if(pressTimer!=null){clearTimeout(pressTimer);pressTimer=null}
    press=null;
  }
  function paintGhost(){
    if(!ghost||!active)return;
    const emoji=(active.el.querySelector('.daytask-icon,.hour-emoji')?.textContent||'🌿').trim()||'🌿';
    const time=(active.el.querySelector('.daytask-body small,.hour-info small')?.textContent||'').trim();
    const badge=document.createElement('span');badge.className='dnd-ghost-emoji';badge.textContent=emoji;
    const info=document.createElement('span');info.className='dnd-ghost-info';
    const title=document.createElement('strong');title.textContent=active.title;
    const meta=document.createElement('small');meta.textContent=time;
    info.append(title,meta);
    const check=document.createElement('span');check.className='dnd-ghost-check';
    ghost.replaceChildren(badge,info,check);
  }
  function decorate(){
    if(active||keyboard)return;
    const items=document.querySelectorAll('.merged-day-view [data-drag-item]');
    for(const el of items){
      if(el.querySelector('.dnd-grip'))continue;
      const obj=getItem(el);
      if(!obj||obj.kind==='event'&&(!obj.editable||obj.allDay))continue;
      const grip=document.createElement('button');
      grip.type='button';grip.className='dnd-grip';grip.innerHTML=svg;
      grip.setAttribute('aria-label',L('drag')+' '+L(obj.kind)+': '+obj.title);
      grip.setAttribute('title',L('drag')+' · '+obj.title);
      grip.setAttribute('data-drag-grip','true');
      const stripe=el.querySelector('.daytask-accent,.hour-color');
      if(stripe?.nextSibling)el.insertBefore(grip,stripe.nextSibling);
      else el.insertBefore(grip,el.firstChild);
      el.classList.add('dnd-ready');
    }
  }
  const originalRender=render;
  render=function(){originalRender();decorate()};
  function enter(item,pointer){
    if(busy)return false;
    const obj=getItem(item);
    if(!obj||obj.kind==='event'&&(!obj.editable||obj.allDay))return false;
    ensureAccessories();
    const rect=item.getBoundingClientRect();
    active={...obj,el:item,pointerId:pointer?.pointerId??null,startX:pointer?.clientX??rect.left,startY:pointer?.clientY??rect.top,
      x:pointer?.clientX??rect.left,y:pointer?.clientY??rect.top,moved:false,target:null};
    return true;
  }
  function begin(){
    if(!active||active.moved)return;
    active.moved=true;document.body.classList.add('dnd-active');
    document.body.classList.toggle('dnd-task-active',active.kind==='task');
    active.el.classList.add('dnd-origin');
    paintGhost();
    ghost.classList.add('dnd-ghost-visible');
    positionGhost(active.x,active.y);
    announce(L('drag')+' '+active.title+'. '+L('keyboard'));
  }
  function hideTimePreview(){
    timeBadge?.classList.remove('dnd-time-badge-visible');
    timeGuide?.classList.remove('dnd-time-guide-visible');
  }
  function showTimePreview(target){
    if(!timeBadge||!timeGuide||!active||target?.kind!=='hour'){
      hideTimePreview();return;
    }
    const timeline=target.element;
    if(!timeline){hideTimePreview();return}
    if(timeGuide.parentNode!==timeline)timeline.appendChild(timeGuide);
    const minute=target.minute,first=Number(timeline.dataset.firstMinute||0);
    const px=Number(timeline.dataset.hourPx||61);
    timeGuide.style.top=((minute-first)/60*px)+'px';
    // Time line stays anchored to the scheduled slot, including while the timeline auto-scrolls.
    const shell=timeline.closest('.hourly-shell');
    const lineY=timeline.getBoundingClientRect().top+(minute-first)/60*px;
    const visible=shell?.getBoundingClientRect();
    timeGuide.classList.toggle('dnd-time-guide-visible',!visible||(lineY>=visible.top&&lineY<=visible.bottom));
    timeBadge.textContent=timeLabel(minute);
    const x=Number.isFinite(active.x)?active.x:timeline.getBoundingClientRect().left+66;
    const y=Number.isFinite(active.y)?active.y:lineY;
    const badgeWidth=76,badgeHeight=36;
    timeBadge.style.left=clamp(x+16,8,Math.max(8,window.innerWidth-badgeWidth-8))+'px';
    timeBadge.style.top=clamp(y-badgeHeight-32,8,Math.max(8,window.innerHeight-badgeHeight-8))+'px';
    timeBadge.classList.add('dnd-time-badge-visible');
  }
  function showTarget(target){
    const last=active.target;
    if(last?.element!==target?.element){
      document.querySelectorAll('.dnd-target').forEach(x=>x.classList.remove('dnd-target'));
      if(target?.element)target.element.classList.add('dnd-target');
    }
    active.target=target;
    showTimePreview(target);
    if(target){
      const msg=target.kind==='hour'?L('minute')+': '+timeLabel(target.minute):
        target.kind==='part'?L('section')+': '+L(target.part==='other'?'otherPart':target.part):
        L('category')+': '+L(target.category);
      if(last?.kind!==target.kind||last?.minute!==target.minute||last?.part!==target.part||last?.category!==target.category)announce(msg);
    }
  }
  function targetAt(x,y){
    const el=document.elementFromPoint(x,y);
    if(!el)return null;
    const chip=el.closest('[data-drop-category]');
    if(chip&&active.kind==='task')return {kind:'category',category:chip.dataset.dropCategory,element:chip};
    const partEl=el.closest('[data-drop-part]');
    if(partEl){
      const part=partEl.dataset.dropPart;
      if(active.kind==='event'&&part==='other')return null;
      return {kind:'part',part,element:partEl};
    }
    const timeline=el.closest('[data-drop-hours]')||document.querySelector('.merged-hourly-agenda[data-drop-hours]');
    if(timeline){
      const rect=timeline.getBoundingClientRect();
      if(x<rect.left||x>rect.right||y<rect.top||y>rect.bottom)return null;
      const first=Number(timeline.dataset.firstMinute||0),px=Number(timeline.dataset.hourPx||61);
      const duration=active.kind==='task'?Math.min(480,active.minutes||25):Math.min(1440,active.minutes||25);
      const max=active.kind==='task'?Math.max(0,1440-duration):1435;
      const raw=first+(y-rect.top)*60/px;
      const minute=clamp(Math.round(raw/15)*15,0,max);
      return {kind:'hour',minute,element:timeline};
    }
    return null;
  }
  function positionGhost(x,y){
    if(!ghost)return;
    const rect=ghost.getBoundingClientRect(),width=rect.width||230,height=rect.height||62;
    ghost.style.left=clamp(x+16,8,Math.max(8,window.innerWidth-width-8))+'px';
    const yPosition=active?.target?.kind==='hour'?y-height-18:y-height/2;
    ghost.style.top=clamp(yPosition,8,Math.max(8,window.innerHeight-height-8))+'px';
  }
  function autoScroll(){
    if(!active?.moved)return;
    const shell=document.querySelector('.merged-day-view .hourly-shell');
    if(shell){
      const rect=shell.getBoundingClientRect(),x=active.x,y=active.y;
      if(x>=rect.left&&x<=rect.right&&y>=rect.top&&y<=rect.bottom){
        const margin=55;
        const delta=y<rect.top+margin?-12:y>rect.bottom-margin?12:0;
        if(delta){
          const before=shell.scrollTop;
          shell.scrollTop+=delta;
          if(shell.scrollTop!==before)showTarget(targetAt(active.x,active.y));
        }
      }
    }
    scrollFrame=requestAnimationFrame(autoScroll);
  }
  function move(e){
    if(press&&press.pointerId===e.pointerId&&!press.ready){
      if(Math.hypot(e.clientX-press.x,e.clientY-press.y)>9){clearPress();active=null}
      return;
    }
    if(!active||active.pointerId!==e.pointerId)return;
    active.x=e.clientX;active.y=e.clientY;
    document.body.classList.toggle('dnd-dock-visible',active.kind==='task'&&active.y>=window.innerHeight-230);
    if(!active.moved&&Math.hypot(active.x-active.startX,active.y-active.startY)<5)return;
    if(!active.moved){
      begin();
      if(scrollFrame==null)scrollFrame=requestAnimationFrame(autoScroll);
    }
    active.didMove=true;
    e.preventDefault();
    showTarget(targetAt(active.x,active.y));
    positionGhost(active.x,active.y);
  }
  function removeVisual(){
    if(scrollFrame!=null){cancelAnimationFrame(scrollFrame);scrollFrame=null}
    active?.el?.classList.remove('dnd-origin');
    document.body.classList.remove('dnd-active','dnd-task-active','dnd-dock-visible');
    document.querySelectorAll('.dnd-target').forEach(x=>x.classList.remove('dnd-target'));
    if(ghost)ghost.classList.remove('dnd-ghost-visible');
    hideTimePreview();
    if(categoryDock)categoryDock.classList.remove('dnd-keyboard');
  }
  const calcPartMinute=(item,part)=>{
    if(part==='other')return null;
    const m=item.start;
    if(m!=null&&partFrom(m)===part)return m;
    return clamp(anchor[part]+(m!=null?m%60:0),0,1435);
  };
  const partFrom=m=>m==null||m<300?'other':m<720?'morning':m<1020?'afternoon':'evening';
  async function applyMove(info,target){
    if(!info||!target||busy)return;
    if(target.kind==='category'){
      if(info.kind!=='task')return;
      if(info.task.category===target.category)return;
      info.task.category=target.category;save();
      toast(L('moved')+' · '+L(target.category));return;
    }
    const date=ui.date;
    let minute=target.kind==='hour'?target.minute:calcPartMinute(info,target.part);
    if(info.kind==='task'){
      const task=info.task;
      if(minute!=null)minute=clamp(Math.round(minute/15)*15,0,Math.max(0,1440-task.minutes));
      if(task.date===date&&task.start===minute&&target.kind!=='part')return;
      task.date=date;task.start=minute;
      task.daypart=target.kind==='part'?target.part:(minute==null?'other':partFrom(minute));
      save();
      // Linked Mellow tasks may also have a Google event. Sync opportunistically.
      if(task.googleCalendar?.eventId){
        if(minute!=null&&window.MellowCalendar?.isConnected?.()&&window.MellowCalendar?.moveEvent){
          try{
            busy=true;
            await window.MellowCalendar.moveEvent(task.googleCalendar.calendarId,task.googleCalendar.eventId,date,minute);
            toast(L('savedGoogle'));
          }catch(err){toast(L('syncFailed')+' '+(err.message||''))}
          finally{busy=false}
        }else toast(minute==null?L('unscheduledLinked'):L('linked'));
      }else toast(L('moved')+' · '+(minute==null?L('other'):timeLabel(minute)));
      return;
    }
    if(info.kind==='event'){
      if(minute==null){toast(L('noOther'));return}
      if(info.start===minute)return;
      busy=true;toast(L('busy'));
      try{
        await window.MellowCalendar.moveEvent(info.calendarId,info.id,date,minute);
        toast(L('savedGoogle')+' · '+timeLabel(minute));
      }catch(err){toast(L('failed')+' '+String(err.message||''))}
      finally{busy=false}
    }
  }
  function release(e,canceled=false){
    if(!active||active.pointerId!==e.pointerId)return;
    const info=active,target=!canceled&&active.didMove?active.target:null,moved=!!active.didMove;
    clearPress();removeVisual();active=null;
    if(moved)preventTapUntil=Date.now()+350;
    if(target)void applyMove(info,target);
    else if(canceled&&moved)toast(L('cancel'));
  }
  document.addEventListener('pointerdown',e=>{
    if(e.button!==0||busy)return;
    const handle=e.target.closest?.('.dnd-grip');
    const item=handle?.closest('[data-drag-item]')||e.target.closest?.('[data-drag-item]');
    if(!item)return;
    if(!handle&&e.target.closest?.('.daytask-check,.hour-check,.event-open'))return;
    if(!enter(item,e))return;
    if(handle){
      e.preventDefault();
      try{handle.setPointerCapture(e.pointerId)}catch{}
      return;
    }
    if(e.pointerType==='touch'||e.pointerType==='pen'){
      press={pointerId:e.pointerId,item,x:e.clientX,y:e.clientY,ready:false};
      pressTimer=setTimeout(()=>{
        if(press?.pointerId===e.pointerId&&active?.pointerId===e.pointerId){
          press.ready=true;begin();
        }
      },320);
    }
  },true);
  document.addEventListener('pointermove',move,{passive:false,capture:true});
  document.addEventListener('pointerup',e=>{if(press?.pointerId===e.pointerId)clearPress();release(e)},true);
  document.addEventListener('pointercancel',e=>{if(press?.pointerId===e.pointerId)clearPress();release(e,true)},true);
  document.addEventListener('click',e=>{
    if(e.target.closest?.('.dnd-grip')){e.preventDefault();e.stopImmediatePropagation();return}
    if(Date.now()<preventTapUntil&&e.target.closest?.('[data-drag-item]')){
      e.preventDefault();e.stopImmediatePropagation();
    }
  },true);
  function keyboardBegin(item){
    if(!enter(item,null))return;
    keyboard={info:active,mode:document.querySelector('.merged-day-view .day-sections')?'part':'hour',index:0};
    if(keyboard.mode==='part'){
      const current=PARTS.indexOf(item.closest('[data-drop-part]')?.dataset.dropPart);
      keyboard.index=Math.max(0,current);
    }else{
      keyboard.index=active.start!=null?clamp(Math.round(active.start/15),0,95):36;
    }
    begin();categoryDock.classList.add('dnd-keyboard');keyboardUpdate();
  }
  function keyboardUpdate(){
    if(!active||!keyboard)return;
    document.body.classList.toggle('dnd-dock-visible',keyboard.mode==='category');
    let t=null;
    if(keyboard.mode==='part'){
      let part=PARTS[keyboard.index];
      if(active.kind==='event'&&part==='other')part='evening';
      t={kind:'part',part,element:document.querySelector('[data-drop-part="'+part+'"]')};
    } else if(keyboard.mode==='category'){
      t={kind:'category',category:CATS[keyboard.index],element:categoryDock?.querySelector('[data-drop-category="'+CATS[keyboard.index]+'"]')};
    } else {
      t={kind:'hour',minute:keyboard.index*15,element:document.querySelector('[data-drop-hours]')};
    }
    showTarget(t);
  }
  document.addEventListener('keydown',e=>{
    if(!keyboard){
      const grip=e.target.closest?.('.dnd-grip');
      if(grip&&(e.key==='Enter'||e.key===' ')){
        e.preventDefault();keyboardBegin(grip.closest('[data-drag-item]'));
      }
      return;
    }
    if(e.key==='Escape'){
      e.preventDefault();removeVisual();active=null;keyboard=null;toast(L('cancel'));return;
    }
    if(e.key==='Enter'||e.key===' '){
      e.preventDefault();
      const info=active,t=active?.target;
      removeVisual();active=null;keyboard=null;
      if(t)void applyMove(info,t);return;
    }
    if(e.key.toLowerCase()==='c'&&active?.kind==='task'){
      e.preventDefault();keyboard.mode=keyboard.mode==='category'?(document.querySelector('.day-sections')?'part':'hour'):'category';keyboard.index=0;keyboardUpdate();return;
    }
    if(e.key==='ArrowUp'||e.key==='ArrowDown'||e.key==='ArrowLeft'||e.key==='ArrowRight'){
      e.preventDefault();
      const diff=e.key==='ArrowUp'||e.key==='ArrowLeft'?-1:1;
      const count=keyboard.mode==='part'?PARTS.length:keyboard.mode==='category'?CATS.length:96;
      keyboard.index=clamp(keyboard.index+diff,0,count-1);
      keyboardUpdate();
    }
  },true);
  window.MellowDrag={applyMove,partFrom,getItem,decorate,version:13};
  decorate();
})();