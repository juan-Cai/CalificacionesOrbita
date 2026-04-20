// Funciones de cálculo y utilidades
export function allA(student) {
  return student.unidades.flatMap(u => u.sesiones.flatMap(s => s.actividades));
}

export function graded(acts) {
  return acts.filter(a => a.nota !== null && a.estado === 'asignada');
}

export function avg(arr) {
  return arr.length ? Math.round(arr.reduce((a,b) => a+b, 0) / arr.length) : null;
}

export function studentAvg(student) {
  return avg(graded(allA(student)).map(a => a.nota));
}

export function unitAvg(unit) {
  return avg(graded(unit.sesiones.flatMap(s => s.actividades)).map(a => a.nota));
}

export function unitCompletion(unit) {
  const acts = unit.sesiones.flatMap(s => s.actividades).filter(a => a.estado === 'asignada');
  const done = acts.filter(a => a.nota !== null);
  return acts.length ? Math.round(done.length / acts.length * 100) : 0;
}

// Colores según nota
export function getGradeColor(nota) {
  if (nota === null) return 'var(--tm)';
  if (nota >= 90) return 'var(--teal-d)';
  if (nota >= 75) return 'var(--green)';
  if (nota >= 60) return 'var(--warn)';
  return 'var(--red)';
}

export function getBarColor(nota) {
  if (nota === null) return 'var(--border)';
  if (nota >= 90) return 'var(--teal)';
  if (nota >= 75) return 'var(--green)';
  if (nota >= 60) return 'var(--warn)';
  return 'var(--red)';
}

export function getBgAndColor(nota) {
  if (nota === null) return { bg: 'var(--bg)', color: 'var(--tm)' };
  if (nota >= 90) return { bg: 'var(--teal-p)', color: 'var(--teal-d)' };
  if (nota >= 75) return { bg: 'var(--green-p)', color: 'var(--green)' };
  if (nota >= 60) return { bg: 'var(--warn-p)', color: 'var(--warn)' };
  return { bg: 'var(--red-p)', color: 'var(--red)' };
}

// Iniciales del nombre
export function getInitials(name) {
  return name.split(' ').slice(0,2).map(w => w[0]).join('');
}

// Animación de conteo
export function animateNumber(element, target, suffix = '', duration = 900) {
  const start = performance.now();
  function update(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - (1 - p) ** 3;
    element.textContent = Math.round(eased * target) + suffix;
    if (p < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}