/* Reconcile linked tasks only. Authentication remains session-only. */
(() => {
  const fields=['title','notes','date','start','minutes'];
  const snapshot=t=>Object.fromEntries(fields.map(k=>[k,t[k]??(k==='notes'?'':null)]));
  const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const path=l=>'/calendars/'+encodeURIComponent(l.calendarId)+'/events/'+encodeURIComponent(l.eventId);
  let running=false;
  async function sync(api){
    if(running||!api.connected())return;
    running=true;
    try{
      for(const entry of [...(db.calendarDeletes||[])]){
        if(!api.canWrite(entry.link.calendarId))continue;
        try{
          const ev=await api.request(path(entry.link));
          if(ev.status!=='cancelled')await api.request(path(entry.link),'DELETE',null,ev.etag);
        }catch(e){if(e.status!==410)throw e}
        db.calendarDeletes=db.calendarDeletes.filter(x=>x!==entry);persist();
      }
      for(const task of [...db.tasks]){
        const link=task.googleCalendar;
        if(!link?.eventId||!api.hasCalendar(link.calendarId))continue;
        const before=snapshot(task);
        let ev;
        try{ev=await api.request(path(link))}catch(e){if(e.status===410)ev={status:'cancelled'};else throw e}
        // A user may edit/delete a task while a request is in flight.
        if(!db.tasks.includes(task)||!equal(snapshot(task),before))continue;
        if(ev.status==='cancelled'){
          if(link.syncBase&&!equal(before,link.syncBase)){task.googleCalendar=undefined;api.conflict()}
          else db.tasks=db.tasks.filter(t=>t!==task);
          persist();continue;
        }
        const start=ev.start?.dateTime?new Date(ev.start.dateTime):null;
        const end=ev.end?.dateTime?new Date(ev.end.dateTime):null;
        if(!start||!end||!Number.isFinite(+start)||!Number.isFinite(+end)){
          // All-day events have no timed-task equivalent: retain a detached task.
          task.googleCalendar=undefined;persist();api.conflict();continue;
        }
        const remote={title:ev.summary||'',notes:ev.description||'',date:dayKey(start),start:start.getHours()*60+start.getMinutes(),minutes:Math.round((end-start)/60000)};
        const base=link.syncBase;
        const localChanged=base&&!equal(before,base),remoteChanged=!base||!equal(remote,base);
        if(localChanged&&!remoteChanged){
          if(!api.canWrite(link.calendarId))throw Error(api.readOnly());
          if(!task.date||task.start==null){
            await api.request(path(link),'DELETE',null,ev.etag);
            task.googleCalendar=undefined;persist();continue;
          }
          const d=fromKey(task.date);d.setHours(Math.floor(task.start/60),task.start%60,0,0);
          await api.request(path(link),'PATCH',{summary:task.title,description:task.notes||'',start:{dateTime:d.toISOString()},end:{dateTime:new Date(+d+task.minutes*60000).toISOString()}},ev.etag);
          link.syncBase=before;
        }else if(remoteChanged){
          if(!equal(before,remote)&&(!base||localChanged)){
            // Preserve a simultaneous local edit instead of silently overwriting it.
            db.tasks.push({...task,id:uid(),googleCalendar:undefined,steps:(task.steps||[]).map(s=>({...s,id:uid()}))});
            api.conflict();
          }
          Object.assign(task,remote);link.syncBase=remote;
        }
        link.syncedAt=Date.now();persist();
      }
    }finally{running=false}
  }
  window.MellowCalendarSync={sync,snapshot};
})();
