'use strict';
(() => {
 const dict=window.COREBIQ_TRANSLATIONS || {};
 const select=document.getElementById('lang');
 const menu=document.getElementById('menu');
 const nav=document.getElementById('nav');
 const supported=['en','ar','fr'];
 const lang=document.documentElement.lang;
 const page=location.pathname.split('/').pop()||'index.html';
 function navigateLanguage(value){if(!supported.includes(value)||value===lang)return;const prefix=lang==='en'?'':'../';location.href=prefix+(value==='en'?'':value+'/')+page;}
 select.addEventListener('change',()=>navigateLanguage(select.value));
 document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>navigateLanguage(b.dataset.lang)));
 const legacy=new URLSearchParams(location.search).get('lang');if(supported.includes(legacy)&&legacy!==lang)navigateLanguage(legacy);
 const drawer=document.getElementById('mobile-nav');
 const drawerClose=document.getElementById('drawer-close');
 const mobile=window.matchMedia('(max-width: 1100px)');
 function openMenu(){
   if(!mobile.matches||drawer.open)return;
   drawer.showModal();
   document.documentElement.classList.add('drawer-open');
   menu.setAttribute('aria-expanded','true');
   drawerClose.focus();
 }
 function closeMenu(){if(drawer.open)drawer.close();}
 menu.addEventListener('click',()=>drawer.open?closeMenu():openMenu());
 drawerClose.addEventListener('click',closeMenu);
 drawer.addEventListener('close',()=>{
   document.documentElement.classList.remove('drawer-open');
   menu.setAttribute('aria-expanded','false');
   if(mobile.matches)menu.focus({preventScroll:true});
 });
 drawer.addEventListener('click',e=>{if(e.target===drawer){
   const b=drawer.getBoundingClientRect();
   if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)closeMenu();
 }});
 drawer.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
 mobile.addEventListener('change',e=>{if(!e.matches)closeMenu();});
 document.getElementById('year').textContent=new Date().getFullYear();
 const form=document.getElementById('enquiry');
 if(form)form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;const f=new FormData(form);const labels={en:['COREBIQ project enquiry','Name','Company','Email','Phone','Requirements'],ar:['استفسار عن مشروع COREBIQ','الاسم','الشركة','البريد الإلكتروني','الهاتف','المتطلبات'],fr:['Demande de projet COREBIQ','Nom','Entreprise','E-mail','Téléphone','Besoins']}[lang];const msg=[labels[0],...['name','company','email','phone','message'].map((k,i)=>[labels[i+1],String(f.get(k)||'').trim()]).filter(x=>x[1]).map(x=>x.join(': '))].join('\n');window.open('https://wa.me/919946151111?text='+encodeURIComponent(msg),'_blank','noopener,noreferrer')});
})();
