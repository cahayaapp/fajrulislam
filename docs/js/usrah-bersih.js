import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {getAuth, onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import {collection, doc, getFirestore, onSnapshot, runTransaction, serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

import {standings} from './usrah-ranking.mjs';

const app = initializeApp(window.CAHAYA_CONFIG.firebase);
const auth = getAuth(app);
const db = getFirestore(app);
const publicRanking = doc(db, 'usrah_bersih_202611', 'rekap');
const scores = collection(publicRanking, 'sesi');
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
  const sums = groups.map(() => 0);
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
    nilai.forEach((score,index) => { sums[index] += score; });
    row(detail, [when, criteria[kriteria], penilai, ...nilai, akun.split('@')[0]]);
  }
  el('arsip').hidden = !archive.rows.length;
  const summary = {sessions, sums};
  const ranking = el('ranking');
  ranking.replaceChildren();
  for (const item of standings(summary)) {
    row(ranking,[item.rank ?? '—','Usrah ' + item.usrah,sessions + '/33',item.average === null ? '—' : format.format(item.average)]);
  }
  return summary;
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
    const summary = render(snapshot.docs.map(item => item.data()));
    const {sessions} = summary;
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
      const summary = (await transaction.get(publicRanking)).data() ?? {sessions:0, sums:groups.map(() => 0)};
      transaction.set(ref,record);
      transaction.set(publicRanking,{sessions:summary.sessions+1,
        sums:summary.sums.map((sum,i) => sum+nilai[i]),lastSession:ref.id});
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
