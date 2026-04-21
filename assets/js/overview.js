import { DATA, AVATAR_COLORS, UNIT_COLORS } from './data.js';
import { allA, graded, avg, studentAvg, unitAvg, unitCompletion, getGradeColor, getBarColor, getBgAndColor, getInitials, animateNumber } from './utils.js';
import { setActiveExpandedUnit, setSortDirection, sortDirection } from './state.js';
import { selectStudent } from './studentDetail.js';
import { openActivityView } from './activityView.js';

export function renderOverview() {
  renderKPIs();
  renderUnitCards();
  renderHistogram();
  renderRanking();
}

function renderKPIs() {
  const avgsList = DATA.estudiantes.map(studentAvg).filter(v => v !== null);
  const groupAvg = avg(avgsList) || 0;
  const allActs = DATA.estudiantes.flatMap(s => allA(s));
  const assigned = allActs.filter(a => a.estado === 'asignada');
  const done = assigned.filter(a => a.nota !== null);
  const rate = assigned.length ? Math.round(done.length / assigned.length * 100) : 0;
  const pending = assigned.filter(a => a.nota === null).length;
  const risk = DATA.estudiantes.filter(s => { const a = studentAvg(s); return a !== null && a < 60; }).length;

  const kpis = [
    { label: 'Promedio General', value: groupAvg, suffix: '', subtitle: 'Sobre 100 puntos', icon: '📊', badge: null },
    { label: 'Estudiantes', value: DATA.estudiantes.length, suffix: '', subtitle: 'En el grupo', icon: '👥', badge: null },
    { label: 'Tasa de Entrega', value: rate, suffix: '%', subtitle: `${done.length} actividades entregadas de ${assigned.length}`, icon: '✅', badge: rate > 80 ? 'up' : 'dn' },
    { label: 'Actividades Pendientes', value: pending, suffix: '', subtitle: 'Actividades sin entregar', icon: '⏳', badge: pending > 0 ? 'dn' : 'up' }
  ];

  const grid = document.getElementById('kpiGrid');
  grid.innerHTML = '';
  kpis.forEach(k => {
    const el = document.createElement('div');
    el.className = `kpi ${k.badge === 'up' ? 'ck' : (k.badge === 'dn' ? 'cw' : '')}`;
    el.innerHTML = `
      <div class="kpi-ico">${k.icon}</div>
      <div class="kpi-lbl">${k.label}</div>
      <div class="kpi-val" id="kv_${k.label.replace(/\s/g,'_')}">0${k.suffix}</div>
      <div class="kpi-sub">${k.subtitle}</div>
      ${k.badge ? `<div class="kpi-badge ${k.badge}">${k.badge === 'up' ? '↑ Bien' : '↓ Atención'}</div>` : ''}
    `;
    grid.appendChild(el);
    animateNumber(el.querySelector('.kpi-val'), k.value, k.suffix);
  });
}

function renderUnitCards() {
  const row = document.getElementById('unitsRow');
  row.innerHTML = '';
  DATA.estudiantes[0].unidades.forEach((unit, idx) => {
    const unitAvgs = DATA.estudiantes.map(s => unitAvg(s.unidades[idx])).filter(v => v !== null);
    const unitAvgVal = avg(unitAvgs) || 0;
    const completions = DATA.estudiantes.map(s => unitCompletion(s.unidades[idx]));
    const avgCompletion = Math.round(completions.reduce((a,b) => a+b, 0) / completions.length);
    const r = 19;
    const circ = 2 * Math.PI * r;
    const card = document.createElement('div');
    card.className = 'uc';
    card.dataset.ui = idx;
    card.innerHTML = `
      <div class="uc-top">
        <div>
          <div class="uc-badge" style="color:${UNIT_COLORS[idx]}">Unidad ${idx+1}</div>
          <div class="uc-name">${unit.nombre}</div>
        </div>
        <div class="uc-stats">
          <div class="uc-nums">
            <div class="uc-num"><div class="uc-nl">Sesiones</div><div class="uc-nv">${unit.sesiones.length}</div></div>
            <div class="uc-num"><div class="uc-nl">Actividades</div><div class="uc-nv">${unit.sesiones.flatMap(s => s.actividades).length}</div></div>
          </div>
          <div class="ring-container">
            <div class="uc-nl">Promedio</div>
            <div class="ring-w">
              <svg class="ring-svg" width="120" height="120" viewBox="0 0 46 46">
                <circle class="rbg" cx="23" cy="23" r="${r}"/>
                <circle class="rfg" cx="23" cy="23" r="${r}" stroke="${UNIT_COLORS[idx]}" stroke-dasharray="${circ}" stroke-dashoffset="${circ}" id="ur${idx}"/>
              </svg>
              <div class="ring-lbl">${avgCompletion}%</div>
            </div>
          </div>
        </div>
      </div>
      <div class="uc-foot" id="ucf${idx}">▾ Ver sesiones y notas</div>
    `;
    card.onclick = () => toggleUnitExpanded(idx);
    row.appendChild(card);
    setTimeout(() => {
      const circle = document.getElementById(`ur${idx}`);
      if (circle) circle.style.strokeDashoffset = circ * (1 - avgCompletion/100);
    }, 300 + idx*80);
  });
}

