const CACHE='mellow-offline-v25';
const CORE=['./','./index.html','./app.js','./timeline-view.js','./subtasks.js','./google-calendar.js','./unified-day.js','./drag-drop.js','./month-search.js','./styles.css','./day-layout.css','./subtasks.css','./motion.css','./google-calendar.css','./unified-day.css','./compact-navigation.css','./purple-theme.css','./pastel-accents.css','./drag-drop.css','./roomy-timeline.css','./month-search.css','./readable-task-list.css','./readable-day-sections.css','./soft-ui.css','./mobile-form-fixes.css','./manifest.webmanifest','./assets/mellow-icon-192.png','./assets/mellow-icon-scalable.svg'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(n=>n.startsWith('mellow-offline-')&&n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin)return;
 const isCode=req.mode==='navigate'||/\.(?:html|js|css)$/i.test(url.pathname);
 if(isCode){
  event.respondWith(fetch(req,{cache:'no-store'}).then(res=>{
   if(res.ok){const clone=res.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(req,clone)));}
   return res;
  }).catch(async()=>{
   const cached=await caches.match(req,{ignoreSearch:true});
   if(cached)return cached;
   if(req.mode==='navigate')return caches.match('./index.html');
   return new Response('Offline resource unavailable',{status:503});
  }));
 }else{
  event.respondWith(caches.match(req,{ignoreSearch:true}).then(hit=>hit||fetch(req).then(res=>{
   if(res.ok){const clone=res.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(req,clone)));}
   return res;
  })));
 }
});