import { DATA } from './data.js';
import { renderOverview, sortRanking } from './overview.js';
import { selectStudent, goBackToGeneral } from './studentDetail.js';
import { openActivityView, goBackFromActivity } from './activityView.js';
import { setSortDirection, setActiveExpandedUnit } from './state.js';

// Inicializar estado global (para que las funciones onclick puedan acceder)
window.DATA = DATA; // opcional, si alguna función necesita acceso global (aunque no debería)
window.sortDirection = -1;
window.activeExpandedUnit = null;

// Exponer funciones que se llaman desde HTML (onclick)
window.sortRanking = sortRanking;
window.selectStudent = selectStudent;
window.goBack = goBackToGeneral;
window.openActivityView = openActivityView;
window.goBackFromActivity = goBackFromActivity;
window.setTab = (tab) => {
  if (tab === 'general') {
    if (document.getElementById('actView').classList.contains('show')) goBackFromActivity();
    else if (window.currentStudent) goBackToGeneral();
  }
};

// También exponemos las del sidebar ya asignadas en sidebar.js (toggleAug, etc.)
// y las de overview (closeExpandedUnit, toggleUnitExpanded)

// Inicializar la UI
document.getElementById('grpBadge').textContent = DATA.grupo;
document.getElementById('hdrMid').textContent = DATA.colegio;

renderOverview();