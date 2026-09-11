
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, setDoc, deleteDoc, getDocs, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const $ = id => document.getElementById(id);
const configReady = firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("YOUR_");
let app, auth, db;
const modules = ["packages","bookings","customers","crm","drivers","expenses","documents","erp","operations","backup"];
const collections = ["packages","bookings","customers","crm","drivers","expenses","documents","vendors","payments","operations"];
let state = { user:null, profile:null, role:"staff", permissions:{}, packages:[], bookings:[], customers:[], crm:[], drivers:[], expenses:[], documents:[], vendors:[], payments:[], operations:[], staff:[] };

const titles = {
 dashboard:["Dashboard","Travel business overview"], packages:["Packages","Fixed tours, custom tours, eVisa and Umrah"],
 bookings:["Bookings","Reservations, payments and travel dates"], customers:["Customers","Customer directory"],
 drivers:["Drivers & Vehicles","Transport resources"], expenses:["Expenses","Travel and operating costs"], documents:["Invoices & Documents","Invoices, quotations, receipts and itineraries"], crm:["CRM & Leads","Enquiries, pipeline and follow-ups"], erp:["ERP & Finance","Receivables, suppliers and profitability"], operations:["Operations","Hotels, transport and trip delivery"],
 staff:["Staff & Permissions","Admin-controlled access"], backup:["Backup & Restore","Firebase data protection"],
 settings:["Settings","System and connection status"], "service-catalog":["Service Catalog","eVisa, Umrah, fixed-price and custom tour products"]
};

function isAdmin(){return state.role==="admin"}
function can(module){return isAdmin() || state.permissions?.[module]===true}
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2500)}
function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function money(v,currency="INR"){return new Intl.NumberFormat(currency==="AED"?"en-AE":"en-IN",{style:"currency",currency,maximumFractionDigits:0}).format(Number(v||0))}
function dateText(v){if(!v)return "—";const d=v?.toDate?v.toDate():new Date(v);return isNaN(d)?"—":d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}
function statusBadge(s){const x=String(s||"").toLowerCase();let c=x.includes("confirm")||x==="active"||x==="paid"||x==="available"?"green":x.includes("cancel")||x==="archived"||x==="inactive"?"red":x.includes("pending")||x==="partial"||x==="draft"||x==="on trip"?"amber":"blue";return `<span class="badge ${c}">${escapeHtml(s||"—")}</span>`}
function setConnection(ok){const el=$("connectionBadge"),set=$("settingsConnection");if(ok){el.className="badge green";el.innerHTML='<i data-lucide="cloud"></i> Firebase connected';set.className="badge green";set.textContent="Connected"}else{el.className="badge amber";el.innerHTML='<i data-lucide="cloud-off"></i> Demo / offline';set.className="badge amber";set.textContent="Not connected"}window.lucide?.createIcons()}
function openModal(id){$(id)?.classList.add("open");window.lucide?.createIcons()}
function closeModal(id){$(id)?.classList.remove("open")}
function initials(email){return (email||"A").split("@")[0].slice(0,2).toUpperCase()}
function authAlert(msg,type="error"){const a=$("authAlert");a.textContent=msg;a.className=`alert show ${type}`}

document.addEventListener("click",e=>{
 const pageBtn=e.target.closest("[data-page]");
 if(pageBtn){e.preventDefault();showPage(pageBtn.dataset.page);$("sidebar").classList.remove("open")}
 const open=e.target.closest("[data-open]");if(open)openModal(open.dataset.open);
 const close=e.target.closest("[data-close]");if(close)closeModal(close.dataset.close);
 if(e.target.classList.contains("modal-backdrop"))e.target.classList.remove("open");
});
$("mobileMenuBtn").addEventListener("click",()=> $("sidebar").classList.toggle("open"));
$("logoutBtn").addEventListener("click",async()=>{if(auth)await signOut(auth);else location.reload()});
$("addStaffBtn").addEventListener("click",()=>{if(isAdmin())openModal("staffModal");else toast("Admin access required")});

function applyPermissions(){
 document.querySelectorAll(".nav button[data-page]").forEach(b=>{
   const p=b.dataset.page;
   let allowed = p==="dashboard" || p==="service-catalog" || isAdmin();
   if(["packages","bookings","customers","crm","drivers","expenses","documents","erp","operations","backup"].includes(p)) allowed=can(p);
   if(p==="staff"||p==="settings") allowed=isAdmin();
   b.style.display=allowed?"flex":"none";
 });
 $("addStaffBtn").style.display=isAdmin()?"inline-flex":"none";
 if(!can("packages")) document.querySelectorAll('[data-open="packageModal"]').forEach(x=>x.style.display="none");
 if(!can("documents")) document.querySelectorAll('[data-open="documentModal"]').forEach(x=>x.style.display="none");
 if(!can("crm")) document.querySelectorAll('[data-open="leadModal"]').forEach(x=>x.style.display="none");
 if(!can("erp")) document.querySelectorAll('[data-open="vendorModal"]').forEach(x=>x.style.display="none");
}

