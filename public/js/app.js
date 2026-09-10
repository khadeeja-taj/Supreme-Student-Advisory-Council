/* ---------- API CLIENT (hybrid) ----------
   Works in two modes automatically:
   • FULL mode  — when a Node/Express back-end answers /api/* (e.g. deployed on
                  Render), registrations go to the central database.
   • STATIC mode — when there is no back-end (e.g. GitHub Pages), it falls back
                  to the browser's localStorage so the site still works. Note:
                  in static mode each browser only sees its own submissions.
   Leave API_BASE empty to call the same origin that serves the page; set it to
   your API URL if you host the back-end on a different domain. */
const API_BASE = "";

// Password used ONLY in static mode (GitHub Pages). In full mode the server's
// ADMIN_PASSWORD is used instead. Change this before publishing.
const STATIC_ADMIN_PASSWORD = "sac2026";

let adminToken = sessionStorage.getItem('ssac_admin_token') || null;

async function api(path, opts){
  opts = opts || {};
  try{
    const res = await fetch(API_BASE + path, {
      method: opts.method || 'GET',
      headers: Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {}),
      body: opts.body
    });
    const ct = res.headers.get('content-type') || '';
    // No JSON back-end here (e.g. GitHub Pages serves a 404 HTML page) -> static mode.
    if(!ct.includes('application/json')){
      return localApi(path, opts);
    }
    let body = {};
    try{ body = await res.json(); }catch(e){ /* no json body */ }
    if(!res.ok){
      const err = new Error(body.error || ('Request failed (' + res.status + ')'));
      err.status = res.status;
      throw err;
    }
    return body;
  }catch(e){
    // Network error means no server is reachable -> static mode.
    if(e instanceof TypeError){ return localApi(path, opts); }
    throw e;
  }
}

// localStorage-backed stand-in for the API, used in static mode.
function localApi(path, opts){
  const method = (opts.method || 'GET').toUpperCase();
  const payload = opts.body ? JSON.parse(opts.body) : {};
  const LKEY = 'ssac_registrations';
  const read = () => { try{ return JSON.parse(localStorage.getItem(LKEY) || '[]'); }catch(e){ return []; } };
  const write = (arr) => { try{ localStorage.setItem(LKEY, JSON.stringify(arr)); }catch(e){} };

  if(path === '/api/register' && method === 'POST'){
    const list = read();
    payload.id = Date.now();
    list.push(payload);
    write(list);
    return { ok: true, id: payload.id };
  }
  if(path === '/api/admin/login' && method === 'POST'){
    if(payload.password === STATIC_ADMIN_PASSWORD){ return { ok: true, token: 'local' }; }
    const err = new Error('Incorrect password'); err.status = 401; throw err;
  }
  if(path === '/api/registrations' && method === 'GET'){ return { registrations: read() }; }
  if(path === '/api/registrations' && method === 'DELETE'){ write([]); return { ok: true, removed: 0 }; }
  const err = new Error('Not found'); err.status = 404; throw err;
}

const DEPARTMENTS = [
  {en:"Faculty of Arabic", ar:"كلية اللغة العربية", icon:"book"},
  {en:"Faculty of Computing & Information Technology", ar:"كلية علوم الحاسوب وتقنية المعلومات", icon:"chip"},
  {en:"Faculty of Education", ar:"كلية التربية", icon:"cap"},
  {en:"Faculty of Engineering and Technology", ar:"كلية الهندسة والتكنولوجيا", icon:"gear"},
  {en:"Faculty of Languages & Literature", ar:"كلية اللغات والآداب", icon:"globe"},
  {en:"Faculty of Management Sciences", ar:"كلية علوم الإدارة", icon:"case"},
  {en:"Faculty of Sciences", ar:"كلية العلوم", icon:"flask"},
  {en:"Faculty of Social Sciences", ar:"كلية العلوم الاجتماعية", icon:"people"},
  {en:"Faculty of Shariah and Law", ar:"كلية الشريعة والقانون", icon:"scale"},
  {en:"Faculty of Usuluddin (Islamic Studies)", ar:"كلية أصول الدين", icon:"mosque"},
  {en:"International Institute of Islamic Economics", ar:"المعهد الدولي للاقتصاد الإسلامي", icon:"chart"}
];

const ICONS = {
  book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13z"/><path d="M4 19.5V6.5"/>',
  chip:'<rect x="7" y="7" width="10" height="10" rx="1"/><path d="M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4"/>',
  cap:'<path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 005 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.14.36.22.75.22 1.15"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 4 6 4 9s-1.5 6.3-4 9c-2.5-2.7-4-6-4-9s1.5-6.3 4-9z"/>',
  case:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/>',
  flask:'<path d="M9 3h6M10 3v6l-5.5 9a2 2 0 001.7 3h11.6a2 2 0 001.7-3L14 9V3"/>',
  people:'<circle cx="9" cy="8" r="3.2"/><path d="M2.5 19c0-3 3-5 6.5-5s6.5 2 6.5 5"/><circle cx="18" cy="9" r="2.4"/><path d="M15.7 14.2c2.6.3 4.8 2 4.8 4.8"/>',
  scale:'<path d="M12 3v18M6 7l-3.5 7a3.5 3.5 0 007 0L6 7zM18 7l-3.5 7a3.5 3.5 0 007 0L18 7zM3.5 7h5M15.5 7h5M8 21h8"/>',
  mosque:'<path d="M3 21h18M4 21v-7a4 4 0 014-4 4 4 0 014 4M12 10a4 4 0 014-4 4 4 0 014 4v7M12 3v3M9 21v-5h6v5"/>',
  chart:'<path d="M3 3v18h18M8 17V10M13 17V6M18 17v-4"/>'
};