function toggleUnitExpanded(uIdx) {
  const current = window.activeExpandedUnit;
  if (current === uIdx) {
    closeExpandedUnit();
    return;
  }
  window.activeExpandedUnit = uIdx;
  document.querySelectorAll('.uc').forEach((c, i) => {
    c.classList.toggle('active', i === uIdx);
    const foot = document.getElementById(`ucf${i}`);
    if (foot) foot.innerHTML = i === uIdx ? '▴ Cerrar' : '▾ Ver sesiones y notas';
  });
  renderExpandedUnitPanel(uIdx);
  const wrap = document.getElementById('uexpWrap');
  wrap.classList.add('is-open');
  setTimeout(() => wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
}

function closeExpandedUnit() {
  window.activeExpandedUnit = null;
  document.querySelectorAll('.uc').forEach((c, i) => {
    c.classList.remove('active');
    const foot = document.getElementById(`ucf${i}`);
    if (foot) foot.innerHTML = '▾ Ver sesiones y notas';
  });
  document.getElementById('uexpWrap').classList.remove('is-open');
}

function renderExpandedUnitPanel(uIdx) {
  const unit = DATA.estudiantes[0].unidades[uIdx];
  const panel = document.getElementById('uexpPanel');
  panel.style.borderTop = `3px solid ${UNIT_COLORS[uIdx]}`;
  panel.innerHTML = `
    <div class="uexp-top" style="background:${UNIT_COLORS[uIdx]}0D">
      <div class="uexp-top-l">
        <div class="uexp-dot" style="background:${UNIT_COLORS[uIdx]}">📖</div>
        <div>
          <div class="uexp-title">Unidad ${uIdx+1} · ${unit.nombre}</div>
          <div class="uexp-sub">${unit.sesiones.length} sesiones · ${unit.sesiones.flatMap(s => s.actividades).length} actividades · ${DATA.estudiantes.length} estudiantes</div>
        </div>
      </div>
      <button class="uexp-close" onclick="closeExpandedUnit()">✕</button>
    </div>
    <div id="expSesCon"></div>
  `;
  const container = document.getElementById('expSesCon');
  unit.sesiones.forEach((ses, sIdx) => {
    const sesGrades = DATA.estudiantes.flatMap(s => graded(s.unidades[uIdx].sesiones[sIdx].actividades).map(a => a.nota));
    const sesAvg = avg(sesGrades);
    const sesBlock = document.createElement('div');
    sesBlock.className = 'exp-ses';
    sesBlock.innerHTML = `
      <div class="exp-ses-hdr" onclick="this.closest('.exp-ses').classList.toggle('is-open')">
        <div class="exp-ses-ico">📚</div>
        <div class="exp-ses-info">
          <div class="exp-ses-name">${ses.nombre}</div>
          <div class="exp-ses-meta">${ses.actividades.length} actividades · ${ses.actividades.filter(a => a.estado === 'asignada').length} asignadas</div>
        </div>
        <div class="exp-ses-avgbox"><span class="exp-ses-avglbl">Promedio: </span><span class="exp-ses-avgval" style="color:${getGradeColor(sesAvg)}">${sesAvg ?? '—'}</span></div>
        <span class="exp-ses-chev">▾</span>
      </div>
      <div class="exp-ses-body" id="esb_${uIdx}_${sIdx}"></div>
    `;
    container.appendChild(sesBlock);
    const body = sesBlock.querySelector('.exp-ses-body');
    // Actualizar la creación de actividades en overview.js
// Dentro de renderExpandedUnitPanel, reemplazar la parte de actividades:

    ses.actividades.forEach((act, aIdx) => {
      const studentGrades = DATA.estudiantes.map((s, sI) => {
        const foundSes = s.unidades[uIdx].sesiones[sIdx];
        const foundAct = foundSes?.actividades[aIdx];
        return { name: s.nombre, nota: foundAct?.nota ?? null, estado: foundAct?.estado ?? 'no_asignada', studentId: s.id, idx: sI };
      });
      const gradedActs = studentGrades.filter(g => g.nota !== null && g.estado === 'asignada');
      const actAvgVal = avg(gradedActs.map(g => g.nota));
      const doneCount = gradedActs.length;
      const assignedCount = studentGrades.filter(g => g.estado === 'asignada').length;
      
      const actDiv = document.createElement('div');
      actDiv.className = 'exp-act';
      
      // Crear encabezado con doble acción
      actDiv.innerHTML = `
        <div class="exp-act-hdr">
          <button class="exp-act-toggle" data-tooltip="Ver notas de estudiantes">
            <span class="chevron">▶</span>
          </button>
          <div class="exp-act-info">
            <span class="exp-act-marker" style="color:${act.estado === 'asignada' ? getGradeColor(actAvgVal) : 'var(--tm)'}"></span>
            <div class="exp-act-name">${act.nombre}</div>
          </div>
          <div class="exp-act-stats">
            <div class="exp-act-avgbox">
              <span class="exp-act-avglbl">Promedio</span>
              <span class="exp-act-avgval" style="color:${getGradeColor(actAvgVal)}">${actAvgVal ?? '—'}</span>
            </div>
            <div class="exp-act-done">
              ${doneCount}/${assignedCount}
            </div>
            <button class="exp-act-detail-btn" data-view-detail>
              ► Ver detalle
            </button>
          </div>
        </div>
        <div class="exp-act-body"></div>
      `;
      
      // Crear lista de estudiantes
      const studentList = document.createElement('div');
      studentList.className = 'sgc-row';
      
      studentGrades.forEach((g) => {
        const studentItem = document.createElement('div');
        studentItem.className = 'sgc';
        
        let statusText = '';
        let statusClass = '';
        let gradeText = '—';
        let fillPercent = 0;
        let fillColor = 'var(--border)';
        let gradeColor = 'var(--tm)';
        
        if (g.estado !== 'asignada') {
          statusText = 'No asignada';
          statusClass = 'na';
          gradeText = '—';
          fillPercent = 0;
          fillColor = 'var(--border)';
          gradeColor = 'var(--tm)';
        } else if (g.nota === null) {
          statusText = 'Pendiente';
          statusClass = 'pending';
          gradeText = '—';
          fillPercent = 0;
          fillColor = 'var(--warn)';
          gradeColor = 'var(--warn)';
        } else {
          statusText = 'Entregado';
          statusClass = 'completed';
          gradeText = g.nota;
          fillPercent = g.nota;
          const { color } = getBgAndColor(g.nota);
          fillColor = color;
          gradeColor = color;
        }
        
        const avatarColor = AVATAR_COLORS[g.idx % AVATAR_COLORS.length];
        const initials = getInitials(g.name);
        
        studentItem.setAttribute('data-status', statusClass);
        studentItem.innerHTML = `
          <div class="sgc-student">
            <div class="sgc-avatar" style="background: ${avatarColor}">${initials}</div>
            <span title="${g.name}">${g.name}</span>
          </div>
          <div class="sgc-progress">
            <div class="sgc-bar-bg">
              <div class="sgc-bar-fill" style="background: ${fillColor}; width: ${fillPercent}%"></div>
            </div>
            <div class="sgc-grade" style="color: ${gradeColor}">${gradeText}</div>
          </div>
          <div class="sgc-status ${statusClass}">${statusText}</div>
        `;
        
        studentList.appendChild(studentItem);
      });
      
      actDiv.querySelector('.exp-act-body').appendChild(studentList);
      
      // Event listeners
      const toggleBtn = actDiv.querySelector('.exp-act-toggle');
      const infoArea = actDiv.querySelector('.exp-act-info');
      const detailBtn = actDiv.querySelector('.exp-act-detail-btn');
      
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        actDiv.classList.toggle('is-open');
      });
      
      infoArea.addEventListener('click', (e) => {
        e.stopPropagation();
        actDiv.classList.toggle('is-open');
      });
      
      detailBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openActivityView(uIdx, ses.nombre, act.nombre, 'general');
      });
      
      body.appendChild(actDiv);
    });
  });
}

