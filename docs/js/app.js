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
  {en:"Faculty of Basic and Applied Sciences", ar:"كلية العلوم الأساسية والتطبيقية", icon:"flask"},
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
    "gender.male":"Male Student","gender.malep":"Register under the Male Student Advisory Council",
    "gender.female":"Female Student","gender.femalep":"Register under the Female Student Advisory Council",
    "reg.kicker":"STEP 3 OF 3","reg.title":"Student Registration","reg.sub":"Complete the form below to join the Supreme Student Advisory Council",
    "step.personal":"Personal","step.academic":"Academic","step.skills":"Skills","step.submit":"Submit",
    "p1.head":"Personal Information","p1.sub":"Tell us a little about yourself.",
    "p2.head":"Academic Information","p2.sub":"Which faculty and program are you enrolled in?","p3s.head":"Skills & Hobbies","p3s.sub":"Select all that apply — you can choose more than one.",
    "p3.head":"Review & submit","p3.sub":"Please review your details below, then send your application to the Council.",
    "p3.note":"Note: Registration is open only to students currently enrolled at the University.",
    "f.name":"Full Name","f.email":"Email Address","f.phone":"Phone Number","f.nat":"Nationality","f.reg":"Registration Number",
    "f.faculty":"Faculty","f.autofill":"(auto-filled)","f.program":"Degree Program","f.semester":"Current Semester","f.year":"Year of Study","f.cgpa":"CGPA","f.optional":"(optional)","f.level":"Degree Level","f.levelph":"Select your degree level","f.skills":"Skills","f.hobbies":"Hobbies & Interests",
    "btn.continue":"Next →","btn.next":"Next →","btn.back":"← Back","btn.submit":"Submit Registration",
    "success.title":"Registration Submitted","success.sub":"Thank you for joining the Supreme Student Advisory Council. Your application has been recorded and will be reviewed by the Council team.",
    "success.home":"Back to Home","success.admin":"Go to Admin",
    "admin.back":"← Back to Home","admin.title":"Admin Control","admin.sub":"Enter the admin password to view submitted registrations.","admin.hint":"Authorized council staff only.","admin.login":"Log In",
    "admin.regs":"Council Registrations","admin.refresh":"Refresh","admin.clear":"Clear All","admin.logout":"Log Out","admin.empty":"No registrations yet.",
    "reps.kicker":"FACULTY REPRESENTATIVES","reps.title":"Council Representatives","reps.sub":"Selected student representatives serving on the Supreme Student Advisory Council, listed by faculty.", "news.kicker":"UPDATES","news.title":"News & Announcements","news.sub":"Upcoming events, deadlines, and important notices from the Council.", "contact.kicker":"GET IN TOUCH","contact.title":"Contact Us","contact.sub":"We would be honored to answer your questions.", "c.phone":"PHONE","c.email":"EMAIL","c.address":"ADDRESS","c.addressv":"International Islamic University, Islamabad, Pakistan","c.map":"Open location in Google Maps →","c.name":"Your Name *","c.emaill":"Email *","c.subject":"Subject","c.message":"Message *","c.thanks":"✓ Thank you — your message has been sent to the Council.","c.send":"Send Message", "footer.about":"The Supreme Student Advisory Council — a platform for students across every faculty of the International Islamic University, Islamabad to represent, advise and shape campus life.","footer.quick":"Quick Links","footer.council":"The Council","footer.connect":"Connect","footer.news":"News & Announcements","footer.reg":"Student Registration","footer.faculties":"Eleven Faculties","footer.wings":"Male & Female Councils","footer.reps":"Faculty Representatives","footer.addr":"International Islamic University, Islamabad, Pakistan","footer.bottom":"© 2026 Supreme Student Advisory Council · International Islamic University, Islamabad", "atab.overview":"Overview","atab.regs":"Registrations","atab.reps":"Representatives","atab.news":"Announcements","atab.messages":"Messages", "chart.trend":"Registrations over time","chart.trendsub":"last 7 days","chart.council":"Council split","chart.status":"Approval status","chart.rate":"Approval rate","chart.faculty":"Registrations by faculty","chart.flow":"Approval flow", "th.name":"Name","th.email":"Email","th.faculty":"Faculty","th.council":"Council","th.reg":"Reg #","th.status":"Status","th.actions":"Actions",
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
    "gender.male":"طالب","gender.malep":"سجل ضمن المجلس الاستشاري لقسم الطلاب",
    "gender.female":"طالبة","gender.femalep":"سجلي ضمن المجلس الاستشاري لقسم الطالبات",
    "reg.kicker":"الخطوة ٣ من ٣","reg.title":"تسجيل الطالب","reg.sub":"أكمل النموذج أدناه للانضمام إلى المجلس الاستشاري الطلابي الأعلى",
    "step.personal":"شخصي","step.academic":"أكاديمي","step.skills":"المهارات","step.submit":"إرسال",
    "p1.head":"المعلومات الشخصية","p1.sub":"أخبرنا القليل عن نفسك.",
    "p2.head":"المعلومات الأكاديمية","p2.sub":"في أي كلية وبرنامج أنت مسجل؟","p3s.head":"المهارات والهوايات","p3s.sub":"اختر كل ما ينطبق — يمكنك اختيار أكثر من واحد.",
    "p3.head":"مراجعة وإرسال","p3.sub":"يرجى مراجعة بياناتك أدناه ثم إرسال طلبك إلى المجلس.",
    "p3.note":"ملاحظة: التسجيل متاح فقط للطلاب المسجلين حاليًا في الجامعة.",
    "f.name":"الاسم الكامل","f.email":"البريد الإلكتروني","f.phone":"رقم الهاتف","f.nat":"الجنسية","f.reg":"الرقم الجامعي",
    "f.faculty":"الكلية","f.autofill":"(معبأ تلقائيًا)","f.program":"البرنامج الدراسي","f.semester":"الفصل الدراسي الحالي","f.year":"سنة الدراسة","f.cgpa":"المعدل التراكمي","f.optional":"(اختياري)","f.level":"مستوى الدرجة","f.levelph":"اختر مستوى الدرجة","f.skills":"المهارات","f.hobbies":"الهوايات والاهتمامات",
    "btn.continue":"التالي ←","btn.next":"التالي ←","btn.back":"→ رجوع","btn.submit":"إرسال التسجيل",
    "success.title":"تم إرسال التسجيل","success.sub":"شكرًا لانضمامك إلى المجلس الاستشاري الطلابي الأعلى. تم تسجيل طلبك وسيتم مراجعته من قبل فريق المجلس.",
    "success.home":"العودة للرئيسية","success.admin":"الذهاب إلى الإدارة",
    "admin.back":"← العودة للرئيسية","admin.title":"لوحة تحكم الإدارة","admin.sub":"أدخل كلمة مرور الإدارة لعرض التسجيلات المقدمة.","admin.hint":"للموظفين المصرح لهم فقط.","admin.login":"تسجيل الدخول",
    "admin.regs":"تسجيلات المجلس","admin.refresh":"تحديث","admin.clear":"مسح الكل","admin.logout":"تسجيل الخروج","admin.empty":"لا توجد تسجيلات بعد.",
    "reps.kicker":"ممثلو الكليات","reps.title":"ممثلو المجلس","reps.sub":"ممثلو الطلاب المختارون في المجلس الاستشاري الطلابي الأعلى، مرتبون حسب الكلية.", "news.kicker":"تحديثات","news.title":"الأخبار والإعلانات","news.sub":"الفعاليات القادمة والمواعيد النهائية والإشعارات المهمة من المجلس.", "contact.kicker":"تواصل معنا","contact.title":"اتصل بنا","contact.sub":"يشرفنا الإجابة عن أسئلتكم.", "c.phone":"الهاتف","c.email":"البريد الإلكتروني","c.address":"العنوان","c.addressv":"الجامعة الإسلامية العالمية، إسلام آباد، باكستان","c.map":"افتح الموقع في خرائط جوجل ←","c.name":"الاسم *","c.emaill":"البريد الإلكتروني *","c.subject":"الموضوع","c.message":"الرسالة *","c.thanks":"✓ شكرًا — تم إرسال رسالتك إلى المجلس.","c.send":"إرسال الرسالة", "footer.about":"المجلس الاستشاري الطلابي الأعلى — منصة لطلاب جميع كليات الجامعة الإسلامية العالمية بإسلام آباد لتمثيل الطلاب وتقديم المشورة وتطوير الحياة الجامعية.","footer.quick":"روابط سريعة","footer.council":"المجلس","footer.connect":"تواصل","footer.news":"الأخبار والإعلانات","footer.reg":"تسجيل الطالب","footer.faculties":"إحدى عشرة كلية","footer.wings":"مجلسا الطلاب والطالبات","footer.reps":"ممثلو الكليات","footer.addr":"الجامعة الإسلامية العالمية، إسلام آباد، باكستان","footer.bottom":"© 2026 المجلس الاستشاري الطلابي الأعلى · الجامعة الإسلامية العالمية بإسلام آباد", "atab.overview":"نظرة عامة","atab.regs":"التسجيلات","atab.reps":"الممثلون","atab.news":"الإعلانات","atab.messages":"الرسائل", "chart.trend":"التسجيلات عبر الوقت","chart.trendsub":"آخر ٧ أيام","chart.council":"توزيع المجلس","chart.status":"حالة الموافقة","chart.rate":"معدل الموافقة","chart.faculty":"التسجيلات حسب الكلية","chart.flow":"مسار الموافقة", "th.name":"الاسم","th.email":"البريد","th.faculty":"الكلية","th.council":"المجلس","th.reg":"الرقم الجامعي","th.status":"الحالة","th.actions":"إجراءات",
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
  try{
    var ap=document.getElementById('adminPanel');
    if(ap && ap.style.display==='block'){ var at=document.querySelector('.atab.active'); if(at) showAdminTab(at.dataset.tab); }
    if(document.getElementById('page-news') && document.getElementById('page-news').classList.contains('active')) renderNews();
    if(document.getElementById('page-reps') && document.getElementById('page-reps').classList.contains('active')) renderReps();
  }catch(e){}
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
      <span class="txt"><span class="name">${lang==='ar'?d.ar:d.en}</span></span>
      <span class="chk"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>`;
    btn.onclick = () => { state.department = d; renderDepartments(); document.getElementById('deptContinue').disabled = false; setTimeout(function(){ go('gender'); }, 280); };
    grid.appendChild(btn);
  });
}
renderDepartments();

function selectGender(g){
  state.gender = g;
  document.getElementById('genderMale').classList.toggle('selected', g==='Male');
  document.getElementById('genderFemale').classList.toggle('selected', g==='Female');
  document.getElementById('genderContinue').disabled = false;
  setTimeout(function(){ go('register'); }, 300);
}

function go(pageId){
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + pageId).classList.add('active');
  document.getElementById('htmlRoot').classList.toggle('on-admin', pageId==='admin');
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
  [1,2,3,4].forEach(i => {
    const _el=document.getElementById('formstep-'+i); if(_el) _el.style.display = (i===n) ? 'block' : 'none';
  });
  document.querySelectorAll('.stepper .st').forEach(el => {
    const s = parseInt(el.dataset.step);
    el.classList.toggle('active', s===n);
    el.classList.toggle('done', s<n);
  });
  if(n === 4){ buildReview(); }
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
  if(current === 2){
    const level = document.getElementById('f_level').value;
    const program = document.getElementById('f_program').value.trim();
    const semester = document.getElementById('f_semester').value.trim();
    if(!level || !program || !semester){ alert(lang==='ar' ? 'يرجى تعبئة المعلومات الأكاديمية.' : 'Please complete your academic information.'); return; }
  }
  goToStep(current+1);
}
function prevStep(current){ goToStep(current-1); }

function _fv(id){ const el=document.getElementById(id); return el?el.value.trim():''; }
function collectChecked(sel){ return Array.prototype.slice.call(document.querySelectorAll(sel)).map(function(i){return i.value;}); }
function gatherSkills(){ var a=collectChecked('#skillsChips input:checked'); var o=_fv('f_skills_other'); if(o) a.push(o); return a; }
function gatherHobbies(){ var a=collectChecked('#hobbiesChips input:checked'); var o=_fv('f_hobbies_other'); if(o) a.push(o); return a; }
function buildReview(){
  const box = document.getElementById('reviewMini');
  const L=(en,ar)=>lang==='ar'?ar:en;
  function rf(label,val,full){ return '<div class="rf'+(full?' full':'')+'"><span>'+label+'</span><b>'+(esc(val)||'—')+'</b></div>'; }
  box.innerHTML =
    rf(L('Full Name','الاسم'), _fv('f_name')) +
    rf(L('Email','البريد الإلكتروني'), _fv('f_email')) +
    rf(L('Phone','الهاتف'), _fv('f_phone')) +
    rf(L('Nationality','الجنسية'), _fv('f_nationality')) +
    rf(L('Registration No.','الرقم الجامعي'), _fv('f_regno')) +
    rf(L('Council','المجلس'), state.gender) +
    rf(L('Faculty','الكلية'), state.department?deptLabel(state.department):'', true) +
    rf(L('Degree Level','مستوى الدرجة'), _fv('f_level')) +
    rf(L('Degree Program','البرنامج'), _fv('f_program')) +
    rf(L('Current Semester','الفصل الدراسي'), _fv('f_semester')) +
    rf(L('CGPA','المعدل التراكمي'), _fv('f_cgpa')) +
    rf(L('Skills','المهارات'), gatherSkills().join(', '), true) +
    rf(L('Hobbies & Interests','الهوايات والاهتمامات'), gatherHobbies().join(', '), true);
}

async function submitForm(){
  const data = {
    name: _fv('f_name'), email: _fv('f_email'), phone: _fv('f_phone'),
    nationality: _fv('f_nationality'), regno: _fv('f_regno'),
    faculty: state.department ? state.department.en : null, gender: state.gender,
    level: _fv('f_level'), program: _fv('f_program'), semester: _fv('f_semester'),
    cgpa: _fv('f_cgpa'), skills: gatherSkills(), hobbies: gatherHobbies(),
    submittedAt: new Date().toISOString()
  };
  if(!data.name || !data.email || !data.phone || !data.regno){
    alert(lang==='ar' ? 'يرجى تعبئة جميع الحقول المطلوبة.' : 'Please fill in all required fields.');
    return;
  }
  const btn = document.querySelector('#formstep-4 .btn-teal');
  if(btn){ btn.disabled = true; }
  try{
    await api('/api/register', { method:'POST', body: JSON.stringify(data) });
  }catch(e){
    if(btn){ btn.disabled = false; }
    alert((lang==='ar' ? 'تعذّر إرسال التسجيل: ' : 'Could not submit registration: ') + e.message);
    return;
  }
  if(btn){ btn.disabled = false; }

  document.getElementById('successCard').innerHTML = successRows(data);
  go('success');
}
function successRows(d){
  const L=(en,ar)=>lang==='ar'?ar:en;
  function r(label,val){ return '<div class="row"><span>'+label+'</span><span>'+(esc(val)||'—')+'</span></div>'; }
  return r(L('Full Name','الاسم'),d.name)+r(L('Email','البريد الإلكتروني'),d.email)+r(L('Phone','الهاتف'),d.phone)+
    r(L('Nationality','الجنسية'),d.nationality)+r(L('Registration No.','الرقم الجامعي'),d.regno)+
    r(L('Council','المجلس'),d.gender)+r(L('Faculty','الكلية'),d.faculty)+
    r(L('Degree Level','مستوى الدرجة'),d.level)+r(L('Degree Program','البرنامج'),d.program)+
    r(L('Current Semester','الفصل الدراسي'),d.semester)+r(L('CGPA','المعدل التراكمي'),d.cgpa)+
    r(L('Skills','المهارات'),(d.skills||[]).join(', '))+r(L('Hobbies & Interests','الهوايات والاهتمامات'),(d.hobbies||[]).join(', '));
}

function resetAndGoHome(){
  state = {department:null, gender:null};
  ['f_name','f_email','f_phone','f_nationality','f_regno','f_program','f_semester','f_cgpa','f_skills_other','f_hobbies_other','f_level'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
  document.querySelectorAll('#skillsChips input:checked, #hobbiesChips input:checked').forEach(function(i){ i.checked=false; var c=i.closest('.chip'); if(c) c.classList.remove('checked'); });
  goToStep(1);
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
function tr(en,ar){ return lang==='ar'?ar:en; }
function facLabel(en){ if(lang!=='ar') return en; var d=DEPARTMENTS.filter(function(x){return x.en===en;})[0]; return d?d.ar:en; }

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

/* ---- chart helpers (inline SVG, no libraries) ---- */
function svgArea(points){
  var W=560,H=180,pad=30,n=points.length;
  var max=Math.max.apply(null,[1].concat(points.map(function(p){return p.value;})));
  function x(i){ return pad + (n<=1?(W-2*pad)/2:i*(W-2*pad)/(n-1)); }
  function y(v){ return H-pad-(v/max)*(H-2*pad-8); }
  var line=points.map(function(p,i){return (i?'L':'M')+x(i).toFixed(1)+' '+y(p.value).toFixed(1);}).join(' ');
  var area=line+' L'+x(n-1).toFixed(1)+' '+(H-pad)+' L'+x(0).toFixed(1)+' '+(H-pad)+' Z';
  var dots=points.map(function(p,i){return '<circle cx="'+x(i).toFixed(1)+'" cy="'+y(p.value).toFixed(1)+'" r="3.5" fill="#219EBC"/>';}).join('');
  var labels=points.map(function(p,i){return '<text x="'+x(i).toFixed(1)+'" y="'+(H-9)+'" text-anchor="middle" class="ax">'+esc(p.label)+'</text>';}).join('');
  var grid=[0,0.5,1].map(function(t){var yy=(H-pad)-t*(H-2*pad-8);return '<line x1="'+pad+'" y1="'+yy.toFixed(1)+'" x2="'+(W-pad)+'" y2="'+yy.toFixed(1)+'" class="grid"/>';}).join('');
  return '<svg viewBox="0 0 '+W+' '+H+'" class="svg-chart" preserveAspectRatio="xMidYMid meet"><defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#219EBC" stop-opacity=".28"/><stop offset="1" stop-color="#219EBC" stop-opacity="0"/></linearGradient></defs>'+grid+'<path d="'+area+'" fill="url(#ag)"/><path d="'+line+'" fill="none" stroke="#219EBC" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>'+dots+labels+'</svg>';
}
function svgDonut(segs,centerNum,centerSub){
  var total=segs.reduce(function(s,x){return s+x.value;},0)||1;
  var r=54,cx=70,cy=70,c=2*Math.PI*r,off=0;
  var arcs=segs.map(function(s){var len=s.value/total*c;var el='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="'+s.color+'" stroke-width="18" stroke-dasharray="'+len.toFixed(2)+' '+(c-len).toFixed(2)+'" stroke-dashoffset="'+(-off).toFixed(2)+'" transform="rotate(-90 '+cx+' '+cy+')"/>';off+=len;return el;}).join('');
  var legend=segs.map(function(s){return '<div class="lg"><span class="dot" style="background:'+s.color+'"></span>'+esc(s.label)+' <b>'+s.value+'</b></div>';}).join('');
  return '<div class="donut"><svg viewBox="0 0 140 140">'+arcs+'<text x="70" y="66" text-anchor="middle" class="dc-num">'+esc(String(centerNum))+'</text><text x="70" y="86" text-anchor="middle" class="dc-sub">'+esc(centerSub||'')+'</text></svg><div class="donut-legend">'+legend+'</div></div>';
}
function svgGauge(pct){
  pct=Math.max(0,Math.min(100,pct));
  var circ=Math.PI*60, fill=pct/100*circ;
  return '<div class="gauge"><svg viewBox="0 0 160 100"><path d="M20 82 A60 60 0 0 1 140 82" fill="none" stroke="#e6eef2" stroke-width="16" stroke-linecap="round"/><path d="M20 82 A60 60 0 0 1 140 82" fill="none" stroke="#219EBC" stroke-width="16" stroke-linecap="round" stroke-dasharray="'+fill.toFixed(2)+' '+circ.toFixed(2)+'"/><text x="80" y="76" text-anchor="middle" class="g-num">'+Math.round(pct)+'%</text></svg><div class="g-cap">'+tr('of applications approved','من الطلبات تمت الموافقة عليها')+'</div></div>';
}

/* ---- ADMIN: analytics (Supreme Student Advisory Council data) ---- */
async function renderAnalytics(){
  var rows=await getRegs();
  var total=rows.length;
  var male=rows.filter(function(r){return r.gender==='Male';}).length;
  var female=rows.filter(function(r){return r.gender==='Female';}).length;
  var approved=rows.filter(function(r){return r.status==='approved';}).length;
  var pending=total-approved;
  document.getElementById('adminStats').innerHTML=
    '<div class="stat"><b>'+total+'</b><span>'+tr('Total registrations','إجمالي التسجيلات')+'</span></div>'+
    '<div class="stat"><b>'+approved+'</b><span>'+tr('Approved','موافق عليها')+'</span></div>'+
    '<div class="stat"><b>'+pending+'</b><span>'+tr('Pending review','قيد المراجعة')+'</span></div>'+
    '<div class="stat"><b>'+(new Set(rows.map(function(r){return r.faculty;})).size)+'</b><span>'+tr('Faculties represented','الكليات الممثلة')+'</span></div>';

  var now=new Date(), pts=[];
  for(var i=6;i>=0;i--){ var d=new Date(now); d.setDate(now.getDate()-i); var key=d.toDateString();
    var cnt=rows.filter(function(r){ try{return new Date(r.submittedAt).toDateString()===key;}catch(e){return false;} }).length;
    pts.push({label:d.toLocaleDateString(undefined,{month:'short',day:'numeric'}), value:cnt}); }
  document.getElementById('chartTrend').innerHTML=svgArea(pts);

  document.getElementById('chartCouncilDonut').innerHTML=svgDonut([{label:tr('Male council','مجلس الطلاب'),value:male,color:'#219EBC'},{label:tr('Female council','مجلس الطالبات'),value:female,color:'#FB8500'}], total, tr('members','عضو'));
  document.getElementById('chartStatusDonut').innerHTML=svgDonut([{label:tr('Approved','موافق عليها'),value:approved,color:'#2a9d63'},{label:tr('Pending','قيد الانتظار'),value:pending,color:'#FFB703'}], total, tr('total','الإجمالي'));
  document.getElementById('chartGauge').innerHTML=svgGauge(total?approved/total*100:0);

  var byFac={}; rows.forEach(function(r){ var f=r.faculty||'—'; byFac[f]=(byFac[f]||0)+1; });
  var keys=Object.keys(byFac).sort(function(a,b){return byFac[b]-byFac[a];});
  var maxF=Math.max.apply(null,[1].concat(keys.map(function(k){return byFac[k];})));
  document.getElementById('chartFaculty').innerHTML= keys.length ? keys.map(function(f){
    return '<div class="bar-row"><span class="bar-label">'+esc(facLabel(f))+'</span><span class="bar-track"><span class="bar-fill" style="width:'+Math.round(byFac[f]/maxF*100)+'%"></span></span><span class="bar-val">'+byFac[f]+'</span></div>';
  }).join('') : '<div class="empty-card">No data yet.</div>';

  document.getElementById('chartFlow').innerHTML=
    '<div class="flow"><div class="flow-step"><b>'+total+'</b><span>'+tr('Applied','تقدّموا')+'</span></div><div class="flow-arrow">&#8594;</div>'+
    '<div class="flow-step pend"><b>'+pending+'</b><span>'+tr('Pending review','قيد المراجعة')+'</span></div><div class="flow-arrow">&#8594;</div>'+
    '<div class="flow-step ok"><b>'+approved+'</b><span>'+tr('Approved','موافق عليها')+'</span></div></div>';
}

/* ---- ADMIN: registrations table (approve / delete) ---- */
var _adminRows=[];
async function loadAdminData(){
  var tbody=document.getElementById('adminTbody'); if(!tbody) return; tbody.innerHTML='';
  var rows=await getRegs();
  rows.sort(function(a,b){ return new Date(b.submittedAt)-new Date(a.submittedAt); });
  _adminRows=rows;
  document.getElementById('adminEmpty').style.display=rows.length?'none':'block';
  document.getElementById('adminTable').style.display=rows.length?'table':'none';
  rows.forEach(function(d){
    var trEl=document.createElement('tr');
    var st = d.status==='approved' ? '<span class="tag ok">'+tr('Approved','موافق')+'</span>' : '<span class="tag pend">'+tr('Pending','قيد الانتظار')+'</span>';
    var approveBtn = d.status==='approved' ? '' : '<button class="mini ok" onclick="approveReg(\''+d.id+'\')">'+tr('Approve','موافقة')+'</button>';
    trEl.innerHTML='<td>'+esc(d.name)+'</td><td>'+esc(d.email)+'</td><td>'+esc(d.faculty)+'</td>'+
      '<td><span class="tag '+(d.gender==='Female'?'female':'male')+'">'+esc(d.gender)+'</span></td>'+
      '<td>'+esc(d.regno)+'</td><td>'+st+'</td>'+
      '<td class="row-actions"><button class="mini" onclick="viewReg(\''+d.id+'\')">'+tr('View','عرض')+'</button>'+approveBtn+'<button class="mini danger" onclick="deleteReg(\''+d.id+'\')">'+tr('Delete','حذف')+'</button></td>';
    tbody.appendChild(trEl);
  });
}
function viewReg(id){
  var d=_adminRows.filter(function(r){return String(r.id)===String(id);})[0]; if(!d) return;
  document.getElementById('regModalName').textContent=d.name||'—';
  var st=d.status==='approved'?'<span class="tag ok">'+tr('Approved','موافق')+'</span>':'<span class="tag pend">'+tr('Pending','قيد الانتظار')+'</span>';
  document.getElementById('regModalStatus').innerHTML=st;
  var ab=d.status==='approved'?'':'<button class="btn-teal" onclick="approveReg(\''+d.id+'\');closeRegModal()">'+tr('Approve','موافقة')+'</button>';
  document.getElementById('regModalActions').innerHTML=ab+'<button class="btn-outline" style="color:#b13a63;border-color:#f3c6d3" onclick="deleteReg(\''+d.id+'\');closeRegModal()">'+tr('Delete','حذف')+'</button>';
  function rf(label,val,full){ return '<div class="rf'+(full?' full':'')+'"><span>'+label+'</span><b>'+(esc(val)||'—')+'</b></div>'; }
  var date=d.submittedAt?new Date(d.submittedAt).toLocaleString():'';
  document.getElementById('regModalBody').innerHTML=
    rf(tr('Full Name','الاسم'),d.name)+rf(tr('Email','البريد الإلكتروني'),d.email)+rf(tr('Phone','الهاتف'),d.phone)+
    rf(tr('Nationality','الجنسية'),d.nationality)+rf(tr('Registration No.','الرقم الجامعي'),d.regno)+
    rf(tr('Council','المجلس'),d.gender)+rf(tr('Faculty','الكلية'),d.faculty,true)+
    rf(tr('Degree Level','مستوى الدرجة'),d.level)+rf(tr('Degree Program','البرنامج'),d.program)+
    rf(tr('Current Semester','الفصل الدراسي'),d.semester)+rf(tr('CGPA','المعدل التراكمي'),d.cgpa)+
    rf(tr('Skills','المهارات'),(d.skills||[]).join(', '),true)+rf(tr('Hobbies & Interests','الهوايات والاهتمامات'),(d.hobbies||[]).join(', '),true)+
    rf(tr('Submitted','تاريخ الإرسال'),date,true);
  document.getElementById('regModal').hidden=false;
}
function closeRegModal(){ var m=document.getElementById('regModal'); if(m) m.hidden=true; }
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


/* ---- skills & hobbies chips ---- */
var SKILLS=[
 'Communication skills (Arabic & English, spoken & written)',
 'Leadership and team management',
 'Public speaking and presentation',
 'Event planning and coordination',
 'Basic report writing and documentation',
 'Programming',
 'Web development',
 'Graphic designing',
 'Social media management',
 'Content creation',
 'Video editing',
 'Photography',
 'Event Management (Protocol, Refreshment)',
 'Logistics (Decoration)',
 'Graphics',
 'Social media / Photography',
 'Stage Performer (Tilawat, Naat, Comparing, Speech, etc.)'
];
var HOBBIES=['Driving','Drawing','Book reading','Arts & crafts','Calligraphy','Sports','Writing / Poetry','Travelling','Cooking','Volunteering','Gardening'];
function _chip(name,label){ return '<label class="chip"><input type="checkbox" name="'+name+'" value="'+esc(label)+'"><span>'+esc(label)+'</span></label>'; }
function _bindChips(box){ box.querySelectorAll('input').forEach(function(inp){ inp.addEventListener('change',function(){ var c=inp.closest('.chip'); if(c) c.classList.toggle('checked', inp.checked); }); }); }
function renderChips(){
  var sc=document.getElementById('skillsChips'), hc=document.getElementById('hobbiesChips');
  if(sc && !sc.dataset.filled){ sc.innerHTML=SKILLS.map(function(x){return _chip('skill',x);}).join(''); sc.dataset.filled='1'; _bindChips(sc); }
  if(hc && !hc.dataset.filled){ hc.innerHTML=HOBBIES.map(function(x){return _chip('hobby',x);}).join(''); hc.dataset.filled='1'; _bindChips(hc); }
}
renderChips();
