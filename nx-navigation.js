(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const servicePage=location.pathname.includes('/services/');
 const prefix=servicePage?'../':'';
 const services=[['sales-automation','Набор на обучение','O'],['websites','Сайты и лендинги','W'],['chatbots','Чат-боты','U'],['crm-integration','CRM и учёт','X'],['process-automation','Автоматизация операций','I'],['analytics','Аналитика','O'],['marketing-automation','Коммуникации','W']];
 const trigger=document.querySelector('.nx-trigger');if(!trigger)return;
 const layer=document.createElement('div');layer.className='nx-layer';layer.id='nx-navigation';layer.hidden=true;
 layer.innerHTML=`<button class="nx-scrim" aria-label="Закрыть меню" tabindex="-1"></button><section class="nx-panel" role="dialog" aria-modal="true" aria-label="Навигация Nexora"><div class="nx-menu-bg" aria-hidden="true"></div><div class="nx-menu-head"><a href="${prefix}index.html#top" aria-label="Nexora — главная">NEXORA</a><button class="nx-close" aria-label="Закрыть меню"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 4L16 16M16 4L4 16" fill="none" stroke="currentColor" stroke-width="1"/></svg></button></div><div class="nx-menu-scroll" data-lenis-prevent><nav aria-label="Основная навигация"><button class="nx-main-item" data-services aria-expanded="false" aria-controls="nx-services"><span class="nx-glyph" aria-hidden="true">O</span><span>Услуги</span><span class="nx-expand" aria-hidden="true">+</span></button><div class="nx-service-list" id="nx-services" hidden>${services.map(([slug,title])=>`<a href="${prefix}services/${slug}.html" ${location.pathname.endsWith(slug+'.html')?'aria-current="page"':''}><span>${title}</span></a>`).join('')}</div><div class="nx-tail"><a class="nx-main-item" href="${prefix}index.html#works"><span class="nx-glyph" aria-hidden="true">W</span><span>Проекты</span></a><a class="nx-main-item" href="${prefix}index.html#manifesto"><span class="nx-glyph" aria-hidden="true">I</span><span>О нас</span></a><a class="nx-main-item" href="${prefix}index.html#contact"><span class="nx-glyph" aria-hidden="true">U</span><span>Контакты</span></a></div></nav><div class="nx-menu-foot">Сайты и связанные системы<br><a href="mailto:hello@nexora.ai">hello@nexora.ai ↗</a></div></div></section>`;
 document.body.append(layer);
 const panel=layer.querySelector('.nx-panel'),back=layer.querySelector('.nx-menu-bg'),parts=[layer.querySelector('.nx-menu-head'),layer.querySelector('.nx-menu-scroll')];
 let open=false,version=0,animations=[],saved=[];const root=document.documentElement;let lockStyle;
 const run=(el,frames,duration,delay=0)=>{if(reduced.matches)return null;const a=el.animate(frames,{duration,delay,easing:'cubic-bezier(.2,.7,.2,1)',fill:'both'});animations.push(a);return a;};
 function cancel(){animations.forEach(a=>a.cancel());animations=[];}
 function lock(){lockStyle={overflow:root.style.overflow,padding:root.style.paddingRight};const gap=innerWidth-root.clientWidth;root.style.overflow='hidden';root.classList.add('nx-navigation-open');if(gap)root.style.paddingRight=(parseFloat(getComputedStyle(root).paddingRight)+gap)+'px';saved=[...document.body.children].filter(el=>el!==layer&&!el.contains(trigger)&&!['SCRIPT','STYLE','LINK'].includes(el.tagName)).map(el=>[el,el.inert]);saved.forEach(([el])=>el.inert=true);document.dispatchEvent(new CustomEvent('nx:menu',{detail:{open:true}}));}
 function unlock(){root.style.overflow=lockStyle.overflow;root.style.paddingRight=lockStyle.padding;root.classList.remove('nx-navigation-open');saved.forEach(([el,value])=>el.inert=value);saved=[];document.dispatchEvent(new CustomEvent('nx:menu',{detail:{open:false}}));}
 async function setOpen(next){
  if(open===next)return;open=next;const token=++version;cancel();trigger.setAttribute('aria-expanded',String(next));
  if(next){lock();layer.hidden=false;run(layer.querySelector('.nx-scrim'),[{opacity:0},{opacity:1}],240);run(back,[{opacity:0,transform:'scale(.04,.25)'},{opacity:1,transform:'scale(.12,.85)',offset:.28},{opacity:1,transform:'scale(1)'}],400);parts.forEach((el,i)=>run(el,[{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],240,120+i*40));layer.querySelector('.nx-close').focus({preventScroll:true});}
  else{parts.forEach(el=>run(el,[{opacity:1},{opacity:0}],150));run(layer.querySelector('.nx-scrim'),[{opacity:1},{opacity:0}],240);const a=run(back,[{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.06,.5)'}],260);if(a)try{await a.finished;}catch{}if(token!==version)return;layer.hidden=true;cancel();unlock();trigger.focus({preventScroll:true});}
 }
 trigger.addEventListener('click',()=>setOpen(!open));layer.querySelector('.nx-close').addEventListener('click',()=>setOpen(false));layer.querySelector('.nx-scrim').addEventListener('click',()=>setOpen(false));
 document.addEventListener('keydown',e=>{if(!open)return;if(e.key==='Escape'){e.preventDefault();setOpen(false);}if(e.key==='Tab'){const focusables=[...panel.querySelectorAll('a,button')].filter(el=>el.getClientRects().length);const first=focusables[0],last=focusables.at(-1);if(e.shiftKey&&(document.activeElement===first||!panel.contains(document.activeElement))){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
 const homePath=new URL(prefix+'index.html',location.href).pathname;
 layer.querySelector('.nx-tail a[href$="#manifesto"]').href=prefix+'index.html#why';
 layer.querySelectorAll('a').forEach(a=>a.addEventListener('click',async e=>{
  const dest=new URL(a.href),isHome=!servicePage&&(location.pathname===homePath||location.pathname===homePath.replace(/index\.html$/,''));
  if(dest.origin===location.origin&&dest.pathname===homePath&&isHome&&dest.hash){
   e.preventDefault();e.stopPropagation();await setOpen(false);
   const target=document.getElementById(dest.hash.slice(1));if(!target)return;
   target.scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'start'});history.replaceState(null,'',dest.hash);
  }else setOpen(false);
 }));
 const list=layer.querySelector('#nx-services'),button=layer.querySelector('[data-services]'),tail=layer.querySelector('.nx-tail');let submenuVersion=0,submenuAnimations=[];
 button.addEventListener('click',async()=>{const token=++submenuVersion;submenuAnimations.forEach(a=>a.cancel());const expanding=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(expanding));const start=tail.getBoundingClientRect().top;
  if(!expanding&&!reduced.matches){const a=list.animate([{opacity:1},{opacity:0}],{duration:150,easing:'ease-in'});submenuAnimations=[a];try{await a.finished;}catch{}if(token!==submenuVersion)return;}
  list.hidden=!expanding;const delta=start-tail.getBoundingClientRect().top;
  if(!reduced.matches){submenuAnimations=[tail.animate([{transform:`translateY(${delta}px)`},{transform:'translateY(0)'}],{duration:320,easing:'cubic-bezier(.2,.7,.2,1)'})];if(expanding)list.querySelectorAll('a').forEach((a,i)=>submenuAnimations.push(a.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,delay:i*40,easing:'ease-out',fill:'backwards'})));}
 });
 window.NXNavigation={close:()=>setOpen(false)};
 document.querySelectorAll('.brand').forEach(brand=>{const span=document.createElement('span');span.className='nx-brand-glitch';span.dataset.word='NEXORA';span.textContent='NEXORA';brand.replaceChildren(span);const burst=()=>{if(reduced.matches)return;span.classList.remove('nx-burst');requestAnimationFrame(()=>span.classList.add('nx-burst'));};brand.addEventListener('pointerenter',burst);brand.addEventListener('focus',burst);span.addEventListener('animationend',()=>span.classList.remove('nx-burst'));});
})();
