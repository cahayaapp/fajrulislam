import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const exportDir=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(exportDir,'..');
const source=(file)=>path.join(root,file);
const readJson=(file)=>JSON.parse(fs.readFileSync(source(file),'utf8'));
const masterContext={window:{}};
vm.runInNewContext(fs.readFileSync(source('config/master-data.js'),'utf8'),masterContext,{filename:'config/master-data.js'});
const master=masterContext.window.CAHAYA_MASTER_DATA;
const schedule=readJson('data/jadwal-pelajaran-awal-2026-2027.json');
const calendar=readJson('data/kalender-pendidikan-2026-2027.json');

const norm=(value)=>String(value??'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'');
const slug=(value)=>String(value??'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const hash=(value)=>crypto.createHash('sha1').update(String(value)).digest('hex').slice(0,12);
const write=(name,value)=>fs.writeFileSync(path.join(exportDir,name),JSON.stringify(value,null,2)+'\n');
const classScope=(name)=>/^PKBM\b/i.test(name)?'pkbm':'kepondokan';
const classUnit=(name)=>/putri/i.test(name)?'putri':/putra/i.test(name)?'putra':'mixed-or-unspecified';

const classes=Object.entries(master.santriByClass).map(([name,names])=>({
  legacySource:'config/master-data.js#CAHAYA_MASTER_DATA.santriByClass',
  legacyKey:`class:${slug(name)}`,
  originalName:name,
  scope:classScope(name),
  unit:classUnit(name),
  studentCount:names.length
}));
const classKeyByName=new Map(classes.map(row=>[row.originalName,row.legacyKey]));

const studentMap=new Map();
for(const [className,names] of Object.entries(master.santriByClass)){
  for(const originalName of names){
    const exactKey=String(originalName).trim();
    if(!studentMap.has(exactKey)) studentMap.set(exactKey,{
      legacySource:'config/master-data.js#CAHAYA_MASTER_DATA.santriByClass',
      legacyKey:`student:${slug(exactKey)}:${hash(exactKey)}`,
      originalName:exactKey,
      normalizedNameKey:norm(exactKey),
      classMemberships:[]
    });
    studentMap.get(exactKey).classMemberships.push({
      classLegacyKey:classKeyByName.get(className),
      originalClassName:className,
      scope:classScope(className)
    });
  }
}
const students=[...studentMap.values()].sort((a,b)=>a.originalName.localeCompare(b.originalName,'id'));

const pkbmTeacherByCode=new Map((master.pkbmTeachers||[]).map(row=>[String(row.code).toUpperCase(),row]));
const teacherScheduleScopes=new Map();
for(const row of schedule){
  const code=String(row.guruKode||'').toUpperCase();
  if(!teacherScheduleScopes.has(code))teacherScheduleScopes.set(code,new Set());
  teacherScheduleScopes.get(code).add(classScope(row.kelas));
}
const teachers=(master.teachers||[]).map(codeValue=>{
  const code=String(codeValue).toUpperCase(),detail=pkbmTeacherByCode.get(code),scopes=[...(teacherScheduleScopes.get(code)||[])];
  if(detail&&!scopes.includes('pkbm'))scopes.push('pkbm');
  return {
    legacySource:detail?['config/master-data.js#CAHAYA_MASTER_DATA.teachers','config/master-data.js#CAHAYA_MASTER_DATA.pkbmTeachers']:['config/master-data.js#CAHAYA_MASTER_DATA.teachers'],
    legacyId:code,
    originalName:detail?.name||code,
    username:detail?.username||null,
    aliases:detail?.aliases||[],
    scopes:scopes.length?scopes:['unresolved']
  };
}).sort((a,b)=>a.legacyId.localeCompare(b.legacyId));

const scheduleSubjects=new Map();
for(const row of schedule){
  const key=norm(row.mapel);
  if(!scheduleSubjects.has(key))scheduleSubjects.set(key,{names:new Set(),scopes:new Set()});
  scheduleSubjects.get(key).names.add(row.mapel);
  scheduleSubjects.get(key).scopes.add(classScope(row.kelas));
}
const masterSubjects=(master.subjects||[]).map(name=>{
  const usage=scheduleSubjects.get(norm(name));
  return {
    legacySource:'config/master-data.js#CAHAYA_MASTER_DATA.subjects',
    legacyKey:`subject:${slug(name)}`,
    originalName:name,
    scheduleNames:usage?[...usage.names]:[],
    scopes:usage?[...usage.scopes]:[]
  };
});
const masterSubjectKeys=new Set(masterSubjects.map(row=>norm(row.originalName)));
const scheduleOnlySubjects=[];
for(const [normalizedKey,usage] of scheduleSubjects){
  if(masterSubjectKeys.has(normalizedKey))continue;
  const names=[...usage.names];
  const name=names[0];
  scheduleOnlySubjects.push({
    legacySource:'data/jadwal-pelajaran-awal-2026-2027.json#mapel',
    legacyKey:`subject:${slug(name)}`,
    originalName:name,
    scheduleNames:names,
    scopes:[...usage.scopes],
    masterStatus:'missing-from-master-subjects'
  });
}
const subjects=[...masterSubjects,...scheduleOnlySubjects].sort((a,b)=>a.originalName.localeCompare(b.originalName,'id'));

const normalizedSchedules=schedule.map(row=>({
  legacySource:'data/jadwal-pelajaran-awal-2026-2027.json',
  legacyId:row.id,
  active:row.aktif!==false,
  academicYear:row.tahunAjaran||null,
  scope:classScope(row.kelas),
  unit:row.unit||classUnit(row.kelas).toUpperCase(),
  classLegacyKey:classKeyByName.get(row.kelas)||null,
  originalClassName:row.kelas||null,
  classNumber:row.nomorKelas||null,
  subjectLegacyKey:`subject:${slug(row.mapel)}`,
  originalSubjectName:row.mapel||null,
  teacherLegacyId:row.guruKode||null,
  dayNumber:row.hari,
  originalDayLabel:row.hariLabel||null,
  startTime:row.jamMulai||null,
  endTime:row.jamSelesai||null,
  originalTimeLabel:row.waktuLabel||null,
  session:row.sesi||null,
  scheduleType:row.jenis||null,
  order:row.urutan??null,
  originalRecord:row
}));

const assignmentMap=new Map();
for(const row of normalizedSchedules){
  const identity=[row.teacherLegacyId,row.originalSubjectName,row.originalClassName].join('|');
  if(!assignmentMap.has(identity))assignmentMap.set(identity,{
    legacySource:'derived from data/jadwal-pelajaran-awal-2026-2027.json',
    legacyKey:`assignment:${hash(identity)}`,
    teacherLegacyId:row.teacherLegacyId,
    subjectLegacyKey:row.subjectLegacyKey,
    originalSubjectName:row.originalSubjectName,
    classLegacyKey:row.classLegacyKey,
    originalClassName:row.originalClassName,
    scope:row.scope,
    scheduleLegacyIds:[]
  });
  assignmentMap.get(identity).scheduleLegacyIds.push(row.legacyId);
}
const assignments=[...assignmentMap.values()].sort((a,b)=>a.legacyKey.localeCompare(b.legacyKey));

const academicCalendar=calendar.map(row=>({
  legacySource:'data/kalender-pendidikan-2026-2027.json',
  legacyId:row.id,
  originalName:row.title||null,
  date:row.date||null,
  startDate:row.startDate||row.date||null,
  endDate:row.endDate||row.date||null,
  eventType:row.type||null,
  sourceTag:row.source||null,
  originalRecord:row
}));

write('teachers.json',teachers);
write('students.json',students);
write('classes.json',classes);
write('subjects.json',subjects);
write('teaching-assignments.json',assignments);
write('schedules.json',normalizedSchedules);
write('academic-calendar.json',academicCalendar);
write('material-targets.json',[]);

console.log(JSON.stringify({teachers:teachers.length,students:students.length,classes:classes.length,subjects:subjects.length,teachingAssignments:assignments.length,schedules:normalizedSchedules.length,academicCalendar:academicCalendar.length,materialTargets:0},null,2));
