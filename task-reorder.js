/* Reorder task cards and change task priority by dropping across priority groups. */
(() => {
  const cardsIn=list=>[...list.querySelectorAll(':scope > .task-card[data-task-reorder-id]')];
  let drag=null;
  let live;
  function announce(message){
    if(!live){live=document.createElement('div');live.className='dnd-screenreader';live.setAttribute('aria-live','polite');document.body.appendChild(live)}
    live.textContent=message;
  }
  function moveByKeyboard(card,delta){
    const list=card?.closest('.tasks-list');
    if(!list)return;
    const cards=cardsIn(list),index=cards.indexOf(card),next=index+delta;
    if(index<0||next<0||next>=cards.length)return;
    if(delta<0)list.insertBefore(card,cards[next]);
    else list.insertBefore(cards[next],card);
    saveOrder(list);
    const title=card.querySelector('.task-title-button')?.textContent||'';
    announce((db.settings.lang==='he'?'המשימה הועברה':'Task moved')+': '+title);
    persist();render();document.querySelector('[data-task-reorder-id="'+CSS.escape(card.dataset.taskReorderId)+'"] .task-reorder-grip')?.focus();
  }
  function saveOrder(list){
    if(!list)return;
    const cards=cardsIn(list),ids=cards.map(card=>card.dataset.taskReorderId),moving=new Map(ids.map(id=>[id,db.tasks.find(item=>item.id===id)]));
    const done=!!list.closest('.task-done-group');
    const priorityGroup=list.dataset.priorityList||list.closest('[data-priority-group]')?.dataset.priorityGroup;
    const priority={high:0,med:1,low:2};
    const fallback=(a,b)=>(priority[a.priority]-priority[b.priority])||(a.start??1440)-(b.start??1440)||(a.createdAt||0)-(b.createdAt||0);
    const tasks=db.tasks.filter(task=>!!task.done===done&&(done||!priorityGroup||task.priority===priorityGroup)).sort((a,b)=>
      (Number.isFinite(a.order)||Number.isFinite(b.order)?(Number.isFinite(a.order)?a.order:Number.MAX_SAFE_INTEGER)-(Number.isFinite(b.order)?b.order:Number.MAX_SAFE_INTEGER)||fallback(a,b):fallback(a,b)));
    const positions=tasks.map((task,index)=>moving.has(task.id)?index:-1).filter(index=>index>=0),ordered=tasks.slice();
    positions.forEach((position,index)=>{if(moving.get(ids[index]))ordered[position]=moving.get(ids[index])});
    ordered.forEach((task,index)=>{task.order=index});
  }
  function clearTargets(){
    document.querySelectorAll('.task-reorder-target,.task-priority-drop-target').forEach(item=>item.classList.remove('task-reorder-target','task-priority-drop-target'));
  }
  document.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    const grip=event.target.closest?.('.task-reorder-grip');
    const card=grip?.closest('[data-task-reorder-id]'),list=card?.closest('.task-group .tasks-list');
    if(!grip||!card||!list)return;
    event.preventDefault();
    const section=list.closest('[data-priority-group]');
    drag={pointerId:event.pointerId,card,sourceList:list,targetList:list,sourcePriority:section?.dataset.priorityGroup||null,targetPriority:section?.dataset.priorityGroup||null,targetSection:section||null,grip,startX:event.clientX,startY:event.clientY,moved:false,original:cardsIn(list).map(item=>item.dataset.taskReorderId)};
    try{grip.setPointerCapture(event.pointerId)}catch{}
  },true);
  document.addEventListener('pointermove',event=>{
    if(!drag||drag.pointerId!==event.pointerId)return;
    if(!drag.moved&&Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)<5)return;
    drag.moved=true;document.body.classList.add('task-reordering');drag.card.classList.add('task-reorder-moving');
    event.preventDefault();
    const point=document.elementFromPoint(event.clientX,event.clientY);
    const sourceGroup=drag.sourceList.closest('.task-group');
    const targetSection=point?.closest?.('[data-priority-group]');
    let targetList=null,targetPriority=null;
    if(drag.sourcePriority&&targetSection&&targetSection.closest('.task-group')===sourceGroup){
      targetPriority=targetSection.dataset.priorityGroup;
      targetList=targetSection.querySelector('.tasks-list[data-priority-list]');
    }else if(point?.closest?.('.tasks-list')===drag.sourceList){
      targetList=drag.sourceList;
      targetPriority=drag.sourcePriority;
    }
    clearTargets();
    if(!targetList)return;
    drag.targetList=targetList;drag.targetPriority=targetPriority;drag.targetSection=targetSection||null;
    if(targetSection&&targetPriority!==drag.sourcePriority)targetSection.classList.add('task-priority-drop-target');
    const over=point?.closest?.('[data-task-reorder-id]');
    if(over===drag.card)return;
    if(over&&over.closest('.tasks-list')===targetList){
      over.classList.add('task-reorder-target');
      const rect=over.getBoundingClientRect();
      if(event.clientY<rect.top+rect.height/2)targetList.insertBefore(drag.card,over);
      else targetList.insertBefore(drag.card,over.nextSibling);
      return;
    }
    const next=cardsIn(targetList).filter(item=>item!==drag.card).find(item=>{
      const rect=item.getBoundingClientRect();
      return rect.height>0&&event.clientY<rect.top+rect.height/2;
    });
    if(next)targetList.insertBefore(drag.card,next);
    else targetList.appendChild(drag.card);
  },{capture:true,passive:false});
  function finish(event,canceled=false){
    if(!drag||event.pointerId!==drag.pointerId)return;
    const state=drag;drag=null;
    document.body.classList.remove('task-reordering');
    clearTargets();
    state.card.classList.remove('task-reorder-moving');
    if(!state.moved)return;
    if(canceled){
      const byId=new Map([...document.querySelectorAll('[data-task-reorder-id]')].map(card=>[card.dataset.taskReorderId,card]));
      state.original.forEach(id=>{const item=byId.get(id);if(item)state.sourceList.appendChild(item)});
      return;
    }
    const targetList=state.targetList||state.sourceList;
    const priorityChanged=!!state.sourcePriority&&!!state.targetPriority&&state.targetPriority!==state.sourcePriority;
    if(priorityChanged){
      const task=db.tasks.find(item=>item.id===state.card.dataset.taskReorderId);
      if(task)task.priority=state.targetPriority;
    }
    saveOrder(state.sourceList);
    if(targetList!==state.sourceList)saveOrder(targetList);
    persist();render();
    toast(priorityChanged?(db.settings.lang==='he'?'החשיבות עודכנה':'Priority updated'):(db.settings.lang==='he'?'הסדר נשמר':'Order saved'));
  }
  document.addEventListener('pointerup',event=>finish(event),true);
  document.addEventListener('pointercancel',event=>finish(event,true),true);
  document.addEventListener('keydown',event=>{
    const grip=event.target.closest?.('.task-reorder-grip');
    if(!grip||(event.key!=='ArrowUp'&&event.key!=='ArrowDown'))return;
    event.preventDefault();
    moveByKeyboard(grip.closest('[data-task-reorder-id]'),event.key==='ArrowUp'?-1:1);
  },true);
})();
