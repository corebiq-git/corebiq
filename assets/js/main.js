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
 function closeMenu(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false')}
 menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open))});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
 document.addEventListener('click',e=>{if(!nav.contains(e.target)&&!menu.contains(e.target))closeMenu()});
 window.addEventListener('resize',()=>{if(innerWidth>850)closeMenu()});
 document.getElementById('year').textContent=new Date().getFullYear();
 const form=document.getElementById('enquiry');
 if(form)form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;const f=new FormData(form);const labels={en:['COREBIQ project enquiry','Name','Company','Email','Phone','Requirements'],ar:['استفسار عن مشروع COREBIQ','الاسم','الشركة','البريد الإلكتروني','الهاتف','المتطلبات'],fr:['Demande de projet COREBIQ','Nom','Entreprise','E-mail','Téléphone','Besoins']}[lang];const msg=[labels[0],...['name','company','email','phone','message'].map((k,i)=>[labels[i+1],String(f.get(k)||'').trim()]).filter(x=>x[1]).map(x=>x.join(': '))].join('\n');window.open('https://wa.me/919946151111?text='+encodeURIComponent(msg),'_blank','noopener,noreferrer')});
})();
