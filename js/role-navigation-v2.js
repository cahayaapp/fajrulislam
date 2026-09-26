(function(root,factory){
  const cjs=typeof module==='object'&&module.exports;
  const api=factory(cjs?require('./role-system-v2.js'):root.CahayaRoleSystemV2,cjs?require('./role-route-registry-v2.js'):root.CahayaRoleRoutesV2);
  if(cjs)module.exports=api;if(root)root.CahayaRoleNavigationV2=api;
})(typeof window!=='undefined'?window:globalThis,function(R,ROUTES){
  'use strict';
  function parse(route){
    if(typeof route!=='string'||/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(route)||/[\\\u0000-\u001f]/.test(route))return null;
    try{
      const u=new URL(route,'https://local.invalid/');
      const p=decodeURIComponent(u.pathname).replace(/^\//,'');
      if(p.includes('..')||p.includes('%')||p.includes('\\'))return null;
      return {path:p.startsWith('docs/')?p.slice(5):p,params:u.searchParams};
    }catch{return null}
  }
  const deny=reason=>({ok:false,reason});
  function canAccessRoute(session,route,menuId){
    if(session?.mode!=='canonical')return {ok:true,reason:'LEGACY_COMPATIBILITY'};
    const parsed=parse(route);if(!parsed)return deny('INVALID_ROUTE');
    const e=ROUTES?.[parsed.path];if(!e)return deny('UNREGISTERED_ROUTE');
    const role=session.activeRole,a=session.activeAssignment;
    if(!R.exactRole(role))return deny('INVALID_ACTIVE_ROLE');
    if(e.policy==='shell')return {ok:true,reason:'SHELL_ONLY'};
    if(menuId&&(!e.menus.includes(menuId)||!R.can(role,menuId,a)))return deny('PERMISSION_DENIED');
    // Local utilities confer no operational authority. Wali is deliberately excluded.
    if(e.policy==='internal-utility')return role!=='WALI_SANTRI'&&e.menus.some(m=>R.can(role,m,a))?{ok:true,reason:'INTERNAL_LOCAL_UTILITY'}:deny('PERMISSION_DENIED');
    if(e.policy==='workspace')return {ok:true,reason:'LOCAL_WORKSPACE'};
    if(e.policy==='legacy-home')return deny('LEGACY_HOME_DISABLED');
    if(e.policy==='manager-area-home')return role==='MANAJER'&&R.managerHomeFor(a).startsWith(parsed.path)&&['PUTRA','PUTRI','ALL'].includes(a.unit)?{ok:true,reason:'MANAGER_AREA_HOME'}:deny('ROLE_HOME_MISMATCH');
    if(R.validateAssignment(role,a).length)return deny('INCOMPLETE_ASSIGNMENT');
    if(parsed.path==='profil.html')return R.can(role,'menu-profil',a)?{ok:true,reason:'OWN_PROFILE'}:deny('PERMISSION_DENIED');
    if(e.policy==='home')return e.roles.includes(role)?{ok:true,reason:'APPROVED_HOME'}:deny('ROLE_HOME_MISMATCH');
    if(e.policy==='counselor-v2')return role==='KONSELOR'&&['PEMULA','MADYA'].includes(a.level)&&['PUTRA','PUTRI'].includes(a.unit)?{ok:true,reason:'COUNSELOR_V2_ASSIGNMENT'}:deny('PERMISSION_DENIED');
    if(e.policy==='legacy-mentor-disabled')return deny('LEGACY_MENTOR_WORKFLOW_DISABLED');
    if(e.policy==='legacy-permit-decision-disabled')return deny('SUPERVISOR_LAYANAN_DECISION_ONLY');
    if(e.policy==='mentor-usrah-v2')return role==='MENTOR_USRAH'&&a.usrahIds.length?{ok:true,reason:'ASSIGNED_USRAH_MENTORING'}:deny('PERMISSION_DENIED');
    if(e.policy==='holiday-journal-monitor-v1'){
      if(role==='MENTOR_USRAH'&&a.usrahIds.length)return {ok:true,reason:'ASSIGNED_USRAH_HOLIDAY_JOURNAL'};
      if(role==='SUPERVISOR'&&['PUTRA','PUTRI','ALL'].includes(a.unit)&&(a.supervisedRoles||[]).some(item=>['NAQIB','NAQIBAH','MENTOR_USRAH'].includes(item)))return {ok:true,reason:'SUPERVISOR_CHARACTER_HOLIDAY_JOURNAL'};
      return deny('PERMISSION_DENIED');
    }
    if(parsed.path==='guru/lapor-pelanggaran.html'&&role==='LAYANAN_KEBERSIHAN')return {ok:true,reason:'LAYANAN_REPORT_ONLY'};
    if(role==='LAYANAN_KEBERSIHAN'&&['PKL/jurnal-pkl.html','PKL/buku-tamu.html','PKL/penitipan-barang.html'].includes(parsed.path))return {ok:true,reason:'LAYANAN_SCOPED_OPERATION'};
    if(e.policy==='dapur-v2')return role==='DAPUR'&&['logbook','checklist','history'].includes(parsed.params.get('view')||'logbook')?{ok:true,reason:'DAPUR_OPERATIONAL_WORKSPACE'}:deny('PERMISSION_DENIED');
    if(e.policy==='dapur-material-v2'){
      const view=parsed.params.get('view'),expected=`menu-dapur-${view}`;
      if(!['stock','menu'].includes(view)||menuId&&menuId!==expected&&menuId!=='menu-dashboard-operasional')return deny('INVALID_DAPUR_VIEW');
      if(role==='DAPUR')return {ok:true,reason:view==='menu'?'DAPUR_MENU_READER':'DAPUR_STOCK_EDITOR'};
      if(role==='DIREKTUR'&&a.unit==='ALL')return {ok:true,reason:'DAPUR_MATERIAL_READER'};
      if(role==='SUPERVISOR'&&a.supervisedRoles?.includes('DAPUR')&&(!a.divisionIds?.length||a.divisionIds.includes('DAPUR')))return {ok:true,reason:view==='menu'?'SUPERVISOR_DAPUR_MENU_EDITOR':'DAPUR_MATERIAL_READER'};
      return deny('PERMISSION_DENIED');
    }
    if(e.policy==='dapur-procurement-v2'){
      const view=parsed.params.get('view'),expected=view==='shopping'?'menu-dapur-shopping':view==='received'?'menu-dapur-received':view==='report'?'menu-dapur-procurement-report':'';
      if(role==='DAPUR'&&['shopping','received'].includes(view)&&(!menuId||menuId===expected))return{ok:true,reason:'DAPUR_PROCUREMENT'};
      if(role==='SUPERVISOR'&&view==='report'&&(!menuId||menuId===expected)&&a.supervisedRoles?.includes('DAPUR')&&(!a.divisionIds?.length||a.divisionIds.includes('DAPUR')))return{ok:true,reason:'SUPERVISOR_DAPUR_REPORT'};
      return deny('PERMISSION_DENIED');
    }
    if(e.policy==='media-v2'||e.policy==='media-url-v2')return role==='MEDIA'?{ok:true,reason:'MEDIA_OPERATIONAL_WORKSPACE'}:deny('PERMISSION_DENIED');
    if(e.policy==='media-operations-v2'){
      const view=parsed.params.get('view'),expected=view==='gallery'?'menu-gallery-dokumentasi':view==='content'?'menu-manajemen-konten':'';
      if(!expected||menuId&&menuId!==expected)return deny('INVALID_MEDIA_VIEW');
      if(role==='MEDIA')return {ok:true,reason:'MEDIA_CONTENT_EDITOR'};
      if(role==='DIREKTUR'&&a.unit==='ALL')return {ok:true,reason:'MEDIA_CONTENT_READER'};
      if(role==='SUPERVISOR'&&a.supervisedRoles?.includes('MEDIA')&&(!a.divisionIds?.length||a.divisionIds.includes('MEDIA')))return {ok:true,reason:'MEDIA_CONTENT_READER'};
      return deny('PERMISSION_DENIED');
    }
    if(e.policy==='manager-education-v2'){
      if(role==='MANAJER'&&R.isEducationManager(a)&&['PUTRA','PUTRI'].includes(a.unit))return {ok:true,reason:'MANAGER_EDUCATION_SCOPE'};
      if(parsed.params.get('view')==='scores'&&!menuId&&((role==='SUPERVISOR'&&R.canManageTahsinLevels(role,a))||(role==='DIREKTUR'&&a.unit==='ALL')))return {ok:true,reason:'EDUCATION_SCORE_REVIEW'};
      return deny('PERMISSION_DENIED');
    }
    if(e.policy==='tahsin-placement-v2')return R.canManageTahsinLevels(role,a)?{ok:true,reason:'TAHSIN_EDUCATION_SCOPE'}:deny('PERMISSION_DENIED');
    if(e.policy==='supervisor-education-v2')return role==='SUPERVISOR'&&R.canManageTahsinLevels(role,a)?{ok:true,reason:'SUPERVISOR_EDUCATION_SCOPE'}:deny('PERMISSION_DENIED');
    if(e.policy==='education-report-v2')return ((role==='SUPERVISOR'||role==='MANAJER')&&R.canManageTahsinLevels(role,a))?{ok:true,reason:'EDUCATION_REPORT_SCOPE'}:deny('PERMISSION_DENIED');
    if(e.policy==='manager-character-v2')return role==='MANAJER'&&R.isCharacterManager(a)?{ok:true,reason:'MANAGER_CHARACTER_SCOPE'}:deny('PERMISSION_DENIED');
    if(e.policy==='weekly-kpi-guru-v2'){
      if(role==='GURU_PONDOK')return {ok:true,reason:'OWN_WEEKLY_GURU_KPI'};
      if(role==='MANAJER'&&R.isEducationManager(a)&&['PUTRA','PUTRI'].includes(a.unit))return {ok:true,reason:'MANAGER_EDUCATION_WEEKLY_KPI'};
      if(role==='SUPERVISOR'&&R.canManageTahsinLevels(role,a))return {ok:true,reason:'SUPERVISOR_EDUCATION_KPI_READ'};
      if(role==='DIREKTUR'&&a.unit==='ALL')return {ok:true,reason:'DIRECTOR_KPI_READ'};
      return deny('PERMISSION_DENIED');
    }
    if(e.policy==='weekly-kpi-naqib-v2'){
      if(['NAQIB','NAQIBAH'].includes(role))return {ok:true,reason:'OWN_WEEKLY_NAQIB_KPI'};
      if(role==='MANAJER'&&R.isCharacterManager(a)&&['PUTRA','PUTRI'].includes(a.unit))return {ok:true,reason:'MANAGER_CHARACTER_WEEKLY_KPI'};
      if(role==='SUPERVISOR'&&['PUTRA','PUTRI','ALL'].includes(a.unit)&&(a.supervisedRoles||[]).some(item=>['NAQIB','NAQIBAH'].includes(item)))return {ok:true,reason:'SUPERVISOR_CHARACTER_KPI_READ'};
      if(role==='DIREKTUR'&&a.unit==='ALL')return {ok:true,reason:'DIRECTOR_KPI_READ'};
      return deny('PERMISSION_DENIED');
    }
    if(e.policy==='supervisor-layanan-v2'){
      const fromRoles=[...new Set((a.supervisedRoles||[]).map(owned=>R.ROLE_DIVISIONS[owned]).filter(Boolean))];
      const areas=a.divisionIds.length?fromRoles.filter(area=>a.divisionIds.includes(area)):fromRoles;
      return role==='SUPERVISOR'&&['PUTRA','PUTRI','ALL'].includes(a.unit)&&areas.includes('LAYANAN_KEBERSIHAN')?{ok:true,reason:'SUPERVISOR_LAYANAN_SCOPE'}:deny('PERMISSION_DENIED');
    }
    if(e.policy==='supervisor-v2'){
      if(role!=='SUPERVISOR'||!['PUTRA','PUTRI','ALL'].includes(a.unit))return deny('PERMISSION_DENIED');
      const fromRoles=[...new Set(a.supervisedRoles.map(owned=>R.ROLE_DIVISIONS[owned]).filter(Boolean))];
      const areas=a.divisionIds.length?fromRoles.filter(area=>a.divisionIds.includes(area)):fromRoles;
      const requested=String(parsed.params.get('area')||'').trim().toUpperCase().replace(/[\s/-]+/g,'_');
      return areas.length&&(!requested||areas.includes(requested))?{ok:true,reason:'SUPERVISOR_V2_SCOPE'}:deny('OUTSIDE_SUPERVISOR_ASSIGNMENT');
    }
    if(e.policy==='director-v2')return role==='DIREKTUR'&&a.unit==='ALL'?{ok:true,reason:'DIRECTOR_V2'}:deny('PERMISSION_DENIED');
    if(e.policy==='guru-mukim-v2')return role==='MANAJER'&&R.isEducationManager(a)&&['PUTRA','PUTRI'].includes(a.unit)||role==='DIREKTUR'&&a.unit==='ALL'?{ok:true,reason:'GURU_MUKIM_SCOPE'}:deny('PERMISSION_DENIED');
    if(e.policy==='higher-case-response-v2'){
      if(role==='DIREKTUR'&&a.unit==='ALL')return {ok:true,reason:'DIRECTOR_CASE_RESPONSE'};
      if(role==='SUPERVISOR'&&['PUTRA','PUTRI','ALL'].includes(a.unit)&&a.supervisedRoles.includes('KONSELOR'))return {ok:true,reason:'SUPERVISOR_CASE_RESPONSE'};
      return deny('PERMISSION_DENIED');
    }
    if(e.policy==='wali')return role==='WALI_SANTRI'?{ok:true,reason:'EXISTING_CHILD_PORTAL'}:deny('PERMISSION_DENIED');
    if(!e.menus.some(m=>R.can(role,m,a)))return deny('PERMISSION_DENIED');
    // Reviewed role-wide legacy tools have no unit adapter. Never grant a
    // narrowed assignment access to their unfiltered records.
    const legacyTools={KESEHATAN:['kesehatan/jurnal.html','kesehatan/pemeriksaan.html','kesehatan/perizinan-uks.html','kesehatan/stokobat.html'],SARPRAS:['sarpras/jurnal.html','sarpras/checklist.html','sarpras/tindak-lanjut.html'],LAYANAN_KEBERSIHAN:['PKL/buku-tamu.html','PKL/penitipan-barang.html']};
    if(legacyTools[role]?.includes(parsed.path))return (!a.unit||a.unit==='ALL')&&!a.usrahIds.length&&!a.studentIds.length&&!a.divisionIds.length&&!a.programDomain?{ok:true,reason:'ROLE_WIDE_LEGACY_TOOL'}:deny('ASSIGNMENT_ADAPTER_REQUIRED');
    if(e.policy==='unreviewed')return deny('ASSIGNMENT_ADAPTER_REQUIRED');
    if(['counselor-queue-pending','naqib-assessment-pending'].includes(e.policy)&&role!=='DIREKTUR')return deny('ASSIGNMENT_ADAPTER_REQUIRED');
    if(e.policy==='division'){
      const divisions=['pendidikan','pembinaan','kesehatan','sarpras','keamanan','layanan','keuangan','dapur','media'];
      if(!divisions.includes(parsed.params.get('division')))return deny('INVALID_DIVISION');
    }
    // Preserve only reviewed existing Director routes, never arbitrary admin URLs.
    if(role==='DIREKTUR'&&a.unit==='ALL'&&!a.programDomain&&!a.studentIds.length&&!a.usrahIds.length&&!a.divisionIds.length)return {ok:true,reason:'EXISTING_DIRECTOR_POLICY'};
    if((e.policy==='teacher'||e.policy==='naqib-report')&&role==='GURU_PONDOK'&&!a.unit&&!a.studentIds.length&&!a.usrahIds.length)return {ok:true,reason:'EXISTING_TEACHER_FILTER'};
    if(e.policy==='program-attendance'&&['NAQIB','NAQIBAH'].includes(role)&&!a.studentIds.length)return {ok:true,reason:'UNIT_PROGRAM_ADAPTER'};
    if(e.policy==='naqib-program-today'&&['NAQIB','NAQIBAH'].includes(role)&&!a.studentIds.length)return {ok:true,reason:'UNIT_PROGRAM_TODAY'};
    if(e.policy==='naqib-journal'&&a.usrahIds.length)return deny('ASSIGNMENT_ADAPTER_REQUIRED');
    if(['naqib-initiative','naqib-report','naqib-journal','naqib-teladan','naqib-assessment','naqib-self-assessment','naqib-discipline','naqib-kpi'].includes(e.policy)&&['NAQIB','NAQIBAH'].includes(role)&&!a.studentIds.length)return {ok:true,reason:'UNIT_NAQIB_ADAPTER'};
    if(e.policy==='counselor-queue'&&role==='KONSELOR'&&!a.studentIds.length)return {ok:true,reason:'UNIT_COUNSELOR_ADAPTER'};
    if(e.policy==='mentor-usrah'&&role==='MENTOR_USRAH'&&!a.studentIds.length)return {ok:true,reason:'ASSIGNED_USRAH_ADAPTER'};
    return deny('ASSIGNMENT_ADAPTER_REQUIRED');
  }
  // expectedUrl is retained for old callers but is NOT route authority.
  function decision(session,menuId,url,expectedUrl){return canAccessRoute(session,url,menuId)}
  return Object.freeze({decision,canAccessRoute,parse,routes:ROUTES});
});
