/* Mellow custom daily timeline hours, persisted locally with the planner settings. */
(() => {
  const language=()=>db.settings.lang==='he'?'he':'en';
  const copy={
    en:{title:'Your day, your hours',description:'Choose the hours shown in the Hourly timeline. Tasks and Google events outside this range stay visible below the timeline.',start:'Day starts',end:'Day ends',range:'Timeline hours',ends:'End of displayed day',midnight:'Midnight (24:00)',outside:'Outside chosen hours',outsideHint:'These items are still scheduled. Change the hours above to see them on the timeline.',invalid:'The end time must be after the start time.',saved:'Timeline hours saved',small:'Change hours'},
    he:{title:'השעות של היום שלך',description:'בחרי אילו שעות יוצגו בציר הזמן. משימות ואירועי Google מחוץ לטווח יישארו גלויים מתחתיו.',start:'תחילת היום',end:'סוף היום',range:'שעות ציר הזמן',ends:'סיום התצוגה',midnight:'חצות (24:00)',outside:'מחוץ לשעות שנבחרו',outsideHint:'הפריטים עדיין מתוזמנים. אפשר לשנות את השעות למעלה כדי להציג אותם בציר הזמן.',invalid:'שעת הסיום חייבת להיות מאוחרת משעת ההתחלה.',saved:'שעות ציר הזמן נשמרו',small:'שינוי שעות'}
  };
  const L=k=>copy[language()][k]||k;
  const hour=n=>String(n).padStart(2,'0')+':00';
  const num=(value,fallback,min,max)=>{
    const x=Number(value);
    return Number.isInteger(x)&&x>=min&&x<=max?x:fallback;
  };
  function get(){
    const start=num(db.settings.dayStartHour,6,0,23),end=num(db.settings.dayEndHour,24,1,24);
    return start<end?{start,end}:{start:6,end:24};
  }
  function options(kind,chosen){
    const min=kind==='start'?0:1,max=kind==='start'?23:24;
    let html='';
    for(let n=min;n<=max;n++)html+='<option value="'+n+'"'+(n===chosen?' selected':'')+'>'+ (n===24?L('midnight'):hour(n))+'</option>';
    return html;
  }
  function controls(context='hourly'){
    const {start,end}=get(),prefix='day-hours-'+context;
    return '<div class="day-hours-controls day-hours-'+context+'">'+
      '<label for="'+prefix+'-start"><span>'+L('start')+'</span><select id="'+prefix+'-start" data-day-hours="start" aria-label="'+L('start')+'">'+options('start',start)+'</select></label>'+
      '<label for="'+prefix+'-end"><span>'+L('end')+'</span><select id="'+prefix+'-end" data-day-hours="end" aria-label="'+L('end')+'">'+options('end',end)+'</select></label>'+
      '</div>';
  }
  function settingsPanel(){
    return '<section class="card day-hours-settings"><h3>'+mellowIcon('clock',19)+' '+L('title')+'</h3><p>'+L('description')+'</p>'+controls('settings')+'</section>';
  }
  const originalRenderSettings=renderSettings;
  renderSettings=function(){
    const base=originalRenderSettings();
    const target='<div class="settingsgrid">';
    return base.includes(target)?base.replace(target,target+settingsPanel()):base+settingsPanel();
  };
  document.addEventListener('change',event=>{
    const which=event.target?.dataset?.dayHours;
    if(which!=='start'&&which!=='end')return;
    const current=get(),value=Number(event.target.value);
    if(!Number.isInteger(value)){toast(L('invalid'));render();return}
    const start=which==='start'?value:current.start,end=which==='end'?value:current.end;
    if(start<0||start>=24||end<=0||end>24||start>=end){
      toast(L('invalid'));render();return;
    }
    db.settings.dayStartHour=start;
    db.settings.dayEndHour=end;
    persist();render();toast(L('saved'));
  },true);
  window.MellowDayHours={get,controls,label:L,hour};
  render();
})();