(function(root){
  'use strict';
  const REGION='us-central1';
  let connection=null;
  async function firebaseConnection(){
    if(root.CAHAYA_FACE_POC_TEST_BACKEND)return root.CAHAYA_FACE_POC_TEST_BACKEND;
    if(connection)return connection;
    connection=(async()=>{
      if(!root.CAHAYA_CONFIG?.firebase)throw Error('Konfigurasi Firebase tidak tersedia.');
      const [appModule,authModule,functionsModule]=await Promise.all([
        import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js'),
        import('https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js')
      ]);
      const app=appModule.getApps().length?appModule.getApp():appModule.initializeApp(root.CAHAYA_CONFIG.firebase),auth=authModule.getAuth(app),functions=functionsModule.getFunctions(app,REGION);
      const user=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Sesi Firebase Auth tidak ditemukan. Silakan login ulang.')),8000),stop=authModule.onAuthStateChanged(auth,value=>{clearTimeout(timer);stop();value?resolve(value):reject(Error('Firebase Auth diperlukan untuk POC multi-device.'))},reject)});
      const call=name=>functionsModule.httpsCallable(functions,name);
      const invoke=async(name,data={})=>(await call(name)(data)).data;
      return {uid:user.uid,context:()=>invoke('getFaceAttendancePocContext'),saveProfile:data=>invoke('saveFaceProfilePoc',data),listProfiles:()=>invoke('listFaceProfilesPoc'),syncProfiles:programId=>invoke('syncFaceProfilesPoc',{programId}),submitCheckIn:data=>invoke('submitFaceCheckInPoc',data)};
    })();
    try{return await connection}catch(error){connection=null;throw error}
  }
  root.CahayaFaceAttendanceBackend={connect:firebaseConnection,reset(){connection=null}};
})(window);
