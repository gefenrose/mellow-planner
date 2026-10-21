/* Reorder task cards in the unfiltered Tasks view. */
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
    const cards=cardsIn(list),ids=cards.map(card=>card.dataset.taskReorderId),moving=new Map(ids.map(id=>[id,db.tasks.find(item=>item.id===id)]));
    const done=!!list.closest('.task-done-group');
    const priority={high:0,med:1,low:2};
    const fallback=(a,b)=>(priority[a.priority]-priority[b.priority])||(a.start??1440)-(b.start??1440)||(a.createdAt||0)-(b.createdAt||0);
    const tasks=db.tasks.filter(task=>!!task.done===done).sort((a,b)=>
      (Number.isFinite(a.order)||Number.isFinite(b.order)?(Number.isFinite(a.order)?a.order:Number.MAX_SAFE_INTEGER)-(Number.isFinite(b.order)?b.order:Number.MAX_SAFE_INTEGER)||fallback(a,b):fallback(a,b)));
    const positions=tasks.map((task,index)=>moving.has(task.id)?index:-1).filter(index=>index>=0),ordered=tasks.slice();
    positions.forEach((position,index)=>{if(moving.get(ids[index]))ordered[position]=moving.get(ids[index])});
    ordered.forEach((task,index)=>{task.order=index});
  }
  document.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    const grip=event.target.closest?.('.task-reorder-grip');
    const card=grip?.closest('[data-task-reorder-id]'),list=card?.closest('.task-group .tasks-list');
    if(!grip||!card||!list)return;
    event.preventDefault();
    drag={pointerId:event.pointerId,card,list,grip,startX:event.clientX,startY:event.clientY,moved:false,original:cardsIn(list).map(item=>item.dataset.taskReorderId)};
    try{grip.setPointerCapture(event.pointerId)}catch{}
  },true);
  document.addEventListener('pointermove',event=>{
    if(!drag||drag.pointerId!==event.pointerId)return;
    if(!drag.moved&&Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)<5)return;
    drag.moved=true;document.body.classList.add('task-reordering');drag.card.classList.add('task-reorder-moving');
    event.preventDefault();
    const over=document.elementFromPoint(event.clientX,event.clientY)?.closest?.('[data-task-reorder-id]');
    document.querySelectorAll('.task-reorder-target').forEach(item=>item.classList.remove('task-reorder-target'));
    if(!over||over===drag.card||over.parentElement!==drag.list)return;
    over.classList.add('task-reorder-target');
    const rect=over.getBoundingClientRect();
    if(event.clientY<rect.top+rect.height/2)drag.list.insertBefore(drag.card,over);
    else drag.list.insertBefore(drag.card,over.nextSibling);
  },{capture:true,passive:false});
  function finish(event,canceled=false){
    if(!drag||event.pointerId!==drag.pointerId)return;
    const state=drag;drag=null;
    document.body.classList.remove('task-reordering');
    document.querySelectorAll('.task-reorder-moving,.task-reorder-target').forEach(item=>item.classList.remove('task-reorder-moving','task-reorder-target'));
    if(!state.moved)return;
    if(canceled){
      const byId=new Map(cardsIn(state.list).map(card=>[card.dataset.taskReorderId,card]));
      state.original.forEach(id=>{const item=byId.get(id);if(item)state.list.appendChild(item)});
      return;
    }
    saveOrder(state.list);persist();render();
    toast(db.settings.lang==='he'?'הסדר נשמר':'Order saved');
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