const I18N = {
  en:{
    "nav.home":"Home","nav.departments":"Departments","nav.reps":"Representatives","nav.news":"News","nav.contact":"Contact","nav.admin":"Admin","nav.getstarted":"Get Started",
    "brand.title":"Supreme Student Advisory Council","brand.sub":"INTERNATIONAL ISLAMIC UNIVERSITY, ISLAMABAD",
    "hero.tag":"ISLAMIC · INTERNATIONAL ISLAMIC UNIVERSITY, ISLAMABAD",
    "hero.title":"Supreme Student Advisory Council",
    "hero.lead":"Under the direction of the Worthy President of the International Islamic University Islamabad, the University is pleased to announce the establishment of the Supreme Student Advisory Council — a platform for students across every faculty to represent, advise and shape campus life.",
    "hero.cta":"Get Started",
    "how.title":"How registration works","how.sub":"Three quick steps to join your faculty's advisory representation.",
    "how.c1t":"Choose your faculty","how.c1p":"Select the department you're currently enrolled in from the eleven faculties of IIUI.",
    "how.c2t":"Tell us about you","how.c2p":"Share a few personal and academic details so we can place you correctly.",
    "how.c3t":"Submit and you're in","how.c3p":"One click submits your application to the Council for review.",
    "footer":"© 2026 Supreme Student Advisory Council · International Islamic University, Islamabad",
    "crumb.home":"← Home","crumb.dept":"← Change faculty","crumb.gender":"← Change council",
    "dept.kicker":"STEP 1 OF 3","dept.title":"Overview of Faculties","dept.sub":"Select the faculty you are currently enrolled in to continue your registration.",
    "gender.kicker":"STEP 2 OF 3","gender.title":"Select Your Council","gender.sub":"The Supreme Student Advisory Council operates as two parallel wings.",
    "gender.male":"Male Council","gender.malep":"Register under the Male Student Advisory Council",
    "gender.female":"Female Council","gender.femalep":"Register under the Female Student Advisory Council",
    "reg.kicker":"STEP 3 OF 3","reg.title":"Student Registration","reg.sub":"Complete the form below to join the Supreme Student Advisory Council.",
    "step.personal":"Personal","step.academic":"Academic","step.submit":"Submit",
    "p1.head":"Personal Information","p1.sub":"Tell us a little about yourself.",
    "p2.head":"Academic Information","p2.sub":"Which faculty and program are you enrolled in?",
    "p3.head":"Ready to submit","p3.sub":"Your details have been filled in. Press the button below to send your application to the Supreme Student Advisory Council.",
    "p3.note":"Note: Registration is open only to students currently enrolled at the University.",
    "f.name":"Full Name","f.email":"Email Address","f.phone":"Phone Number","f.nat":"Nationality","f.reg":"Registration Number",
    "f.faculty":"Faculty","f.autofill":"(auto-filled)","f.program":"Degree Program","f.semester":"Current Semester","f.year":"Year of Study","f.cgpa":"CGPA","f.optional":"(optional)",
    "btn.continue":"Next →","btn.next":"Next →","btn.back":"← Back","btn.submit":"Submit Registration",
    "success.title":"Registration Submitted","success.sub":"Thank you for joining the Supreme Student Advisory Council. Your application has been recorded and will be reviewed by the Council team.",
    "success.home":"Back to Home","success.admin":"Go to Admin",
    "admin.back":"← Back to Home","admin.title":"Admin Control","admin.sub":"Enter the admin password to view submitted registrations.","admin.hint":"Authorized council staff only.","admin.login":"Log In",
    "admin.regs":"Council Registrations","admin.refresh":"Refresh","admin.clear":"Clear All","admin.logout":"Log Out","admin.empty":"No registrations yet.",
    "admin.th.name":"Name","admin.th.email":"Email","admin.th.phone":"Phone","admin.th.faculty":"Faculty","admin.th.category":"Category","admin.th.program":"Program","admin.th.semester":"Semester","admin.th.reg":"Reg #","admin.th.submitted":"Submitted"
  },
  ar:{
    "nav.home":"الرئيسية","nav.departments":"الكليات","nav.reps":"الممثلون","nav.news":"الأخبار","nav.contact":"اتصل بنا","nav.admin":"الإدارة","nav.getstarted":"ابدأ الآن",
    "brand.title":"المجلس الاستشاري الطلابي الأعلى","brand.sub":"الجامعة الإسلامية العالمية بإسلام آباد",
    "hero.tag":"الجامعة الإسلامية العالمية بإسلام آباد",
    "hero.title":"المجلس الاستشاري الطلابي الأعلى",
    "hero.lead":"بتوجيه من رئيس الجامعة الإسلامية العالمية بإسلام آباد، يسر الجامعة أن تعلن عن تأسيس المجلس الاستشاري الطلابي الأعلى — منصة لطلاب جميع الكليات لتمثيل الطلاب وتقديم المشورة وتشكيل الحياة الجامعية.",
    "hero.cta":"ابدأ الآن",
    "how.title":"كيف يتم التسجيل","how.sub":"ثلاث خطوات سريعة للانضمام إلى تمثيل كليتك الاستشاري.",
    "how.c1t":"اختر كليتك","how.c1p":"اختر القسم الذي تدرس فيه حاليًا من بين كليات الجامعة الإحدى عشرة.",
    "how.c2t":"أخبرنا عن نفسك","how.c2p":"شارك بعض المعلومات الشخصية والأكاديمية لوضعك في المكان الصحيح.",
    "how.c3t":"أرسل وأنت منضم","how.c3p":"بضغطة واحدة يتم إرسال طلبك إلى المجلس للمراجعة.",
    "footer":"© 2026 المجلس الاستشاري الطلابي الأعلى · الجامعة الإسلامية العالمية بإسلام آباد",
    "crumb.home":"← الرئيسية","crumb.dept":"← تغيير الكلية","crumb.gender":"← تغيير المجلس",
    "dept.kicker":"الخطوة ١ من ٣","dept.title":"نظرة عامة على الكليات","dept.sub":"اختر الكلية التي تدرس فيها حاليًا لمتابعة التسجيل.",
    "gender.kicker":"الخطوة ٢ من ٣","gender.title":"اختر مجلسك","gender.sub":"يعمل المجلس الاستشاري الطلابي الأعلى بجناحين متوازيين.",
    "gender.male":"المجلس الطلابي (طلاب)","gender.malep":"سجل ضمن المجلس الاستشاري لقسم الطلاب",
    "gender.female":"المجلس الطلابي (طالبات)","gender.femalep":"سجلي ضمن المجلس الاستشاري لقسم الطالبات",
    "reg.kicker":"الخطوة ٣ من ٣","reg.title":"تسجيل الطالب","reg.sub":"أكمل النموذج أدناه للانضمام إلى المجلس الاستشاري الطلابي الأعلى.",
    "step.personal":"شخصي","step.academic":"أكاديمي","step.submit":"إرسال",
    "p1.head":"المعلومات الشخصية","p1.sub":"أخبرنا القليل عن نفسك.",
    "p2.head":"المعلومات الأكاديمية","p2.sub":"في أي كلية وبرنامج أنت مسجل؟",
    "p3.head":"جاهز للإرسال","p3.sub":"تم تعبئة بياناتك. اضغط الزر أدناه لإرسال طلبك إلى المجلس الاستشاري الطلابي الأعلى.",
    "p3.note":"ملاحظة: التسجيل متاح فقط للطلاب المسجلين حاليًا في الجامعة.",
    "f.name":"الاسم الكامل","f.email":"البريد الإلكتروني","f.phone":"رقم الهاتف","f.nat":"الجنسية","f.reg":"الرقم الجامعي",
    "f.faculty":"الكلية","f.autofill":"(معبأ تلقائيًا)","f.program":"البرنامج الدراسي","f.semester":"الفصل الدراسي الحالي","f.year":"سنة الدراسة","f.cgpa":"المعدل التراكمي","f.optional":"(اختياري)",
    "btn.continue":"التالي ←","btn.next":"التالي ←","btn.back":"→ رجوع","btn.submit":"إرسال التسجيل",
    "success.title":"تم إرسال التسجيل","success.sub":"شكرًا لانضمامك إلى المجلس الاستشاري الطلابي الأعلى. تم تسجيل طلبك وسيتم مراجعته من قبل فريق المجلس.",
    "success.home":"العودة للرئيسية","success.admin":"الذهاب إلى الإدارة",
    "admin.back":"← العودة للرئيسية","admin.title":"لوحة تحكم الإدارة","admin.sub":"أدخل كلمة مرور الإدارة لعرض التسجيلات المقدمة.","admin.hint":"للموظفين المصرح لهم فقط.","admin.login":"تسجيل الدخول",
    "admin.regs":"تسجيلات المجلس","admin.refresh":"تحديث","admin.clear":"مسح الكل","admin.logout":"تسجيل الخروج","admin.empty":"لا توجد تسجيلات بعد.",
    "admin.th.name":"الاسم","admin.th.email":"البريد الإلكتروني","admin.th.phone":"الهاتف","admin.th.faculty":"الكلية","admin.th.category":"الفئة","admin.th.program":"البرنامج","admin.th.semester":"الفصل","admin.th.reg":"الرقم الجامعي","admin.th.submitted":"تاريخ الإرسال"
  }
};

