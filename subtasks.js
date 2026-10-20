/* Mellow subtask editor — loads after timeline-view.js.
   Manual checklist is free and works offline. Gemini is optional and opt-in. */
(() => {
  const words = {
    en: {
      heading: 'Small steps', manual: 'Add a step', placeholder: 'One small action…',
      breakDown: 'Break down this task', suggestions: 'Suggested steps',
      aiMode: 'Gemini AI', offline: 'Offline suggestions', preview: 'Review suggestions before adding.',
      missing: 'Give your task a name first.', empty: 'No steps yet. Start small.',
      addSelected: 'Add selected steps', noSelected: 'Select at least one suggestion.',
      limit: 'Each task can have up to 20 steps.', done: 'steps done',
      up: 'Move step up', down: 'Move step down', delete: 'Remove step',
      aiBusy: 'Thinking of helpful steps…', aiFallback: 'Gemini unavailable. Showing offline suggestions instead.',
      offlineNote: 'For real AI-generated steps, select Gemini and add a key in Settings. Offline suggestions stay free.',
      privacyNote: 'Gemini receives only this task’s title and notes when you request suggestions.',
      duplicate: 'Those steps are already in your checklist.', saveHint: 'Use Save to keep your checklist changes.'
    },
    he: {
      heading: 'צעדים קטנים', manual: 'הוספת צעד', placeholder: 'פעולה קטנה אחת…',
      breakDown: 'פירוק המשימה לצעדים', suggestions: 'צעדים מוצעים',
      aiMode: 'Gemini AI', offline: 'הצעות ללא חיבור', preview: 'אפשר לערוך ולבחור את הצעדים לפני ההוספה.',
      missing: 'קודם יש לכתוב שם למשימה.', empty: 'אין צעדים עדיין. אפשר להתחיל בקטן.',
      addSelected: 'הוספת הצעדים שנבחרו', noSelected: 'יש לבחור לפחות צעד אחד.',
      limit: 'אפשר להוסיף עד 20 צעדים למשימה.', done: 'צעדים הושלמו',
      up: 'העברת צעד למעלה', down: 'העברת צעד למטה', delete: 'מחיקת צעד',
      aiBusy: 'יוצרת צעדים קטנים…', aiFallback: 'Gemini לא זמין, לכן מוצגות הצעות מקומיות.',
      offlineNote: 'לצעדים מבוססי AI יש לבחור Gemini ולהגדיר מפתח בהגדרות. ההצעות המקומיות חינמיות.',
      privacyNote: 'רק שם המשימה וההערות יישלחו ל-Gemini לאחר לחיצה על יצירת הצעות.',
      duplicate: 'הצעדים האלה כבר נמצאים ברשימה.', saveHint: 'יש ללחוץ על שמירה כדי לשמור את השינויים.'
    }
  };
  const W = key => words[db.settings.lang === 'he' ? 'he' : 'en'][key] || key;
  const icon = (name,size=18) => mellowIcon(name,size);
  const stepCopy = s => ({
    id: s.id || uid(),
    title: String(s.title || '').slice(0,160),
    done: !!s.done
  });
  function resetSteps() {
    ui.stepContext = null;
    ui.stepDraft = null;
    ui.stepCandidates = [];
    ui.stepMode = '';
    ui.stepBusy = false;
  }
  function ensureSteps() {
    const key = ui.editId || '__new__';
    if (ui.stepContext !== key || !Array.isArray(ui.stepDraft)) {
      const task = findTask(ui.editId);
      ui.stepContext = key;
      ui.stepDraft = (task?.steps || []).map(stepCopy);
      ui.stepCandidates = [];
      ui.stepMode = '';
      ui.stepBusy = false;
    }
  }
  function encodedText() {
    return esc(ui.stepDraft.map(s => s.title).join('\n'));
  }
  function previewPanel() {
    if (!ui.stepCandidates?.length) return '';
    return '<div class="step-preview"><div class="step-preview-heading"><strong>' +
      icon('sparkles',18)+' '+W('suggestions')+'</strong><span class="step-source">'+
      (ui.stepMode === 'gemini' ? W('aiMode') : W('offline'))+'</span></div>'+
      '<p class="hint">'+W('preview')+'</p><div class="step-candidates">' +
      ui.stepCandidates.map((s,i) =>
        '<div class="step-candidate"><label class="step-select" aria-label="'+W('suggestions')+'"><input type="checkbox" data-step-candidate="'+i+'" '+(s.selected?'checked':'')+'></label>'+
        '<input type="text" maxlength="160" data-step-proposal-title="'+i+'" value="'+esc(s.title)+'" aria-label="'+W('suggestions')+' '+(i+1)+'"></div>'
      ).join('') +
      '</div><div class="step-preview-actions"><button type="button" class="btn small" data-step-action="apply">'+icon('plus',16)+' '+W('addSelected')+'</button>'+
      '<button type="button" class="btn ghost small" data-step-action="discard">'+T('cancel')+'</button></div></div>';
  }
  function editorContent() {
    ensureSteps();
    const done = ui.stepDraft.filter(s => s.done).length, total = ui.stepDraft.length;
    const rows = ui.stepDraft.map((s,i) => '<div class="step-manual-row">'+
      '<label class="step-select" aria-label="'+(i+1)+'"><input type="checkbox" data-step-done="'+i+'" '+(s.done?'checked':'')+'></label>'+
      '<input class="step-manual-title" type="text" maxlength="160" data-step-title="'+i+'" value="'+esc(s.title)+'" aria-label="'+W('heading')+' '+(i+1)+'">'+
      '<div class="step-row-controls"><button type="button" class="step-iconbtn" data-step-action="up" data-index="'+i+'" aria-label="'+W('up')+'" '+(i===0?'disabled':'')+'>'+icon('chevronLeft',16)+'</button>'+
      '<button type="button" class="step-iconbtn" data-step-action="down" data-index="'+i+'" aria-label="'+W('down')+'" '+(i===total-1?'disabled':'')+'>'+icon('chevronRight',16)+'</button>'+
      '<button type="button" class="step-iconbtn step-delete" data-step-action="remove" data-index="'+i+'" aria-label="'+W('delete')+'">'+icon('plus',15)+'</button></div></div>').join('');
    return '<div class="step-head"><div><strong>'+icon('tasks',19)+' '+W('heading')+'</strong><span class="step-count">'+done+' / '+total+' '+W('done')+'</span></div></div>'+
      (total?'<div class="steps-track"><span style="width:'+Math.round(100*done/total)+'%"></span></div>':'')+
      '<div class="step-manual-list">'+(rows||'<p class="hint step-empty">'+W('empty')+'</p>')+'</div>'+
      '<div class="step-entry"><input id="stepNewTitle" maxlength="160" type="text" placeholder="'+W('placeholder')+'" aria-label="'+W('manual')+'">'+
      '<button type="button" class="btn secondary small" data-step-action="add">'+icon('plus',16)+' '+W('manual')+'</button></div>'+
      '<div class="step-suggest-row"><button type="button" class="btn ghost small" data-step-action="suggest" '+(ui.stepBusy?'disabled':'')+'>'+icon('sparkles',17)+' '+(ui.stepBusy?W('aiBusy'):W('breakDown'))+'</button>'+
      '<span class="step-source">'+(db.settings.aiMode==='gemini' && sessionStorage.getItem('mellow-gemini-key') ? W('aiMode') : W('offline'))+'</span></div>'+
      (db.settings.aiMode==='gemini' && sessionStorage.getItem('mellow-gemini-key') ? '<p class="hint">'+W('privacyNote')+'</p>' : '<p class="hint">'+W('offlineNote')+'</p>')+
      previewPanel()+
      '<textarea id="taskSteps" class="hidden" aria-hidden="true" tabindex="-1">'+encodedText()+'</textarea>'+
      '<p class="hint">'+W('saveHint')+'</p>';
  }
  function renderStepEditor() {
    const panel=document.querySelector('#stepPanel');
    if(panel) panel.innerHTML=editorContent();
  }
  function syncText() {
    const field=document.querySelector('#taskSteps');
    if(field) field.value=ui.stepDraft.map(s=>s.title).join('\n');
  }
  const taskModalBeforeSteps=taskModal;
  taskModal=function(){
    const html=taskModalBeforeSteps();
    ensureSteps();
    const start=html.indexOf('<div class="field full"><label for="taskSteps">');
    const tail='</textarea></div>';
    const end=start<0?-1:html.indexOf(tail,start);
    if(start<0||end<0) return html; // Leave original editor available if its structure changes.
    return html.slice(0,start)+'<section id="stepPanel" class="field full steps-editor">'+editorContent()+'</section>'+html.slice(end+tail.length);
  };
  function collectTitle() {
    const title=(document.querySelector('#taskTitle')?.value||'').trim();
    const notes=(document.querySelector('#taskNotes')?.value||'').trim();
    return {title,notes};
  }
  function safeSuggestions(raw) {
    if(!Array.isArray(raw)) return [];
    return [...new Set(raw.slice(0,12).map(v => typeof v==='string'?v:typeof v?.title==='string'?v.title:'')
      .map(v=>v.trim().slice(0,160)).filter(v=>v.length>2))].slice(0,8);
  }
  function offlineBreakdown(title,notes) {
    const text=(title+' '+notes).toLocaleLowerCase();
    const he=db.settings.lang==='he';
    let key = 'general';
    const tests=[
      ['clean',/clean|tidy|organize|declutter|wash|לנקות|לסדר|ניקיון|חדר|לשטוף|ארגון/],
      ['laundry',/laundry|washing clothes|כביס|לכבס/],
      ['email',/email|message|reply|inbox|מייל|הודעה|להשיב/],
      ['write',/write|draft|essay|report|create a story|לכתוב|כתיבה|סיפור|עבודה/],
      ['study',/study|read|book|lesson|exam|learn|ללמוד|לקרוא|ספר|מבחן|שיעורים/],
      ['coding',/app|coding|program|website|project|code|בנייה|אפליקציה|לתכנת|פיתוח|אתר/],
      ['shopping',/shop|grocery|buy|errand|shopping list|סופר|לקנות|קניות|סידורים/],
      ['exercise',/exercise|workout|walk|run|gym|אימון|הליכה|כושר|לרוץ/],
      ['meeting',/meeting|appointment|call|פגישה|שיחה|להתקשר/]
    ];
    for(const [name,re] of tests) if(re.test(text)){key=name;break}
    const plans={
      en:{
        clean:['Choose one small area','Gather supplies and clear the surface','Clean just that area','Put supplies back and check the result'],
        laundry:['Gather and sort clothes','Start the washing machine','Move clothes to dry','Fold and put clothes away'],
        email:['Open the conversation and identify the request','Write a short first draft','Check the details and send','Mark the thread complete'],
        write:['Write down the main idea','Make a tiny outline','Draft one section at a time','Reread and make a final edit'],
        study:['Choose a short section or chapter','Read or review for 10–15 minutes','Write down three key ideas','Recap what you learned'],
        coding:['Choose one small feature or bug','Inspect the relevant files','Implement the smallest working change','Test and save the result'],
        shopping:['List what you need','Check what you already have','Get or order the items','Put purchases away'],
        exercise:['Prepare comfortable clothes and water','Warm up gently','Do the planned movement','Cool down and rest'],
        meeting:['Check the time and details','Write down two things to discuss','Join or attend','Note any follow-up action'],
        general:['Decide what finished looks like','Gather what you need','Do the easiest first step','Work on one manageable piece','Review what is left and finish']
      },
      he:{
        clean:['לבחור אזור קטן אחד','להכין את הציוד ולפנות מקום','לנקות רק את האזור הזה','להחזיר ציוד ולבדוק מה נשאר'],
        laundry:['לאסוף ולמיין בגדים','להפעיל מכונת כביסה','להעביר לייבוש','לקפל ולהחזיר למקום'],
        email:['לפתוח את ההודעה ולהבין מה נדרש','לכתוב טיוטה קצרה','לבדוק פרטים ולשלוח','לסמן שהטיפול הסתיים'],
        write:['לרשום את הרעיון המרכזי','להכין ראשי פרקים קצרים','לכתוב חלק קטן בכל פעם','לקרוא שוב ולתקן'],
        study:['לבחור פרק או קטע קצר','לקרוא או ללמוד כ־15 דקות','לרשום שלוש נקודות חשובות','לסכם מה למדתי'],
        coding:['לבחור תכונה קטנה או תקלה','לבדוק את הקבצים הרלוונטיים','לבצע שינוי קטן שעובד','לבדוק ולשמור את התוצאה'],
        shopping:['להכין רשימת קניות','לבדוק מה כבר יש','לקנות או להזמין','להחזיר מוצרים למקום'],
        exercise:['להכין בגדים נוחים ומים','לעשות חימום עדין','לבצע את התרגול המתוכנן','להרפות ולנוח'],
        meeting:['לבדוק שעה ומקום','לכתוב שני נושאים לשיחה','להשתתף בפגישה או בשיחה','לרשום משימת המשך אם צריך'],
        general:['להגדיר איך נראית משימה שהסתיימה','להכין את מה שצריך','להתחיל בפעולה הקלה ביותר','לעבוד על חלק אחד קטן','לבדוק מה נשאר ולסיים']
      }
    };
    return plans[he?'he':'en'][key];
  }
  async function geminiBreakdown(title,notes) {
    const key=sessionStorage.getItem('mellow-gemini-key');
    if(!key) throw Error('No API key');
    const lang=db.settings.lang==='he'?'Hebrew':'English';
    const prompt='You help users who struggle with executive function. Break exactly ONE task into 3 to 7 concrete, kind, very small actionable steps. Respond in '+lang+'. Each step should start with an action and be achievable. Avoid invented facts, appointments, or medical instructions. Return ONLY JSON in form {"steps":["..."]}. Task: '+JSON.stringify({title:title.slice(0,160),notes:notes.slice(0,1200)});
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),22000);
    try {
      const resp=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',{
        method:'POST',
        headers:{'Content-Type':'application/json','x-goog-api-key':key},
        body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json',temperature:0.35}}),
        signal:controller.signal
      });
      if(!resp.ok) throw Error('Gemini '+resp.status);
      const body=await resp.json();
      const content=body.candidates?.[0]?.content?.parts?.map(x=>x.text||'').join('')||'';
      const parsed=JSON.parse(content);
      const safe=safeSuggestions(parsed.steps);
      if(!safe.length) throw Error('Empty step breakdown');
      return safe;
    } finally {clearTimeout(timer)}
  }
  async function suggestSteps() {
    ensureSteps();
    if(ui.stepBusy) return;
    const {title,notes}=collectTitle();
    if(!title){toast(W('missing'));document.querySelector('#taskTitle')?.focus();return}
    const context=ui.stepContext;
    ui.stepBusy=true;
    renderStepEditor();
    let list=null,mode='offline',fallback=false;
    const useAI=db.settings.aiMode==='gemini' && !!sessionStorage.getItem('mellow-gemini-key');
    if(useAI){
      try {list=await geminiBreakdown(title,notes);mode='gemini'}
      catch(error){console.warn('Gemini steps unavailable',error);fallback=true}
    }
    if(!list?.length){list=safeSuggestions(offlineBreakdown(title,notes));mode='offline'}
    if(ui.stepContext!==context||ui.modal!=='task')return;
    ui.stepBusy=false;
    ui.stepMode=mode;
    ui.stepCandidates=list.map(title=>({title,selected:true}));
    renderStepEditor();
    if(fallback)toast(W('aiFallback'));
  }
  document.addEventListener('click',event=>{
    const el=event.target.closest('[data-step-action]');
    if(el){
      event.preventDefault();event.stopImmediatePropagation();
      ensureSteps();
      const a=el.dataset.stepAction, i=Number(el.dataset.index);
      if(a==='add'){
        const input=document.querySelector('#stepNewTitle');
        const title=input?.value.trim().slice(0,160);
        if(!title){input?.focus();return}
        if(ui.stepDraft.length>=20){toast(W('limit'));return}
        ui.stepDraft.push({id:uid(),title,done:false});
        renderStepEditor();document.querySelector('#stepNewTitle')?.focus();
      } else if(a==='remove') {
        ui.stepDraft.splice(i,1);renderStepEditor();
      } else if(a==='up'||a==='down') {
        const j=i+(a==='up'?-1:1);
        if(j>=0&&j<ui.stepDraft.length){[ui.stepDraft[i],ui.stepDraft[j]]=[ui.stepDraft[j],ui.stepDraft[i]];renderStepEditor()}
      } else if(a==='suggest') {
        void suggestSteps();
      } else if(a==='discard') {
        ui.stepCandidates=[];renderStepEditor();
      } else if(a==='apply') {
        const selected=ui.stepCandidates.filter(s=>s.selected).map(s=>s.title.trim().slice(0,160)).filter(Boolean);
        if(!selected.length){toast(W('noSelected'));return}
        const seen=new Set(ui.stepDraft.map(s=>s.title.toLocaleLowerCase()));
        let added=0;
        for(const title of selected) {
          if(ui.stepDraft.length>=20){toast(W('limit'));break}
          if(seen.has(title.toLocaleLowerCase()))continue;
          ui.stepDraft.push({id:uid(),title,done:false});
          seen.add(title.toLocaleLowerCase());added++;
        }
        ui.stepCandidates=[];renderStepEditor();
        if(!added)toast(W('duplicate'));
      }
      syncText();
      return;
    }
    // Reset transient drafts whenever a fresh task editor is opened or closed.
    const action=event.target.closest('[data-action]')?.dataset.action;
    if(['newtask','edit','newpart','addhour','close','deletetask'].includes(action))resetSteps();
  },true);
  document.addEventListener('input',event=>{
    const el=event.target;
    if(el.matches?.('[data-step-title]')){
      ensureSteps();
      const step=ui.stepDraft[Number(el.dataset.stepTitle)];
      if(step){step.title=el.value.slice(0,160);syncText()}
    } else if(el.matches?.('[data-step-proposal-title]')){
      const s=ui.stepCandidates[Number(el.dataset.stepProposalTitle)];
      if(s)s.title=el.value.slice(0,160);
    }
  },true);
  document.addEventListener('change',event=>{
    const el=event.target;
    if(el.matches?.('[data-step-done]')){
      ensureSteps();const s=ui.stepDraft[Number(el.dataset.stepDone)];
      if(s){s.done=el.checked;const badge=document.querySelector('.step-count');
        if(badge)badge.textContent=ui.stepDraft.filter(x=>x.done).length+' / '+ui.stepDraft.length+' '+W('done');
        const fill=document.querySelector('.steps-track span');
        if(fill)fill.style.width=Math.round(100*ui.stepDraft.filter(x=>x.done).length/(ui.stepDraft.length||1))+'%';
      }
    }else if(el.matches?.('[data-step-candidate]')){
      const s=ui.stepCandidates[Number(el.dataset.stepCandidate)];if(s)s.selected=el.checked;
    }
  },true);
  document.addEventListener('keydown',event=>{
    if(event.key==='Enter'&&event.target?.id==='stepNewTitle'){
      event.preventDefault();document.querySelector('[data-step-action="add"]')?.click();
    }
    if(event.key==='Escape')resetSteps();
  },true);
})();