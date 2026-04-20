// Estado mutable
export let currentStudent = null;
export let currentUnitIndex = 0;
export let activeExpandedUnit = null;
export let sortDirection = -1;  // -1 = descendente
export let currentActivityRef = null;
export let previousView = 'general'; // 'general', 'student'

// Funciones para modificar el estado (para mantener control)
export function setCurrentStudent(student) { currentStudent = student; }
export function setCurrentUnitIndex(idx) { currentUnitIndex = idx; }
export function setActiveExpandedUnit(idx) { activeExpandedUnit = idx; }
export function setSortDirection(dir) { sortDirection = dir; }
export function setCurrentActivityRef(ref) { currentActivityRef = ref; }
export function setPreviousView(view) { previousView = view; }