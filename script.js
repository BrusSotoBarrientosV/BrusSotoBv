/* ------------------------------------------------------------------
   MiCurso — interacciones
   - Navegación lateral entre vistas
   - Acordeón de unidades (chevron)
   - Selección de semanas con modal y marcado de progreso
   - Cálculo dinámico del progreso general
   - Agregar/borrar documentos (por enlace) en cada semana — persistente
     entre sesiones usando localStorage del navegador
------------------------------------------------------------------- */

const TOTAL_WEEKS = 16;
const STORAGE_KEY = 'micurso_week_documents';

// Documentos por semana: { "1": [ {name, type, url}, ... ], ... }
// Se cargan desde localStorage al iniciar y se guardan ahí cada cambio,
// por lo que sobreviven a recargas y al cerrar/abrir el navegador.
let weekDocuments = loadDocuments();

function loadDocuments(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  }catch{
    return {};
  }
}

function saveDocuments(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(weekDocuments));
  }catch{
    // Si localStorage no está disponible (modo privado, cuota llena, etc.)
    console.warn('No se pudo guardar en localStorage; los documentos no persistirán.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initSidebarNav();
  initUnitAccordions();
  initWeekBoxes();
  initModal();
  initDocModal();
  initLogout();
  renderAllWeekDocs();
  updateProgress();
});

/* ---------------- RENDER INICIAL DE TODAS LAS SEMANAS ---------------- */
function renderAllWeekDocs(){
  for(let week = 1; week <= TOTAL_WEEKS; week++){
    renderWeekDocs(String(week));
  }
}

/* ---------------- NAVEGACIÓN LATERAL ---------------- */
function initSidebarNav(){
  const links = document.querySelectorAll('.nav-link');
  const views = document.querySelectorAll('.view');
  const crumbCurrent = document.getElementById('breadcrumb-current');

  links.forEach(link => {
    link.addEventListener('click', () => {
      const target = link.dataset.view;
      if(!target) return;

      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      views.forEach(v => v.classList.remove('active'));
      const targetView = document.getElementById(`view-${target}`);
      if(targetView) targetView.classList.add('active');

      if(crumbCurrent){
        crumbCurrent.textContent = link.dataset.label || link.textContent.trim();
      }
    });
  });

  // Breadcrumb "Unidades" siempre regresa a la vista principal
  const crumbHome = document.getElementById('breadcrumb-home');
  if(crumbHome){
    crumbHome.addEventListener('click', () => {
      document.querySelector('.nav-link[data-view="unidades"]').click();
    });
  }
}

/* ---------------- ACORDEÓN DE UNIDADES ---------------- */
function initUnitAccordions(){
  document.querySelectorAll('.unit-card').forEach(card => {
    const header = card.querySelector('.unit-card-header');
    const chevronBtn = card.querySelector('.chevron-btn');
    const detail = card.querySelector('.unit-detail');

    const toggle = (e) => {
      // Evita que un clic dentro de las semanas dispare el acordeón
      if(e.target.closest('.week-box')) return;
      const isOpen = detail.classList.toggle('open');
      chevronBtn.classList.toggle('open', isOpen);
      header.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    };

    header.addEventListener('click', toggle);
    header.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        toggle(e);
      }
    });
  });
}

/* ---------------- SEMANAS ---------------- */
function initWeekBoxes(){
  document.querySelectorAll('.week-box-main').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const box = btn.closest('.week-box');
      openWeekModal(box);
    });
  });

  document.querySelectorAll('.add-doc-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openDocModal(btn.dataset.week);
    });
  });
}

/* ---------------- MODAL ---------------- */
let activeWeekBox = null;

function initModal(){
  const overlay = document.getElementById('modal-overlay');
  const closeBtn = document.getElementById('modal-close');
  const toggleBtn = document.getElementById('modal-toggle-complete');

  overlay.addEventListener('click', (e) => {
    if(e.target === overlay) closeModal();
  });
  closeBtn.addEventListener('click', closeModal);

  toggleBtn.addEventListener('click', () => {
    if(!activeWeekBox) return;
    const completed = activeWeekBox.classList.toggle('completed');
    toggleBtn.textContent = completed ? 'Marcar como pendiente' : 'Marcar como completada';
    updateProgress();
  });
}

function openWeekModal(box){
  activeWeekBox = box;
  const overlay = document.getElementById('modal-overlay');
  const title = document.getElementById('modal-title');
  const desc = document.getElementById('modal-desc');
  const iconWrap = document.getElementById('modal-icon');
  const toggleBtn = document.getElementById('modal-toggle-complete');

  const weekLabel = box.querySelector('.week-label').textContent;
  const unitCard = box.closest('.unit-card');
  const unitName = unitCard.querySelector('.unit-title .name').textContent;
  const isCompleted = box.classList.contains('completed');

  title.textContent = weekLabel;
  desc.textContent = `Contenido de "${unitName}" correspondiente a esta semana. Revisa los materiales y actividades asignadas.`;
  iconWrap.className = 'modal-icon ' + unitCard.className.match(/unit-\d/)[0];
  toggleBtn.textContent = isCompleted ? 'Marcar como pendiente' : 'Marcar como completada';

  overlay.classList.add('open');
}

