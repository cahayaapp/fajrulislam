// Mechanical entry-hook installation/check. No business logic or data changes.
// Default is read-only. --patch prints an apply_patch document, never writes.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const excluded=new Set(['docs','.git','node_modules','.agents','.codex','migration-export','tests']);
const publicPages=new Set(['index.html','404.html','role-access-denied.html']);
function walk(dir=''){return fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(x=>{
  if(excluded.has(x.name)||x.name.startsWith('.'))return [];
  const p=path.posix.join(dir,x.name);
  return x.isDirectory()?walk(p):p.endsWith('.html')?[p]:[];
})}
const start='<!-- ROLE_V2_ENTRY_START -->',end='<!-- ROLE_V2_ENTRY_END -->';
function block(file){const prefix='../'.repeat(file.split('/').length-1);return start+'\n'+['role-system-v2','role-route-registry-v2','role-navigation-v2','role-scope-v2','role-entry-v2'].map(n=>'<script src="'+prefix+'js/'+n+'.js?v=206"></script>').join('\n')+'\n'+end}
function stripped(text){return text.replace(/<!-- ROLE_V2_ENTRY_START -->[\s\S]*?<!-- ROLE_V2_ENTRY_END -->/,'')}
const files=walk().filter(f=>!publicPages.has(f)),changes=[],missing=[];
for(const f of files){
  const old=fs.readFileSync(path.join(root,f),'utf8'),clean=stripped(old);
  if(!/<head\b[^>]*>/i.test(clean)){missing.push(f+': missing head');continue}
  let next=clean.replace(/<head\b[^>]*>/i,m=>m+block(f));
  if(next!==old)changes.push([f,old,next]);
  const mirror=path.join(root,'docs',f);
  if(fs.existsSync(mirror)){const m=fs.readFileSync(mirror,'utf8'),n=stripped(m).replace(/<head\b[^>]*>/i,h=>h+block(f));if(m!==n)changes.push(['docs/'+f,m,n])}
}
if(process.argv.includes('--patch')){
  console.log('*** Begin Patch');
  for(const [f,old,next] of changes.slice(0,8)){
    // Narrow replacement around head/entry only, except small mirrored drift.
    let a=old.split('\n'),b=next.split('\n'),i=0;
    while(i<a.length&&i<b.length&&a[i]===b[i])i++;
    let ae=a.length,be=b.length;while(ae>i&&be>i&&a[ae-1]===b[be-1]){ae--;be--}
    console.log('*** Update File: '+f+'\n@@');
    console.log(a.slice(i,ae).map(l=>'-'+l).concat(b.slice(i,be).map(l=>'+'+l)).join('\n'));
  }
  console.log('*** End Patch');
}else{
  console.log(JSON.stringify({pages:files.length,changesNeeded:changes.map(x=>x[0]),missing},null,2));
  if(changes.length||missing.length)process.exitCode=1;
}
module.exports={files,stripped};
