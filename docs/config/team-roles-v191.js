(function(){
  const R={
    zaky:['manajer-pendidikan','guru'],
    doni:['supervisor-pendidikan-pengasuhan','konselor-muda','mentor'],
    beny:['mentor'],
    dandy:['mentor','konselor-pemula','manajer-pengasuhan'],
    fatimah:['manajer-pengasuhan','guru','mentor','naqib'],
    alamanda:['manajer-pendidikan','guru','mentor','naqib'],
    meilisa:['guru','konselor-pemula'],
    kamal:['naqib'],
    favian:['naqib'],
    khaizuran:['naqib'],
    faiq:['guru'],
    rosyidin:['guru'],
    rahiel:['guru'],
    naqieb:['guru']
  };
  const ALL=['admin','direktur','supervisor-pendidikan-pengasuhan','manajer-pendidikan','manajer-pengasuhan','guru','mentor','mentor-quran','naqib','konselor-pemula','konselor-muda','kesehatan','sarpras','layanan','keuangan','kasir','cla'];
  function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim()}
  function identity(p){return norm([p?.username,p?.email,p?.label,p?.nama,p?.name].filter(Boolean).join(' '))}
  function personKey(p){const s=identity(p),flat=s.replace(/ /g,'');if(flat.includes('multazam'))return'multazam';if(flat.includes('diniindriani')||flat==='dini'||flat.startsWith('dini'))return'dini';const alias={zaky:['zaky','zaki'],doni:['doni'],beny:['beny','benny','beni'],dandy:['dandy','dandi'],fatimah:['fatimah'],alamanda:['alamanda'],meilisa:['meilisa'],kamal:['kamal'],favian:['favian'],khaizuran:['khaizuran'],faiq:['faiq'],rosyidin:['rosyidin'],rahiel:['rahiel'],naqieb:['naqieb','naqib']};for(const [k,vals] of Object.entries(alias)){if(vals.some(v=>flat.includes(v)))return k}return''}
  function rolesFor(p){const k=personKey(p);if(k==='multazam'||k==='dini')return [...ALL];return k?[...(R[k]||[])]:[]}
  function apply(p){const roles=rolesFor(p);if(!roles.length)return p||{};return {...(p||{}),workspaceRoles:roles,allRoles:roles,akses:roles,teamRoleSource:'v191'} }
  window.CAHAYA_TEAM_ROLES={roles:R,allRoles:ALL,identity,personKey,rolesFor,apply};
})();