function showPage(name){
 if(name!=="dashboard" && name!=="service-catalog" && !isAdmin() && !can(name)){toast("You don't have permission for this module");return}
 document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
 $(`page-${name}`).classList.add("active");
 document.querySelectorAll(".nav button").forEach(b=>b.classList.toggle("active",b.dataset.page===name));
 $("pageTitle").textContent=titles[name][0];$("pageSubtitle").textContent=titles[name][1];
 renderAll();
}

$("loginForm").addEventListener("submit",async e=>{
 e.preventDefault();
 if(!configReady){authAlert("Add your Firebase Web App config in firebase-config.js first.");return}
 try{await signInWithEmailAndPassword(auth,$("loginEmail").value.trim(),$("loginPassword").value);authAlert("Signed in","ok")}
 catch(err){authAlert(err.message||"Unable to sign in")}
});

async function loadCollection(name){
 if(!db)return state[name]=[];
 try{const snap=await getDocs(collection(db,name));state[name]=snap.docs.map(d=>({id:d.id,...d.data()}))}
 catch(err){console.error(name,err);state[name]=[]}
}
async function loadStaff(){
 if(!db||!isAdmin()){state.staff=[];return}
 try{const snap=await getDocs(collection(db,"users"));state.staff=snap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.role==="staff")}
 catch(err){console.error(err);state.staff=[]}
}
async function loadAll(){for(const c of collections)await loadCollection(c);await loadStaff();renderAll()}
async function add(name,data){
 if(!can(name)){toast("Permission denied");return}
 if(!db){state[name].unshift({id:crypto.randomUUID(),...data,createdAt:new Date().toISOString()});renderAll();toast("Saved in demo mode");return}
 await addDoc(collection(db,name),{...data,createdAt:serverTimestamp(),updatedAt:serverTimestamp(),ownerUid:state.user?.uid||null});await loadCollection(name);renderAll();toast("Saved to Firebase")
}
async function remove(name,id){
 if(!can(name))return toast("Permission denied");
 if(!confirm("Delete this record?"))return;
 if(db)await deleteDoc(doc(db,name,id));
 state[name]=state[name].filter(x=>x.id!==id);renderAll();toast("Record deleted")
}
window.removeRecord=remove;