function closeModal(){
  document.getElementById('modal-overlay').classList.remove('open');
  activeWeekBox = null;
}

/* ---------------- PROGRESO GENERAL ---------------- */
function updateProgress(){
  const completed = document.querySelectorAll('.week-box.completed').length;
  const percent = Math.round((completed / TOTAL_WEEKS) * 100);

  document.getElementById('progress-percent').textContent = `${percent}%`;
  document.getElementById('progress-fill').style.width = `${percent}%`;
}

/* ---------------- CERRAR SESIÓN ---------------- */
function initLogout(){
  const btn = document.getElementById('logout-btn');
  btn.addEventListener('click', () => {
    const ok = confirm('¿Seguro que deseas cerrar sesión?');
    if(ok){
      alert('Sesión cerrada (demo).');
    }
  });
}

/* ---------------- AGREGAR DOCUMENTOS POR SEMANA ---------------- */
const DOC_TYPE_LABELS = {
  pdf: 'PDF',
  word: 'Word',
  excel: 'Excel',
  ppt: 'PowerPoint',
  link: 'Enlace'
};

const DOC_TYPE_ICONS = {
  pdf: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
  word: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
  excel: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
  ppt: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
  link: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2"><path d="M10 13a5 5 0 0 0 7.5.4l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7.5-.4l-2 2a5 5 0 0 0 7 7l1-1"/></svg>'
};

let activeDocWeek = null;

function initDocModal(){
  const overlay = document.getElementById('doc-modal-overlay');
  const closeBtn = document.getElementById('doc-modal-close');
  const form = document.getElementById('doc-form');
  const errorMsg = document.getElementById('doc-form-error');

  overlay.addEventListener('click', (e) => {
    if(e.target === overlay) closeDocModal();
  });
  closeBtn.addEventListener('click', closeDocModal);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if(!activeDocWeek) return;

    const nameInput = document.getElementById('doc-name');
    const typeInput = document.getElementById('doc-type');
    const urlInput = document.getElementById('doc-url');

    const name = nameInput.value.trim();
    const url = urlInput.value.trim();

    if(!name || !isValidUrl(url)){
      errorMsg.classList.add('show');
      return;
    }
    errorMsg.classList.remove('show');

    if(!weekDocuments[activeDocWeek]) weekDocuments[activeDocWeek] = [];
    weekDocuments[activeDocWeek].push({
      name,
      type: typeInput.value,
      url
    });
    saveDocuments();

    renderWeekDocs(activeDocWeek);
    form.reset();
    closeDocModal();
  });
}

function isValidUrl(value){
  try{
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  }catch{
    return false;
  }
}

function openDocModal(week){
  activeDocWeek = week;
  document.getElementById('doc-modal-title').textContent = `Agregar documento — Semana ${week}`;
  document.getElementById('doc-form-error').classList.remove('show');
  document.getElementById('doc-form').reset();
  document.getElementById('doc-modal-overlay').classList.add('open');
  document.getElementById('doc-name').focus();
}

function closeDocModal(){
  document.getElementById('doc-modal-overlay').classList.remove('open');
  activeDocWeek = null;
}

function renderWeekDocs(week){
  const container = document.getElementById(`week-docs-${week}`);
  if(!container) return;
  const docs = weekDocuments[week] || [];

  container.innerHTML = docs.map((doc, index) => `
    <div class="week-doc">
      <a class="week-doc-link" href="${escapeAttr(doc.url)}" target="_blank" rel="noopener noreferrer" title="${escapeAttr(doc.name)} (${DOC_TYPE_LABELS[doc.type]})">
        <span class="doc-icon ${doc.type}">${DOC_TYPE_ICONS[doc.type]}</span>
        <span class="doc-name">${escapeHtml(doc.name)}</span>
      </a>
      <button class="doc-remove" type="button" data-week="${week}" data-index="${index}">Borrar</button>
    </div>
  `).join('');

  container.querySelectorAll('.doc-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const w = btn.dataset.week;
      const idx = parseInt(btn.dataset.index, 10);
      const doc = weekDocuments[w][idx];
      const ok = confirm(`¿Borrar el documento "${doc.name}"? Esta acción no se puede deshacer.`);
      if(!ok) return;
      weekDocuments[w].splice(idx, 1);
      saveDocuments();
      renderWeekDocs(w);
    });
  });
}

function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str){
  return escapeHtml(str).replace(/"/g, '&quot;');
}
