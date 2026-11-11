import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {getAuth, onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import {collection, doc, getFirestore, onSnapshot, runTransaction, serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const app = initializeApp(window.CAHAYA_CONFIG.firebase);
const auth = getAuth(app);
const db = getFirestore(app, 'usrah-bersih');
const scores = collection(db, 'penilaian');
const accounts = ['multazam@cahayaapp.id', 'bennyarizona@cahayaapp.id', 'donisetiawan@cahayaapp.id'];
const el = id => document.getElementById(id);
const form = el('form');
const fields = form.elements;
const button = form.querySelector('button');
const message = form.querySelector('output');
const groups = Array.from({length:6}, (_, i) => i + 1);
const wib = date => new Date(date.getTime() + 7 * 3600000).toISOString().slice(0,16);
const format = new Intl.NumberFormat('id-ID', {maximumFractionDigits:2});
let unsubscribe;
let busy = false;

const criteria = {kamar:'Kamar', piket:'Tempat piket', kompak:'Kekompakan anggota'};

function showPanel() {
  const links = Array.from(document.querySelectorAll('.switcher a'));
  const active = links.find(link => link.hash === location.hash) || links[0];
  for (const link of links) {
    const id = link.hash.slice(1);
    el(id).hidden = link !== active;
    if (link === active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}
showPanel();
window.addEventListener('hashchange', showPanel);

function updatePeriod() {
  const now = wib(new Date());
  const open = now >= '2026-11-11T00:00' && now <= '2026-11-21T23:59';
  button.disabled = busy || !open;
  el('status').textContent = open ? '' : 'Form dibuka pada 11–21 November 2026 (WIB). Rekap tetap dapat dilihat.';
  return open;
}

function row(body, cells) {
  const tr = body.insertRow();
  for (const value of cells) tr.insertCell().textContent = value;
}

function render(records) {
  const totals = groups.map(usrah => ({usrah, count:0, sum:0}));
  const detail = el('rincian');
  detail.replaceChildren();
  const archive = el('nilaiLama');
  archive.replaceChildren();
  let sessions = 0;
  records.sort((a,b) => b.waktu.toMillis() - a.waktu.toMillis());
  for (const record of records) {
    const {waktu, penilai, nilai, kriteria, akun} = record;
    const when = wib(waktu.toDate()).replace('T',' ');
    if (!nilai) {
      row(archive, [when, record.usrah, record.sesi, penilai, record.kamar, record.piket, record.kompak]);
      continue;
    }
    sessions++;
    totals.forEach((item,index) => {
      item.sum += nilai[index];
      item.count++;
    });
    row(detail, [when, criteria[kriteria], penilai, ...nilai, akun.split('@')[0]]);
  }
  el('arsip').hidden = !archive.rows.length;
  const average = item => item.count ? item.sum / item.count : -1;
  totals.sort((a,b) => average(b) - average(a));
  const ranking = el('ranking');
  ranking.replaceChildren();
  let rank = 0;
  totals.forEach((item,index) => {
    if (!index || average(totals[index-1]) !== average(item)) rank = index + 1;
    row(ranking,[item.count ? rank : '—','Usrah ' + item.usrah,item.count + '/33',item.count ? format.format(average(item)) : '—']);
  });
  return sessions;
}

onAuthStateChanged(auth, user => {
  unsubscribe?.();
  el('isi').hidden = true;
  el('ranking').replaceChildren();
  el('rincian').replaceChildren();
  el('nilaiLama').replaceChildren();
  el('arsip').hidden = true;
  if (!accounts.includes(user?.email)) {
    el('status').textContent = 'Silakan masuk menggunakan akun penginput lomba.';
    return;
  }
  el('isi').hidden = false;
  if (updatePeriod()) fields.waktu.value = wib(new Date());
  unsubscribe = onSnapshot(scores, {includeMetadataChanges:true}, snapshot => {
    const sessions = render(snapshot.docs.map(item => item.data()));
    el('rekapStatus').textContent = snapshot.metadata.fromCache ? 'Menunggu sinkronisasi dengan server…' :
      sessions ? sessions + ' dari 33 sesi tercatat.' : 'Belum ada sesi penilaian.';
  }, () => { el('rekapStatus').textContent = 'Rekap gagal dimuat. Periksa koneksi dan akses Firebase, lalu muat ulang halaman.'; });
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (busy || !updatePeriod()) return;
  const local = fields.waktu.value;
  const waktu = new Date(local + ':00+07:00');
  if (waktu > new Date()) {
    message.textContent = 'Waktu pemeriksaan belum tiba.';
    return;
  }
  const kriteria = fields.kriteria.value;
  const nilai = groups.map(group => fields['usrah' + group].valueAsNumber);
  if (!form.reportValidity()) return;
  const ref = doc(scores, local.slice(0,10) + '-' + kriteria);
  const record = {kriteria,nilai,waktu,penilai:fields.penilai.value,akun:auth.currentUser.email,disimpan:serverTimestamp()};
  busy = true;
  for (const field of fields) field.disabled = true;
  message.textContent = 'Menyimpan…';
  try {
    await runTransaction(db, async transaction => {
      if ((await transaction.get(ref)).exists()) throw new Error('sesi-terisi');
      transaction.set(ref,record);
    });
    message.textContent = 'Sesi ' + criteria[kriteria] + ' untuk Usrah 1–6 tersimpan.';
    for (const group of groups) fields['usrah' + group].value = '';
    fields.kriteria.value = '';
  } catch (error) {
    message.textContent = error.message === 'sesi-terisi' ? 'Sesi untuk kriteria dan tanggal ini sudah tercatat. Lihat rincian di rekap.' :
      'Nilai belum tersimpan. Periksa waktu pemeriksaan, koneksi, dan akses Firebase.';
  } finally {
    for (const field of fields) field.disabled = false;
    busy = false;
    updatePeriod();
  }
});
setInterval(() => { if (!el('isi').hidden) updatePeriod(); }, 30000);
