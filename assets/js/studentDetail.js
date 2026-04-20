import { DATA, AVATAR_COLORS } from './data.js';
import { allA, graded, avg, studentAvg, unitAvg, getGradeColor, getBarColor, getInitials, animateNumber } from './utils.js';
import { currentStudent, setCurrentStudent, setCurrentUnitIndex, currentUnitIndex, setPreviousView, setCurrentActivityRef } from './state.js';
import { openActivityView } from './activityView.js';

export function selectStudent(id) {
  const student = DATA.estudiantes.find(s => s.id === id);
  if (!student) return;
  setCurrentStudent(student);
  setCurrentUnitIndex(0);
  document.querySelectorAll('.stu-item').forEach(el => el.classList.toggle('on', parseInt(el.dataset.id) === id));
  document.getElementById('ovView').classList.add('hide');
  document.getElementById('detailView').classList.add('show');
  document.getElementById('actView').classList.remove('show');
  renderStudentHero();
  renderUnitTabs();
  renderSessions(0);
  document.getElementById('pgTitle').textContent = student.nombre;
}

export function goBackToGeneral() {
  setCurrentStudent(null);
  document.getElementById('ovView').classList.remove('hide');
  document.getElementById('detailView').classList.remove('show');
  document.getElementById('actView').classList.remove('show');
  document.querySelectorAll('.stu-item').forEach(el => el.classList.remove('on'));
  document.getElementById('pgTitle').textContent = 'Dashboard de Calificaciones';
}

function renderStudentHero() {
  const s = currentStudent;
  const sa = studentAvg(s) || 0;
  const allActs = allA(s);
  const assigned = allActs.filter(a => a.estado === 'asignada');
  const done = assigned.filter(a => a.nota !== null);
  const completion = assigned.length ? Math.round(done.length / assigned.length * 100) : 0;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const hero = document.getElementById('dHero');
  hero.innerHTML = `
    <div class="dav">${getInitials(s.nombre)}</div>
    <div class="d-info">
      <div class="d-name">${s.nombre}</div>
      <div class="d-meta">${DATA.grupo} · ${DATA.curso}</div>
      <div class="d-stats">
        <div><div class="dstat-v">${done.length}</div><div class="dstat-l">Entregadas</div></div>
        <div><div class="dstat-v">${assigned.length - done.length}</div><div class="dstat-l">Pendientes</div></div>
        <div><div class="dstat-v">${completion}%</div><div class="dstat-l">Completado</div></div>
      </div>
    </div>
    <div class="dring">
      <svg width="70" height="70" viewBox="0 0 70 70" style="transform:rotate(-90deg)">
        <circle cx="35" cy="35" r="${r}" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="5.5"/>
        <circle cx="35" cy="35" r="${r}" fill="none" stroke="white" stroke-width="5.5" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${circ}" id="dR"/>
      </svg>
      <div class="dring-lbl"><div class="dring-v">${sa}</div><div class="dring-t">Promedio</div></div>
    </div>
  `;
  setTimeout(() => {
    const circle = document.getElementById('dR');
    if (circle) circle.style.strokeDashoffset = circ * (1 - sa/100);
  }, 80);
}

function renderUnitTabs() {
  const container = document.getElementById('uTabs');
  container.innerHTML = '';
  currentStudent.unidades.forEach((unit, idx) => {
    const ua = unitAvg(unit);
    const btn = document.createElement('button');
    btn.className = `utab${idx === currentUnitIndex ? ' on' : ''}`;
    btn.innerHTML = `
      <div class="utab-n">Unidad ${idx+1}</div>
      <div class="utab-nm">${unit.nombre}</div>
      <div class="utab-g" style="color:${getGradeColor(ua)}">${ua ?? '—'}</div>
    `;
    btn.onclick = () => {
      setCurrentUnitIndex(idx);
      renderUnitTabs();
      renderSessions(idx);
    };
    container.appendChild(btn);
  });
}

function renderSessions(unitIdx) {
  const unit = currentStudent.unidades[unitIdx];
  const container = document.getElementById('sesCon');
  container.innerHTML = '';
  unit.sesiones.forEach((ses, sIdx) => {
    const doneActs = ses.actividades.filter(a => a.nota !== null && a.estado === 'asignada');
    const assignedActs = ses.actividades.filter(a => a.estado === 'asignada');
    const sesAvg = avg(doneActs.map(a => a.nota));
    const completion = assignedActs.length ? Math.round(doneActs.length / assignedActs.length * 100) : 0;
    const block = document.createElement('div');
    block.className = 'ses-blk';
    block.innerHTML = `
      <div class="ses-hdr" onclick="this.closest('.ses-blk').classList.toggle('is-open'); animateActBars(this.closest('.ses-blk'))">
        <div class="ses-ico">📚</div>
        <div style="flex:1"><div class="ses-name">${ses.nombre}</div><div class="ses-meta">${ses.actividades.length} actividades</div></div>
        <div class="ses-prog">
          <div class="ses-avg" style="color:${getGradeColor(sesAvg)}">${sesAvg ?? '—'}</div>
          <div class="pbar-w" style="width:70px"><div class="pbar" style="width:${completion}%;background:${getBarColor(sesAvg)}"></div></div>
        </div>
        <span class="ses-chev">▾</span>
      </div>
      <div class="acts-list">
        ${ses.actividades.map(act => `
          <div class="act-row" onclick="openActivityView(${unitIdx},'${ses.nombre.replace(/'/g, "\\'")}','${act.nombre.replace(/'/g, "\\'")}','student')">
            <span class="act-ico">${act.estado === 'asignada' ? (act.nota !== null ? '✅' : '⏳') : '○'}</span>
            <span class="act-name">${act.nombre}</span>
            <div class="act-bar-a">
              <div class="act-bar-bg"><div class="act-bar" data-t="${act.nota ?? 0}" style="width:0%;background:${getBarColor(act.nota)}"></div></div>
              <span class="act-grade" style="color:${getGradeColor(act.nota)}">${act.nota ?? '—'}</span>
            </div>
            <span class="act-status ${act.estado === 'asignada' ? (act.nota !== null ? 'st-a' : 'st-p') : 'st-u'}">${act.estado === 'asignada' ? (act.nota !== null ? 'Entregada' : 'Pendiente') : 'No asignada'}</span>
          </div>
        `).join('')}
      </div>
    `;
    container.appendChild(block);
    if (sIdx === 0) {
      setTimeout(() => {
        block.classList.add('is-open');
        animateActBars(block);
      }, 100);
    }
  });
}

function animateActBars(block) {
  setTimeout(() => {
    block.querySelectorAll('.act-bar[data-t]').forEach(bar => {
      bar.style.width = bar.dataset.t + '%';
    });
  }, 50);
}

// Exponer funciones globales
window.animateActBars = animateActBars;