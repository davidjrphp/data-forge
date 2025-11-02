
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Footer year
document.addEventListener('DOMContentLoaded', () => {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
});

// Hero slider (fade)
document.addEventListener('DOMContentLoaded', () => {
  const slides = Array.from(document.querySelectorAll('.hero .slide'));
  if (!slides.length) return;
  let idx = 0, timer = null;
  const show = i => slides.forEach((s,k)=> s.classList.toggle('active', k===i));
  const start = () => {
    if (prefersReducedMotion){ show(0); return; }
    show(0);
    timer = setInterval(()=>{ idx = (idx+1)%slides.length; show(idx); }, 5000);
  };
  const stop = () => { if (timer) clearInterval(timer); };
  start();
  document.addEventListener('visibilitychange', ()=> document.hidden ? stop() : start());
});

// Mobile nav toggle
(function(){
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('#site-nav');
  if (!toggle || !nav) return;
  const setState = (open) => {
    nav.setAttribute('data-state', open ? 'open' : 'closed');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.documentElement.classList.toggle('nav-open', open);
  };
  setState(false);
  toggle.addEventListener('click', () => setState(nav.getAttribute('data-state')!=='open'));
  nav.addEventListener('click', (e) => { if (e.target.matches('a')) setState(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setState(false); });
})();

// Scroll reveal
(function(){
  if (prefersReducedMotion) {
    document.querySelectorAll('.reveal').forEach(el=> el.classList.add('show'));
    return;
  }
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('show'); io.unobserve(e.target); } });
  }, {root:null,rootMargin:"0px 0px -10% 0px",threshold:0.15});
  document.querySelectorAll('.reveal').forEach(el=> io.observe(el));
})();

// Generic slider (team + clients)
(function(){
  function createSlider(root){
    const track = root.querySelector('.slider-track');
    const viewport = root.querySelector('.slider-viewport');
    const prev = root.querySelector('.slider-btn.prev');
    const next = root.querySelector('.slider-btn.next');
    const dotsWrap = root.querySelector('.slider-dots');
    const autoplayMs = parseInt(root.dataset.autoplay||'0',10);
    if(!track||!viewport||!dotsWrap) return;

    let index=0,timer=null,dragging=false,startX=0,currentTX=0,dx=0;
    const slides = Array.from(track.children);

    dotsWrap.innerHTML='';
    slides.forEach((_,i)=>{
      const b=document.createElement('button'); b.type='button';
      if(i===0) b.setAttribute('aria-current','true');
      b.addEventListener('click',()=>go(i));
      dotsWrap.appendChild(b);
    });

    function measure(){
      const style=getComputedStyle(track);
      const gap=parseFloat(style.columnGap||style.gap||'0')||0;
      const cardWidth=slides[0]?.getBoundingClientRect().width||0;
      return {gap,cardWidth};
    }
    function update(){
      const {gap,cardWidth}=measure();
      const x=-(cardWidth+gap)*index; currentTX=x;
      track.style.transform=`translateX(${x}px)`;
      dotsWrap.querySelectorAll('button').forEach((d,i)=> d.setAttribute('aria-current', i===index ? 'true':'false'));
    }
    function go(i){ index=(i+slides.length)%slides.length; update(); restart(); }
    function nextSlide(){ go(index+1); }
    function prevSlide(){ go(index-1); }
    next?.addEventListener('click',nextSlide);
    prev?.addEventListener('click',prevSlide);
    window.addEventListener('resize',update,{passive:true});

    // drag
    viewport.addEventListener('pointerdown',(e)=>{dragging=true;startX=e.clientX;dx=0;viewport.setPointerCapture(e.pointerId);track.style.transition='none';});
    function endDrag(){ if(!dragging) return; dragging=false; track.style.transition=''; if(Math.abs(dx)>40){ dx<0?nextSlide():prevSlide(); } else { update(); } dx=0; }
    viewport.addEventListener('pointermove',(e)=>{ if(!dragging) return; dx=e.clientX-startX; track.style.transform=`translateX(${currentTX+dx}px)`; });
    viewport.addEventListener('pointerup',endDrag);
    viewport.addEventListener('pointercancel',endDrag);
    viewport.addEventListener('pointerleave',endDrag);

    function restart(){ if(timer) clearInterval(timer); if(autoplayMs>0 && !prefersReducedMotion) timer=setInterval(nextSlide,autoplayMs); }
    update(); restart();
  }
  document.querySelectorAll('.slider').forEach(createSlider);
})();

// Lead form
document.addEventListener('DOMContentLoaded', ()=>{
  const form=document.getElementById('lead-form'); if(!form) return;
  const msg=document.getElementById('lead-msg');
  form.addEventListener('submit', async (e)=>{
    e.preventDefault(); if(msg) msg.textContent='Submitting...';
    const fd=new FormData(form); const payload=Object.fromEntries(fd.entries());
    try{
      const res=await fetch('/src/handlers/contact.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const data=await res.json(); if(data.ok){ msg.textContent=data.message||'Thanks! We will reach out shortly.'; form.reset(); }
      else { msg.textContent=data.error||'Something went wrong.'; }
    }catch(err){ if(msg) msg.textContent='Network error. Please try again.'; }
  });
});

// Stats (fallback to /data/stats.json)
document.addEventListener('DOMContentLoaded', ()=>{
  const keys=['total_projects','completed','not_completed','suspended'];
  const apply=(data)=>{ if(!data) return; keys.forEach(k=>{ const el=document.getElementById(k); if(el && data[k]!=null) el.textContent=data[k]; }); };
  fetch('/stats.php').then(r=>r.ok?r.json():Promise.reject()).then(apply).catch(()=>{
    fetch('/data/stats.json').then(r=>r.ok?r.json():null).then(apply).catch(()=>{});
  });
});
