/* Mockup-fidelity shell: integrated routines and calmer task page hierarchy. */
(()=>{
  function routinePicker(){
    const he=db.settings.lang==='he';
    const cards=db.routines.length?db.routines.map(localizedRoutine).map(r=>{
      const minutes=r.steps.reduce((sum,step)=>sum+Number(step.minutes||0),0);
      return '<article class="task-routine-option"><div><strong>'+esc(r.name)+'</strong><small>'+r.steps.length+' '+T('subtasks')+' · '+minutes+' '+T('minutesLabel')+'</small></div><div><button type="button" class="btn secondary small" data-routine-use="'+esc(r.id)+'">'+mellowIcon('plus',15)+' '+(he?'שימוש בשגרה':'Use routine')+'</button><button type="button" class="iconbtn" data-action="editroutine" data-id="'+esc(r.id)+'" aria-label="'+T('edit')+'">'+mellowIcon('pencil',16)+'</button></div></article>';
    }).join(''):'<p class="task-routine-picker-empty">'+(he?'אין עדיין שגרות שמורות.':'No saved routines yet.')+'</p>';
    return '<details class="field full task-accordion task-routines-accordion"><summary>'+mellowIcon('repeat',19)+' <span>'+T('routines')+'</span><small>'+db.routines.length+'</small>'+mellowIcon('chevronDown',17)+'</summary><div class="task-routine-picker">'+cards+'<button type="button" class="btn ghost small" data-action="newroutine">'+mellowIcon('plus',15)+' '+T('newRoutine')+'</button></div></details>';
  }

  const taskModalWithSteps=taskModal;
  taskModal=function(){
    const html=taskModalWithSteps(),start=html.indexOf('task-steps-accordion');
    if(start<0)return html;
    const end=html.indexOf('</details>',start);
    return end<0?html:html.slice(0,end+10)+routinePicker()+html.slice(end+10);
  };

  const originalTasks=renderTasks;
  renderTasks=function(){
    const he=db.settings.lang==='he';
    const html=originalTasks(),pageStart=html.indexOf('<div class="task-page">'),filtersStart=html.indexOf('<details class="task-filter-menu">',pageStart);
    if(pageStart<0||filtersStart<0)return html;
    const description=he?'משימות, צעדים קטנים ושגרות במקום אחד.':'Tasks, small steps and routines in one place.';
    const managing=!!ui.manageItems?.tasks,manageLabel=he?(managing?'סיום עריכה':'מצב עריכה'):(managing?'Done editing':'Edit mode');
    const action='<div class="page-title-actions"><button type="button" class="page-manage-toggle '+(managing?'is-active':'')+'" data-manage-toggle="tasks" aria-pressed="'+managing+'" aria-label="'+esc(manageLabel)+'" title="'+esc(manageLabel)+'">'+mellowIcon(managing?'check':'pencil',17)+'</button><button type="button" class="page-title-add" data-unified-add="tasks-page" aria-label="'+esc(T('newTask'))+'">'+mellowIcon('plus',18)+'</button></div>';
    return sectionHead(T('tasks'),description,action)+'<div class="task-page '+(managing?'is-managing':'')+'">'+html.slice(filtersStart);
  };

  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-routine-use]');
    if(!button)return;
    event.preventDefault();event.stopImmediatePropagation();
    const routine=findRoutine(button.dataset.routineUse);if(!routine)return;
    const title=document.querySelector('#taskTitle'),emoji=document.querySelector('#taskEmoji'),minutes=document.querySelector('#taskMin'),start=document.querySelector('#taskStart'),end=document.querySelector('#taskEnd');
    const total=Math.max(5,routine.steps.reduce((sum,step)=>sum+Number(step.minutes||0),0));
    if(title&&!title.value.trim())title.value=routine.name;if(emoji)emoji.value=routine.emoji||'🌿';if(minutes)minutes.value=total;
    if(start&&!start.value&&routine.time){start.value=routine.time;if(end){const startMinute=convertStart(routine.time);end.value=startMinute==null?'':fmt(Math.min(1439,startMinute+total))}}
    window.MellowSteps?.apply?.(routine.steps.map(step=>({title:step.title,done:false})));
    document.querySelector('.task-steps-accordion')?.setAttribute('open','');
    toast(db.settings.lang==='he'?'השגרה נוספה למשימה.':'Routine added to the task.');
  },true);
  render();
})();