let lang = 'en';
function toggleLang(){
  lang = (lang === 'en') ? 'ar' : 'en';
  applyLang();
}
function applyLang(){
  const dict = I18N[lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if(dict[key] !== undefined){ el.textContent = dict[key]; }
  });
  document.getElementById('htmlRoot').setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  document.getElementById('htmlRoot').setAttribute('lang', lang);
  document.getElementById('langBtn').textContent = lang === 'ar' ? '🌐 English' : '🌐 العربية';
  document.getElementById('langBtnMobile').textContent = lang === 'ar' ? 'English' : 'العربية';
  renderDepartments();
  if(state.department){
    document.getElementById('f_faculty').value = deptLabel(state.department);
  }
}

function deptLabel(d){ return lang === 'ar' ? d.ar : d.en; }

let state = {
  department: null,
  gender: null,
};

function renderDepartments(){
  const grid = document.getElementById('deptGrid');
  grid.innerHTML = '';
  DEPARTMENTS.forEach((d) => {
    const btn = document.createElement('button');
    btn.className = 'dept-card' + (state.department === d ? ' selected' : '');
    btn.innerHTML = `<span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[d.icon]}</svg></span>
      <span class="txt"><span class="name">${lang==='ar'?d.ar:d.en}</span><span class="namear">${lang==='ar'?d.en:d.ar}</span></span>
      <span class="chk"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>`;
    btn.onclick = () => { state.department = d; renderDepartments(); document.getElementById('deptContinue').disabled = false; };
    grid.appendChild(btn);
  });
}
renderDepartments();

