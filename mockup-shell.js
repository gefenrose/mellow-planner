/* Mockup-fidelity shell: routines live inside Tasks and the add chooser. */
(()=>{
  function routineLibrary(){
    const he=db.settings.lang==='he';
    const cards=db.routines.length?db.routines.map(localizedRoutine).map(r=>{
      const minutes=r.steps.reduce((sum,step)=>sum+Number(step.minutes||0),0);
      const days=r.days?.map(day=>new Intl.DateTimeFormat(locale(),{weekday:'short'}).format(new Date(2026,9,18+day))).join(' · ')||'';
      return '<article class="card routine task-routine-card"><div class="routine-head"><span class="routine-icon">'+mellowIcon('repeat',23)+'</span><div><h3>'+esc(r.name)+(r.demo?' <span class="demo">'+T('sample')+'</span>':'')+'</h3><span class="small subtle">'+minutes+' '+T('minutesLabel')+' · '+r.steps.length+' '+T('subtasks')+'</span></div></div><ol class="steps">'+r.steps.slice(0,3).map(step=>'<li><span class="step-title">'+mellowIcon('circle',12)+' '+esc(step.title)+'</span><span>'+fmtLength(step.minutes)+'</span></li>').join('')+'</ol><div class="small subtle routine-days">'+esc(days)+'</div><div class="routine-actions"><button class="btn small" data-action="runroutine" data-id="'+esc(r.id)+'">'+mellowIcon('arrowUpRight',15)+' '+T('runToday')+'</button><button class="btn ghost small" data-action="editroutine" data-id="'+esc(r.id)+'">'+T('edit')+'</button><button class="iconbtn" data-action="deleteroutine" data-id="'+esc(r.id)+'" aria-label="'+T('delete')+'">'+mellowIcon('trash',17)+'</button></div></article>';
    }).join(''):'<div class="card task-routine-empty"><img src="./assets/kawaii-tea-still-life.png" alt=""><div><h3>'+T('routineEmpty')+'</h3><p>'+T('routineEmptySub')+'</p></div></div>';
    return '<section class="task-routine-library" aria-labelledby="routineLibraryTitle"><header><div><span class="planner-eyebrow">'+(he?'תכנון לשימוש חוזר':'Reusable planning')+'</span><h2 id="routineLibraryTitle">'+T('routines')+'</h2><p>'+(he?'השגרות נשמרות כאן לצד המשימות ונוספות ליום בלחיצה.':'Routines now live with your tasks and can be added to any day.')+'</p></div><button type="button" class="btn secondary" data-action="newroutine">'+mellowIcon('plus',17)+' '+T('newRoutine')+'</button></header><div class="task-routine-grid">'+cards+'</div></section>';
  }

  const originalTasks=renderTasks;
  renderTasks=function(){
    let html=originalTasks();
    html=html.replace('class="page-title-add" data-action="newtask"','class="page-title-add" data-unified-add="tasks-page"');
    const marker='<section class="task-group task-done-group">';
    return html.includes(marker)?html.replace(marker,routineLibrary()+marker):html+routineLibrary();
  };
  render();
})();
