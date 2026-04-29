import { DATA, AVATAR_COLORS, UNIT_COLORS } from './data.js';
import { avg, getGradeColor, getBarColor, getBgAndColor, getInitials } from './utils.js';
import { currentStudent, setPreviousView, setCurrentActivityRef, previousView } from './state.js';
import { selectStudent } from './studentDetail.js';
import { goBackToGeneral } from './studentDetail.js';

function getUnitColor(idx) {
  return UNIT_COLORS[idx % UNIT_COLORS.length];
}

export function openActivityView(uIdx, sesNom, actNom, fromView) {
  setPreviousView(fromView);
  setCurrentActivityRef({ uIdx, sesNom, actNom });
  
  const studentGrades = DATA.estudiantes.map((s, sI) => {
    const ses = s.unidades[uIdx]?.sesiones.find(ss => ss.nombre === sesNom);
    const act = ses?.actividades.find(a => a.nombre === actNom);
    return { student: s, studentId: s.id, index: sI, nota: act?.nota ?? null, estado: act?.estado ?? 'no_asignada' };
  });
  const gradedList = studentGrades.filter(g => g.nota !== null && g.estado === 'asignada');
  const actAvg = avg(gradedList.map(g => g.nota));
  const assignedCount = studentGrades.filter(g => g.estado === 'asignada').length;
  const doneCount = gradedList.length;
  const maxGrade = gradedList.length ? Math.max(...gradedList.map(g => g.nota)) : null;
  const minGrade = gradedList.length ? Math.min(...gradedList.map(g => g.nota)) : null;
  const unitName = DATA.estudiantes[0].unidades[uIdx].nombre;
  const heroColor = getUnitColor(uIdx);

  document.getElementById('ovView').classList.add('hide');
  document.getElementById('detailView').classList.remove('show');
  document.getElementById('actView').classList.add('show');
  document.getElementById('actBackBtn').textContent = (fromView === 'student' && currentStudent) ? `← Volver a ${currentStudent.nombre}` : '← Volver a Vista General';
  document.getElementById('pgTitle').textContent = actNom;

  // Hero
  document.getElementById('actHero').innerHTML = `
    <div class="act-hero-ico" style="background:${heroColor}1A">${getActIcon(actNom)}</div>
    <div class="act-hero-info">
      <div class="act-hero-meta">
        <span class="act-hero-badge" style="background:${heroColor}1A;color:${heroColor}">Unidad ${uIdx+1} · ${unitName}</span>
        <span style="font-size:10px;color:var(--tm)">›</span>
        <span style="font-size:11px;color:var(--ts);font-weight:600">${sesNom}</span>
      </div>
      <div class="act-hero-title">${actNom}</div>
      <div class="act-hero-sub">${assignedCount} estudiantes asignados · ${doneCount} han entregado</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0;align-items:flex-end">
      <div style="font-size:38px;font-weight:800;font-family:'Manrope',sans-serif;color:${getGradeColor(actAvg)};line-height:1">${actAvg ?? '—'}</div>
      <div style="font-size:10px;color:var(--ts);font-weight:600;text-transform:uppercase;letter-spacing:.5px">Promedio</div>
    </div>
  `;

  // KPIs pequeños
  document.getElementById('actKpis').innerHTML = `
    <div class="act-kpi"><div class="act-kpi-ico">📤</div><div class="act-kpi-val">${doneCount}/${assignedCount}</div><div class="act-kpi-lbl">Entregas</div></div>
    <div class="act-kpi"><div class="act-kpi-ico">📊</div><div class="act-kpi-val" style="color:${getGradeColor(actAvg)}">${actAvg ?? '—'}</div><div class="act-kpi-lbl">Promedio</div></div>
    <div class="act-kpi"><div class="act-kpi-ico">🏆</div><div class="act-kpi-val" style="color:var(--teal-d)">${maxGrade ?? '—'}</div><div class="act-kpi-lbl">Nota más alta</div></div>
    <div class="act-kpi"><div class="act-kpi-ico">📉</div><div class="act-kpi-val" style="color:${minGrade && minGrade < 60 ? 'var(--red)' : 'var(--warn)'}">${minGrade ?? '—'}</div><div class="act-kpi-lbl">Nota más baja</div></div>
  `;

  // Tabla de estudiantes ordenados por nota
  const sortedGrades = [...studentGrades].sort((a,b) => (b.nota || 0) - (a.nota || 0));
  const tableRows = sortedGrades.map(g => {
    const { bg, color } = getBgAndColor(g.nota);
    let statusClass = '', statusText = '';
    if (g.estado !== 'asignada') { statusClass = 'st-u'; statusText = 'No asignada'; }
    else if (g.nota === null) { statusClass = 'st-p'; statusText = 'Pendiente'; }
    else { statusClass = 'st-a'; statusText = 'Entregada'; }
    return `
      <div class="act-stu-row" onclick="selectStudent(${g.studentId})" title="Ver estudiante">
        <div class="s-av" style="background:${AVATAR_COLORS[g.index % AVATAR_COLORS.length]};width:26px;height:26px;font-size:10px;flex-shrink:0">${getInitials(g.student.nombre)}</div>
        <span class="act-stu-name">${g.student.nombre}</span>
        <div class="act-stu-bar">
          <div class="act-stu-bw"><div class="act-stu-bf" data-t="${g.nota ?? 0}" style="width:0%;background:${getBarColor(g.nota)}"></div></div>
          <span class="act-stu-grade" style="color:${getGradeColor(g.nota)}">${g.nota ?? '—'}</span>
        </div>
        <span class="act-stu-status ${statusClass}">${statusText}</span>
      </div>
    `;
  }).join('');

  // Distribución de notas
  const ranges = [
    { label: '0–50', min: 0, max: 50, color: 'var(--red)' },
    { label: '51–60', min: 51, max: 60, color: '#FA8C36' },
    { label: '61–70', min: 61, max: 70, color: 'var(--warn)' },
    { label: '71–80', min: 71, max: 80, color: '#84CC16' },
    { label: '81–90', min: 81, max: 90, color: 'var(--green)' },
    { label: '91–100', min: 91, max: 100, color: 'var(--teal)' }
  ];
  const counts = ranges.map(r => gradedList.filter(g => g.nota >= r.min && g.nota <= r.max).length);
  const maxCount = Math.max(...counts, 1);
  const distRows = ranges.map((r, i) => `
    <div class="dist-row">
      <span class="dist-lbl">${r.label}</span>
      <div class="dist-bw"><div class="dist-bf" data-t="${Math.round(counts[i] / maxCount * 100)}" style="width:0%;background:${r.color}"></div></div>
      <span class="dist-cnt">${counts[i]}</span>
    </div>
  `).join('');

  const approved = gradedList.filter(g => g.nota >= 75).length;
  const risk = gradedList.filter(g => g.nota < 60).length;

  document.getElementById('actContent').innerHTML = `
    <div class="act-table-card">
      <div class="act-table-hdr">
        <div class="card-ttl">Notas por Estudiante</div>
        <div class="card-sub" style="margin:0">Ordenado por nota</div>
      </div>
      <div>${tableRows}</div>
    </div>
    <div class="act-dist-card">
      <div class="card-ttl">Distribución de Notas</div>
      <div class="card-sub">Esta actividad</div>
      <div class="dist-bars">${distRows}</div>
      ${gradedList.length ? `
        <div style="margin-top:16px;padding:12px;background:var(--bg);border-radius:var(--rs);border:1px solid var(--border)">
          <div style="font-size:11px;font-weight:700;color:var(--ts);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">Resumen</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
            <div style="text-align:center;padding:8px;background:var(--card);border-radius:var(--rs);border:1px solid var(--border)">
              <div style="font-size:18px;font-weight:800;font-family:'Manrope',sans-serif;color:var(--green)">${approved}</div>
              <div style="font-size:9px;color:var(--ts);font-weight:700;text-transform:uppercase;margin-top:2px">Aprobados</div>
            </div>
            <div style="text-align:center;padding:8px;background:var(--card);border-radius:var(--rs);border:1px solid var(--border)">
              <div style="font-size:18px;font-weight:800;font-family:'Manrope',sans-serif;color:var(--red)">${risk}</div>
              <div style="font-size:9px;color:var(--ts);font-weight:700;text-transform:uppercase;margin-top:2px">En riesgo</div>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;

  setTimeout(() => {
    document.querySelectorAll('.act-stu-bf[data-t]').forEach(bar => bar.style.width = bar.dataset.t + '%');
    document.querySelectorAll('.dist-bf[data-t]').forEach(bar => bar.style.width = bar.dataset.t + '%');
  }, 120);
}

export function goBackFromActivity() {
  document.getElementById('actView').classList.remove('show');
  if (previousView === 'student' && currentStudent) {
    document.getElementById('detailView').classList.add('show');
    document.getElementById('ovView').classList.add('hide');
    document.getElementById('pgTitle').textContent = currentStudent.nombre;
  } else {
    document.getElementById('ovView').classList.remove('hide');
    document.getElementById('pgTitle').textContent = 'Dashboard de Calificaciones';
  }
}

function getActIcon(name) {
  const n = name.toLowerCase();
  if (n.includes('quiz') || n.includes('evalua')) return '📝';
  if (n.includes('video')) return '🎬';
  if (n.includes('diseño') || n.includes('editorial')) return '🎨';
  if (n.includes('mapa')) return '🗺️';
  if (n.includes('diagnós')) return '🔎';
  if (n.includes('portafolio')) return '💼';
  if (n.includes('rúbrica')) return '📋';
  return '📄';
}