function renderAll(){applyPermissions();renderDashboard();renderPackages();renderBookings();renderCustomers();renderCRM();renderDrivers();renderExpenses();renderDocuments();renderERP();renderOperations();renderStaff();populateBookingPackages();window.lucide?.createIcons()}
function renderDashboard(){
 const revenue=state.bookings.filter(b=>String(b.status).toLowerCase()!=="cancelled").reduce((a,b)=>a+Number(b.amount||0),0);
 $("kpis").innerHTML=[
  ["map","Packages",state.packages.length,"Travel products"],
  ["calendar-check-2","Bookings",state.bookings.length,"Reservations"],
  ["users","Customers",state.customers.length,"Customer records"],
  ["banknote","Revenue",money(revenue,state.bookings.find(b=>b.currency)?.currency||"INR"),"Active booking value"]
 ].map(x=>`<div class="kpi"><div class="label"><i data-lucide="${x[0]}"></i>${x[1]}</div><strong>${x[2]}</strong><small>${x[3]}</small></div>`).join("");
 const top=state.packages.slice(0,5),max=Math.max(1,...top.map(p=>Number(p.price||0)));
 $("packageChart").innerHTML=top.length?top.map(p=>`<div class="bar"><span>${escapeHtml(p.name)}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.max(8,Number(p.price||0)/max*100)}%"></div></div><b>${money(p.price,p.currency||"INR")}</b></div>`).join(""):`<div class="empty">No packages yet.</div>`;
 const recent=[...state.bookings].sort((a,b)=>String(b.createdAt||"").localeCompare(String(a.createdAt||""))).slice(0,5);
 $("recentBookings").innerHTML=recent.length?recent.map(b=>`<div class="stat-row"><span><b>${escapeHtml(b.customer)}</b><br><span style="color:var(--muted)">${escapeHtml(b.packageName||"Package")} • ${dateText(b.travelDate)}</span></span><span>${statusBadge(b.status)}</span></div>`).join(""):`<div class="empty">No bookings yet.</div>`;
}
function renderPackages(){
 const q=($("packageSearch")?.value||"").toLowerCase();
 const rows=state.packages.filter(p=>`${p.name} ${p.destination} ${p.status} ${p.serviceType}`.toLowerCase().includes(q));
 $("packagesTable").innerHTML=rows.length?rows.map(p=>`<tr><td><b>${escapeHtml(p.name)}</b><br><small style="color:var(--muted)">${escapeHtml(p.serviceType||"Tour")}</small></td><td>${escapeHtml(p.destination)}</td><td>${escapeHtml(p.duration)}</td><td>${money(p.price,p.currency||"INR")}<br><span class="badge">${escapeHtml(p.currency||"INR")}</span></td><td>${statusBadge(p.status)}</td><td>${dateText(p.updatedAt||p.createdAt)}</td><td>${can("packages")?`<button class="btn small danger" onclick="removeRecord('packages','${p.id}')"><i data-lucide="trash-2"></i></button>`:"—"}</td></tr>`).join(""):`<tr><td colspan="7"><div class="empty">No packages found.</div></td></tr>`;
}
function renderBookings(){
 const q=($("bookingSearch")?.value||"").toLowerCase(),rows=state.bookings.filter(b=>`${b.customer} ${b.packageName} ${b.status}`.toLowerCase().includes(q));
 $("bookingsTable").innerHTML=rows.length?rows.map(b=>`<tr><td><b>${escapeHtml(b.id.slice(0,8))}</b></td><td>${escapeHtml(b.customer)}</td><td>${escapeHtml(b.packageName)}</td><td>${dateText(b.travelDate)}</td><td>${money(b.amount,b.currency||"INR")}<br>${statusBadge(b.payment)}</td><td>${statusBadge(b.status)}</td><td>${can("bookings")?`<button class="btn small danger" onclick="removeRecord('bookings','${b.id}')"><i data-lucide="trash-2"></i></button>`:"—"}</td></tr>`).join(""):`<tr><td colspan="7"><div class="empty">No bookings found.</div></td></tr>`;
}
function renderCustomers(){
 const q=($("customerSearch")?.value||"").toLowerCase(),rows=state.customers.filter(c=>`${c.name} ${c.mobile} ${c.email} ${c.city}`.toLowerCase().includes(q));
 $("customersTable").innerHTML=rows.length?rows.map(c=>`<tr><td><b>${escapeHtml(c.name)}</b></td><td>${escapeHtml(c.mobile)}</td><td>${escapeHtml(c.email||"—")}</td><td>${escapeHtml(c.city||"—")}</td><td>${state.bookings.filter(b=>String(b.customer).toLowerCase()===String(c.name).toLowerCase()).length}</td><td>${can("customers")?`<button class="btn small danger" onclick="removeRecord('customers','${c.id}')"><i data-lucide="trash-2"></i></button>`:"—"}</td></tr>`).join(""):`<tr><td colspan="6"><div class="empty">No customers found.</div></td></tr>`;
}
function renderDrivers(){
 const q=($("driverSearch")?.value||"").toLowerCase(),rows=state.drivers.filter(d=>`${d.name} ${d.mobile} ${d.vehicle} ${d.registration}`.toLowerCase().includes(q));
 $("driversTable").innerHTML=rows.length?rows.map(d=>`<tr><td><b>${escapeHtml(d.name)}</b></td><td>${escapeHtml(d.mobile)}</td><td>${escapeHtml(d.vehicle||"—")}</td><td>${escapeHtml(d.registration||"—")}</td><td>${escapeHtml(d.capacity||"—")}</td><td>${statusBadge(d.status)}</td><td>${can("drivers")?`<button class="btn small danger" onclick="removeRecord('drivers','${d.id}')"><i data-lucide="trash-2"></i></button>`:"—"}</td></tr>`).join(""):`<tr><td colspan="7"><div class="empty">No drivers or vehicles found.</div></td></tr>`;
}
function renderExpenses(){
 const q=($("expenseSearch")?.value||"").toLowerCase(),rows=state.expenses.filter(x=>`${x.category} ${x.description} ${x.vendor}`.toLowerCase().includes(q));
 $("expensesTable").innerHTML=rows.length?rows.map(x=>`<tr><td>${dateText(x.date)}</td><td>${statusBadge(x.category)}</td><td>${escapeHtml(x.description)}</td><td>${escapeHtml(x.vendor||"—")}</td><td>${money(x.amount,x.currency||"INR")}</td><td>${can("expenses")?`<button class="btn small danger" onclick="removeRecord('expenses','${x.id}')"><i data-lucide="trash-2"></i></button>`:"—"}</td></tr>`).join(""):`<tr><td colspan="6"><div class="empty">No expenses found.</div></td></tr>`;
}
function renderStaff(){
 const q=($("staffSearch")?.value||"").toLowerCase();
 if(!isAdmin()){ $("staffTable").innerHTML='<tr><td colspan="5"><div class="empty">Admin access required.</div></td></tr>';return}
 const rows=state.staff.filter(s=>`${s.name} ${s.email}`.toLowerCase().includes(q));
 $("staffTable").innerHTML=rows.length?rows.map(s=>{
   const perms=Object.entries(s.permissions||{}).filter(([,v])=>v).map(([k])=>k).join(", ")||"None";
   return `<tr><td><b>${escapeHtml(s.name||"—")}</b><br><small style="color:var(--muted)">${escapeHtml(s.email||"")}</small></td><td>${statusBadge(s.role)}</td><td>${escapeHtml(perms)}</td><td>${statusBadge(s.status||"active")}</td><td><button class="btn small danger" onclick="removeStaff('${s.id}')"><i data-lucide="user-minus"></i></button></td></tr>`
 }).join(""):`<tr><td colspan="5"><div class="empty">No staff members yet.</div></td></tr>`;
}
window.removeStaff=async uid=>{
 if(!isAdmin()||!db)return toast("Admin + Firebase required");
 if(!confirm("Remove this staff profile? Their Firebase login should also be disabled from Authentication."))return;
 await deleteDoc(doc(db,"users",uid));await loadStaff();renderAll();toast("Staff profile removed")
};