function selectGender(g){
  state.gender = g;
  document.getElementById('genderMale').classList.toggle('selected', g==='Male');
  document.getElementById('genderFemale').classList.toggle('selected', g==='Female');
  document.getElementById('genderContinue').disabled = false;
}

function go(pageId){
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + pageId).classList.add('active');
  window.scrollTo({top:0, behavior:'instant'});
  if(pageId === 'gender' && state.department){
    document.getElementById('genderFacultyCrumb').textContent = ' · ' + deptLabel(state.department);
  }
  if(pageId === 'register'){
    document.getElementById('deptChip').textContent = (lang==='ar'?'الكلية: ':'Faculty: ') + (state.department ? deptLabel(state.department) : '—');
    document.getElementById('f_faculty').value = state.department ? deptLabel(state.department) : '';
    document.getElementById('registerCrumb').textContent = state.department ? (' · ' + deptLabel(state.department) + ' — ' + (state.gender||'')) : '';
    goToStep(1);
  }
}

function openDrawer(){ document.getElementById('drawer').classList.add('open'); document.getElementById('scrim').classList.add('show'); }
function closeDrawer(){ document.getElementById('drawer').classList.remove('open'); document.getElementById('scrim').classList.remove('show'); }

/* ---------- FORM STEPPER ---------- */
function goToStep(n){
  [1,2,3].forEach(i => {
    document.getElementById('formstep-'+i).style.display = (i===n) ? 'block' : 'none';
  });
  document.querySelectorAll('.stepper .st').forEach(el => {
    const s = parseInt(el.dataset.step);
    el.classList.toggle('active', s===n);
    el.classList.toggle('done', s<n);
  });
  if(n === 3){ buildReview(); }
}
function nextStep(current){
  if(current === 1){
    const name = document.getElementById('f_name').value.trim();
    const email = document.getElementById('f_email').value.trim();
    const phone = document.getElementById('f_phone').value.trim();
    const nat = document.getElementById('f_nationality').value.trim();
    const reg = document.getElementById('f_regno').value.trim();
    if(!name || !email || !phone || !nat || !reg){ alert(lang==='ar' ? 'يرجى تعبئة جميع الحقول المطلوبة.' : 'Please fill in all required fields.'); return; }
  }
  goToStep(current+1);
}
function prevStep(current){ goToStep(current-1); }

function buildReview(){
  const box = document.getElementById('reviewMini');
  const name = document.getElementById('f_name').value.trim();
  const program = document.getElementById('f_program').value.trim();
  box.innerHTML = `
    <div><span>${lang==='ar'?'الاسم':'Name'}</span><b>${name||'—'}</b></div>
    <div><span>${lang==='ar'?'المجلس':'Council'}</span><b>${state.gender||'—'}</b></div>
    <div><span>${lang==='ar'?'الكلية':'Faculty'}</span><b>${state.department?deptLabel(state.department):'—'}</b></div>
    <div><span>${lang==='ar'?'البرنامج':'Program'}</span><b>${program||'—'}</b></div>
  `;
}

async function submitForm(){
  const data = {
    name: document.getElementById('f_name').value.trim(),
    email: document.getElementById('f_email').value.trim(),
    phone: document.getElementById('f_phone').value.trim(),
    nationality: document.getElementById('f_nationality').value.trim(),
    regno: document.getElementById('f_regno').value.trim(),
    faculty: state.department ? state.department.en : null,
    gender: state.gender,
    program: document.getElementById('f_program').value.trim(),
    semester: document.getElementById('f_semester').value.trim(),
    year: document.getElementById('f_year').value.trim(),
    cgpa: document.getElementById('f_cgpa').value.trim(),
    submittedAt: new Date().toISOString()
  };
  if(!data.name || !data.email || !data.phone || !data.regno){
    alert(lang==='ar' ? 'يرجى تعبئة جميع الحقول المطلوبة.' : 'Please fill in all required fields.');
    return;
  }
  const btn = document.querySelector('#formstep-3 .btn-teal');
  if(btn){ btn.disabled = true; }
  try{
    await api('/api/register', { method:'POST', body: JSON.stringify(data) });
  }catch(e){
    if(btn){ btn.disabled = false; }
    alert((lang==='ar' ? 'تعذّر إرسال التسجيل: ' : 'Could not submit registration: ') + e.message);
    return;
  }
  if(btn){ btn.disabled = false; }

  document.getElementById('successCard').innerHTML = `
    <div class="row"><span>${lang==='ar'?'الاسم':'Name'}</span><span>${data.name}</span></div>
    <div class="row"><span>${lang==='ar'?'الكلية':'Faculty'}</span><span>${data.faculty || '—'}</span></div>
    <div class="row"><span>${lang==='ar'?'الفئة':'Category'}</span><span>${data.gender || '—'}</span></div>
    <div class="row"><span>${lang==='ar'?'الرقم الجامعي':'Registration No.'}</span><span>${data.regno}</span></div>
  `;
  go('success');
}

