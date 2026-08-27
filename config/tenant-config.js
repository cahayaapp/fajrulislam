/* CAHAYA APP WHITE-LABEL — SATU-SATUNYA FILE IDENTITAS & FIREBASE */
(function(){
  const defaults = {
    version: "2026.08-white-label-v3-finance-module",
    app: {
      name: "CAHAYA App",
      shortName: "CAHAYA",
      workspaceName: "CAHAYA Workspace",
      institutionName: "Pesantren Cahaya Fajrul Islam",
      institutionShortName: "Fajrul Islam",
      tagline: "Holistic Islamic School",
      academicYear: "2026/2027",
      domain: "cahayaapp.com",
      supportContact: "Admin Pesantren"
    },
    branding: {
      logo: "assets/logofi.png",
      logoAlt: "Logo Pesantren",
      favicon: "assets/cahaya-app/favicon.ico",
      appLogo: "assets/cahaya-app/logo-horizontal.png",
      appIcon: "assets/cahaya-app/logo-icon.png",
      pwaIcon192: "assets/cahaya-app/app-icon-v67-192.png",
      pwaIcon512: "assets/cahaya-app/app-icon-v67-512.png"
    },
    theme: {
      primary: "#2878ff",
      primaryDark: "#1557d5",
      secondary: "#f2b632",
      accent: "#f2b632",
      success: "#29c58d",
      danger: "#ff5f70"
    },
    terminology: {
      student: "Santri",
      parent: "Wali Santri",
      teacher: "Guru",
      mentor: "Naqib",
      class: "Kelas",
      room: "Kamar",
      group: "Usrah"
    },
    firebase: {
      apiKey: "AIzaSyB0Eza852WuQL2R8U-yHpVnM3o8NMxZolI",
      authDomain: "absensi-santri-fajrul-islam.firebaseapp.com",
      databaseURL: "https://absensi-santri-fajrul-islam-default-rtdb.firebaseio.com",
      projectId: "absensi-santri-fajrul-islam",
      storageBucket: "absensi-santri-fajrul-islam.firebasestorage.app",
      messagingSenderId: "739982369926",
      appId: "1:739982369926:web:7e5375c3ddbaf0584cdd07"
    },
    modules: {
      academic: true,
      tahfiz: true,
      nurturing: true,
      counseling: true,
      health: true,
      permits: true,
      finance: true,
      cashier: true,
      facilities: true,
      observer: true,
      assessment: true,
      media: true,
      chat: true,
      pkl: true,
      guestBook: true,
      itemDeposit: true,
      meetingMinutes: true,
      operationalManagement: true
    },
    bandwidth: {
      chatMessageLimit: 50,
      feedLimit: 20,
      reportDefaultDays: 31,
      masterCacheHours: 24,
      dashboardCacheMinutes: 5
    }
  };
  const deepMerge=(a,b)=>{const out={...a};Object.keys(b||{}).forEach(k=>{out[k]=(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k]))?deepMerge(a?.[k]||{},b[k]):b[k]});return out};
  let preview={};
  try{preview=JSON.parse(localStorage.getItem('cahayaTenantPreview')||'{}')}catch(_){preview={}}
  window.CAHAYA_CONFIG=deepMerge(defaults,window.CAHAYA_CONFIG||{});
  window.CAHAYA_CONFIG=deepMerge(window.CAHAYA_CONFIG,preview);
  window.CahayaTenant={defaults,deepMerge,get:()=>window.CAHAYA_CONFIG};
})();