function currencySymbol(code){return code==="AED"?"د.إ":"₹"}
function documentTotal(d){
  const subtotal=Number(d.subtotal||0), discount=Number(d.discount||0), rate=Number(d.taxRate||0);
  return Math.max(0, subtotal-discount) * (1 + rate/100);
}

function renderCRM(){
 const leads=state.crm||[], q=($("leadSearch")?.value||"").toLowerCase();
 const rows=leads.filter(l=>`${l.name} ${l.mobile} ${l.interest} ${l.stage}`.toLowerCase().includes(q));
 const stages=["New","Contacted","Qualified","Quoted","Won","Lost"];
 const counts=Object.fromEntries(stages.map(s=>[s,leads.filter(l=>l.stage===s).length]));
 $("crmKpis").innerHTML=[
  ["user-plus","Leads",leads.length,"All enquiries"],
  ["target","Qualified",counts.Qualified||0,"Sales-ready leads"],
  ["file-check-2","Quoted",counts.Quoted||0,"Quotation stage"],
  ["trophy","Won",counts.Won||0,"Converted opportunities"]
 ].map(x=>`<div class="kpi"><div class="label"><i data-lucide="${x[0]}"></i>${x[1]}</div><strong>${x[2]}</strong><small>${x[3]}</small></div>`).join("");
 $("leadsTable").innerHTML=rows.length?rows.map(l=>`<tr><td><b>${escapeHtml(l.name)}</b><br><small style="color:var(--muted)">${escapeHtml(l.email||"")}</small></td><td>${escapeHtml(l.mobile)}</td><td>${escapeHtml(l.interest)}</td><td>${money(l.value||0,l.currency||"INR")}</td><td>${statusBadge(l.stage)}</td><td>${dateText(l.followup)}</td><td>${escapeHtml(l.owner||state.user?.email||"—")}</td><td><button class="btn small danger" onclick="removeRecord('crm','${l.id}')"><i data-lucide="trash-2"></i></button></td></tr>`).join(""):`<tr><td colspan="8"><div class="empty">No leads found.</div></td></tr>`;
}
function renderERP(){
 const revenue=state.bookings.filter(b=>String(b.status).toLowerCase()!=="cancelled").reduce((a,b)=>a+Number(b.amount||0),0);
 const expenses=state.expenses.reduce((a,b)=>a+Number(b.amount||0),0);
 const paid=state.bookings.filter(b=>String(b.payment).toLowerCase()==="paid").reduce((a,b)=>a+Number(b.amount||0),0);
 const outstanding=Math.max(0,revenue-paid);
 const payables=(state.vendors||[]).reduce((a,v)=>a+Number(v.payable||0),0);
 const profit=revenue-expenses;
 $("erpKpis").innerHTML=[
  ["trending-up","Sales",money(revenue,"INR"),"Booking value"],
  ["wallet","Collected",money(paid,"INR"),"Marked paid"],
  ["clock-3","Receivable",money(outstanding,"INR"),"Estimated outstanding"],
  ["chart-no-axes-combined","Gross view",money(profit,"INR"),"Revenue less expenses"]
 ].map(x=>`<div class="kpi"><div class="label"><i data-lucide="${x[0]}"></i>${x[1]}</div><strong>${x[2]}</strong><small>${x[3]}</small></div>`).join("");
 const outstandingRows=state.bookings.filter(b=>String(b.payment).toLowerCase()!=="paid" && String(b.status).toLowerCase()!=="cancelled").slice(0,7);
 $("receivablesList").innerHTML=outstandingRows.length?outstandingRows.map(b=>`<div class="stat-row"><span><b>${escapeHtml(b.customer)}</b><br><span style="color:var(--muted)">${escapeHtml(b.packageName||"Package")}</span></span><span>${money(b.amount,b.currency||"INR")}</span></div>`).join(""):`<div class="empty">No outstanding bookings.</div>`;
 $("profitabilityList").innerHTML=`<div class="stat-row"><span>Booking revenue</span><b>${money(revenue,"INR")}</b></div><div class="stat-row"><span>Recorded expenses</span><b>- ${money(expenses,"INR")}</b></div><div class="stat-row"><span>Supplier payables</span><b>${money(payables,"INR")}</b></div><div class="stat-row"><span>Operating view</span><b>${money(profit,"INR")}</b></div>`;
 const q=($("vendorSearch")?.value||"").toLowerCase(), vendors=(state.vendors||[]).filter(v=>`${v.name} ${v.category} ${v.contact}`.toLowerCase().includes(q));
 $("vendorsTable").innerHTML=vendors.length?vendors.map(v=>`<tr><td><b>${escapeHtml(v.name)}</b></td><td>${escapeHtml(v.category)}</td><td>${escapeHtml(v.contact||"—")}</td><td>${escapeHtml(v.currency||"INR")}</td><td>${money(v.payable||0,v.currency||"INR")}</td><td>${statusBadge(v.status)}</td><td><button class="btn small danger" onclick="removeRecord('vendors','${v.id}')"><i data-lucide="trash-2"></i></button></td></tr>`).join(""):`<tr><td colspan="7"><div class="empty">No suppliers found.</div></td></tr>`;
}
function renderOperations(){
 const confirmed=state.bookings.filter(b=>String(b.status).toLowerCase()==="confirmed").length;
 const activeDrivers=state.drivers.filter(d=>String(d.status).toLowerCase()==="available").length;
 // Keep a compact operational snapshot without introducing fake operational records.
}
function renderDocuments(){
  const q=($("documentSearch")?.value||"").toLowerCase();
  const rows=state.documents.filter(d=>`${d.number} ${d.type} ${d.customer} ${d.bookingRef}`.toLowerCase().includes(q));
  $("documentsTable").innerHTML=rows.length?rows.map(d=>`<tr>
    <td><b>${escapeHtml(d.number)}</b></td><td>${escapeHtml(d.type)}</td><td>${escapeHtml(d.customer)}</td>
    <td>${dateText(d.issueDate)}</td><td>${escapeHtml(d.currency||"INR")}</td>
    <td>${currencySymbol(d.currency)} ${documentTotal(d).toLocaleString("en-IN",{maximumFractionDigits:2})}</td>
    <td>${statusBadge(d.status)}</td>
    <td><div class="actions">
      <button class="btn small" onclick="printDocument('${d.id}')"><i data-lucide="printer"></i> Print</button>
      <button class="btn small danger" onclick="removeRecord('documents','${d.id}')"><i data-lucide="trash-2"></i></button>
    </div></td>
  </tr>`).join(""):`<tr><td colspan="8"><div class="empty">No documents found.</div></td></tr>`;
}
function buildPrintableDocument(d){
  const sym=currencySymbol(d.currency), subtotal=Number(d.subtotal||0), discount=Number(d.discount||0), tax=Number(Math.max(0,subtotal-discount)*Number(d.taxRate||0)/100), total=subtotal-discount+tax;
  const title=d.type==="Invoice"?"TAX INVOICE":String(d.type||"DOCUMENT").toUpperCase();
  const items=escapeHtml(d.items||"").replace(/\n/g,"<br>");
  const notes=escapeHtml(d.notes||"").replace(/\n/g,"<br>");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(d.number)} — ${title}</title>
  <style>
  @page{size:A4;margin:14mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#202124;margin:0;background:#fff}
  .sheet{max-width:820px;margin:auto}.top{display:flex;justify-content:space-between;gap:30px;border-bottom:3px solid #d71916;padding-bottom:22px}
  .brand{display:flex;gap:12px;align-items:center}.brand img{width:55px;height:55px;border-radius:12px;object-fit:cover}.brand h1{font-size:24px;margin:0}.brand p{font-size:11px;color:#6b7074;margin:3px 0}
  .doc{text-align:right}.doc h2{font-size:23px;margin:0 0 6px;color:#d71916}.doc p{margin:2px 0;font-size:11px;color:#555}
  .meta{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:25px 0}.box{border:1px solid #ddd;border-radius:10px;padding:13px}.label{font-size:9px;text-transform:uppercase;color:#777;letter-spacing:.7px}.value{font-size:13px;font-weight:700;margin-top:4px}
  table{width:100%;border-collapse:collapse;margin-top:20px}th,td{padding:11px 9px;border-bottom:1px solid #ddd;text-align:left;font-size:12px}th{background:#f6f7f8;font-size:10px;text-transform:uppercase;color:#666}td.num,th.num{text-align:right}
  .summary{margin:22px 0 0 auto;width:330px}.row{display:flex;justify-content:space-between;padding:7px 0;font-size:12px}.grand{border-top:2px solid #202124;margin-top:5px;padding-top:10px;font-size:16px;font-weight:800}
  .notes{margin-top:30px;border-top:1px solid #ddd;padding-top:14px;font-size:11px;color:#555}.footer{margin-top:45px;padding-top:12px;border-top:1px solid #ddd;display:flex;justify-content:space-between;font-size:9px;color:#777}
  @media print{body{background:#fff}.sheet{max-width:none}}
  </style></head><body><div class="sheet">
  <div class="top"><div class="brand"><img src="${location.origin+location.pathname.replace(/[^/]*$/,"")}assets/logo.jpg"><div><h1>Travells</h1><p>Travel &amp; Packages</p><p>Professional travel services</p></div></div>
  <div class="doc"><h2>${title}</h2><p><b>${escapeHtml(d.number)}</b></p><p>Date: ${escapeHtml(dateText(d.issueDate))}</p><p>Currency: ${escapeHtml(d.currency||"INR")}</p></div></div>
  <div class="meta"><div class="box"><div class="label">Bill To / Customer</div><div class="value">${escapeHtml(d.customer)}</div><div style="font-size:11px;color:#666;margin-top:4px">Booking: ${escapeHtml(d.bookingRef||"—")}</div></div>
  <div class="box"><div class="label">Business details</div><div class="value">Travells</div><div style="font-size:11px;color:#666;margin-top:4px">Add your final address, GSTIN/TRN, phone and email in the production settings.</div></div></div>
  <table><thead><tr><th>Description</th><th class="num">Amount</th></tr></thead><tbody><tr><td>${items}</td><td class="num">${sym} ${subtotal.toLocaleString("en-IN",{maximumFractionDigits:2})}</td></tr></tbody></table>
  <div class="summary"><div class="row"><span>Subtotal</span><b>${sym} ${subtotal.toLocaleString("en-IN",{maximumFractionDigits:2})}</b></div>
  <div class="row"><span>Discount</span><b>- ${sym} ${discount.toLocaleString("en-IN",{maximumFractionDigits:2})}</b></div>
  <div class="row"><span>Tax (${Number(d.taxRate||0)}%)</span><b>${sym} ${tax.toLocaleString("en-IN",{maximumFractionDigits:2})}</b></div>
  <div class="row grand"><span>Total</span><span>${sym} ${total.toLocaleString("en-IN",{maximumFractionDigits:2})}</span></div></div>
  <div class="notes"><b>Notes / terms</b><div style="margin-top:7px">${notes||"Thank you for choosing Travells."}</div></div>
  <div class="footer"><span>Generated from Travells Admin</span><span>${escapeHtml(d.status||"Draft")}</span></div></div>
  <script>window.onload=()=>setTimeout(()=>window.print(),300)</script></body></html>`;
}
window.printDocument=async id=>{
  const d=state.documents.find(x=>x.id===id);if(!d)return;
  const w=window.open("","_blank","width=900,height=1000");if(!w)return toast("Allow pop-ups to print the document");
  w.document.open();w.document.write(buildPrintableDocument(d));w.document.close();
};

function populateBookingPackages(){$("bookingPackage").innerHTML=state.packages.length?state.packages.map(p=>`<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)} — ${money(p.price,p.currency||"INR")}</option>`).join(""):'<option value="">Add a package first</option>'}

$("packageForm").addEventListener("submit",async e=>{
 e.preventDefault();await add("packages",{name:$("packageName").value.trim(),destination:$("packageDestination").value.trim(),duration:$("packageDuration").value.trim(),price:Number($("packagePrice").value),currency:$("packageCurrency").value,serviceType:$("packageServiceType").value,pricingModel:$("packagePricingModel").value,status:$("packageStatus").value,description:$("packageDescription").value.trim()});e.target.reset();closeModal("packageModal")
});
$("bookingForm").addEventListener("submit",async e=>{
 e.preventDefault();const p=state.packages.find(x=>x.id===$("bookingPackage").value);await add("bookings",{customer:$("bookingCustomer").value.trim(),packageId:p?.id||null,packageName:p?.name||"Unknown",travelDate:$("bookingDate").value,amount:Number($("bookingAmount").value),currency:$("bookingCurrency").value,status:$("bookingStatus").value,payment:$("bookingPayment").value});e.target.reset();closeModal("bookingModal")
});
$("customerForm").addEventListener("submit",async e=>{e.preventDefault();await add("customers",{name:$("customerName").value.trim(),mobile:$("customerMobile").value.trim(),email:$("customerEmail").value.trim(),city:$("customerCity").value.trim()});e.target.reset();closeModal("customerModal")});
$("driverForm").addEventListener("submit",async e=>{e.preventDefault();await add("drivers",{name:$("driverName").value.trim(),mobile:$("driverMobile").value.trim(),vehicle:$("driverVehicle").value.trim(),registration:$("driverReg").value.trim(),capacity:Number($("driverCapacity").value),status:$("driverStatus").value});e.target.reset();closeModal("driverModal")});
$("expenseForm").addEventListener("submit",async e=>{e.preventDefault();await add("expenses",{date:$("expenseDate").value,category:$("expenseCategory").value,description:$("expenseDescription").value.trim(),vendor:$("expenseVendor").value.trim(),amount:Number($("expenseAmount").value),currency:$("expenseCurrency").value});e.target.reset();closeModal("expenseModal")});


$("leadForm").addEventListener("submit",async e=>{
 e.preventDefault();
 if(!can("crm"))return toast("CRM permission denied");
 await add("crm",{name:$("leadName").value.trim(),mobile:$("leadMobile").value.trim(),email:$("leadEmail").value.trim(),source:$("leadSource").value,interest:$("leadInterest").value,value:Number($("leadValue").value||0),currency:"INR",stage:$("leadStage").value,followup:$("leadFollowup").value,notes:$("leadNotes").value.trim(),owner:state.user?.email||"Admin"});
 e.target.reset();closeModal("leadModal");
});
$("vendorForm").addEventListener("submit",async e=>{
 e.preventDefault();
 if(!can("erp"))return toast("ERP permission denied");
 await add("vendors",{name:$("vendorName").value.trim(),category:$("vendorCategory").value,contact:$("vendorContact").value.trim(),currency:$("vendorCurrency").value,payable:Number($("vendorPayable").value||0),status:$("vendorStatus").value,notes:$("vendorNotes").value.trim()});
 e.target.reset();closeModal("vendorModal");
});

$("staffForm").addEventListener("submit",async e=>{
 e.preventDefault();
 if(!isAdmin()||!db){toast("Connect Firebase and sign in as admin first");return}
 const permissions={};document.querySelectorAll(".perm-check").forEach(x=>permissions[x.dataset.perm]=x.checked);
 try{
   const response=await fetch("/api/createStaff",{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${await state.user.getIdToken()}`},body:JSON.stringify({name:$("staffName").value.trim(),email:$("staffEmail").value.trim(),password:$("staffPassword").value,permissions,status:$("staffStatus").value})});
   if(!response.ok)throw new Error(await response.text());
   e.target.reset();closeModal("staffModal");await loadStaff();renderAll();toast("Staff created")
 }catch(err){console.error(err);toast("Staff creation needs the deployed createStaff backend")}
});


function updateDocumentPreview(){
  const c=$("documentCurrency")?.value||"INR", sym=currencySymbol(c);
  const subtotal=Number($("documentSubtotal")?.value||0), discount=Number($("documentDiscount")?.value||0), rate=Number($("documentTaxRate")?.value||0);
  const tax=Math.max(0,subtotal-discount)*rate/100, total=subtotal-discount+tax;
  $("documentTaxPreview").textContent=`${sym}${tax.toLocaleString("en-IN",{maximumFractionDigits:2})}`;
  $("documentTotalPreview").textContent=`${sym}${total.toLocaleString("en-IN",{maximumFractionDigits:2})}`;
}
["documentCurrency","documentSubtotal","documentDiscount","documentTaxRate"].forEach(id=>$(id)?.addEventListener("input",updateDocumentPreview));
$("documentForm").addEventListener("submit",async e=>{
  e.preventDefault();
  await add("documents",{
    type:$("documentType").value,number:$("documentNumber").value.trim(),customer:$("documentCustomer").value.trim(),
    bookingRef:$("documentBooking").value.trim(),issueDate:$("documentDate").value,currency:$("documentCurrency").value,
    subtotal:Number($("documentSubtotal").value||0),discount:Number($("documentDiscount").value||0),
    taxRate:Number($("documentTaxRate").value||0),status:$("documentStatus").value,
    items:$("documentItems").value.trim(),notes:$("documentNotes").value.trim()
  });
  e.target.reset();$("documentTaxPreview").textContent="₹0";$("documentTotalPreview").textContent="₹0";closeModal("documentModal");
});

$("seedBtn").addEventListener("click",async()=>{
 if(!can("packages"))return toast("Permission denied");
 if(state.packages.length&&!confirm("Add demo records alongside existing packages?"))return;
 const demos=[
  {name:"Kerala Explorer",destination:"Munnar • Thekkady • Alleppey",duration:"5 Days / 4 Nights",price:29999,currency:"INR",serviceType:"Tour — Fixed Price",pricingModel:"Fixed",status:"Active",description:"Hill stations, wildlife and backwater experiences."},
  {name:"Umrah Economy",destination:"Makkah • Madinah",duration:"10 Days / 9 Nights",price:79999,currency:"INR",serviceType:"Umrah",pricingModel:"Fixed",status:"Active",description:"Umrah package with configurable dates and inclusions."},
  {name:"UAE eVisa",destination:"United Arab Emirates",duration:"Visa service",price:450,currency:"AED",serviceType:"eVisa",pricingModel:"Fixed",status:"Active",description:"eVisa service product."},
  {name:"Dubai Custom Choose",destination:"Dubai • Abu Dhabi",duration:"Custom",price:0,currency:"AED",serviceType:"Tour — Custom Choose",pricingModel:"Custom",status:"Draft",description:"Build a quotation from selected hotels, transport and activities."}
 ];
 for(const p of demos)await add("packages",p)
});

$("exportBtn").addEventListener("click",()=>{
 if(!can("backup"))return toast("Backup permission denied");
 const payload={exportedAt:new Date().toISOString(),app:"Travells Packages Admin",collections:Object.fromEntries(collections.map(c=>[c,state[c].map(({id,...data})=>({id,...data}))]))};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`travells-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);toast("Backup downloaded")
});
$("restoreBtn").addEventListener("click",async()=>{
 if(!can("backup"))return toast("Backup permission denied");
 const file=$("restoreFile").files[0];if(!file)return toast("Select a JSON backup first");
 if(!confirm("Restore this backup? Existing documents with the same IDs may be overwritten."))return;
 try{const data=JSON.parse(await file.text());for(const c of collections)for(const item of(data.collections?.[c]||[])){const{id,...rest}=item;if(db&&id)await setDoc(doc(db,c,id),{...rest,restoredAt:serverTimestamp()},{merge:true})}await loadAll();toast("Backup restored")}catch(err){console.error(err);toast("Invalid backup file")}
});

["packageSearch","bookingSearch","customerSearch","driverSearch","expenseSearch","staffSearch","leadSearch","vendorSearch","documentSearch"].forEach(id=>$(id)?.addEventListener("input",renderAll));

async function init(){
 window.lucide?.createIcons();
 if(!configReady){setConnection(false);$("authView").style.display="grid";$("appView").style.display="none";$("firebaseProject").textContent="Firebase config not added yet";return}
 try{
  app=initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app);$("firebaseProject").textContent=firebaseConfig.projectId;
  onAuthStateChanged(auth,async user=>{
   state.user=user;
   if(user){
    $("authView").style.display="none";$("appView").style.display="flex";$("userEmail").textContent=user.email||"Admin";$("settingsEmail").textContent=user.email||"—";$("avatar").textContent=initials(user.email);
    try{
      const snap=await getDoc(doc(db,"users",user.uid));
      state.profile=snap.exists()?snap.data():null;state.role=state.profile?.role||"staff";state.permissions=state.profile?.permissions||{};
    }catch(e){state.role="staff";state.permissions={}}
    setConnection(true);applyPermissions();await loadAll();showPage("dashboard")
   }else{$("authView").style.display="grid";$("appView").style.display="none";setConnection(false)}
  })
 }catch(err){console.error(err);setConnection(false);authAlert("Firebase initialization failed. Check firebase-config.js.")}
}
init();
