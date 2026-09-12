/* ============ FIREBASE — Realtime Database (dorman sampai config diisi) ============ */
/* CARA MENGAKTIFKAN:
   1. Buka https://console.firebase.google.com -> project-mu.
   2. Build -> Realtime Database -> Create Database -> region Singapore
      (asia-southeast1) -> mulai "Locked mode".
   3. Build -> Authentication -> Sign-in method -> Email/Password -> Enable.
   4. Authentication -> Users -> Add user (email + password login-mu).
   5. Project Settings -> Your apps -> Web (</>) -> salin firebaseConfig,
      TEMPEL menggantikan placeholder di bawah. Pastikan ada "databaseURL".
   Selama apiKey masih "PASTE_...", app jalan mode localStorage biasa (tanpa login).
   TANPA KARTU KREDIT — Realtime Database gratis di plan Spark. */
const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "PASTE_YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://PASTE_YOUR_PROJECT-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "PASTE_YOUR_PROJECT",
  storageBucket: "PASTE_YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID"
};

const FIREBASE_ENABLED = !!firebaseConfig.apiKey && !/^PASTE/.test(firebaseConfig.apiKey);

let fbAuth=null, fbDB=null, fbUser=null, fbUnsub=null, fbSaveTimer=null, fbSeeded=false, fbReady=false;

if(FIREBASE_ENABLED){
  try{
    firebase.initializeApp(firebaseConfig);
    fbAuth=firebase.auth();
    fbDB=firebase.database();
  }catch(e){
    console.error('Firebase init gagal',e);
    fbAuth=null;fbDB=null;
  }
}

/* --- simpan ke cloud (debounce; seluruh DB sebagai satu blob JSON di users/{uid}) --- */
function cloudSave(){
  if(!FIREBASE_ENABLED||!fbUser||!fbDB)return;
  clearTimeout(fbSaveTimer);
  fbSaveTimer=setTimeout(()=>{
    fbDB.ref('users/'+fbUser.uid)
      .set({db:JSON.stringify(DB),updatedAt:Date.now()})
      .catch(e=>toast('Gagal simpan cloud: '+(e.code||e.message)));
  },400);
}

/* --- layar login --- */
function renderLogin(){
  $('#pageTitle').textContent='Masuk';
  $('#view').innerHTML=`<div class="login">
    <div class="card" style="max-width:360px;margin:8vh auto 0">
      <div style="text-align:center;margin-bottom:16px">
        <div class="logo" style="width:44px;height:44px;border-radius:12px;background:var(--mainblue);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:20px">C</div>
        <div style="font-weight:600;font-size:16px;margin-top:8px">Capella Academy</div>
        <div class="muted" style="font-size:12px">Masuk untuk mengakses data</div>
      </div>
      <div class="field"><label>Email</label><input id="lg_email" type="email" autocomplete="username" placeholder="email@contoh.com"></div>
      <div class="field"><label>Password</label><input id="lg_pass" type="password" autocomplete="current-password" placeholder="••••••••"></div>
      <div id="lg_err" style="color:#B03A2E;font-size:12px;min-height:16px;margin-bottom:6px"></div>
      <button class="btn primary" id="lg_btn" style="width:100%;justify-content:center">Masuk</button>
    </div></div>`;
  const submit=()=>doLogin();
  $('#lg_btn').onclick=submit;
  $('#lg_pass').onkeydown=e=>{if(e.key==='Enter')submit()};
}
function doLogin(){
  const em=$('#lg_email').value.trim(),pw=$('#lg_pass').value;
  if(!em||!pw){$('#lg_err').textContent='Email & password wajib diisi';return}
  $('#lg_btn').textContent='Memproses…';$('#lg_btn').disabled=true;
  fbAuth.signInWithEmailAndPassword(em,pw).catch(e=>{
    $('#lg_err').textContent='Gagal masuk: '+(e.code||e.message);
    $('#lg_btn').textContent='Masuk';$('#lg_btn').disabled=false;
  });
}
function fbLogout(){if(fbAuth)fbAuth.signOut()}

/* --- boot: dipanggil paling akhir (dari reports.js) --- */
function boot(){
  if(!FIREBASE_ENABLED){render();return;}            // mode localStorage seperti biasa
  if(!fbAuth){toast('Firebase gagal dimuat — mode lokal');render();return;}
  fbAuth.onAuthStateChanged(user=>{
    fbUser=user;fbSeeded=false;fbReady=false;
    if(fbUnsub){fbUnsub();fbUnsub=null;}
    if(!user){renderLogin();return;}
    const ref=fbDB.ref('users/'+user.uid);
    const handler=ref.on('value',snap=>{
      const val=snap.val();
      if(!val||!val.db){
        // dokumen cloud belum ada: dorong data localStorage yang ada ke cloud (jangan timpa kosong)
        if(!fbSeeded){fbSeeded=true;cloudSave()}
        if(!fbReady){fbReady=true;render()}
        return;
      }
      const same=(val.db===JSON.stringify(DB));
      if(!same){
        try{DB=JSON.parse(val.db)}catch(e){DB=structuredClone(DEFAULT)}
        migrate();
        localStorage.setItem(KEY,JSON.stringify(DB));   // cache offline
      }
      if(!same||!fbReady){fbReady=true;render()}          // paint awal + update dari device lain; abaikan echo sendiri
    },err=>{toast('Sinkron gagal: '+(err.code||err.message));render()});
    fbUnsub=()=>ref.off('value',handler);
  });
}
