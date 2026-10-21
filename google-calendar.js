/* Mellow Google Calendar — opt-in Google Identity Services OAuth.
   Client ID preference in local storage. Tokens and calendar events in memory only.
   No Google password, client secret, refresh token or token storage. */
(() => {
  const API='https://www.googleapis.com/calendar/v3';
  const SCOPES=['https://www.googleapis.com/auth/calendar.events','https://www.googleapis.com/auth/calendar.calendarlist.readonly'];
  const KEY_CLIENT='mellow-google-client-id-v1', KEY_SHOW='mellow-google-visible-v1', KEY_WRITE='mellow-google-write-v1';
  const g={
    clientId:localStorage.getItem(KEY_CLIENT)||'',
    token:null,expiresAt:0,calendars:[],events:[],loadedDate:null,
    loading:false,connecting:false,busy:false,error:'',requestId:0,
    visible:null,writeCalendar:localStorage.getItem(KEY_WRITE)||''
  };
  const copy={
    en:{
      calendar:'Calendar',calendarIntro:'Google Calendar',setup:'Connect Google Calendar',
      explain:'See your Google events next to your Mellow tasks. Add new events or send scheduled Mellow tasks to a calendar.',
      connect:'Connect with Google',reconnect:'Reconnect Google',disconnect:'Disconnect this session',
      connected:'Connected to Google Calendar',disconnected:'Not connected',expired:'Your Google session expired. Reconnect to refresh events.',
      config:'One-time Google setup',clientId:'Google OAuth web client ID',
      saveClient:'Save client ID',needClient:'Enter a valid Google OAuth web client ID.',
      origin:'In Google Cloud, enable the Calendar API, configure the OAuth consent screen, and create a Web application OAuth client with this Authorized JavaScript origin:',
      cloud:'Google Cloud credentials',guide:'Google setup guide',
      test:'If the consent screen is in Testing, add your Google account as a test user. Calendar access may require verification if published broadly.',
      noPassword:'Google handles sign-in. Mellow never asks for your password, stores no Google access token, and does not upload your events to Mellow servers.',
      privacy:'Calendar data stays in this browser session. Disconnecting leaves your Mellow tasks untouched.',
      refresh:'Refresh events',newEvent:'New Google event',title:'Event name',when:'Date',at:'Starts at',duration:'Duration (minutes)',
      location:'Location (optional)',description:'Notes (optional)',save:'Create Google event',chooseCalendar:'Save events to',visible:'Visible calendars',
      shown:'Show',hidden:'Hide',none:'No Google events for this day',viewEvent:'Open in Google Calendar',
      createSuccess:'Event created in Google Calendar',taskSent:'Task added to Google Calendar',sendTask:'Add task to Google Calendar',
      alreadySent:'Open linked Google event',needsSchedule:'Choose a task date and start time first.',
      busy:'Working…',loadFailed:'Could not load calendar events. Try reconnecting.',
      authFailed:'Google authorization failed. Check OAuth origin and test-user settings.',
      popup:'Google sign-in is unavailable. Check your connection or browser popup settings.',
      calendarMissing:'Choose a calendar you can edit.',notSaved:'This event is in Google Calendar; Mellow does not automatically sync later changes.',
      primary:'Primary',readOnly:'View only',events:'Google events',timed:'Timed events',allDay:'All-day',
      noWritable:'You need a calendar with editing permission to create events.',
      account:'Your calendar connection',notAutomatic:'Connection lasts for the current browser session. Reconnect after reloading.',
      errorPrefix:'Google Calendar:',nothing:'Nothing to show yet',
      timeInvalid:'Choose a valid start time and duration.',
      maxShown:'Up to eight visible calendars are loaded at once.',
      selected:'Selected calendars',send:'Send to Google'
    },
    he:{
      calendar:'יומן',calendarIntro:'Google Calendar',setup:'חיבור ליומן Google',
      explain:'האירועים מ-Google מופיעים לצד המשימות ב-Mellow. אפשר ליצור אירוע חדש או לשלוח משימה מתוזמנת ליומן.',
      connect:'התחברות עם Google',reconnect:'התחברות מחדש',disconnect:'ניתוק החיבור הנוכחי',
      connected:'היומן מחובר',disconnected:'לא מחובר',expired:'תוקף החיבור ל-Google הסתיים. יש להתחבר מחדש.',
      config:'הגדרה חד־פעמית',clientId:'מזהה לקוח OAuth של אתר אינטרנט',
      saveClient:'שמירת מזהה הלקוח',needClient:'יש להזין מזהה לקוח OAuth תקין.',
      origin:'ב-Google Cloud יש להפעיל את Calendar API, להגדיר מסך הסכמה וליצור לקוח OAuth מסוג Web application עם הכתובת הבאה במקורות JavaScript מורשים:',
      cloud:'פרטי ההתחברות ב-Google Cloud',guide:'מדריך הגדרה של Google',
      test:'אם מסך ההסכמה נמצא במצב Testing, יש להוסיף את חשבון Google לרשימת משתמשי הבדיקה. לשימוש ציבורי נרחב עשוי להידרש תהליך אימות.',
      noPassword:'ההתחברות מתבצעת דרך Google. Mellow לא מבקשת סיסמה ולא שומרת אסימוני גישה או מעבירה אירועים לשרתים שלה.',
      privacy:'פרטי האירועים זמינים בזיכרון הדפדפן בלבד. ניתוק Google לא מוחק משימות ב-Mellow.',
      refresh:'רענון אירועים',newEvent:'אירוע חדש ב-Google',title:'שם האירוע',when:'תאריך',at:'שעת התחלה',duration:'משך בדקות',
      location:'מיקום (לא חובה)',description:'הערות (לא חובה)',save:'יצירת אירוע',chooseCalendar:'שמירה ביומן',visible:'יומנים מוצגים',
      shown:'הצגה',hidden:'הסתרה',none:'אין אירועים ביומן ביום הזה',viewEvent:'פתיחת האירוע ב-Google',
      createSuccess:'האירוע נוצר ביומן Google',taskSent:'המשימה נוספה ל-Google Calendar',sendTask:'הוספת המשימה ליומן Google',
      alreadySent:'פתיחת האירוע המקושר',needsSchedule:'צריך לבחור תאריך ושעת התחלה למשימה.',
      busy:'בביצוע…',loadFailed:'לא ניתן לטעון אירועים. כדאי להתחבר מחדש.',
      authFailed:'ההרשאה נדחתה. יש לבדוק את כתובת האתר ומשתמשי הבדיקה בהגדרות OAuth.',
      popup:'לא ניתן להיכנס ל-Google. כדאי לבדוק את החיבור ואת הגדרות החלוניות.',
      calendarMissing:'צריך לבחור יומן שניתן לערוך.',notSaved:'האירוע נוסף ל-Google. שינויים עתידיים ב-Mellow אינם מתעדכנים אוטומטית ביומן.',
      primary:'ראשי',readOnly:'לצפייה בלבד',events:'אירועים מ-Google',timed:'אירועים עם שעה',allDay:'אירועים לאורך היום',
      noWritable:'כדי ליצור אירועים יש צורך ביומן עם הרשאות עריכה.',
      account:'חיבור ליומן',notAutomatic:'החיבור תקף לסשן הדפדפן הנוכחי. לאחר טעינה מחדש צריך להתחבר שוב.',
      errorPrefix:'יומן Google:',nothing:'עדיין אין אירועים להצגה',
      timeInvalid:'יש לבחור שעה ומשך תקינים.',
      maxShown:'אפשר להציג עד שמונה יומנים בו־זמנית.',
      selected:'יומנים שנבחרו',send:'שליחה ל-Google'
    }
  };
  const W=k=>(copy[db.settings.lang==='he'?'he':'en'][k]||k);
  const ico=(name,size=18)=>mellowIcon(name,size);
  const dateParts=d=>{
    const m=String(d||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m?[+m[1],+m[2],+m[3]]:null;
  };
  const localMidnight=d=>{
    const bits=dateParts(d);
    return bits?new Date(bits[0],bits[1]-1,bits[2]):new Date();
  };
  const localDateTime=(d,time)=>{
    const bits=dateParts(d),match=/^(\d{2}):(\d{2})$/.exec(time||'');
    return bits&&match?new Date(bits[0],bits[1]-1,bits[2],+match[1],+match[2]):null;
  };
  const prettyTime=v=>new Intl.DateTimeFormat(locale(),{hour:'2-digit',minute:'2-digit'}).format(new Date(v));
  const colorOf=cal=>/^#[\da-fA-F]{6}$/.test(cal?.backgroundColor||'')?cal.backgroundColor:'#62826e';
  const safeUrl=s=>{
    try{const url=new URL(s);return url.protocol==='https:'&&(['calendar.google.com','www.google.com'].includes(url.hostname))?url.href:null}catch{return null}
  };
  function setMessage(message){g.error=String(message||'');if(message)console.warn('Calendar:',message)}
  function readable(){return g.token&&Date.now()<g.expiresAt}
  function writable(){return g.calendars.filter(c=>['owner','writer'].includes(c.accessRole));}
  function shownCalendars(){
    if(!g.visible){try{g.visible=JSON.parse(localStorage.getItem(KEY_SHOW)||'null')}catch{g.visible=null}}
    if(!Array.isArray(g.visible))return g.calendars.filter(c=>c.selected!==false).slice(0,8).map(c=>c.id);
    return g.visible.filter(id=>g.calendars.some(c=>c.id===id)).slice(0,8);
  }
  function writeId(){
    const editable=writable();
    if(!editable.length)return '';
    return editable.some(c=>c.id===g.writeCalendar)?g.writeCalendar:(editable.find(c=>c.primary)||editable[0]).id;
  }
  function selectWriter(id){
    if(!writable().some(c=>c.id===id))return;
    g.writeCalendar=id;localStorage.setItem(KEY_WRITE,id);
  }
  function isAllDay(ev){return !!ev.start?.date}
  function dayEvents(d){if(g.loadedDate!==d)return [];return g.events.slice().sort((a,b)=>{
      const sa=isAllDay(a)?'':(a.start?.dateTime||''),sb=isAllDay(b)?'':(b.start?.dateTime||'');
      return Number(!!sa)-Number(!!sb)||sa.localeCompare(sb);
    });
  }
  function eventTime(e){
    if(isAllDay(e))return W('allDay');
    if(!e.start?.dateTime||!e.end?.dateTime)return '';
    return prettyTime(e.start.dateTime)+' – '+prettyTime(e.end.dateTime);
  }
  function eventCard(ev){
    const calendar=g.calendars.find(c=>c.id===ev._calendarId);
    const link=safeUrl(ev.htmlLink);
    return '<div class="gcal-event"><span class="gcal-dot" style="background:'+colorOf(calendar)+'"></span><div class="gcal-event-main"><strong>'+esc(ev.summary||W('nothing'))+'</strong>'+
    '<small>'+esc(eventTime(ev))+' · '+esc(calendar?.summary||W('calendar'))+'</small>'+
    (ev.location?'<small>'+esc(ev.location)+'</small>':'')+'</div>'+
    (link?'<a href="'+esc(link)+'" target="_blank" rel="noopener noreferrer" class="gcal-event-link" aria-label="'+esc(W('viewEvent'))+'">'+ico('chevronRight',18)+'</a>':'')+'</div>';
  }
  function loadStatus(){
    if(g.loading)return '<span class="gcal-state">'+ico('clock',14)+' '+W('busy')+'</span>';
    if(g.error)return '<span class="gcal-error" role="status">'+esc(g.error)+'</span>';
    return '';
  }
  function todayPanel(date){
    if(!g.clientId)return '<div class="gcal-today-prompt"><span>'+ico('calendar',20)+' '+W('calendarIntro')+'</span><button data-gcal="open-tab" type="button" class="btn secondary small">'+W('setup')+'</button></div>';
    if(!readable())return '<div class="gcal-today-prompt"><span>'+ico('calendar',19)+' '+W('calendarIntro')+'</span><button type="button" data-gcal="connect" class="btn secondary small">'+W('connect')+'</button></div>';
    const events=dayEvents(date),content=g.loadedDate===date?events.slice(0,8).map(eventCard).join(''):g.loading?'':('<p class="subtle">'+esc(W('none'))+'</p>');
    return '<section class="gcal-today-panel card"><div class="gcal-panel-title"><h3>'+ico('calendar',19)+' '+W('events')+' <span class="gcal-smallcount">'+events.length+'</span></h3><button type="button" class="btn ghost small" data-gcal="open-tab">'+W('calendar')+' '+ico('chevronRight',15)+'</button></div>'+loadStatus()+
      '<div class="gcal-events">'+(content||(!g.loading?'<p class="subtle">'+W('none')+'</p>':''))+'</div></section>';
  }
  const origToday=renderToday;
  renderToday=function(){
    let html=origToday();
    const marker='<div class="day-planner-controls">';
    if(html.includes(marker))html=html.replace(marker,todayPanel(ui.date)+marker);
    return html;
  };
  function calendarSwitcher(){
    if(!readable())return '';
    return '<div class="gcal-calendar-picker"><label for="gcalWriteCalendar">'+W('chooseCalendar')+'</label><select id="gcalWriteCalendar">'+writable().map(c=>'<option value="'+esc(c.id)+'" '+(writeId()===c.id?'selected':'')+'>'+esc(c.summary||'Calendar')+'</option>').join('')+'</select></div>';
  }
  function calendarOptions(){
    if(!readable())return '';
    const selected=new Set(shownCalendars());
    return '<div class="gcal-calendar-options"><div class="gcal-options-head"><strong>'+W('visible')+'</strong><small>'+W('maxShown')+'</small></div>'+
      g.calendars.map(c=>'<label class="gcal-calendar-choice"><input type="checkbox" data-gcal-visible="'+esc(c.id)+'" '+(selected.has(c.id)?'checked':'')+'><span class="gcal-dot" style="background:'+colorOf(c)+'"></span><span>'+esc(c.summary||W('calendar'))+'</span></label>').join('')+'</div>';
  }
  function connectionPanel(){
    return '<section class="card gcal-settings-card"><h3>'+ico('calendar',20)+' '+W('account')+'</h3>'+
      '<p class="subtle">'+W('explain')+'</p>'+
      '<div class="gcal-setup"><label for="gcalClient">'+W('clientId')+'</label>'+
      '<div class="gcal-client-row"><input id="gcalClient" type="text" spellcheck="false" autocapitalize="off" autocomplete="off" placeholder="1234567890-xxx.apps.googleusercontent.com" value="'+esc(g.clientId)+'">'+
      '<button type="button" data-gcal="save-client" class="btn secondary small">'+W('saveClient')+'</button></div></div>'+
      '<div class="gcal-connect-actions">'+(readable()?'<span class="gcal-connected">'+ico('check',16)+' '+W('connected')+'</span><button type="button" class="btn ghost small" data-gcal="disconnect">'+W('disconnect')+'</button>':
        '<button type="button" class="btn" data-gcal="connect">'+ico('calendar',18)+' '+W('connect')+'</button>')+'</div>'+
      (g.error?'<p class="gcal-error" role="status">'+esc(g.error)+'</p>':'')+
      (readable()?calendarSwitcher()+calendarOptions()+'<p class="hint">'+W('notAutomatic')+'</p>':
      '<div class="gcal-guide"><strong>'+W('config')+'</strong><p>'+W('origin')+'</p><code>'+esc(location.origin||'https://mellow-planner.vercel.app')+'</code>'+
      '<p><a target="_blank" rel="noopener noreferrer" href="https://console.cloud.google.com/apis/credentials">'+W('cloud')+' ↗</a> · <a target="_blank" rel="noopener noreferrer" href="https://developers.google.com/workspace/calendar/api/quickstart/js">'+W('guide')+' ↗</a></p>'+
      '<p>'+W('test')+'</p></div>')+
      '<p class="hint">'+W('noPassword')+'</p></section>';
  }
  const origSettings=renderSettings;
  renderSettings=function(){
    return origSettings().replace('<div class="settingsgrid">','<div class="settingsgrid">'+connectionPanel());
  };
  function renderPage(){
    const events=dayEvents(ui.date);
    const header='<div class="topbar"><div><div class="overline">MELLOW / '+W('calendar')+'</div><h1>'+ico('calendar',27)+' '+W('calendar')+'</h1><p class="subtle">'+W('explain')+'</p></div></div>';
    if(!readable())return '<div class="gcal-page">'+header+connectionPanel()+'</div>';
    return '<div class="gcal-page">'+header+
      '<div class="gcal-toolbar"><button type="button" class="btn secondary small" data-action="gotoday">'+T('today')+'</button>'+
      '<button type="button" class="btn secondary small" data-gcal="prev-day">'+ico('chevronLeft',18)+'</button><strong>'+esc(dt(ui.date,{weekday:'short',month:'long',day:'numeric',year:'numeric'}))+'</strong>'+
      '<button type="button" class="btn secondary small" data-gcal="next-day">'+ico('chevronRight',18)+'</button></div>'+
      '<div class="week dayticker gcal-date-strip">'+weekDays()+'</div>'+
      '<div class="gcal-actionbar"><button type="button" class="btn" data-gcal="new-event">'+ico('plus',16)+' '+W('newEvent')+'</button>'+
      '<button type="button" class="btn secondary small" data-gcal="refresh">'+ico('repeat',16)+' '+W('refresh')+'</button></div>'+
      loadStatus()+
      '<div class="gcal-day-events card"><div class="gcal-panel-title"><h3>'+W('events')+' <span class="gcal-smallcount">'+events.length+'</span></h3></div>'+
      (events.length?events.map(eventCard).join(''):g.loading?'<p class="subtle">'+W('busy')+'</p>':'<p class="subtle">'+W('none')+'</p>')+'</div>'+
      '<div class="card gcal-filter-panel">'+calendarSwitcher()+calendarOptions()+'</div>'+
      '<p class="hint">'+W('privacy')+'</p></div>';
  }
  function eventModal(){
    const canWrite=writable().length>0;
    const start=Math.ceil((minNow()+15)/15)*15 % (24*60);
    const time=ui.date===today()?fmt(start):'09:00';
    return '<div class="modal-bg"><div class="modal" role="dialog" aria-modal="true" aria-label="'+W('newEvent')+'"><div class="modalheader"><h2>'+ico('calendar',21)+' '+W('newEvent')+'</h2><button type="button" class="iconbtn gcal-close-button" data-action="close">'+ico('plus',18)+'</button></div>'+
    '<form id="gcalEventForm" class="gcal-event-form"><div class="field full"><label for="gcalTitle">'+W('title')+'</label><input id="gcalTitle" required maxlength="160"></div>'+
    '<div class="formgrid"><div class="field"><label for="gcalDate">'+W('when')+'</label><input id="gcalDate" type="date" required value="'+esc(ui.date)+'"></div>'+
    '<div class="field"><label for="gcalTime">'+W('at')+'</label><input id="gcalTime" type="time" required value="'+time+'"></div>'+
    '<div class="field"><label for="gcalDuration">'+W('duration')+'</label><input id="gcalDuration" type="number" min="5" max="1440" step="5" required value="30"></div>'+
    '<div class="field"><label for="gcalEventCalendar">'+W('chooseCalendar')+'</label><select id="gcalEventCalendar">'+writable().map(c=>'<option value="'+esc(c.id)+'" '+(c.id===writeId()?'selected':'')+'>'+esc(c.summary||W('calendar'))+'</option>').join('')+'</select></div></div>'+
    '<div class="field"><label for="gcalLocation">'+W('location')+'</label><input id="gcalLocation" maxlength="200"></div>'+
    '<div class="field"><label for="gcalDescription">'+W('description')+'</label><textarea id="gcalDescription" maxlength="2000" rows="3"></textarea></div>'+
    (canWrite?'':'<p class="gcal-error">'+W('noWritable')+'</p>')+
    '<div class="formactions"><button type="button" class="btn ghost" data-action="close">'+T('cancel')+'</button><button type="submit" class="btn" '+(!canWrite||g.busy?'disabled':'')+'>'+ico('plus',16)+' '+W('save')+'</button></div></form></div></div>';
  }
  const previousModal=renderModal;
  renderModal=function(){return ui.modal==='calendarEvent'?eventModal():previousModal()};
  const beforeTaskModal=taskModal;
  taskModal=function(){
    let html=beforeTaskModal();
    const task=findTask(ui.editId);
    if(!task)return html;
    const link=safeUrl(task.googleCalendar?.htmlLink);
    let snippet='';
    if(link)snippet='<div class="gcal-task-send">'+ico('check',18)+' <a target="_blank" rel="noopener noreferrer" href="'+esc(link)+'">'+W('alreadySent')+' ↗</a></div>';
    else if(readable()){
      snippet='<div class="gcal-task-send"><button type="button" class="btn secondary small" data-gcal="send-task" data-id="'+esc(task.id)+'" '+(g.busy?'disabled':'')+'>'+ico('calendar',17)+' '+W('sendTask')+'</button>'+
      (task.date&&task.start!=null?'':'<span class="hint">'+W('needsSchedule')+'</span>')+'</div>';
    }
    return snippet?html.replace('<div class="formactions">',snippet+'<div class="formactions">'):html;
  };
  function connect(){
    const typed=document.querySelector('#gcalClient')?.value.trim() ||g.clientId;
    if(!/^[\w-]+\.apps\.googleusercontent\.com$/.test(typed)){toast(W('needClient'));return}
    if(!window.google?.accounts?.oauth2?.initTokenClient){toast(W('popup'));return}
    g.clientId=typed;localStorage.setItem(KEY_CLIENT,typed);
    g.error='';g.connecting=true;
    try{
      const client=window.google.accounts.oauth2.initTokenClient({
        client_id:typed,scope:SCOPES.join(' '),
        callback:response=>{
          g.connecting=false;
          if(response.error||!response.access_token){setMessage(W('authFailed'));render();return}
          const hasScopes=window.google.accounts.oauth2.hasGrantedAllScopes;
          if(typeof hasScopes==='function'&&!hasScopes(response,...SCOPES)){setMessage(W('authFailed'));render();return}
          g.token=response.access_token;g.expiresAt=Date.now()+Math.max(1,Number(response.expires_in||3300)-60)*1000;
          g.error='';g.events=[];g.loadedDate=null;g.calendars=[];
          void loadCalendarsAndEvents();
          render();
        },
        error_callback:()=>{g.connecting=false;setMessage(W('popup'));render()}
      });
      // Called directly from the user's tap to avoid Safari popup blockers.
      client.requestAccessToken({prompt:'consent'});
    }catch(e){g.connecting=false;setMessage(W('popup'));console.warn(e);render()}
  }
  function disconnect(){
    // Do not persist tokens or calendar events. Disconnect only the current session.
    const token=g.token;g.token=null;g.expiresAt=0;g.events=[];g.calendars=[];g.loadedDate=null;g.requestId++;
    if(token&&window.google?.accounts?.oauth2?.revoke)try{window.google.accounts.oauth2.revoke(token,()=>{})}catch{}
    g.error='';render();
  }
  async function request(path,method='GET',body){
    if(!readable()){g.token=null;throw Error(W('expired'))}
    const resp=await fetch(API+path,{
      method,headers:{Authorization:'Bearer '+g.token,...(body?{'Content-Type':'application/json'}:{})},
      ...(body?{body:JSON.stringify(body)}:{})
    });
    if(resp.status===401){g.token=null;g.events=[];g.calendars=[];g.expiresAt=0;throw Error(W('expired'))}
    if(!resp.ok){
      let message='HTTP '+resp.status;
      try{const parsed=await resp.json();message=String(parsed.error?.message||message).slice(0,250)}catch{}
      throw Error(message);
    }
    return resp.json();
  }
  async function fetchCalendarList(){
    let items=[],page='';
    for(let n=0;n<3;n++){
      const q='?maxResults=250'+(page?'&pageToken='+encodeURIComponent(page):'');
      const result=await request('/users/me/calendarList'+q);
      items.push(...(result.items||[]));
      if(!result.nextPageToken)break;
      page=result.nextPageToken;
    }
    g.calendars=items;
    if(!g.calendars.length)g.error=W('loadFailed');
    render();
  }
  async function loadCalendarsAndEvents(){
    try{await fetchCalendarList();await refreshEvents(ui.date,true)}
    catch(err){g.loading=false;setMessage(W('errorPrefix')+' '+(err.message||W('loadFailed')));render()}
  }
  async function refreshEvents(date=ui.date,force=false){
    if(!readable()||!g.calendars.length)return;
    if(!force&&g.loadedDate===date&&!g.error)return;
    const requestId=++g.requestId;
    g.loading=true;g.error='';
    if(!ui.modal)render();
    const start=localMidnight(date),next=new Date(start);next.setDate(next.getDate()+1);
    const range='?timeMin='+encodeURIComponent(start.toISOString())+
      '&timeMax='+encodeURIComponent(next.toISOString())+'&singleEvents=true&orderBy=startTime&maxResults=250';
    try{
      const calendars=shownCalendars();
      const results=await Promise.allSettled(calendars.map(async calId=>{
        const rows=[];let nextPage='';
        for(let page=0;page<3;page++){
          const q=range+(nextPage?'&pageToken='+encodeURIComponent(nextPage):'');
          const result=await request('/calendars/'+encodeURIComponent(calId)+'/events'+q);
          for(const event of result.items||[])if(event.status!=='cancelled')rows.push({...event,_calendarId:calId});
          if(!result.nextPageToken)break;
          nextPage=result.nextPageToken;
        }
        return rows;
      }));
      if(requestId!==g.requestId)return;
      g.events=results.filter(r=>r.status==='fulfilled').flatMap(r=>r.value);
      g.loadedDate=date;
      const failures=results.filter(r=>r.status==='rejected');
      if(failures.length)g.error=W('loadFailed')+' '+String(failures[0].reason?.message||'');
    }catch(e){
      if(requestId!==g.requestId)return;
      g.events=[];g.loadedDate=date;g.error=W('loadFailed')+' '+e.message;
    }finally{
      if(requestId===g.requestId){g.loading=false;if(!ui.modal)render()}
    }
  }
  async function createEvent({summary,date,time,minutes,calendarId,description='',place=''},task){
    if(g.busy)return;
    const start=localDateTime(date,time);
    if(!start||!Number.isFinite(minutes)||minutes<5||minutes>1440){toast(W('timeInvalid'));return}
    if(!writable().some(c=>c.id===calendarId)){toast(W('calendarMissing'));return}
    g.busy=true;
    try{
      const end=new Date(start.getTime()+minutes*60000);
      const response=await request('/calendars/'+encodeURIComponent(calendarId)+'/events','POST',{
        summary:summary.slice(0,160),description:description.slice(0,2000),location:place.slice(0,200),
        start:{dateTime:start.toISOString()},end:{dateTime:end.toISOString()}
      });
      if(task&&response.id){
        task.googleCalendar={eventId:response.id,calendarId,htmlLink:safeUrl(response.htmlLink)||'',syncedAt:Date.now()};
        persist();
      }
      ui.modal=null;g.error='';toast(task?W('taskSent'):W('createSuccess'));render();
      await refreshEvents(ui.date,true);
    }catch(err){g.error=String(err.message||W('loadFailed'));toast(W('errorPrefix')+' '+g.error);render()}
    finally{g.busy=false}
  }
  async function sendTask(taskId){
    const task=findTask(taskId);
    if(!task)return;
    if(task.googleCalendar?.eventId){toast(W('alreadySent'));return}
    if(!task.date||task.start==null){toast(W('needsSchedule'));return}
    const calendarId=writeId();
    if(!calendarId){toast(W('noWritable'));return}
    const time=fmt(task.start);
    await createEvent({
      summary:task.title,date:task.date,time,
      minutes:task.minutes,calendarId,
      description:task.notes||''
    },task);
  }
  function addDay(delta){
    const d=localMidnight(ui.date);d.setDate(d.getDate()+delta);
    ui.date=dayKey(d);render();void refreshEvents(ui.date);
  }
  document.addEventListener('click',event=>{
    const control=event.target.closest?.('[data-gcal]');
    if(control){
      event.preventDefault();event.stopImmediatePropagation();
      const action=control.dataset.gcal;
      if(action==='open-tab'){ui.tab='calendar';ui.modal=null;render();if(readable())void refreshEvents(ui.date)}
      if(action==='connect')connect();
      if(action==='save-client'){
        const id=document.querySelector('#gcalClient')?.value.trim()||'';
        if(!/^[\w-]+\.apps\.googleusercontent\.com$/.test(id)){toast(W('needClient'));return}
        g.clientId=id;localStorage.setItem(KEY_CLIENT,id);toast(T('saved'));render();
      }
      if(action==='disconnect')disconnect();
      if(action==='refresh')void refreshEvents(ui.date,true);
      if(action==='new-event'){if(!readable()){toast(W('reconnect'));return}ui.modal='calendarEvent';render()}
      if(action==='send-task')void sendTask(control.dataset.id);
      if(action==='prev-day')addDay(-1);
      if(action==='next-day')addDay(1);
      return;
    }
    const el=event.target.closest?.('[data-action]');
    if(el&&['day','setdate','gotoday','nav','dayview'].includes(el.dataset.action)){
      setTimeout(()=>{
        if(readable()&&(ui.tab==='calendar'||ui.tab==='today'))void refreshEvents(ui.date);
      },20);
    }
  },true);
  document.addEventListener('change',event=>{
    const input=event.target;
    if(input.id==='gcalWriteCalendar'){selectWriter(input.value);render();return}
    if(input.matches?.('[data-gcal-visible]')){
      const chosen=new Set(shownCalendars());
      if(input.checked){if(chosen.size>=8){input.checked=false;toast(W('maxShown'));return}chosen.add(input.dataset.gcalVisible)}
      else chosen.delete(input.dataset.gcalVisible);
      g.visible=[...chosen];localStorage.setItem(KEY_SHOW,JSON.stringify(g.visible));
      void refreshEvents(ui.date,true);
    }
  },true);
  document.addEventListener('submit',event=>{
    if(event.target?.id!=='gcalEventForm')return;
    event.preventDefault();event.stopImmediatePropagation();
    if(g.busy)return;
    const summary=document.querySelector('#gcalTitle')?.value.trim()||'';
    const date=document.querySelector('#gcalDate')?.value||'',time=document.querySelector('#gcalTime')?.value||'';
    const minutes=Number(document.querySelector('#gcalDuration')?.value||0),calendarId=document.querySelector('#gcalEventCalendar')?.value;
    if(!summary){toast(W('title'));return}
    if(!dateParts(date)||!localDateTime(date,time)){toast(W('timeInvalid'));return}
    void createEvent({summary,date,time,minutes,calendarId,description:document.querySelector('#gcalDescription')?.value||'',place:document.querySelector('#gcalLocation')?.value||''});
  },true);
  E.calendar='Calendar';H.calendar='יומן';
  icons.calendar=mellowIcon('calendar',20);
  window.MellowCalendar={renderPage,refresh:()=>refreshEvents(ui.date,true),state:g,disconnect};
  render();
})();
