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
    "nav.home":"Home","nav.departments":"Departments","nav.reps":"Members","nav.news":"News","nav.contact":"Contact","nav.admin":"Admin","nav.getstarted":"Get Started",
    "brand.title":"Supreme Student Advisory Council","brand.sub":"INTERNATIONAL ISLAMIC UNIVERSITY, ISLAMABAD",
    "hero.tag":"ISLAMIC · INTERNATIONAL ISLAMIC UNIVERSITY, ISLAMABAD",
    "hero.title":"Supreme Student Advisory Council",
    "hero.lead":"Under the direction of the Worthy President of the International Islamic University Islamabad, the University is pleased to announce the establishment of the Supreme Student Advisory Council — a platform for students across every faculty to represent, advise and shape campus life.",
    "hero.cta":"Get Started",
    "how.title":"How registration works","how.sub":"Three quick steps to join your faculty's advisory representation",
    "how.c1t":"Choose your faculty","how.c1p":"Select the department you're currently enrolled in from the twelve faculties of IIUI.",
    "how.c2t":"Tell us about you","how.c2p":"Share a few personal and academic details so we can place you correctly.",
    "how.c3t":"Submit and you're in","how.c3p":"One click submits your application to the Council for review.",
    "footer":"© 2026 Supreme Student Advisory Council · International Islamic University, Islamabad",
    "crumb.home":"← Home","crumb.dept":"← Change faculty","crumb.gender":"← Change council",
    "dept.kicker":"STEP 1 OF 3","dept.title":"Overview of Faculties","dept.sub":"Select the faculty you are currently enrolled in to continue your registration",
    "gender.kicker":"STEP 2 OF 3","gender.title":"Select Your Council","gender.sub":"The Supreme Student Advisory Council operates as two parallel wings",
    "gender.male":"Male Student","gender.malep":"Register under the Male Student Advisory Council",
    "gender.female":"Female Student","gender.femalep":"Register under the Female Student Advisory Council",
    "reg.kicker":"STEP 3 OF 3","reg.title":"Student Registration","reg.sub":"Complete the form below to join the Supreme Student Advisory Council",
    "step.personal":"Personal","step.academic":"Academic","step.skills":"Skills","step.submit":"Submit",
    "p1.head":"Personal Information","p1.sub":"Tell us a little about yourself",
    "p2.head":"Academic Information","p2.sub":"Which faculty and program are you enrolled in?","p3s.head":"Skills & Hobbies","p3s.sub":"Select all that apply — you can choose more than one",
    "p3.head":"Review & submit","p3.sub":"Please review your details below, then send your application to the Council.",
    "p3.note":"Note: Registration is open only to students currently enrolled at the University.",
    "f.name":"Full Name","f.email":"Email Address","f.phone":"Phone Number","f.nat":"Nationality","f.reg":"Registration Number",
    "f.faculty":"Faculty","f.autofill":"(auto-filled)","f.program":"Degree Program","f.semester":"Current Semester","f.year":"Year of Study","f.cgpa":"CGPA","f.optional":"(optional)","f.level":"Academic Level","f.levelph":"Select your academic level","f.skills":"Skills","f.hobbies":"Hobbies & Interests",
    "lvl.bs":"BS (Bachelor's)","lvl.ms":"MS / MPhil (Master's)","lvl.phd":"PhD (Doctorate)","lvl.diploma":"Diploma",
    "val.male":"Male Student","val.female":"Female Student",
    "ph.other":"Other (optional)","ph.cname":"Your name","ph.cemail":"you@example.com","ph.csubject":"Subject","ph.cmessage":"Your message","ph.pass":"Password","ph.repname":"Student name","ph.reprole":"Role (e.g. President)","ph.antitle":"Announcement title","ph.anbody":"Details",
    "btn.continue":"Next →","btn.next":"Next →","btn.back":"← Back","btn.submit":"Submit Registration",
    "success.title":"Registration Submitted","success.sub":"Thank you for joining the Supreme Student Advisory Council. Your application has been recorded and will be reviewed by the Council team.",
    "success.home":"Back to Home","success.admin":"Go to Admin",
    "admin.back":"← Back to Home","admin.title":"Admin Control","admin.sub":"Enter the admin password to view submitted registrations.","admin.hint":"Authorized council staff only.","admin.login":"Log In",
    "admin.regs":"Council Registrations","admin.refresh":"Refresh","admin.clear":"Clear All","admin.logout":"Log Out","admin.empty":"No registrations yet.",
    "reps.kicker":"COUNCIL MEMBERS","reps.title":"Council Members","reps.sub":"The selected student members serving on the Supreme Student Advisory Council, organized by faculty", "news.kicker":"UPDATES","news.title":"News & Announcements","news.sub":"Upcoming events, deadlines, and important notices from the Council", "contact.kicker":"GET IN TOUCH","contact.title":"Contact Us","contact.sub":"We would be honored to answer your questions", "c.phone":"PHONE","c.email":"EMAIL","c.address":"ADDRESS","c.addressv":"International Islamic University, Islamabad, Pakistan","c.map":"Open location in Google Maps →","c.name":"Your Name *","c.emaill":"Email *","c.subject":"Subject","c.message":"Message *","c.thanks":"✓ Thank you — your message has been sent to the Council.","c.send":"Send Message", "footer.about":"The Supreme Student Advisory Council — a platform for students across every faculty of the International Islamic University, Islamabad to represent, advise and shape campus life.","footer.quick":"Quick Links","footer.council":"The Council","footer.connect":"Connect","footer.news":"News & Announcements","footer.reg":"Student Registration","footer.faculties":"Twelve Faculties","footer.wings":"Male & Female Councils","footer.reps":"Faculty Members","footer.addr":"International Islamic University, Islamabad, Pakistan","footer.bottom":"© 2026 Supreme Student Advisory Council · International Islamic University, Islamabad", "atab.overview":"Overview","atab.regs":"Registrations","atab.reps":"Members","atab.news":"Announcements","atab.messages":"Messages", "chart.trend":"Registrations over time","chart.trendsub":"last 7 days","chart.council":"Council split","chart.status":"Approval status","chart.rate":"Approval rate","chart.faculty":"Registrations by faculty","chart.flow":"Approval flow", "th.name":"Name","th.email":"Email","th.faculty":"Faculty","th.council":"Council","th.reg":"Reg #","th.status":"Status","th.actions":"Actions",
    "admin.th.name":"Name","admin.th.email":"Email","admin.th.phone":"Phone","admin.th.faculty":"Faculty","admin.th.category":"Category","admin.th.program":"Program","admin.th.semester":"Semester","admin.th.reg":"Reg #","admin.th.submitted":"Submitted"
  },
  ar:{
    "nav.home":"الرئيسية","nav.departments":"الكليات","nav.reps":"الأعضاء","nav.news":"الأخبار","nav.contact":"اتصل بنا","nav.admin":"الإدارة","nav.getstarted":"ابدأ الآن",
    "brand.title":"المجلس الاستشاري الطلابي الأعلى","brand.sub":"الجامعة الإسلامية العالمية بإسلام آباد",
    "hero.tag":"الجامعة الإسلامية العالمية بإسلام آباد",
    "hero.title":"المجلس الاستشاري الطلابي الأعلى",
    "hero.lead":"بتوجيه من رئيس الجامعة الإسلامية العالمية بإسلام آباد، يسر الجامعة أن تعلن عن تأسيس المجلس الاستشاري الطلابي الأعلى — منصة لطلاب جميع الكليات لتمثيل الطلاب وتقديم المشورة وتشكيل الحياة الجامعية.",
    "hero.cta":"ابدأ الآن",
    "how.title":"كيف يتم التسجيل","how.sub":"ثلاث خطوات سريعة للانضمام إلى تمثيل كليتك الاستشاري",
    "how.c1t":"اختر كليتك","how.c1p":"اختر القسم الذي تدرس فيه حاليًا من بين كليات الجامعة الاثنتي عشرة.",
    "how.c2t":"أخبرنا عن نفسك","how.c2p":"شارك بعض المعلومات الشخصية والأكاديمية لوضعك في المكان الصحيح.",
    "how.c3t":"أرسل وأنت منضم","how.c3p":"بضغطة واحدة يتم إرسال طلبك إلى المجلس للمراجعة.",
    "footer":"© 2026 المجلس الاستشاري الطلابي الأعلى · الجامعة الإسلامية العالمية بإسلام آباد",
    "crumb.home":"← الرئيسية","crumb.dept":"← تغيير الكلية","crumb.gender":"← تغيير المجلس",
    "dept.kicker":"الخطوة ١ من ٣","dept.title":"نظرة عامة على الكليات","dept.sub":"اختر الكلية التي تدرس فيها حاليًا لمتابعة التسجيل",
    "gender.kicker":"الخطوة ٢ من ٣","gender.title":"اختر مجلسك","gender.sub":"يعمل المجلس الاستشاري الطلابي الأعلى بجناحين متوازيين",
    "gender.male":"طالب","gender.malep":"سجل ضمن المجلس الاستشاري لقسم الطلاب",
    "gender.female":"طالبة","gender.femalep":"سجلي ضمن المجلس الاستشاري لقسم الطالبات",
    "reg.kicker":"الخطوة ٣ من ٣","reg.title":"تسجيل الطالب","reg.sub":"أكمل النموذج أدناه للانضمام إلى المجلس الاستشاري الطلابي الأعلى",
    "step.personal":"شخصي","step.academic":"أكاديمي","step.skills":"المهارات","step.submit":"إرسال",
    "p1.head":"المعلومات الشخصية","p1.sub":"أخبرنا القليل عن نفسك",
    "p2.head":"المعلومات الأكاديمية","p2.sub":"في أي كلية وبرنامج أنت مسجل؟","p3s.head":"المهارات والهوايات","p3s.sub":"اختر كل ما ينطبق — يمكنك اختيار أكثر من واحد",
    "p3.head":"مراجعة وإرسال","p3.sub":"يرجى مراجعة بياناتك أدناه ثم إرسال طلبك إلى المجلس.",
    "p3.note":"ملاحظة: التسجيل متاح فقط للطلاب المسجلين حاليًا في الجامعة.",
    "f.name":"الاسم الكامل","f.email":"البريد الإلكتروني","f.phone":"رقم الهاتف","f.nat":"الجنسية","f.reg":"الرقم الجامعي",
    "f.faculty":"الكلية","f.autofill":"(معبأ تلقائيًا)","f.program":"البرنامج الدراسي","f.semester":"الفصل الدراسي الحالي","f.year":"سنة الدراسة","f.cgpa":"المعدل التراكمي","f.optional":"(اختياري)","f.level":"المستوى الأكاديمي","f.levelph":"اختر المستوى الأكاديمي","f.skills":"المهارات","f.hobbies":"الهوايات والاهتمامات",
    "lvl.bs":"بكالوريوس","lvl.ms":"ماجستير","lvl.phd":"دكتوراه","lvl.diploma":"دبلوم",
    "val.male":"طالب","val.female":"طالبة",
    "ph.other":"أخرى (اختياري)","ph.cname":"اسمك","ph.cemail":"you@example.com","ph.csubject":"الموضوع","ph.cmessage":"رسالتك","ph.pass":"كلمة المرور","ph.repname":"اسم الطالب","ph.reprole":"الدور (مثال: الرئيس)","ph.antitle":"عنوان الإعلان","ph.anbody":"التفاصيل",
    "btn.continue":"التالي ←","btn.next":"التالي ←","btn.back":"→ رجوع","btn.submit":"إرسال التسجيل",
    "success.title":"تم إرسال التسجيل","success.sub":"شكرًا لانضمامك إلى المجلس الاستشاري الطلابي الأعلى. تم تسجيل طلبك وسيتم مراجعته من قبل فريق المجلس.",
    "success.home":"العودة للرئيسية","success.admin":"الذهاب إلى الإدارة",
    "admin.back":"← العودة للرئيسية","admin.title":"لوحة تحكم الإدارة","admin.sub":"أدخل كلمة مرور الإدارة لعرض التسجيلات المقدمة.","admin.hint":"للموظفين المصرح لهم فقط.","admin.login":"تسجيل الدخول",
    "admin.regs":"تسجيلات المجلس","admin.refresh":"تحديث","admin.clear":"مسح الكل","admin.logout":"تسجيل الخروج","admin.empty":"لا توجد تسجيلات بعد.",
    "reps.kicker":"أعضاء المجلس","reps.title":"أعضاء المجلس","reps.sub":"الطلاب الأعضاء المختارون في المجلس الاستشاري الطلابي الأعلى، مرتبون حسب الكلية", "news.kicker":"تحديثات","news.title":"الأخبار والإعلانات","news.sub":"الفعاليات القادمة والمواعيد النهائية والإشعارات المهمة من المجلس", "contact.kicker":"تواصل معنا","contact.title":"اتصل بنا","contact.sub":"يشرفنا الإجابة عن أسئلتكم", "c.phone":"الهاتف","c.email":"البريد الإلكتروني","c.address":"العنوان","c.addressv":"الجامعة الإسلامية العالمية، إسلام آباد، باكستان","c.map":"افتح الموقع في خرائط جوجل ←","c.name":"الاسم *","c.emaill":"البريد الإلكتروني *","c.subject":"الموضوع","c.message":"الرسالة *","c.thanks":"✓ شكرًا — تم إرسال رسالتك إلى المجلس.","c.send":"إرسال الرسالة", "footer.about":"المجلس الاستشاري الطلابي الأعلى — منصة لطلاب جميع كليات الجامعة الإسلامية العالمية بإسلام آباد لتمثيل الطلاب وتقديم المشورة وتطوير الحياة الجامعية.","footer.quick":"روابط سريعة","footer.council":"المجلس","footer.connect":"تواصل","footer.news":"الأخبار والإعلانات","footer.reg":"تسجيل الطالب","footer.faculties":"اثنتا عشرة كلية","footer.wings":"مجلسا الطلاب والطالبات","footer.reps":"أعضاء الكليات","footer.addr":"الجامعة الإسلامية العالمية، إسلام آباد، باكستان","footer.bottom":"© 2026 المجلس الاستشاري الطلابي الأعلى · الجامعة الإسلامية العالمية بإسلام آباد", "atab.overview":"نظرة عامة","atab.regs":"التسجيلات","atab.reps":"الأعضاء","atab.news":"الإعلانات","atab.messages":"الرسائل", "chart.trend":"التسجيلات عبر الوقت","chart.trendsub":"آخر ٧ أيام","chart.council":"توزيع المجلس","chart.status":"حالة الموافقة","chart.rate":"معدل الموافقة","chart.faculty":"التسجيلات حسب الكلية","chart.flow":"مسار الموافقة", "th.name":"الاسم","th.email":"البريد","th.faculty":"الكلية","th.council":"المجلس","th.reg":"الرقم الجامعي","th.status":"الحالة","th.actions":"إجراءات",
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
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.getAttribute('data-i18n-ph');
    if(dict[key] !== undefined){ el.setAttribute('placeholder', dict[key]); }
  });
  document.getElementById('htmlRoot').setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  document.getElementById('htmlRoot').setAttribute('lang', lang);
  document.getElementById('langBtn').textContent = lang === 'ar' ? '🌐 English' : '🌐 العربية';
  var lba=document.getElementById('langBtnAdmin'); if(lba) lba.textContent = lang === 'ar' ? '🌐 English' : '🌐 العربية';
  document.getElementById('langBtnMobile').textContent = lang === 'ar' ? 'English' : 'العربية';
  renderDepartments();
  try{ populateFacultySelect(); }catch(e){}
  try{ renderChips(); }catch(e){}
  if(state.department){
    document.getElementById('f_faculty').value = deptLabel(state.department);
  }
  try{
    var ap=document.getElementById('adminPanel');
    if(ap && ap.style.display==='block'){ var at=document.querySelector('.atab.active'); if(at) showAdminTab(at.dataset.tab); }
    if(document.getElementById('page-news') && document.getElementById('page-news').classList.contains('active')) renderNews();
    if(document.getElementById('page-reps') && document.getElementById('page-reps').classList.contains('active')) renderReps();
    if(document.getElementById('page-competitions') && document.getElementById('page-competitions').classList.contains('active')) renderCompetitions();
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

function populateFacultySelect(){
  var sel=document.getElementById('f_faculty'); if(!sel) return;
  var cur=sel.value;
  sel.innerHTML='<option value="">'+(lang==='ar'?'اختر كليتك':'Select your faculty')+'</option>'
    + DEPARTMENTS.map(function(d){ return '<option value="'+esc(d.en)+'">'+esc(lang==='ar'?d.ar:d.en)+'</option>'; }).join('');
  if(cur) sel.value=cur;
}
try{ populateFacultySelect(); }catch(e){}

function selectGender(g){
  state.gender = g;
  document.getElementById('genderMale').classList.toggle('selected', g==='Male');
  document.getElementById('genderFemale').classList.toggle('selected', g==='Female');
  document.getElementById('genderContinue').disabled = false;
  setTimeout(function(){ go('register'); }, 300);
}

/* =========================================================================
   ROLE-BASED ACCESS CONTROL (frontend layer)
   The backend/API is the source of truth; this only shapes the UI and blocks
   obvious navigation. Every protected API call still carries the JWT and is
   re-checked server-side.
   ========================================================================= */
var authToken = sessionStorage.getItem('ssac_token') || null;
var authUser = null;
try{ authUser = JSON.parse(sessionStorage.getItem('ssac_user') || 'null'); }catch(e){ authUser = null; }

function currentRole(){ return authUser ? authUser.role : null; }
function isLoggedIn(){ return !!authToken; }
function authHeaders(){ return authToken ? { Authorization: 'Bearer ' + authToken } : {}; }
function landingFor(role){ return role==='admin' ? 'admin' : (role==='council' ? 'council' : 'competitions'); }
function cap(s){ return String(s||'').charAt(0).toUpperCase() + String(s||'').slice(1); }
function roleLabel(r){ return tr(cap(r), {admin:'مشرف', council:'عضو مجلس', student:'طالب'}[r] || r); }

function setNav(baseId, on){
  ['', 'm_'].forEach(function(pfx){ var e=document.getElementById(pfx+baseId); if(e) e.style.display = on ? '' : 'none'; });
}
function applyRoleUI(){
  var role = currentRole(), loggedIn = isLoggedIn();
  setNav('navLogin', !loggedIn);
  setNav('navLogout', loggedIn);
  setNav('navCompetitions', true);                           // Competitions are public — always visible
  setNav('navCouncil', role==='admin' || role==='council');  // Advisory Council: admin + council
  setNav('navAdmin', role==='admin');                        // Admin panel: admin only
  // keep the legacy admin bearer in sync so existing admin-panel calls work
  adminToken = (role==='admin') ? authToken : null;
  var h = document.getElementById('htmlRoot');
  if(h){ h.className = h.className.replace(/\brole-\w+\b/g,'').replace(/\s+/g,' ').trim();
         if(role) h.classList.add('role-' + role);
         h.classList.toggle('logged-in', loggedIn); }
}

async function doLogin(ev){
  if(ev) ev.preventDefault();
  var email = val('login_email');
  var passEl = document.getElementById('login_pass'); var password = passEl ? passEl.value : '';
  var errEl = document.getElementById('loginErr'); if(errEl) errEl.textContent='';
  if(!email || !password){ if(errEl) errEl.textContent = tr('Please enter your email and password.','يرجى إدخال البريد وكلمة المرور.'); return; }
  try{
    var r = await api('/api/auth/login', { method:'POST', body: JSON.stringify({ email:email, password:password }) });
    authToken = r.token; authUser = r.user;
    sessionStorage.setItem('ssac_token', authToken);
    sessionStorage.setItem('ssac_user', JSON.stringify(authUser));
    if(passEl) passEl.value='';
    applyRoleUI();
    go(landingFor(authUser.role));
  }catch(e){
    if(errEl) errEl.textContent = (e && e.status===401)
      ? tr('Invalid email or password.','بريد إلكتروني أو كلمة مرور غير صحيحة.')
      : tr('Sign-in is unavailable right now. Please try again later.','تعذّر تسجيل الدخول حاليًا. حاول لاحقًا.');
  }
}
function doLogout(){
  authToken = null; authUser = null; adminToken = null;
  sessionStorage.removeItem('ssac_token');
  sessionStorage.removeItem('ssac_user');
  sessionStorage.removeItem('ssac_admin_token');
  document.getElementById('htmlRoot').classList.remove('admin-authed');
  applyRoleUI();
  go('home');
}

/* ---- Competitions: PUBLIC browse → detail → register (no login) ---- */
function compStatusBadge(s){
  if(s==='open') return '<span class="rbac-badge s-open">'+tr('Available','متاحة الآن')+'</span>';
  if(s==='soon') return '<span class="rbac-badge s-draft">'+tr('Coming soon','قريبًا')+'</span>';
  return '<span class="rbac-badge s-closed">'+tr('Closed','مغلقة')+'</span>';
}
async function renderCompetitions(){
  var box = document.getElementById('competitionsBody');
  if(!box) return;
  box.innerHTML = '<div class="empty-card">'+tr('Loading…','جارٍ التحميل…')+'</div>';
  var comps = [];
  try{ var r = await api('/api/competitions', { headers: authHeaders() }); comps = r.competitions || []; }
  catch(e){ box.innerHTML = '<div class="empty-card">'+tr('Could not load competitions.','تعذّر تحميل المسابقات.')+'</div>'; return; }
  if(!comps.length){ box.innerHTML = '<div class="empty-card">'+tr('No competitions yet. Please check back soon, in shā’ Allah.','لا توجد مسابقات بعد. تابعنا قريبًا بإذن الله.')+'</div>'; return; }
  window._comps = {};
  box.innerHTML = comps.map(function(c){
    window._comps[c.id] = c;
    var title = (lang==='ar' && c.title_ar) ? c.title_ar : c.title;
    return '<article class="comp-card comp-click" onclick="openCompetition('+c.id+')">'
      + (c.image ? '<div class="comp-thumb" style="background-image:url(\''+c.image+'\')"></div>' : '')
      + '<div class="comp-body">'
      + (c.category ? '<span class="comp-cat">'+esc(c.category)+'</span>' : '')
      + '<h3>'+esc(title)+'</h3>' + compStatusBadge(c.status)
      + '</div><div class="comp-foot"><span class="comp-link">'+tr('View details →','عرض التفاصيل →')+'</span></div></article>';
  }).join('');
}
async function openCompetition(id){
  var box = document.getElementById('compDetailBody'); if(!box) return;
  var c = (window._comps||{})[id];
  if(!c){ try{ var r=await api('/api/competitions/'+id,{headers:authHeaders()}); c=r.competition; }catch(e){} }
  if(!c){ alert(tr('Could not open this competition.','تعذّر فتح المسابقة.')); return; }
  var title = (lang==='ar' && c.title_ar) ? c.title_ar : c.title;
  var desc  = (lang==='ar' && c.description_ar) ? c.description_ar : (c.description||'');
  var reqs  = (lang==='ar' && c.requirements_ar) ? c.requirements_ar : (c.requirements||'');
  box.innerHTML = '<button class="btn-outline sm" onclick="go(\'competitions\')">← '+tr('Back to competitions','رجوع للمسابقات')+'</button>'
    + '<div class="comp-detail">'
    + (c.image ? '<img class="comp-detail-img" src="'+c.image+'" alt="">' : '')
    + (c.category ? '<span class="comp-cat">'+esc(c.category)+'</span>' : '')
    + '<h2>'+esc(title)+'</h2> '+compStatusBadge(c.status)
    + (desc ? '<p>'+esc(desc).replace(/\n/g,'<br>')+'</p>' : '')
    + (reqs ? '<h3>'+tr('Requirements & conditions','الشروط والمتطلبات')+'</h3><p>'+esc(reqs).replace(/\n/g,'<br>')+'</p>' : '')
    + '<div class="comp-detail-foot">'
    + (c.status==='open'
        ? '<button class="btn-primary" onclick="startCompetitionEntry('+c.id+')">'+tr('Register for this competition','سجّل في هذه المسابقة')+' →</button>'
        : '<span class="comp-done">'+(c.status==='soon'?tr('Registration opens soon.','التسجيل يُفتح قريبًا.'):tr('Registration is closed.','التسجيل مغلق.'))+'</span>')
    + '</div></div>';
  go('compdetail');
}
function clearRegForm(){
  ['f_name','f_email','f_phone','f_nationality','f_regno','f_program','f_semester','f_cgpa','f_skills_other','f_hobbies_other','f_faculty'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
  var lvl=document.getElementById('f_level'); if(lvl) lvl.selectedIndex=0;
  document.querySelectorAll('#skillsChips input:checked, #hobbiesChips input:checked').forEach(function(i){ i.checked=false; var c=i.closest('.chip'); if(c) c.classList.remove('checked'); });
  var sb=document.getElementById('socialAccounts'); if(sb){ sb.innerHTML=''; addSocialAccount(); }
}
function startCompetitionEntry(id){
  var c = (window._comps||{})[id] || { id:id };
  state.mode = '';                                   // not a council submission
  state.competition = { id:id, title:(lang==='ar'&&c.title_ar)?c.title_ar:(c.title||'') };
  state.department = null; state.gender = null;
  clearRegForm();
  go('register');
}

/* Add a council member — reuse the SAME registration wizard (faculty grid →
   personal → academic → skills → submit); only the submit target differs. */
function startAddMember(){
  state.mode = 'council';
  state.competition = null;
  state.department = null; state.gender = null;
  clearRegForm();
  go('departments');
}

/* ---- Competitions management (admin) ---- */
async function renderAdminCompetitions(){
  var box = document.getElementById('adminCompBody'); if(!box) return;
  box.innerHTML = '<div class="empty-card">'+tr('Loading…','جارٍ التحميل…')+'</div>';
  var comps = [];
  try{ var r = await api('/api/competitions', { headers: authHeaders() }); comps = r.competitions || []; }
  catch(e){ if(e&&e.status===401){doLogout();return;} box.innerHTML='<div class="empty-card">'+tr('Could not load.','تعذّر التحميل.')+'</div>'; return; }
  var form = '<form class="mng-form col" onsubmit="createCompetition(event)">'
    + '<input id="cmp_title" placeholder="'+tr('Title (English)','العنوان (إنجليزي)')+'">'
    + '<input id="cmp_title_ar" placeholder="'+tr('Title (Arabic)','العنوان (عربي)')+'">'
    + '<input id="cmp_category" placeholder="'+tr('Category (optional)','التصنيف (اختياري)')+'">'
    + '<textarea id="cmp_desc" rows="2" placeholder="'+tr('Description','الوصف')+'"></textarea>'
    + '<textarea id="cmp_reqs" rows="2" placeholder="'+tr('Requirements / conditions','الشروط والمتطلبات')+'"></textarea>'
    + '<select id="cmp_status"><option value="soon">'+tr('Coming soon','قريبًا')+'</option><option value="open">'+tr('Available (open registration)','متاحة (تسجيل مفتوح)')+'</option><option value="closed">'+tr('Closed','مغلقة')+'</option></select>'
    + '<label class="fld-label">'+tr('Image (optional)','صورة (اختياري)')+'</label>'
    + '<input type="file" id="cmp_image" accept="image/*">'
    + '<button class="btn-teal" type="submit">'+tr('Add competition','إضافة مسابقة')+'</button></form>';
  var list = comps.length ? comps.map(function(c){
    return '<div class="rbac-row"><div class="rbac-info"><b>'+esc(c.title)+'</b> '+compStatusBadge(c.status)
      + '<span class="rbac-sub">'+(c.entries||0)+' '+tr('registered','مسجّل')+'</span></div>'
      + '<div class="rbac-actions">'
      + '<select class="sm-select" onchange="setCompStatus('+c.id+',this.value)">'
        + '<option value="soon"'+(c.status==='soon'?' selected':'')+'>'+tr('Coming soon','قريبًا')+'</option>'
        + '<option value="open"'+(c.status==='open'?' selected':'')+'>'+tr('Available','متاحة')+'</option>'
        + '<option value="closed"'+(c.status==='closed'?' selected':'')+'>'+tr('Closed','مغلقة')+'</option></select>'
      + '<button class="btn-outline sm" onclick="viewEntries('+c.id+')">'+tr('Registrations','المسجّلون')+'</button>'
      + '<button class="btn-outline sm danger" onclick="deleteCompetition('+c.id+')">'+tr('Delete','حذف')+'</button>'
      + '</div><div class="entries-box" id="entries-'+c.id+'"></div></div>';
  }).join('') : '<div class="empty-card">'+tr('No competitions yet. Add one above.','لا توجد مسابقات بعد. أضِف واحدة بالأعلى.')+'</div>';
  box.innerHTML = '<div class="rbac-manage">'+form+'<div class="rbac-list">'+list+'</div></div>';
}
function readImageCompressed(inputId, maxW){
  return new Promise(function(resolve){
    var inp=document.getElementById(inputId);
    if(!inp || !inp.files || !inp.files[0]){ resolve(null); return; }
    var reader=new FileReader();
    reader.onload=function(e){
      var img=new Image();
      img.onload=function(){
        var mw=maxW||1000, scale=Math.min(1, mw/img.width);
        var w=Math.round(img.width*scale), h=Math.round(img.height*scale);
        var cv=document.createElement('canvas'); cv.width=w; cv.height=h;
        cv.getContext('2d').drawImage(img,0,0,w,h);
        try{ resolve(cv.toDataURL('image/jpeg',0.82)); }catch(err){ resolve(e.target.result); }
      };
      img.onerror=function(){ resolve(e.target.result); };
      img.src=e.target.result;
    };
    reader.onerror=function(){ resolve(null); };
    reader.readAsDataURL(inp.files[0]);
  });
}
async function createCompetition(ev){
  if(ev) ev.preventDefault();
  var title = val('cmp_title');
  if(!title){ alert(tr('Title is required.','العنوان مطلوب.')); return; }
  var image = await readImageCompressed('cmp_image', 1000);
  var body = { title:title, title_ar:val('cmp_title_ar'), category:val('cmp_category'), description:val('cmp_desc'), requirements:val('cmp_reqs'), status: val('cmp_status')||'soon' };
  if(image) body.image = image;
  try{ await api('/api/competitions', { method:'POST', headers: authHeaders(), body: JSON.stringify(body) }); renderAdminCompetitions(); }
  catch(e){ alert(tr('Could not save: ','تعذّر الحفظ: ')+(e && e.message || '')); }
}
async function setCompStatus(id, status){
  try{ await api('/api/competitions/'+id, { method:'PATCH', headers: authHeaders(), body: JSON.stringify({ status:status }) }); }
  catch(e){ alert(e && e.message || 'Error'); }
}
async function deleteCompetition(id){
  if(!confirm(tr('Delete this competition? This cannot be undone.','حذف هذه المسابقة؟ لا يمكن التراجع.'))) return;
  try{ await api('/api/competitions/'+id, { method:'DELETE', headers: authHeaders() }); renderAdminCompetitions(); }
  catch(e){ alert(e && e.message || 'Error'); }
}
async function viewEntries(id){
  var box = document.getElementById('entries-'+id); if(!box) return;
  if(box.getAttribute('data-open')==='1'){ box.innerHTML=''; box.setAttribute('data-open','0'); return; }
  box.setAttribute('data-open','1');
  box.innerHTML = '<div class="rbac-sub">'+tr('Loading…','جارٍ التحميل…')+'</div>';
  var entries=[];
  try{ var r=await api('/api/competitions/'+id+'/registrations',{headers:authHeaders()}); entries=r.entries||[]; }
  catch(e){ box.innerHTML='<div class="rbac-sub">'+tr('Could not load.','تعذّر التحميل.')+'</div>'; return; }
  if(!entries.length){ box.innerHTML='<div class="rbac-sub">'+tr('No registrations yet.','لا يوجد مسجّلون بعد.')+'</div>'; return; }
  box.innerHTML = entries.map(function(en){
    var badge = en.status==='approved'?'open':(en.status==='rejected'?'closed':'draft');
    return '<div class="entry-row"><div class="rbac-info"><b>'+esc(en.name)+'</b> <span class="rbac-badge s-'+badge+'">'+esc(en.status)+'</span><span class="rbac-sub">'+esc(en.email||'')+(en.faculty?' · '+esc(facLabel(en.faculty)):'')+(en.phone?' · '+esc(en.phone):'')+(en.socials?' · '+esc(en.socials):'')+'</span></div>'
      + '<div class="rbac-actions">'
      + (en.status!=='approved'?'<button class="btn-outline sm" onclick="setEntry('+en.id+',\'approved\','+id+')">'+tr('Approve','قبول')+'</button>':'')
      + (en.status!=='rejected'?'<button class="btn-outline sm" onclick="setEntry('+en.id+',\'rejected\','+id+')">'+tr('Reject','رفض')+'</button>':'')
      + '<button class="btn-outline sm danger" onclick="delEntry('+en.id+','+id+')">'+tr('Delete','حذف')+'</button>'
      + '</div></div>';
  }).join('');
}
function reopenEntries(id){ var b=document.getElementById('entries-'+id); if(b){ b.setAttribute('data-open','0'); viewEntries(id); } }
async function setEntry(eid,status,cid){ try{ await api('/api/entries/'+eid,{method:'PATCH',headers:authHeaders(),body:JSON.stringify({status:status})}); reopenEntries(cid); }catch(e){ alert(e&&e.message||'Error'); } }
async function delEntry(eid,cid){ if(!confirm(tr('Delete this registration?','حذف هذا التسجيل؟')))return; try{ await api('/api/entries/'+eid,{method:'DELETE',headers:authHeaders()}); reopenEntries(cid); }catch(e){ alert(e&&e.message||'Error'); } }

/* ---- Council members: council/HOD adds → admin approves ---- */
function renderCouncilAddForm(){ state._cmDept = null; renderCouncilAddStep(); }
function pickCouncilDept(i){ state._cmDept = DEPARTMENTS[i]; renderCouncilAddStep(); }
function renderCouncilAddStep(){
  var box = document.getElementById('councilAddBody'); if(!box) return;
  if(!state._cmDept){
    // Step 1 — the faculty cards grid (same look as the registration flow)
    var grid = DEPARTMENTS.map(function(d,i){
      return '<button class="dept-card" onclick="pickCouncilDept('+i+')">'
        + '<span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+ICONS[d.icon]+'</svg></span>'
        + '<span class="txt"><span class="name">'+esc(lang==='ar'?d.ar:d.en)+'</span></span>'
        + '<span class="chk"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span></button>';
    }).join('');
    box.innerHTML = '<p class="portal-sub" style="margin-bottom:14px">'+tr('Step 1 — choose the department','الخطوة 1 — اختر الكلية')+'</p><div class="dept-grid">'+grid+'</div>';
  } else {
    // Step 2 — the member details form (styled card)
    var d = state._cmDept;
    box.innerHTML = '<div class="formcard">'
      + '<div class="deptchip-row"><span class="deptchip">'+tr('Department: ','الكلية: ')+esc(lang==='ar'?d.ar:d.en)+'</span> <button class="btn-outline sm" onclick="state._cmDept=null;renderCouncilAddStep()">'+tr('Change department','تغيير الكلية')+'</button></div>'
      + '<div class="field"><label>'+tr('Member full name','اسم العضو الكامل')+' *</label><input id="cm_name"></div>'
      + '<div class="field"><label>'+tr('Position (e.g. President)','المنصب (مثال: رئيس)')+'</label><input id="cm_position"></div>'
      + '<div class="field"><label>'+tr('Email (optional)','البريد (اختياري)')+'</label><input id="cm_email" type="email"></div>'
      + '<div class="field"><label>'+tr('Phone (optional)','الهاتف (اختياري)')+'</label><input id="cm_phone"></div>'
      + '<div class="field"><label>'+tr('Details / notes (optional)','تفاصيل / ملاحظات (اختياري)')+'</label><textarea id="cm_details" rows="3"></textarea></div>'
      + '<button class="btn-teal" style="width:100%" onclick="submitCouncilMember()">'+tr('Submit for approval','إرسال للاعتماد')+'</button>'
      + '<p class="portal-sub" style="margin-top:12px">'+tr('Each department can have up to 5 members. Approved by the Admin.','كل كلية بحد أقصى 5 أعضاء. الاعتماد من المشرف.')+'</p>'
      + '<div id="cmAddMsg"></div></div>';
  }
}
async function submitCouncilMember(ev){
  if(ev) ev.preventDefault();
  var name=val('cm_name'); var dept = state._cmDept ? state._cmDept.en : '';
  if(!name||!dept){ alert(tr('Member name is required.','اسم العضو مطلوب.')); return; }
  var body={ name:name, department:dept, position:val('cm_position'), email:val('cm_email'), phone:val('cm_phone'), details:val('cm_details') };
  try{
    await api('/api/council-members',{method:'POST',headers:authHeaders(),body:JSON.stringify(body)});
    var msg=document.getElementById('cmAddMsg'); if(msg) msg.innerHTML='<div class="ok-card">✓ '+tr('Submitted. Awaiting admin approval.','تم الإرسال. بانتظار اعتماد المشرف.')+'</div>';
    ['cm_name','cm_position','cm_email','cm_phone','cm_details'].forEach(function(id){var e=document.getElementById(id);if(e)e.value='';});
  }catch(e){ if(e&&e.status===401){doLogout();return;} alert(tr('Could not submit: ','تعذّر الإرسال: ')+(e&&e.message||'')); }
}
async function renderCouncilMembers(){
  var box=document.getElementById('adminCouncilBody'); if(!box) return;
  box.innerHTML='<div class="empty-card">'+tr('Loading…','جارٍ التحميل…')+'</div>';
  var members=[];
  try{ var r=await api('/api/council-members',{headers:authHeaders()}); members=r.members||[]; }
  catch(e){ if(e&&e.status===401){doLogout();return;} box.innerHTML='<div class="empty-card">'+tr('Could not load.','تعذّر التحميل.')+'</div>'; return; }
  if(!members.length){ box.innerHTML='<div class="empty-card">'+tr('No council members added yet.','لم يُضَف أعضاء بعد.')+'</div>'; return; }
  box.innerHTML='<div class="rbac-list">'+members.map(function(m){
    var badge=m.status==='approved'?'open':(m.status==='rejected'?'closed':'draft');
    return '<div class="rbac-row"><div class="rbac-info"><b>'+esc(m.name)+'</b> <span class="rbac-badge r-council">'+esc(facLabel(m.department))+'</span>'
      + ' <span class="rbac-badge s-'+badge+'">'+esc(m.status)+'</span>'
      + '<span class="rbac-sub">'+(m.position?esc(m.position)+' · ':'')+esc(m.email||'')+(m.phone?' · '+esc(m.phone):'')+(m.socials?' · '+esc(m.socials):'')+'</span></div>'
      + '<div class="rbac-actions">'
      + (m.status!=='approved'?'<button class="btn-outline sm" onclick="setMember('+m.id+',\'approved\')">'+tr('Approve','قبول')+'</button>':'')
      + (m.status!=='rejected'?'<button class="btn-outline sm" onclick="setMember('+m.id+',\'rejected\')">'+tr('Reject','رفض')+'</button>':'')
      + '<button class="btn-outline sm danger" onclick="delMember('+m.id+')">'+tr('Delete','حذف')+'</button>'
      + '</div></div>';
  }).join('')+'</div>';
}
async function setMember(id,status){ try{ await api('/api/council-members/'+id,{method:'PATCH',headers:authHeaders(),body:JSON.stringify({status:status})}); renderCouncilMembers(); }catch(e){ alert(e&&e.message||'Error'); } }
async function delMember(id){ if(!confirm(tr('Delete this member?','حذف هذا العضو؟')))return; try{ await api('/api/council-members/'+id,{method:'DELETE',headers:authHeaders()}); renderCouncilMembers(); }catch(e){ alert(e&&e.message||'Error'); } }

/* ---- User management (admin only) ---- */
async function renderAdminUsers(){
  var box = document.getElementById('adminUsersBody'); if(!box) return;
  box.innerHTML = '<div class="empty-card">'+tr('Loading…','جارٍ التحميل…')+'</div>';
  var users = [];
  try{ var r = await api('/api/users', { headers: authHeaders() }); users = r.users || []; }
  catch(e){
    if(e && e.status===401){ doLogout(); return; }
    box.innerHTML = '<div class="empty-card">'+tr('Could not load users.','تعذّر تحميل المستخدمين.')+'</div>'; return;
  }
  var form = '<form class="mng-form" onsubmit="createUser(event)">'
    + '<input id="usr_name" placeholder="'+tr('Full name','الاسم الكامل')+'">'
    + '<input id="usr_email" type="email" placeholder="'+tr('Email','البريد الإلكتروني')+'">'
    + '<input id="usr_pass" type="password" placeholder="'+tr('Password','كلمة المرور')+'">'
    + '<select id="usr_role"><option value="council">'+tr('Council / HOD','عضو مجلس / رئيس قسم')+'</option>'
    + '<option value="admin">'+tr('Admin','مشرف')+'</option></select>'
    + '<select id="usr_dept"><option value="">'+tr('Department (for Council/HOD)','الكلية (للمجلس/رئيس القسم)')+'</option>'
        + DEPARTMENTS.map(function(d){ return '<option value="'+esc(d.en)+'">'+esc(lang==='ar'?d.ar:d.en)+'</option>'; }).join('')
    + '</select>'
    + '<button class="btn-teal" type="submit">'+tr('Add account','إضافة حساب')+'</button></form>';
  var rows = users.map(function(u){
    return '<div class="rbac-row"><div class="rbac-info"><b>'+esc(u.name)+'</b>'
      + ' <span class="rbac-badge r-'+u.role+'">'+esc(roleLabel(u.role))+'</span>'
      + (u.department? ' <span class="rbac-badge r-council">'+esc(facLabel(u.department))+'</span>':'')
      + (u.active ? '' : ' <span class="rbac-badge s-closed">'+tr('Inactive','معطّل')+'</span>')
      + '<span class="rbac-sub">'+esc(u.email)+'</span></div>'
      + '<div class="rbac-actions">'
      + '<button class="btn-outline sm" onclick="toggleUser('+u.id+','+(u.active?'false':'true')+')">'+(u.active?tr('Deactivate','تعطيل'):tr('Activate','تفعيل'))+'</button>'
      + '<button class="btn-outline sm danger" onclick="deleteUser('+u.id+')">'+tr('Delete','حذف')+'</button>'
      + '</div></div>';
  }).join('');
  box.innerHTML = '<div class="rbac-manage">'+form+'<div class="rbac-list">'+(rows||('<div class="empty-card">'+tr('No users yet.','لا يوجد مستخدمون بعد.')+'</div>'))+'</div></div>';
}
async function createUser(ev){
  if(ev) ev.preventDefault();
  var name=val('usr_name'), email=val('usr_email'), pass=document.getElementById('usr_pass').value, role=val('usr_role'), dept=val('usr_dept');
  if(!name||!email||!pass){ alert(tr('Name, email and password are required.','الاسم والبريد وكلمة المرور مطلوبة.')); return; }
  try{ await api('/api/users', { method:'POST', headers: authHeaders(), body: JSON.stringify({ name:name, email:email, password:pass, role:role, department:dept }) }); renderAdminUsers(); }
  catch(e){ alert(tr('Could not create user: ','تعذّر إنشاء المستخدم: ')+(e && e.message || '')); }
}
async function toggleUser(id, active){
  try{ await api('/api/users/'+id, { method:'PATCH', headers: authHeaders(), body: JSON.stringify({ active:active }) }); renderAdminUsers(); }
  catch(e){ alert(e && e.message || 'Error'); }
}
async function deleteUser(id){
  if(!confirm(tr('Delete this user?','حذف هذا المستخدم؟'))) return;
  try{ await api('/api/users/'+id, { method:'DELETE', headers: authHeaders() }); renderAdminUsers(); }
  catch(e){ alert(e && e.message || 'Error'); }
}

/* Pages that require a login, and which roles may open them.
   The backend re-checks every request — this is the UX layer only. */
var PAGE_ROLES = { council:['admin','council'], 'council-add':['admin','council'], admin:['admin'] };
function go(pageId){
  var need = PAGE_ROLES[pageId];
  if(need){
    if(!isLoggedIn()){ go('login'); return; }
    if(need.indexOf(currentRole()) < 0){
      alert(tr('You do not have permission to view this page.','ليس لديك صلاحية لعرض هذه الصفحة.'));
      go(landingFor(currentRole())); return;
    }
  }
  var target = document.getElementById('page-' + pageId);
  if(!target){ pageId='home'; target=document.getElementById('page-home'); }
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  target.classList.add('active');
  document.getElementById('htmlRoot').classList.toggle('on-admin', pageId==='admin');
  if(pageId==='admin'){
    document.getElementById('htmlRoot').classList.add('admin-authed');
    var lb=document.getElementById('adminLoginBox'); if(lb) lb.style.display='none';
    var ap=document.getElementById('adminPanel'); if(ap) ap.style.display='block';
    showAdminTab('overview');
  }
  if(pageId==='competitions'){ renderCompetitions(); }
  if(pageId==='council-add'){ renderCouncilAddForm(); }
  window.scrollTo({top:0, behavior:'instant'});
  if(pageId === 'gender' && state.department){
    document.getElementById('genderFacultyCrumb').textContent = ' · ' + deptLabel(state.department);
  }
  if(pageId === 'register'){
    if(state.competition && state.competition.id){
      document.getElementById('deptChip').textContent = tr('Competition: ','المسابقة: ') + state.competition.title;
      document.getElementById('registerCrumb').textContent = ' · ' + state.competition.title;
    } else {
      document.getElementById('deptChip').textContent = (lang==='ar'?'الكلية: ':'Faculty: ') + (state.department ? deptLabel(state.department) : '—');
      document.getElementById('f_faculty').value = state.department ? state.department.en : '';
      document.getElementById('registerCrumb').textContent = state.department ? (' · ' + deptLabel(state.department) + ' — ' + (state.gender||'')) : '';
    }
    var _sb=document.getElementById('socialAccounts'); if(_sb && !_sb.children.length) addSocialAccount();
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
function addSocialAccount(value){
  var box=document.getElementById('socialAccounts'); if(!box) return;
  var row=document.createElement('div'); row.className='social-row';
  row.innerHTML='<input type="text" class="social-input" autocomplete="off" placeholder="'+(lang==='ar'?'مثال: https://instagram.com/username':'e.g. https://instagram.com/username')+'"><button type="button" class="social-del" title="remove" onclick="this.parentNode.remove()">×</button>';
  if(value) row.querySelector('input').value=value;
  box.appendChild(row);
}
function gatherSocials(){ return Array.prototype.slice.call(document.querySelectorAll('#socialAccounts .social-input')).map(function(i){return i.value.trim();}).filter(Boolean); }
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
    rf(L('Council','المجلس'), councilLabel(state.gender)) +
    rf(L('Faculty','الكلية'), state.department?deptLabel(state.department):'', true) +
    rf(L('Academic Level','المستوى الأكاديمي'), levelLabel(_fv('f_level'))) +
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
    faculty: _fv('f_faculty') || (state.department ? state.department.en : null), gender: state.gender,
    level: _fv('f_level'), program: _fv('f_program'), semester: _fv('f_semester'),
    cgpa: _fv('f_cgpa'), skills: gatherSkills(), hobbies: gatherHobbies(), socials: gatherSocials(),
    submittedAt: new Date().toISOString()
  };
  if(!data.name || !data.email || !data.phone || !data.regno){
    alert(lang==='ar' ? 'يرجى تعبئة جميع الحقول المطلوبة.' : 'Please fill in all required fields.');
    return;
  }
  const btn = document.querySelector('#formstep-4 .btn-teal');
  if(btn){ btn.disabled = true; }
  var inCompetition = !!(state.competition && state.competition.id);
  var inCouncil = (state.mode === 'council');
  try{
    if(inCouncil){
      await api('/api/council-members', { method:'POST', headers: authHeaders(), body: JSON.stringify(data) });
    } else if(inCompetition){
      await api('/api/competitions/'+state.competition.id+'/register', { method:'POST', body: JSON.stringify(data) });
    } else {
      await api('/api/register', { method:'POST', body: JSON.stringify(data) });
    }
  }catch(e){
    if(btn){ btn.disabled = false; }
    alert((lang==='ar' ? 'تعذّر إرسال التسجيل: ' : 'Could not submit registration: ') + e.message);
    return;
  }
  if(btn){ btn.disabled = false; }

  document.getElementById('successCard').innerHTML = successRows(data);
  state.competition = null; state.mode = ''; // clear context after submit
  go('success');
}
function successRows(d){
  const L=(en,ar)=>lang==='ar'?ar:en;
  function r(label,val){ return '<div class="row"><span>'+label+'</span><span>'+(esc(val)||'—')+'</span></div>'; }
  return r(L('Full Name','الاسم'),d.name)+r(L('Email','البريد الإلكتروني'),d.email)+r(L('Phone','الهاتف'),d.phone)+
    r(L('Nationality','الجنسية'),d.nationality)+r(L('Registration No.','الرقم الجامعي'),d.regno)+
    r(L('Council','المجلس'),councilLabel(d.gender))+r(L('Faculty','الكلية'),facLabel(d.faculty))+
    r(L('Academic Level','المستوى الأكاديمي'),levelLabel(d.level))+r(L('Degree Program','البرنامج'),d.program)+
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

function adminLogout(){ doLogout(); }

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
function facLabel(en){ var d=DEPARTMENTS.filter(function(x){return x.en===en||x.ar===en;})[0]; return d?(lang==='ar'?d.ar:d.en):en; }
function councilLabel(g){ return I18N[lang][g==='Female'?'val.female':'val.male']; }
function levelLabel(v){ if(!v) return ''; var k='lvl.'+String(v).toLowerCase(); return (I18N[lang][k]!==undefined)?I18N[lang][k]:v; }

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
  if(!items.length){ box.innerHTML='<div class="empty-card">'+(lang==='ar'?'سيتم الإعلان عن الأعضاء قريبًا.':'Members will be announced soon.')+'</div>'; return; }
  var groups={}; items.forEach(function(r){ (groups[r.faculty]=groups[r.faculty]||[]).push(r); });
  box.innerHTML=Object.keys(groups).map(function(fac){
    return '<div class="rep-group"><h3>'+esc(fac)+'</h3><div class="rep-cards">'+groups[fac].map(function(r){
      return '<div class="rep-card"><div class="rep-avatar">'+initials(r.name)+'</div><div class="rep-meta"><b>'+esc(r.name)+'</b><span>'+esc(r.role||tr('Member','عضو'))+'</span></div></div>';
    }).join('')+'</div></div>';
  }).join('');
}

/* ---- ADMIN: tabs ---- */
function showAdminTab(name){
  document.querySelectorAll('.atab').forEach(function(b){ b.classList.toggle('active', b.dataset.tab===name); });
  ['overview','regs','reps','news','messages','competitions','council','users'].forEach(function(t){ var p=document.getElementById('apanel-'+t); if(p) p.hidden=(t!==name); });
  if(name==='overview') renderAnalytics();
  if(name==='regs') loadAdminData();
  if(name==='reps') renderAdminReps();
  if(name==='news') renderAdminNews();
  if(name==='messages') renderAdminMessages();
  if(name==='competitions') renderAdminCompetitions();
  if(name==='council') renderCouncilMembers();
  if(name==='users') renderAdminUsers();
}
async function tryAdminLogin(){
  var pass=document.getElementById('adminPass').value;
  try{
    var r=await api('/api/admin/login',{method:'POST',body:JSON.stringify({password:pass})});
    adminToken=r.token; sessionStorage.setItem('ssac_admin_token',adminToken);
    document.getElementById('adminPass').value='';
    document.getElementById('adminLoginBox').style.display='none';
    document.getElementById('adminPanel').style.display='block';
    document.getElementById('htmlRoot').classList.add('admin-authed');
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
/* Overview data = council members + all competition registrations, mapped to the
   shape the charts already expect ({faculty, gender, status, submittedAt}). */
async function getDashboardRows(){
  var rows=[];
  try{
    var m=await api('/api/council-members',{headers:authHeaders()});
    (m.members||[]).forEach(function(x){ rows.push({faculty:x.department, gender:x.gender, status:x.status, submittedAt:x.created_at}); });
  }catch(e){ if(e&&e.status===401){ doLogout(); return rows; } }
  try{
    var cr=await api('/api/competitions',{headers:authHeaders()});
    var comps=cr.competitions||[];
    var lists=await Promise.all(comps.map(function(c){
      return api('/api/competitions/'+c.id+'/registrations',{headers:authHeaders()}).then(function(r){return r.entries||[];}).catch(function(){return [];});
    }));
    lists.forEach(function(list){ list.forEach(function(x){ rows.push({faculty:x.faculty, gender:x.gender, status:x.status, submittedAt:x.created_at}); }); });
  }catch(e){}
  return rows;
}
async function renderAnalytics(){
  var rows=await getDashboardRows();
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
    trEl.innerHTML='<td>'+esc(d.name)+'</td><td>'+esc(d.email)+'</td><td>'+esc(facLabel(d.faculty))+'</td>'+
      '<td><span class="tag '+(d.gender==='Female'?'female':'male')+'">'+esc(councilLabel(d.gender))+'</span></td>'+
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
  document.getElementById('regModalActions').innerHTML=ab+'<button class="btn-outline" style="color:#b13a63;border-color:#f3c6d3" onclick="deleteReg(\''+d.id+'\');closeRegModal()">'+tr('Delete','حذف')+'</button>'+'<button class="btn-outline" onclick="closeRegModal();go(\'home\')">'+tr('Home','الرئيسية')+'</button>';
  function rf(label,val,full){ return '<div class="rf'+(full?' full':'')+'"><span>'+label+'</span><b>'+(esc(val)||'—')+'</b></div>'; }
  var date=d.submittedAt?new Date(d.submittedAt).toLocaleString():'';
  document.getElementById('regModalBody').innerHTML=
    rf(tr('Full Name','الاسم'),d.name)+rf(tr('Email','البريد الإلكتروني'),d.email)+rf(tr('Phone','الهاتف'),d.phone)+
    rf(tr('Nationality','الجنسية'),d.nationality)+rf(tr('Registration No.','الرقم الجامعي'),d.regno)+
    rf(tr('Council','المجلس'),councilLabel(d.gender))+rf(tr('Faculty','الكلية'),facLabel(d.faculty),true)+
    rf(tr('Academic Level','المستوى الأكاديمي'),levelLabel(d.level))+rf(tr('Degree Program','البرنامج'),d.program)+
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
  box.innerHTML=items.length?items.map(function(r){ return '<div class="mng-row"><div class="mng-body"><b>'+esc(r.name)+'</b><span class="muted"> · '+esc(r.role||'Member')+'</span><div class="muted">'+esc(r.faculty)+'</div></div><button class="mini danger" onclick="deleteRep(\''+r.id+'\')">Delete</button></div>'; }).join(''):'<div class="empty-card">No representatives added.</div>';
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
 {en:'Leadership & Team Management', ar:'القيادة وإدارة الفريق'},
 {en:'Communication', ar:'التواصل'},
 {en:'Public Speaking & Presentation', ar:'التحدث أمام الجمهور والعروض التقديمية'},
 {en:'Event Planning & Coordination', ar:'تخطيط وتنظيم الفعاليات'},
 {en:'Report Writing & Documentation', ar:'كتابة التقارير والتوثيق'},
 {en:'Social Media Management', ar:'إدارة وسائل التواصل الاجتماعي'},
 {en:'Graphic Design', ar:'التصميم الجرافيكي'},
 {en:'Photography', ar:'التصوير الفوتوغرافي'},
 {en:'Video Editing', ar:'تحرير الفيديو'},
 {en:'Programming', ar:'البرمجة'},
 {en:'Web Development', ar:'تطوير المواقع'}
];
var HOBBIES=[
 {en:'Volunteering', ar:'التطوع'},
 {en:'Book Reading', ar:'القراءة'},
 {en:'Writing / Poetry', ar:'الكتابة والشعر'},
 {en:'Sports', ar:'الرياضة'},
 {en:'Drawing', ar:'الرسم'},
 {en:'Arts & Crafts', ar:'الفنون والحرف اليدوية'},
 {en:'Cooking', ar:'الطبخ'},
 {en:'Landscaping', ar:'التزيين بالزراعة'},
 {en:'Calligraphy', ar:'الخط'},
 {en:'Research & Learning', ar:'البحث والتعلّم'},
 {en:'Entrepreneurship', ar:'ريادة الأعمال'},
 {en:'Technology & Innovation', ar:'التقنية والابتكار'},
 {en:'Community Service', ar:'خدمة المجتمع'},
 {en:'Cultural Activities', ar:'الأنشطة الثقافية'},
 {en:'Languages & Translation', ar:'اللغات والترجمة'}
];
function _chip(name,item){ var label=(lang==='ar'?item.ar:item.en); return '<label class="chip"><input type="checkbox" name="'+name+'" value="'+esc(item.en)+'"><span class="chip-check" aria-hidden="true"></span><span class="chip-label">'+esc(label)+'</span></label>'; }
function _bindChips(box){ box.querySelectorAll('input').forEach(function(inp){ inp.addEventListener('change',function(){ var c=inp.closest('.chip'); if(c) c.classList.toggle('checked', inp.checked); }); }); }
function _renderChipBox(box,items,name){
  if(!box) return;
  var checked={}; box.querySelectorAll('input:checked').forEach(function(i){ checked[i.value]=1; });
  box.innerHTML=items.map(function(it){ return _chip(name,it); }).join('');
  box.querySelectorAll('input').forEach(function(inp){ if(checked[inp.value]){ inp.checked=true; var c=inp.closest('.chip'); if(c) c.classList.add('checked'); } });
  _bindChips(box);
}
function renderChips(){
  _renderChipBox(document.getElementById('skillsChips'), SKILLS, 'skill');
  _renderChipBox(document.getElementById('hobbiesChips'), HOBBIES, 'hobby');
}
renderChips();

/* ---- RBAC i18n strings (added on top of the base dictionary) ---- */
try{
  Object.assign(I18N.en, {
    "nav.council":"Advisory Council","nav.competitions":"Competitions","nav.login":"Login","nav.logout":"Log Out",
    "atab.competitions":"Competitions","atab.council":"Council Members","atab.users":"Users",
    "login.title":"Sign in","login.sub":"Sign in to reach your portal. Accounts are created by the Administrator.","login.email":"Email","login.pass":"Password","login.btn":"Log In",
    "comp.title":"Competitions","comp.sub":"Browse the competitions and register to take part.",
    "council.title":"Advisory Council","council.sub":"Your council area.",
    "council.c1t":"Add Council Member","council.c1p":"Add a member for your department (up to 5). Submissions are approved by the Admin.","council.c1b":"Add Council Member",
    "council.c2t":"Competitions","council.c2p":"Browse the competitions available on the site.",
    "canv.title":"Add Council Member","canv.sub":"Select the department and enter the member's details.",
    "f.social":"Social media accounts (optional)","f.socialadd":"+ Add account"
  });
  Object.assign(I18N.ar, {
    "nav.council":"المجلس الاستشاري","nav.competitions":"المسابقات","nav.login":"تسجيل الدخول","nav.logout":"تسجيل الخروج",
    "atab.competitions":"المسابقات","atab.council":"أعضاء المجلس","atab.users":"المستخدمون",
    "login.title":"تسجيل الدخول","login.sub":"سجّل الدخول للوصول إلى لوحتك. الحسابات يُنشئها المشرف.","login.email":"البريد الإلكتروني","login.pass":"كلمة المرور","login.btn":"دخول",
    "comp.title":"المسابقات","comp.sub":"تصفّح المسابقات وسجّل للمشاركة.",
    "council.title":"المجلس الاستشاري","council.sub":"منطقة المجلس.",
    "council.c1t":"إضافة عضو مجلس","council.c1p":"أضِف عضوًا لكليتك (حتى 5 أعضاء). الاعتماد يتم من قِبل المشرف.","council.c1b":"إضافة عضو مجلس",
    "council.c2t":"المسابقات","council.c2p":"تصفّح المسابقات المتاحة في الموقع.",
    "canv.title":"إضافة عضو مجلس","canv.sub":"اختر الكلية وأدخل بيانات العضو.",
    "f.social":"حسابات التواصل الاجتماعي (اختياري)","f.socialadd":"+ إضافة حساب"
  });
}catch(e){}

/* apply the active-language dictionary + role-based UI on first paint */
try{ applyRoleUI(); }catch(e){}
try{ applyLang(); }catch(e){}

/* If a token is stored, confirm it with the backend; drop it if it's expired/invalid. */
(function(){
  if(!authToken) return;
  api('/api/auth/me', { headers: authHeaders() })
    .then(function(r){ authUser = r.user; sessionStorage.setItem('ssac_user', JSON.stringify(authUser)); applyRoleUI(); })
    .catch(function(e){ if(e && e.status===401) doLogout(); });
})();
