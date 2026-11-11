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
const groups = Array.from({length:8}, (_, i) => i + 1);
const wib = date => new Date(date.getTime() + 7 * 3600000).toISOString().slice(0,16);
const format = new Intl.NumberFormat('id-ID', {maximumFractionDigits:2});
let unsubscribe;
let busy = false;

for (const group of groups) fields.usrah.add(new Option('Usrah ' + group, group));

function showPanel() {
  const active = location.hash === '#rekap' ? 'rekap' : 'formulir';
  for (const link of document.querySelectorAll('.switcher a')) {
    const id = link.hash.slice(1);
    el(id).hidden = id !== active;
    if (id === active) link.setAttribute('aria-current', 'page');
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
  records.sort((a,b) => b.waktu.toMillis() - a.waktu.toMillis());
  for (const record of records) {
    const {usrah, sesi, waktu, penilai, kamar, piket, kompak, akun} = record;
    totals[usrah-1].sum += kamar + piket + kompak;
    totals[usrah-1].count++;
    row(detail, [wib(waktu.toDate()).replace('T',' '),usrah,sesi,penilai,kamar,piket,kompak,akun.split('@')[0]]);
  }
  const average = item => item.count ? item.sum / (3 * item.count) : -1;
  totals.sort((a,b) => average(b) - average(a));
  const ranking = el('ranking');
  ranking.replaceChildren();
  let rank = 0;
  totals.forEach((item,index) => {
    if (!index || average(totals[index-1]) !== average(item)) rank = index + 1;
    row(ranking,[item.count ? rank : '—','Usrah ' + item.usrah,item.count + '/33',item.count ? format.format(average(item)) : '—']);
  });
}

onAuthStateChanged(auth, user => {
  unsubscribe?.();
  el('isi').hidden = true;
  el('ranking').replaceChildren();
  el('rincian').replaceChildren();
  if (!accounts.includes(user?.email)) {
    el('status').textContent = 'Silakan masuk menggunakan akun penginput lomba.';
    return;
  }
  el('isi').hidden = false;
  if (updatePeriod()) fields.waktu.value = wib(new Date());
  unsubscribe = onSnapshot(scores, {includeMetadataChanges:true}, snapshot => {
    render(snapshot.docs.map(item => item.data()));
    el('rekapStatus').textContent = snapshot.metadata.fromCache ? 'Menunggu sinkronisasi dengan server…' :
      snapshot.empty ? 'Belum ada penilaian.' : snapshot.size + ' pemeriksaan tercatat.';
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
  const usrah = Number(fields.usrah.value);
  const sesi = Number(fields.sesi.value);
  const ref = doc(scores,[local.slice(8,10),usrah,sesi].join('-'));
  const record = {usrah,sesi,waktu,penilai:fields.penilai.value,akun:auth.currentUser.email,disimpan:serverTimestamp()};
  for (const key of ['kamar','piket','kompak']) record[key] = Number(fields[key].value);
  busy = true;
  button.disabled = true;
  message.textContent = 'Menyimpan…';
  try {
    await runTransaction(db, async transaction => {
      if ((await transaction.get(ref)).exists()) throw new Error('sesi-terisi');
      transaction.set(ref,record);
    });
    message.textContent = 'Nilai Usrah ' + usrah + ' untuk pemeriksaan ke-' + sesi + ' tersimpan.';
    for (const key of ['kamar','piket','kompak']) fields[key].value = '';
  } catch (error) {
    message.textContent = error.message === 'sesi-terisi' ? 'Pemeriksaan ini sudah tercatat. Lihat rincian di rekap.' :
      'Nilai belum tersimpan. Periksa waktu pemeriksaan, koneksi, dan akses Firebase.';
  } finally {
    busy = false;
    updatePeriod();
  }
});
setInterval(() => { if (!el('isi').hidden) updatePeriod(); }, 30000);
