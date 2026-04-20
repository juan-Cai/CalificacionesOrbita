import { DATA, AVATAR_COLORS, UNIT_COLORS } from './data.js';
import { allA, graded, studentAvg, getInitials, getBgAndColor, getGradeColor } from './utils.js';
import { setCurrentStudent, setCurrentUnitIndex, setPreviousView, setCurrentActivityRef } from './state.js';
import { selectStudent } from './studentDetail.js';
import { openActivityView } from './activityView.js';

export function renderSidebar() {
  const sorted = [...DATA.estudiantes].sort((a,b) => (studentAvg(b)||0) - (studentAvg(a)||0));
  document.getElementById('stuCount').textContent = sorted.length;
  const list = document.getElementById('stuList');
  list.innerHTML = '';
  
  sorted.forEach((s, i) => {
    const sa = studentAvg(s);
    const { bg, color } = getBgAndColor(sa);
    const acts = allA(s);
    const assigned = acts.filter(a => a.estado === 'asignada');
    const done = assigned.filter(a => a.nota !== null);
    const el = document.createElement('div');
    el.className = 'stu-item';
    el.dataset.id = s.id;
    el.innerHTML = `
      <div class="s-av" style="background:${AVATAR_COLORS[i % AVATAR_COLORS.length]}">${getInitials(s.nombre)}</div>
      <div class="stu-info">
        <div class="stu-name">${s.nombre}</div>
        <div class="stu-sub">${done.length}/${assigned.length} entregadas</div>
      </div>
      <div class="gpill" style="background:${bg};color:${color}">${sa ?? '—'}</div>
    `;
    el.onclick = () => selectStudent(s.id);
    list.appendChild(el);
  });

  // Renderizar lista de actividades en el sidebar (progreso por actividad)
  const templateStudent = DATA.estudiantes[0];
  let totalActivities = 0;
  const actList = document.getElementById('actSbList');
  actList.innerHTML = '';
  
  templateStudent.unidades.forEach((unit, uIdx) => {
    totalActivities += unit.sesiones.flatMap(s => s.actividades).length;
    const group = document.createElement('div');
    group.className = 'aug';
    let sesHtml = '';
    unit.sesiones.forEach(ses => {
      const actHtml = ses.actividades.map(act => {
        const doneCount = DATA.estudiantes.filter(s => {
          const foundSes = s.unidades[uIdx]?.sesiones.find(ss => ss.nombre === ses.nombre);
          const foundAct = foundSes?.actividades.find(a => a.nombre === act.nombre);
          return foundAct && foundAct.nota !== null && foundAct.estado === 'asignada';
        }).length;
        const assignedCount = DATA.estudiantes.filter(s => {
          const foundSes = s.unidades[uIdx]?.sesiones.find(ss => ss.nombre === ses.nombre);
          const foundAct = foundSes?.actividades.find(a => a.nombre === act.nombre);
          return foundAct && foundAct.estado === 'asignada';
        }).length;
        const pct = assignedCount ? Math.round(doneCount / assignedCount * 100) : 0;
        const dotColor = pct >= 80 ? 'var(--green)' : (pct >= 50 ? 'var(--warn)' : 'var(--red)');
        return `
          <div class="act-sb-item" onclick="openActivityView(${uIdx},'${ses.nombre.replace(/'/g, "\\'")}','${act.nombre.replace(/'/g, "\\'")}','general')" title="Ver actividad: ${act.nombre}">
            <div class="act-sb-dot" style="background:${dotColor}"></div>
            <div class="act-sb-name">${act.nombre}</div>
            <div class="act-sb-prog">
              <div class="act-sb-bar"><div class="act-sb-fill" style="width:${pct}%;background:${dotColor}"></div></div>
              <span class="act-sb-pct">${doneCount}/${assignedCount}</span>
            </div>
          </div>
        `;
      }).join('');
      sesHtml += `<div class="ses-grp"><div class="ses-nm">${ses.nombre}</div>${actHtml}</div>`;
    });
    group.innerHTML = `
      <div class="aug-hdr" onclick="toggleAug(this)">
        <span style="color:${UNIT_COLORS[uIdx]};font-size:10px">●</span>
        U${uIdx+1} · ${unit.nombre}
        <span class="aug-chev">▾</span>
      </div>
      <div class="aug-body">${sesHtml}</div>
    `;
    actList.appendChild(group);
  });
  document.getElementById('actCount').textContent = totalActivities;
}

export function filterStudents() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  document.querySelectorAll('.stu-item').forEach(el => {
    const name = el.querySelector('.stu-name').textContent.toLowerCase();
    el.style.display = name.includes(query) ? '' : 'none';
  });
}

// Función global para toggle de secciones del sidebar (se asigna a window)
window.toggleAug = function(header) {
  const body = header.nextElementSibling;
  const isOpen = body.classList.toggle('is-open');
  header.classList.toggle('is-open', isOpen);
};