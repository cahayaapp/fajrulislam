import {schemas} from './form-schema.js';
export const studentName = d => d.profile?.studentName || d.registration?.studentName || 'Nama belum diisi';
export const hasAnswer = v => Array.isArray(v) ? v.some(hasAnswer) : v !== undefined && v !== null && String(v).trim() !== '';
export function completeness(d,key){const fields=schemas[key].filter(f=>f.required);return {filled:fields.filter(f=>hasAnswer(d[key]?.[f.name])).length,total:fields.length};}
export function displayAnswer(f,v){if(!hasAnswer(v))return 'Belum diisi';const labels=new Map((f.options||[]).map(o=>Array.isArray(o)?o:[o,o]));return(Array.isArray(v)?v:[v]).map(x=>labels.get(x)??String(x)).join(', ');}
