// Each roll call contributes at most one status per pupil to its time slot.
export function attendanceBoards(presensi,kind){
  const boards=new Map();
  for(const row of presensi?.sessions||[]){
    if(row.kind!==kind)continue;
    const parts=(row.context||'').split(' · ');
    const slot=row.slot??parts.find(part=>/^\d{1,2}:\d{2} WIB$/.test(part))??'';
    const session=row.sessionLabel??parts.find(part=>/^sesi\b/i.test(part))??'';
    const label=kind==='program'?row.title:slot||session||row.title;
    const id=JSON.stringify([kind,label.toLocaleLowerCase('id'),kind==='program'?slot:'']);
    if(!boards.has(id))boards.set(id,{id,title:kind==='program'?row.title:session||'Sesi belajar',slot,subjects:new Set(),roll:new Map()});
    const board=boards.get(id);
    if(kind==='kbm')board.subjects.add(row.title);
    for(const [status,ids] of Object.entries(row.groups||{})){
      for(const index of ids){
        const n=presensi.names?.[index];
        if(!n)continue;
        const stamp=row.updated??0;
        if(!board.roll.has(n)||stamp>=board.roll.get(n).stamp)
          board.roll.set(n,{stamp,status:status==='terlambat'?'hadir':status});
      }
    }
  }
  return [...boards.values()].map(({roll,subjects,...board})=>{
    const presentNames=[];
    const groups={hadir:0,izin:[],alfa:[],sakit:[],belum:0};
    for(const [n,{status}] of roll){
      if(status==='hadir'){groups.hadir++;presentNames.push(n);}
      else if(Array.isArray(groups[status]))groups[status].push(n);
      else groups.belum++;
    }
    for(const key of ['izin','alfa','sakit'])groups[key].sort((a,b)=>a.localeCompare(b,'id'));
    presentNames.sort((a,b)=>a.localeCompare(b,'id'));
    return {...board,presentNames,subjects:[...subjects],groups,total:roll.size};
  });
}

// Keep identity and attendance corrections independent of display names.
function attendanceStudents(presensi,present){
  const sessions=new Map(), students=new Map();
  for(const row of presensi?.sessions||[]){
    if(!['kbm','program'].includes(row.kind))continue;
    const id=JSON.stringify([row.kind,row.title,row.slot||row.sessionLabel||'']);
    if(!sessions.has(id))sessions.set(id,{label:[row.title,row.slot||row.sessionLabel].filter(Boolean).join(' · '),roll:new Map()});
    const session=sessions.get(id);
    for(const [status,ids] of Object.entries(row.groups||{})){
      for(const index of ids){
        const name=presensi.names?.[index];
        if(!name)continue;
        const previous=session.roll.get(name),updated=row.updated||0;
        if(!previous||updated>=previous.updated)session.roll.set(name,{status,updated});
      }
    }
  }
  for(const {label,roll} of sessions.values()){
    for(const [name,{status}] of roll){
      if(!(present?['hadir','terlambat']:['izin','sakit','alfa']).includes(status))continue;
      if(!students.has(name))students.set(name,new Set());
      students.get(name).add(present?label:label+' — '+status);
    }
  }
  return [...students].sort(([a],[b])=>a.localeCompare(b,'id')).map(([name,activities])=>({name,activities:[...activities]}));
}

export function absentStudents(presensi){return attendanceStudents(presensi,false)}
export function presentStudents(presensi){return attendanceStudents(presensi,true)}

// Same fallback convention as the Cahaya parent portal.
export function familiarName(fullName,nicknames={}){
  const explicit=nicknames[fullName];
  if(typeof explicit==='string'&&explicit.trim())return explicit.trim();
  const parts=String(fullName||'').trim().split(/\s+/);
  let short=parts[0]||'Santri';
  if(/^(m\.|m|muhammad|mohammad|mochammad|moch\.|moch|mohd\.|mohd|mhd\.|mhd)$/i.test(short)&&parts.length>1){
    short=parts.slice(1).join(' ').replace(/^(al-|al\s|el-|el\s)/i,'').trim().split(/\s|-/).pop();
  }
  return short.charAt(0).toUpperCase()+short.slice(1).toLowerCase();
}
