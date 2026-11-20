// Phone-based accounts use an internal Firebase email identifier, not an email inbox.
// This identifies an account; it does not verify ownership of the phone number.
const PHONE_DOMAIN = 'phone.psb.cahayaapp.invalid';
export function normalizePhone(value) {
  let number = String(value ?? '').trim().replace(/[\s()+-]/g, '');
  if (number.startsWith('62')) number = '0' + number.slice(2);
  if (!/^08\d{8,12}$/.test(number)) throw new Error('Gunakan nomor HP yang valid, format 08… atau +62….');
  return number;
}
export function phoneFromAuthEmail(email) {
  const match = String(email ?? '').toLowerCase().match(/^([0-9]+)@phone\.psb\.cahayaapp\.invalid$/);
  return match && /^08\d{8,12}$/.test(match[1]) ? match[1] : null;
}
export function loginIdentity(value) {
  const input = String(value ?? '').trim();
  if (!input) throw new Error('Masukkan email atau nomor HP terlebih dahulu.');
  if (input.includes('@')) {
    if (input.toLowerCase().endsWith('@' + PHONE_DOMAIN)) throw new Error('Masukkan nomor HP Anda, bukan alamat internal akun.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) throw new Error('Periksa kembali alamat email.');
    return {type: 'email', email: input.toLowerCase(), phone: null};
  }
  const phone = normalizePhone(input);
  return {type: 'phone', email: `${phone}@${PHONE_DOMAIN}`, phone};
}
export function accountIdentity(application) {
  return phoneFromAuthEmail(application?.email) || application?.email || application?.phone || '';
}
