(function () {
  'use strict';

  const R = window.CahayaRoleSystemV2;
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem('cahayaCurrentUser') || '{}') || {};
  } catch {}

  const session = R.resolveSession(user, localStorage);
  const a = session.activeAssignment;
  const managerHome = R.managerHomeFor(a);
  if (session.activeRole !== 'MANAJER' || !managerHome.startsWith('home-manajer-pendidikan.html')) return;

  const name = user.label || user.nama || user.displayName || user.username || 'Manajer Pendidikan';
  const unit = a.unit === 'PUTRI' ? 'Putri' : 'Putra';
  const avatar = document.getElementById('managerProfileButton');
  avatar.textContent = String(name).trim().charAt(0).toUpperCase() || 'M';
  avatar.setAttribute('aria-label', `Buka profil ${name}`);
  avatar.onclick = () => {
    try {
      if (parent !== window && typeof parent.openAuthorizedMenu === 'function') {
        parent.openAuthorizedMenu('menu-profil');
        return;
      }
    } catch {}
    location.href = 'main-dashboard.html';
  };
  document.getElementById('greeting').textContent = `Assalamu’alaikum, ${name}`;
  document.getElementById('managerName').textContent = name;
  document.getElementById('scopeChip').textContent = `${unit} • Kepondokan`;
  document.getElementById('dateChip').textContent = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric'
  }).format(new Date());

  const quick = [
    ['◷', 'Kontrol Hari Ini', 'Pantau seluruh proses pendidikan hari ini', 'control', 'menu-kontrol-pendidikan'],
    ['▤', 'Capaian Materi', 'Pantau target dan realisasi materi', 'material', 'menu-materi-pembelajaran'],
    ['↗', 'Tindak Lanjut', 'Selesaikan temuan operasional pendidikan', 'followup', 'menu-tindak-akademik'],
    ['☾', 'Guru Mukim & Ibadah', 'Atur Guru Mukim dan catat keteladanan ibadah', 'worship', 'menu-absensi-ibadah-guru']
  ];
  const menu = [
    ['♙', 'Guru Pondok', 'Lihat personil pendidikan dalam scope Anda', 'teachers', 'menu-guru-pondok'],
    ['#', 'Progres Input Nilai', 'Pantau progres Parsial dan Final setiap Guru', 'scores', 'menu-nilai-manajer'],
    ['◇', 'Observasi Pembelajaran', 'Catat observasi pelaksanaan pembelajaran', 'observation', 'menu-observasi-pembelajaran'],
    ['↶', 'Riwayat Temuan', 'Lihat temuan dan tindak lanjut sebelumnya', 'findings', 'menu-riwayat-temuan'],
    ['✦', 'Pembinaan Guru', 'Catat pembinaan operasional personil', 'coaching', 'menu-pembinaan-guru'],
    ['?', 'Panduan Kerja', 'Tugas, standar, dan batas kewenangan', 'guide', 'menu-panduan-kerja']
  ];

  function render(host, rows, primary) {
    document.getElementById(host).innerHTML = rows.map(x => `<button class="me-card ${primary ? 'primary' : ''}" data-view="${x[3]}" data-menu="${x[4]}"><span class="me-icon">${x[0]}</span><b>${x[1]}</b><small>${x[2]}</small><em>Buka →</em></button>`).join('');
  }

  render('quickGrid', quick, true);
  render('menuGrid', menu, false);
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-view]');
    if (!b) return;
    const route = b.dataset.view === 'worship'
      ? 'pendidikan/absensi-ibadah-guru.html?v=232'
      : `manajer/pendidikan-v2.html?v=232&view=${encodeURIComponent(b.dataset.view)}`;
    try {
      if (parent !== window && typeof parent.loadPage === 'function') {
        parent.loadPage(route, parent.document.getElementById(b.dataset.menu));
        return;
      }
    } catch {}
    location.href = route;
  });
})();