function renderHistogram() {
  const allGrades = DATA.estudiantes.flatMap(s => graded(allA(s)).map(a => a.nota));
  const ranges = [
    { label: '0–50', min: 0, max: 50, color: 'var(--red)' },
    { label: '51–60', min: 51, max: 60, color: '#FA8C36' },
    { label: '61–70', min: 61, max: 70, color: 'var(--warn)' },
    { label: '71–80', min: 71, max: 80, color: '#84CC16' },
    { label: '81–90', min: 81, max: 90, color: 'var(--green)' },
    { label: '91–100', min: 91, max: 100, color: 'var(--teal)' }
  ];
  const counts = ranges.map(r => allGrades.filter(g => g >= r.min && g <= r.max).length);
  const maxCount = Math.max(...counts, 1);
  const MAX_PX = 100;
  const chart = document.getElementById('hChart');
  chart.innerHTML = '<div class="haxis"></div>';
  ranges.forEach((r, i) => {
    const barHeight = Math.max(Math.round(counts[i] / maxCount * MAX_PX), 3);
    const col = document.createElement('div');
    col.className = 'hcol';
    col.innerHTML = `
      <div class="hbar-wrap"><div class="hbar" id="hbar_${i}" style="background:${r.color};height:3px" title="${counts[i]} en ${r.label}"></div></div>
      <div class="hcnt">${counts[i]}</div>
      <div class="hrng">${r.label}</div>
    `;
    chart.appendChild(col);
    setTimeout(() => {
      const bar = document.getElementById(`hbar_${i}`);
      if (bar) bar.style.height = barHeight + 'px';
    }, 450 + i*60);
  });
}

