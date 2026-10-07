/* Nexora presentation v2 — isolated, accessible interactions. */
(() => {
 const motion = matchMedia('(prefers-reduced-motion: reduce)');
 const hover = matchMedia('(hover: hover) and (pointer: fine)');
 const ease = 'cubic-bezier(.2,.7,.2,1)';
 const animate = (element,frames,duration) => !motion.matches && element.animate ? element.animate(frames,{duration,easing:ease}) : null;
 function disclosure(row) {
  const summary=row.querySelector('summary');
  const body=row.querySelector('.scenario-body')||row.querySelector('p');
  let animation=null,closing=false,manual=false;
  summary.setAttribute('aria-expanded',String(row.open));
  const capture=()=>{
   const siblings=[...row.parentElement.children].filter(el=>el!==row);
   const section=row.closest('section');
   if(section){let next=section.nextElementSibling;while(next){siblings.push(next);next=next.nextElementSibling;}}
   return siblings.map(el=>[el,el.getBoundingClientRect().top]);
  };
  const settle=positions=>{if(motion.matches)return;positions.forEach(([el,top])=>{const delta=top-el.getBoundingClientRect().top;if(Math.abs(delta)>1)el.animate([{transform:'translateY('+delta+'px)'},{transform:'translateY(0)'}],{duration:360,easing:ease});});};
  function stop(){if(animation){animation.cancel();animation=null;}closing=false;}
  function open(){stop();summary.setAttribute('aria-expanded','true');if(row.open)return;const positions=capture();row.open=true;settle(positions);animation=animate(body,[{opacity:0,transform:'translateY(20px)'},{opacity:1,transform:'translateY(0)'}],360);}
  function close(){stop();if(!row.open)return;closing=true;summary.setAttribute('aria-expanded','false');animation=animate(body,[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(8px)'}],240);const finish=()=>{if(!closing)return;const positions=capture();row.open=false;settle(positions);closing=false;animation=null;};if(animation)animation.finished.then(finish).catch(()=>{});else finish();}
  summary.addEventListener('click',event=>{event.preventDefault();manual=true;closing?open():row.open?close():open();});
  row.addEventListener('keydown',event=>{if(event.key==='Escape'&&row.open){event.preventDefault();manual=true;close();summary.focus();}});
  return {row,summary,open,hasManual:()=>manual};
 }
 const scenarios=[...document.querySelectorAll('.scenario')].map(disclosure);
 document.querySelectorAll('.faq').forEach(disclosure);
 // Progressive desktop disclosure. Each row opens once; clicks always take precedence.
 const desktop=matchMedia('(min-width: 1024px)');
 if('IntersectionObserver' in window){
  let observer;
  const bind=()=>{observer?.disconnect();if(!desktop.matches)return;observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(!entry.isIntersecting)return;const card=scenarios.find(item=>item.summary===entry.target);if(!card.hasManual())card.open();observer.unobserve(entry.target);});},{rootMargin:'0px 0px -18% 0px',threshold:.4});scenarios.forEach(card=>observer.observe(card.summary));};
  desktop.addEventListener('change',bind);bind();
 }
 // Numerals use the same local face as the main Nexora wordmark.
 function styleDigits(root){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];
  while(walker.nextNode()){
   const node=walker.currentNode;
   if(/\d/.test(node.nodeValue)&&!node.parentElement.closest('script,style,.digits,.mono,.scenario-number,.scope-symbol,.sr-only'))nodes.push(node);
  }
  nodes.forEach(node=>{const fragment=document.createDocumentFragment();node.nodeValue.split(/(\d+(?:[.,]\d+)?)/).forEach(part=>{if(/^\d/.test(part)){const span=document.createElement('span');span.className='digits';span.textContent=part;fragment.append(span);}else fragment.append(document.createTextNode(part));});node.replaceWith(fragment);});
 }
 styleDigits(document.body);
 document.querySelectorAll('[data-demo]').forEach(demo=>{
  const states=JSON.parse(demo.querySelector('script[type="application/json"]').textContent);
  const controls=[...demo.querySelectorAll('[data-state]')];let current=0,transition=null,version=0;
  const visual=demo.querySelector('[data-demo-visual]');
  function select(index,announce=true){
   current=index;const state=states[index],token=++version;
   if(transition)transition.cancel();
   controls.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
   const render=()=>{
    if(token!==version)return;
    visual.innerHTML=state.visual;styleDigits(visual);
    demo.querySelector('[data-demo-title]').textContent=state.title;styleDigits(demo.querySelector('[data-demo-title]'));
    demo.querySelector('[data-demo-text]').textContent=state.text;styleDigits(demo.querySelector('[data-demo-text]'));
    demo.querySelector('[data-demo-label]').textContent=state.label;
    if(announce)demo.querySelector('[data-status]').textContent=state.title+'. '+state.text;
    transition=animate(visual,[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],260);
    if(!motion.matches)visual.querySelectorAll('.bar').forEach((bar,i)=>bar.animate([{transform:'scaleX(.1)'},{transform:'scaleX(1)'}],{duration:320,delay:i*40,easing:ease}));
   };
   if(announce&&!motion.matches){transition=animate(visual,[{opacity:1},{opacity:0}],150);if(transition)transition.finished.then(render).catch(()=>{});else render();}else render();
  }
  controls.forEach((b,i)=>b.addEventListener('click',()=>select(i)));
  demo.querySelector('[data-next]').addEventListener('click',()=>select((current+1)%states.length));
  demo.querySelector('[data-reset]').addEventListener('click',()=>select(0));select(0,false);
 });
 document.querySelectorAll('[data-copy-brief]').forEach(button=>button.addEventListener('click',async()=>{
  const brief=document.querySelector('[data-brief]'),status=document.querySelector('[data-copy-status]');
  try{if(!navigator.clipboard)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(brief.innerText.trim());status.textContent='Вопросы скопированы. Можно заполнить ответы и отправить их команде.';}
  catch{const range=document.createRange();range.selectNodeContents(brief);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);status.textContent='Текст выделен. Скопируйте через меню устройства или Ctrl+C.';}
 }));
 if('IntersectionObserver' in window&&!motion.matches){
  document.documentElement.classList.add('motion-ready');
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.08});
  document.querySelectorAll('.hero-art,.process-ornament,.cta-art,.section-index,.section-head h2,.section-intro,.phase,.faq,.brief-invitation,.brief-field,.brief-controls,.brief-privacy,.related-head,.related-link,.cta-layout h2,.cta-layout>div>p,.contact-path li,.cta-actions,.scope-grid h3,.scope-grid p,.scope-grid li,.demo-explainer h2,.demo-explainer p').forEach(el=>{el.classList.add('reveal-target');observer.observe(el);});
  document.addEventListener('focusin',e=>e.target.closest('.reveal-target')?.classList.add('is-visible'));
 }
})();


/* Only visible geometry runs. CSS owns time; scrolling owns parallax. */
(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const figures=[...document.querySelectorAll('.hero-art,.scope-ornament,.scenario-visual,.process-ornament,.process-backdrop,.cta-art')];
 const active=new Set();let scheduled=false;
 const draw=()=>{scheduled=false;if(reduced.matches)return;active.forEach(figure=>{const box=figure.getBoundingClientRect();const progress=Math.max(0,Math.min(1,(innerHeight-box.top)/(innerHeight+box.height)));figure.style.setProperty('--geo-scroll',((progress-.5)*40)+'px');});};
 const schedule=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(draw);}};
 if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{entry.target.classList.toggle('nx-live',entry.isIntersecting);entry.isIntersecting?active.add(entry.target):active.delete(entry.target);});schedule();},{threshold:.01});figures.forEach(figure=>observer.observe(figure));}else figures.forEach(figure=>{active.add(figure);figure.classList.add('nx-live');});
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});
 document.querySelectorAll('.scenario').forEach(row=>row.addEventListener('toggle',schedule));
 reduced.addEventListener('change',()=>{figures.forEach(figure=>figure.style.removeProperty('--geo-scroll'));schedule();});
})();

