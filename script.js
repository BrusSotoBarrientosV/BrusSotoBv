/* ------------------------------------------------------------------
   MiCurso — interacciones
   - Navegación lateral entre vistas
   - Acordeón de unidades (chevron)
   - Selección de semanas con modal y marcado de progreso
   - Cálculo dinámico del progreso general
------------------------------------------------------------------- */

const TOTAL_WEEKS = 16;

document.addEventListener('DOMContentLoaded', () => {
  initSidebarNav();
  initUnitAccordions();
  initWeekBoxes();
  initModal();
  initLogout();
  updateProgress();
});

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
    };

    header.addEventListener('click', toggle);
  });
}

/* ---------------- SEMANAS ---------------- */
function initWeekBoxes(){
  document.querySelectorAll('.week-box').forEach(box => {
    box.addEventListener('click', (e) => {
      e.stopPropagation();
      openWeekModal(box);
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
