(function(root){
  'use strict';
  const firebase=root.firebase;
  if(!firebase?.database||!root.CAHAYA_CONFIG?.firebase)throw new Error('Firebase Konselor belum siap. Periksa koneksi dan muat ulang halaman.');
  const app=firebase.apps.length?firebase.app():firebase.initializeApp(root.CAHAYA_CONFIG.firebase);
  const database=app.database();
  const apply=(source,...steps)=>steps.reduce((current,step)=>step(current),source);
  root.CahayaCounselorFirebaseV3=Object.freeze({
    getDatabase:()=>database,
    ref:(db,path='/')=>db.ref(path),
    get:target=>target.once('value'),
    set:(target,value)=>target.set(value),
    update:(target,value)=>target.update(value),
    remove:target=>target.remove(),
    push:target=>target.push(),
    query:apply,
    orderByChild:key=>target=>target.orderByChild(key),
    startAt:value=>target=>target.startAt(value),
    endAt:value=>target=>target.endAt(value),
    limitToLast:count=>target=>target.limitToLast(count),
    // Keep the exact path observed until the transaction settles. A one-time read
    // can release its cache before transaction() invokes the update callback.
    runTransaction:async(target,change,options={})=>{
      let listener;
      const initial=await new Promise((resolve,reject)=>{
        listener=snapshot=>resolve(snapshot);
        target.on('value',listener,error=>{target.off('value',listener);reject(error)});
      });
      try{
        if(!initial.exists())return{committed:false,snapshot:initial};
        return await target.transaction(change,undefined,options.applyLocally!==false);
      }finally{target.off('value',listener)}
    }
  });
})(window);