function resetAndGoHome(){
  state = {department:null, gender:null};
  ['f_name','f_email','f_phone','f_nationality','f_regno','f_program','f_semester','f_year','f_cgpa'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('deptContinue').disabled = true;
  document.getElementById('genderContinue').disabled = true;
  document.getElementById('genderMale').classList.remove('selected');
  document.getElementById('genderFemale').classList.remove('selected');
  renderDepartments();
  go('home');
}

/* ---------- ADMIN ---------- */
async function tryAdminLogin(){
  const pass = document.getElementById('adminPass').value;
  try{
    const r = await api('/api/admin/login', { method:'POST', body: JSON.stringify({ password: pass }) });
    adminToken = r.token;
    sessionStorage.setItem('ssac_admin_token', adminToken);
    document.getElementById('adminPass').value = '';
    document.getElementById('adminLoginBox').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    loadAdminData();
  }catch(e){
    alert(lang==='ar' ? 'كلمة مرور غير صحيحة.' : 'Incorrect password.');
  }
}

function adminLogout(){
  adminToken = null;
  sessionStorage.removeItem('ssac_admin_token');
  document.getElementById('adminPanel').style.display = 'none';
  document.getElementById('adminLoginBox').style.display = 'block';
}

async function loadAdminData(){
  const tbody = document.getElementById('adminTbody');
  tbody.innerHTML = '';
  const statsBox = document.getElementById('adminStats');

  let rows = [];
  try{
    const res = await api('/api/registrations', { headers: { Authorization: 'Bearer ' + adminToken } });
    rows = res.registrations || [];
  }catch(e){
    if(e.status === 401){ adminLogout(); alert(lang==='ar' ? 'انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى.' : 'Session expired, please log in again.'); return; }
    console.error(e);
    alert((lang==='ar' ? 'تعذّر تحميل البيانات: ' : 'Could not load data: ') + e.message);
    return;
  }

  if(rows.length === 0){
    document.getElementById('adminEmpty').style.display = 'block';
    document.getElementById('adminTable').style.display = 'none';
    statsBox.innerHTML = '';
    return;
  }
  document.getElementById('adminEmpty').style.display = 'none';
  document.getElementById('adminTable').style.display = 'table';

  rows.sort((a,b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  const total = rows.length;
  const male = rows.filter(r=>r.gender==='Male').length;
  const female = rows.filter(r=>r.gender==='Female').length;
  const faculties = new Set(rows.map(r=>r.faculty)).size;
  statsBox.innerHTML = `
    <div class="stat"><b>${total}</b><span>${lang==='ar'?'إجمالي التسجيلات':'Total registrations'}</span></div>
    <div class="stat"><b>${male}</b><span>${lang==='ar'?'مجلس الطلاب':'Male council'}</span></div>
    <div class="stat"><b>${female}</b><span>${lang==='ar'?'مجلس الطالبات':'Female council'}</span></div>
    <div class="stat"><b>${faculties}</b><span>${lang==='ar'?'كليات ممثلة':'Faculties represented'}</span></div>
  `;

  rows.forEach(d => {
    const tr = document.createElement('tr');
    const date = d.submittedAt ? new Date(d.submittedAt).toLocaleString() : '—';
    tr.innerHTML = `
      <td>${d.name||''}</td>
      <td>${d.email||''}</td>
      <td>${d.phone||''}</td>
      <td>${d.faculty||''}</td>
      <td><span class="tag ${d.gender==='Female'?'female':'male'}">${d.gender||''}</span></td>
      <td>${d.program||''}</td>
      <td>${d.semester||''}</td>
      <td>${d.regno||''}</td>
      <td>${date}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function clearAllRegistrations(){
  if(!confirm(lang==='ar' ? 'حذف جميع التسجيلات؟ لا يمكن التراجع عن هذا الإجراء.' : 'Delete all registrations? This cannot be undone.')) return;
  try{
    await api('/api/registrations', { method:'DELETE', headers: { Authorization: 'Bearer ' + adminToken } });
    loadAdminData();
  }catch(e){
    if(e.status === 401){ adminLogout(); return; }
    alert((lang==='ar' ? 'تعذّر الحذف: ' : 'Could not delete: ') + e.message);
  }
}

/* =========================================================
   EXTENDED FEATURES: news, contact messages, representatives,
   admin dashboard (analytics + approve/delete). These override
   the earlier localApi / loadAdminData / tryAdminLogin (last
   function declaration wins) and add the new pages' logic.
   In static mode everything persists in localStorage; when a
   real back-end answers /api/*, those endpoints are used instead.
   ========================================================= */

/* ---- small helpers ---- */
function val(id){ const el=document.getElementById(id); return el?el.value.trim():''; }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function fmtDate(d){ try{ return new Date(d).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}); }catch(e){ return ''; } }
function initials(n){ return String(n||'').split(/\s+/).filter(Boolean).slice(0,2).map(function(w){return w[0].toUpperCase();}).join(''); }
function authHdr(){ return { Authorization: 'Bearer ' + adminToken }; }

/* ---- localStorage-backed API (static mode) ---- */
function localApi(path, opts){
  var method = (opts.method || 'GET').toUpperCase();
  var payload = opts.body ? JSON.parse(opts.body) : {};
  function get(k){ try{ return JSON.parse(localStorage.getItem(k) || '[]'); }catch(e){ return []; } }
  function set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
  function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

  if(path === '/api/register' && method === 'POST'){ var a=get('ssac_registrations'); payload.id=uid(); payload.status='pending'; a.push(payload); set('ssac_registrations',a); return {ok:true,id:payload.id}; }
  if(path === '/api/admin/login' && method === 'POST'){ if(payload.password===STATIC_ADMIN_PASSWORD) return {ok:true,token:'local'}; var e=new Error('Incorrect password'); e.status=401; throw e; }
  if(path === '/api/registrations' && method === 'GET'){ return {registrations:get('ssac_registrations')}; }
  if(path === '/api/registrations' && method === 'DELETE'){ set('ssac_registrations',[]); return {ok:true}; }
  if(path === '/api/registrations/update' && method === 'POST'){ set('ssac_registrations', get('ssac_registrations').map(function(r){ return r.id===payload.id ? Object.assign({},r,{status:payload.status}) : r; })); return {ok:true}; }
  if(path === '/api/registrations/delete' && method === 'POST'){ set('ssac_registrations', get('ssac_registrations').filter(function(r){ return r.id!==payload.id; })); return {ok:true}; }

  if(path === '/api/announcements' && method === 'GET'){ return {items:get('ssac_news')}; }
  if(path === '/api/announcements' && method === 'POST'){ var n=get('ssac_news'); payload.id=uid(); payload.date=new Date().toISOString(); n.unshift(payload); set('ssac_news',n); return {ok:true}; }
  if(path === '/api/announcements/delete' && method === 'POST'){ set('ssac_news', get('ssac_news').filter(function(x){return x.id!==payload.id;})); return {ok:true}; }

  if(path === '/api/messages' && method === 'POST'){ var m=get('ssac_messages'); payload.id=uid(); payload.date=new Date().toISOString(); m.unshift(payload); set('ssac_messages',m); return {ok:true}; }
  if(path === '/api/messages' && method === 'GET'){ return {items:get('ssac_messages')}; }
  if(path === '/api/messages/delete' && method === 'POST'){ set('ssac_messages', get('ssac_messages').filter(function(x){return x.id!==payload.id;})); return {ok:true}; }

  if(path === '/api/reps' && method === 'GET'){ return {items:get('ssac_reps')}; }
  if(path === '/api/reps' && method === 'POST'){ var p=get('ssac_reps'); payload.id=uid(); p.push(payload); set('ssac_reps',p); return {ok:true}; }
  if(path === '/api/reps/delete' && method === 'POST'){ set('ssac_reps', get('ssac_reps').filter(function(x){return x.id!==payload.id;})); return {ok:true}; }

  var err=new Error('Not found'); err.status=404; throw err;
}

/* ---- PUBLIC: News ---- */
async function renderNews(){
  var box=document.getElementById('newsList'); if(!box) return;
  var items=[]; try{ var r=await api('/api/announcements'); items=r.items||[]; }catch(e){}
  if(!items.length){ box.innerHTML='<div class="empty-card">'+(lang==='ar'?'لا توجد إعلانات بعد. يرجى المراجعة لاحقًا.':'No announcements yet. Please check back soon, in shā’ Allah.')+'</div>'; return; }
  box.innerHTML=items.map(function(n){ return '<article class="news-card"><div class="news-date">'+fmtDate(n.date)+'</div><h3>'+esc(n.title)+'</h3><p>'+esc(n.body)+'</p></article>'; }).join('');
}

/* ---- PUBLIC: Contact ---- */
async function submitMessage(ev){
  if(ev) ev.preventDefault();
  var name=val('c_name'), email=val('c_email'), subject=val('c_subject'), message=val('c_message');
  if(!name||!email||!message){ alert(lang==='ar'?'يرجى تعبئة الحقول المطلوبة.':'Please fill in the required fields.'); return; }
  try{ await api('/api/messages',{method:'POST',body:JSON.stringify({name:name,email:email,subject:subject,message:message})}); }
  catch(e){ alert((lang==='ar'?'تعذّر الإرسال: ':'Could not send: ')+e.message); return; }
  ['c_name','c_email','c_subject','c_message'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
  var t=document.getElementById('contactThanks'); if(t){ t.hidden=false; setTimeout(function(){ t.hidden=true; },6000); }
}

/* ---- PUBLIC: Representatives ---- */
async function renderReps(){
  var box=document.getElementById('repsList'); if(!box) return;
  var items=[]; try{ var r=await api('/api/reps'); items=r.items||[]; }catch(e){}
  if(!items.length){ box.innerHTML='<div class="empty-card">'+(lang==='ar'?'سيتم الإعلان عن الممثلين قريبًا.':'Representatives will be announced soon.')+'</div>'; return; }
  var groups={}; items.forEach(function(r){ (groups[r.faculty]=groups[r.faculty]||[]).push(r); });
  box.innerHTML=Object.keys(groups).map(function(fac){
    return '<div class="rep-group"><h3>'+esc(fac)+'</h3><div class="rep-cards">'+groups[fac].map(function(r){
      return '<div class="rep-card"><div class="rep-avatar">'+initials(r.name)+'</div><div class="rep-meta"><b>'+esc(r.name)+'</b><span>'+esc(r.role||'Representative')+'</span></div></div>';
    }).join('')+'</div></div>';
  }).join('');
}

/* ---- ADMIN: tabs ---- */
function showAdminTab(name){
  document.querySelectorAll('.atab').forEach(function(b){ b.classList.toggle('active', b.dataset.tab===name); });
  ['overview','regs','reps','news','messages'].forEach(function(t){ var p=document.getElementById('apanel-'+t); if(p) p.hidden=(t!==name); });
  if(name==='overview') renderAnalytics();
  if(name==='regs') loadAdminData();
  if(name==='reps') renderAdminReps();
  if(name==='news') renderAdminNews();
  if(name==='messages') renderAdminMessages();
}
async function tryAdminLogin(){
  var pass=document.getElementById('adminPass').value;
  try{
    var r=await api('/api/admin/login',{method:'POST',body:JSON.stringify({password:pass})});
    adminToken=r.token; sessionStorage.setItem('ssac_admin_token',adminToken);
    document.getElementById('adminPass').value='';
    document.getElementById('adminLoginBox').style.display='none';
    document.getElementById('adminPanel').style.display='block';
    showAdminTab('overview');
  }catch(e){ alert(lang==='ar'?'كلمة مرور غير صحيحة.':'Incorrect password.'); }
}

async function getRegs(){ try{ var r=await api('/api/registrations',{headers:authHdr()}); return r.registrations||[]; }catch(e){ if(e.status===401){ adminLogout(); } return []; } }

/* ---- ADMIN: analytics ---- */
async function renderAnalytics(){
  var rows=await getRegs();
  var total=rows.length;
  var male=rows.filter(function(r){return r.gender==='Male';}).length;
  var female=rows.filter(function(r){return r.gender==='Female';}).length;
  var approved=rows.filter(function(r){return r.status==='approved';}).length;
  var pending=total-approved;
  document.getElementById('adminStats').innerHTML=
    '<div class="stat"><b>'+total+'</b><span>Total registrations</span></div>'+
    '<div class="stat"><b>'+approved+'</b><span>Approved</span></div>'+
    '<div class="stat"><b>'+pending+'</b><span>Pending</span></div>'+
    '<div class="stat"><b>'+(new Set(rows.map(function(r){return r.faculty;})).size)+'</b><span>Faculties</span></div>';
  var byFac={}; rows.forEach(function(r){ var f=r.faculty||'—'; byFac[f]=(byFac[f]||0)+1; });
  var keys=Object.keys(byFac).sort(function(a,b){return byFac[b]-byFac[a];});
  var maxF=Math.max.apply(null,[1].concat(keys.map(function(k){return byFac[k];})));
  document.getElementById('chartFaculty').innerHTML= keys.length ? keys.map(function(f){
    return '<div class="bar-row"><span class="bar-label">'+esc(f)+'</span><span class="bar-track"><span class="bar-fill" style="width:'+Math.round(byFac[f]/maxF*100)+'%"></span></span><span class="bar-val">'+byFac[f]+'</span></div>';
  }).join('') : '<div class="empty-card">No data yet.</div>';
  var cm=Math.max(1,male,female);
  document.getElementById('chartCouncil').innerHTML=
    '<div class="bar-row"><span class="bar-label">Male</span><span class="bar-track"><span class="bar-fill male" style="width:'+Math.round(male/cm*100)+'%"></span></span><span class="bar-val">'+male+'</span></div>'+
    '<div class="bar-row"><span class="bar-label">Female</span><span class="bar-track"><span class="bar-fill female" style="width:'+Math.round(female/cm*100)+'%"></span></span><span class="bar-val">'+female+'</span></div>';
  document.getElementById('chartFlow').innerHTML=
    '<div class="flow"><div class="flow-step"><b>'+total+'</b><span>Applied</span></div><div class="flow-arrow">→</div>'+
    '<div class="flow-step pend"><b>'+pending+'</b><span>Pending review</span></div><div class="flow-arrow">→</div>'+
    '<div class="flow-step ok"><b>'+approved+'</b><span>Approved</span></div></div>';
}

/* ---- ADMIN: registrations table (approve / delete) ---- */
async function loadAdminData(){
  var tbody=document.getElementById('adminTbody'); if(!tbody) return; tbody.innerHTML='';
  var rows=await getRegs();
  rows.sort(function(a,b){ return new Date(b.submittedAt)-new Date(a.submittedAt); });
  document.getElementById('adminEmpty').style.display=rows.length?'none':'block';
  document.getElementById('adminTable').style.display=rows.length?'table':'none';
  rows.forEach(function(d){
    var tr=document.createElement('tr');
    var st = d.status==='approved' ? '<span class="tag ok">Approved</span>' : '<span class="tag pend">Pending</span>';
    var approveBtn = d.status==='approved' ? '' : '<button class="mini ok" onclick="approveReg(\''+d.id+'\')">Approve</button>';
    tr.innerHTML='<td>'+esc(d.name)+'</td><td>'+esc(d.email)+'</td><td>'+esc(d.faculty)+'</td>'+
      '<td><span class="tag '+(d.gender==='Female'?'female':'male')+'">'+esc(d.gender)+'</span></td>'+
      '<td>'+esc(d.regno)+'</td><td>'+st+'</td>'+
      '<td class="row-actions">'+approveBtn+'<button class="mini danger" onclick="deleteReg(\''+d.id+'\')">Delete</button></td>';
    tbody.appendChild(tr);
  });
}
async function approveReg(id){ try{ await api('/api/registrations/update',{method:'POST',headers:authHdr(),body:JSON.stringify({id:id,status:'approved'})}); loadAdminData(); }catch(e){ alert(e.message); } }
async function deleteReg(id){ if(!confirm('Delete this registration?')) return; try{ await api('/api/registrations/delete',{method:'POST',headers:authHdr(),body:JSON.stringify({id:id})}); loadAdminData(); }catch(e){ alert(e.message); } }

/* ---- ADMIN: announcements ---- */
async function renderAdminNews(){
  var box=document.getElementById('adminNewsList'); if(!box) return;
  var items=[]; try{ var r=await api('/api/announcements'); items=r.items||[]; }catch(e){}
  box.innerHTML=items.length?items.map(function(n){ return '<div class="mng-row"><div class="mng-body"><b>'+esc(n.title)+'</b><span class="muted"> · '+fmtDate(n.date)+'</span><p>'+esc(n.body)+'</p></div><button class="mini danger" onclick="deleteAnnouncement(\''+n.id+'\')">Delete</button></div>'; }).join(''):'<div class="empty-card">No announcements.</div>';
}
async function addAnnouncement(ev){ if(ev) ev.preventDefault(); var title=val('an_title'), body=val('an_body'); if(!title||!body){ alert('Enter a title and details.'); return; } try{ await api('/api/announcements',{method:'POST',headers:authHdr(),body:JSON.stringify({title:title,body:body})}); document.getElementById('an_title').value=''; document.getElementById('an_body').value=''; renderAdminNews(); }catch(e){ alert(e.message); } }
async function deleteAnnouncement(id){ if(!confirm('Delete this announcement?')) return; try{ await api('/api/announcements/delete',{method:'POST',headers:authHdr(),body:JSON.stringify({id:id})}); renderAdminNews(); }catch(e){ alert(e.message); } }

/* ---- ADMIN: messages ---- */
async function renderAdminMessages(){
  var box=document.getElementById('adminMsgList'); if(!box) return;
  var items=[]; try{ var r=await api('/api/messages',{headers:authHdr()}); items=r.items||[]; }catch(e){ if(e.status===401){ adminLogout(); return; } }
  box.innerHTML=items.length?items.map(function(m){ return '<div class="mng-row"><div class="mng-body"><b>'+esc(m.name)+'</b> <span class="muted">&lt;'+esc(m.email)+'&gt; · '+fmtDate(m.date)+'</span>'+(m.subject?'<div class="msg-subj">'+esc(m.subject)+'</div>':'')+'<p>'+esc(m.message)+'</p></div><button class="mini danger" onclick="deleteMessage(\''+m.id+'\')">Delete</button></div>'; }).join(''):'<div class="empty-card">No messages yet.</div>';
}
async function deleteMessage(id){ if(!confirm('Delete this message?')) return; try{ await api('/api/messages/delete',{method:'POST',headers:authHdr(),body:JSON.stringify({id:id})}); renderAdminMessages(); }catch(e){ alert(e.message); } }

/* ---- ADMIN: representatives ---- */
async function renderAdminReps(){
  var box=document.getElementById('adminRepsList'); if(!box) return;
  var sel=document.getElementById('rep_faculty');
  if(sel && !sel.dataset.filled){ sel.innerHTML=DEPARTMENTS.map(function(d){ return '<option value="'+esc(d.en)+'">'+esc(d.en)+'</option>'; }).join(''); sel.dataset.filled='1'; }
  var items=[]; try{ var r=await api('/api/reps'); items=r.items||[]; }catch(e){}
  box.innerHTML=items.length?items.map(function(r){ return '<div class="mng-row"><div class="mng-body"><b>'+esc(r.name)+'</b><span class="muted"> · '+esc(r.role||'Representative')+'</span><div class="muted">'+esc(r.faculty)+'</div></div><button class="mini danger" onclick="deleteRep(\''+r.id+'\')">Delete</button></div>'; }).join(''):'<div class="empty-card">No representatives added.</div>';
}
async function addRep(ev){ if(ev) ev.preventDefault(); var name=val('rep_name'), role=val('rep_role'), faculty=val('rep_faculty'); if(!name||!faculty){ alert('Enter a name and choose a faculty.'); return; } try{ await api('/api/reps',{method:'POST',headers:authHdr(),body:JSON.stringify({name:name,role:role,faculty:faculty})}); document.getElementById('rep_name').value=''; document.getElementById('rep_role').value=''; renderAdminReps(); }catch(e){ alert(e.message); } }
async function deleteRep(id){ if(!confirm('Delete this representative?')) return; try{ await api('/api/reps/delete',{method:'POST',headers:authHdr(),body:JSON.stringify({id:id})}); renderAdminReps(); }catch(e){ alert(e.message); } }

/* ---- hook new pages into navigation ---- */
(function(){
  var _go = window.go;
  window.go = function(pageId){
    _go(pageId);
    if(pageId==='news') renderNews();
    if(pageId==='reps') renderReps();
  };
})();
