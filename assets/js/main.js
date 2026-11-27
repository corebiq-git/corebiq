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

/* Icon-only contact links with localized accessible labels. */
(() => {
 const lang=document.documentElement.lang;
 const labels=({en:['Call COREBIQ','Email COREBIQ','WhatsApp COREBIQ','Instagram','Facebook','Website'],ar:['اتصل بـ COREBIQ','راسل COREBIQ بالبريد الإلكتروني','واتساب COREBIQ','إنستغرام','فيسبوك','الموقع الإلكتروني'],fr:['Appeler COREBIQ','Envoyer un e-mail à COREBIQ','WhatsApp COREBIQ','Instagram','Facebook','Site web']})[lang] || ['Call COREBIQ','Email COREBIQ','WhatsApp COREBIQ','Instagram','Facebook','Website'];
 const actions=[['tel:+919946151111','phone'],['mailto:support@corebiq.com','mail'],['https://wa.me/919946151111','whatsapp'],['https://www.instagram.com/corebiq/','instagram'],['https://www.facebook.com/corebiq/','facebook'],['https://corebiq.com/','globe']];
 document.querySelectorAll('.site-footer .footer-contact-list').forEach(list=>{
   const sprite=list.querySelector('use')?.getAttribute('href')?.split('#')[0];
   if(!sprite)return;
   const links=actions.map(([href,icon],i)=>{
     const a=document.createElement('a');a.href=href;a.setAttribute('aria-label',labels[i]);a.title=labels[i];
     if(href.startsWith('https:')&&icon!=='globe'){a.target='_blank';a.rel='noopener noreferrer';}
     const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
     for(const [k,v] of Object.entries({'aria-hidden':'true',focusable:'false',viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':'1.75','stroke-linecap':'round','stroke-linejoin':'round'}))svg.setAttribute(k,v);
     if(icon==='whatsapp'||icon==='facebook'){
       const paths=icon==='whatsapp'?['M20.5 11.8a8.5 8.5 0 0 1-12.7 7.4L3 20.5l1.3-4.7A8.5 8.5 0 1 1 20.5 11.8Z','M9.2 8.1c-.3-.7-.5-.8-.9-.8h-.5c-.5 0-1.1.6-1.1 1.6 0 1.4 1 3 2.4 4.4 1.6 1.6 3.4 2.6 4.7 2.6 1 0 1.7-.6 1.8-1.2l.1-.6c0-.3-.2-.4-.7-.7l-1.5-.7c-.4-.2-.6-.1-.8.2l-.5.6c-.2.2-.4.2-.8 0-1.2-.6-2.3-1.6-2.9-2.9-.2-.3-.1-.5.1-.7l.5-.6c.2-.2.2-.5.1-.8Z']:['M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z'];
       paths.forEach(d=>{const p=document.createElementNS(svg.namespaceURI,'path');p.setAttribute('d',d);svg.append(p);});
     }else{const use=document.createElementNS(svg.namespaceURI,'use');use.setAttribute('href',sprite+'#'+icon);svg.append(use);}
     a.append(svg);return a;
   });
   list.replaceChildren(...links);list.classList.add('contact-icons');
 });
})();