export function sortRanking() {
  window.sortDirection *= -1;
  renderRanking();
}

function renderRanking() {
  const sorted = [...DATA.estudiantes].sort((a,b) => ((studentAvg(b)||0) - (studentAvg(a)||0)) * window.sortDirection);
  const body = document.getElementById('rankBody');
  body.innerHTML = '';
  const medals = ['🥇','🥈','🥉'];
  sorted.forEach((s, i) => {
    const sa = studentAvg(s);
    const unitAverages = s.unidades.map(u => unitAvg(u));
    const allActs = allA(s);
    const assigned = allActs.filter(a => a.estado === 'asignada');
    const done = assigned.filter(a => a.nota !== null);
    const studentIndex = DATA.estudiantes.findIndex(st => st.id === s.id);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-size:14px;text-align:center">${i < 3 ? medals[i] : `<span style="font-size:11px;font-weight:700;color:var(--tm)">${i+1}</span>`}</td>
      <td><div class="td-stu"><div class="s-av" style="background:${AVATAR_COLORS[studentIndex % AVATAR_COLORS.length]};width:26px;height:26px;font-size:10px">${getInitials(s.nombre)}</div><span class="td-name">${s.nombre}</span></div></td>
      <td><span class="td-num" style="color:${getGradeColor(sa)}">${sa ?? '—'}</span></td>
      ${unitAverages.map(u => `<td><div style="display:flex;align-items:center;gap:6px"><div class="mini-bw"><div class="mini-b" style="width:${u??0}%;background:${getBarColor(u)}"></div></div><span style="font-size:12px;font-weight:700;color:${getGradeColor(u)}">${u ?? '—'}</span></div></td>`).join('')}
      <td><span style="font-size:12px;font-weight:600;color:var(--tb)">${done.length}/${assigned.length}</span></td>
    `;
    tr.onclick = () => selectStudent(s.id);
    body.appendChild(tr);
  });
}

// Exponer funciones globales necesarias para onclick
window.closeExpandedUnit = closeExpandedUnit;
window.toggleUnitExpanded = toggleUnitExpanded; // aunque no se usa directamente