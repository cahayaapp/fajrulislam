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
    const groups={hadir:0,izin:[],alfa:[],sakit:[],belum:0};
    for(const [n,{status}] of roll){
      if(status==='hadir')groups.hadir++;
      else if(Array.isArray(groups[status]))groups[status].push(n);
      else groups.belum++;
    }
    for(const key of ['izin','alfa','sakit'])groups[key].sort((a,b)=>a.localeCompare(b,'id'));
    return {...board,subjects:[...subjects],groups,total:roll.size};
  });
}
