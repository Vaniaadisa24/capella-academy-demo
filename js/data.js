/* ============ CONSTANTS ============ */
const JENJANG=['1 SD','2 SD','3 SD','4 SD','5 SD','6 SD','7 SMP','8 SMP','9 SMP','10 SMA','11 SMA','12 SMA','Persiapan SNBT','Persiapan Kedinasan'];
const JENIS_SET=['Latihan','PR','Soal tambahan','Persiapan ujian'];   /* lama — dipakai saat migrasi jenis→tipe */
const TIPE_SUMBER=[{v:'modul',t:'Modul'},{v:'tambahan',t:'Soal tambahan'}];
const tipeLabel=t=>t==='modul'?'Modul':'Soal tambahan';
const TIPE_SALAH_DEFAULT=['salah konsep','salah hitung','salah baca soal','kurang teliti menulis','tidak selesai','kosong'];

/* ============ DATA LAYER (localStorage; Firebase menyusul) ============ */
const KEY='capella_v1';
const DEFAULT={settings:{namaLembaga:'Capella Academy',tarifPerJenjang:{},durasiStandar:90,showFooterName:true},modul:[],bank:[],students:[]};
let DB=load();migrate();
function load(){try{const r=localStorage.getItem(KEY);return r?JSON.parse(r):structuredClone(DEFAULT)}catch(e){return structuredClone(DEFAULT)}}
function migrate(){
  DB.settings=DB.settings||{};if(!DB.settings.tarifPerJenjang)DB.settings.tarifPerJenjang={};
  if(DB.settings.namaLembaga==null)DB.settings.namaLembaga='Capella Academy';
  if(DB.settings.showFooterName==null)DB.settings.showFooterName=true;
  if(!DB.settings.durasiStandar)DB.settings.durasiStandar=90;
  if(!Array.isArray(DB.settings.tipeSalah)||!DB.settings.tipeSalah.length)DB.settings.tipeSalah=TIPE_SALAH_DEFAULT.slice();
  if(!Array.isArray(DB.modul))DB.modul=[];if(!Array.isArray(DB.bank))DB.bank=[];if(!Array.isArray(DB.students))DB.students=[];
  if(Array.isArray(DB.library)){
    DB.library.forEach(e=>{
      const subs=(e.modulSubs||e.subbabs||[]).map(sb=>typeof sb==='string'?{nama:sb,link:''}:{nama:sb.nama||'',link:sb.link||sb.bankLink||''});
      DB.modul.push({id:uid(),jenjang:e.jenjang,mapel:e.mapel||'',bab:e.bab,link:e.modulLink||'',subs});
      const bs=(e.bankSubs||[]);
      if(bs.length)DB.bank.push({id:uid(),jenjang:e.jenjang,mapel:e.mapel||'',bab:e.bab,isi:bs.map(x=>x.nama).join('\n'),link:''});
    });
    delete DB.library;
  }
  DB.bank.forEach(b=>{if(!Array.isArray(b.sets))b.sets=[];b.sets.forEach(st=>{
    if(st.id==null)st.id=uid();
    if(st.subbab==null)st.subbab='';
    if(!Array.isArray(st.subbabs))st.subbabs=st.subbab?[st.subbab]:[];
    /* jenis lama → tipe: 'Latihan' berasal dari modul, sisanya soal tambahan */
    if(!st.tipe)st.tipe=(st.jenis==='Latihan')?'modul':'tambahan';
    /* file tunggal (versi transisi) → files[]; string lama dibungkus jadi {id,nama} */
    if(!Array.isArray(st.files))st.files=st.file?[{id:uid(),nama:st.file}]:[];
    st.files=st.files.map(f=>typeof f==='string'?{id:uid(),nama:f}:{id:f.id||uid(),nama:f.nama||''});
    if(!Array.isArray(st.topik))st.topik=[];
  })});
  /* Konsolidasi: satu bab = SATU kelompok Modul yang mencakup semua sub-babnya.
     Sisa split lama (satu set Modul per sub-bab) digabung jadi satu; id set lama dipetakan
     ke id gabungan supaya referensi sumberId di sesi/PR tidak putus. */
  const sumberIdMap={};
  DB.bank.forEach(b=>{
    const moduls=(b.sets||[]).filter(st=>st.tipe==='modul');
    if(moduls.length>1){
      const keep=moduls[0];
      moduls.slice(1).forEach(st=>{
        st.subbabs.forEach(x=>{if(!keep.subbabs.includes(x))keep.subbabs.push(x)});
        st.files.forEach(f=>keep.files.push(f));
        (st.topik||[]).forEach(x=>{if(!keep.topik.includes(x))keep.topik.push(x)});
        sumberIdMap[st.id]=keep.id;
      });
      keep.subbab=keep.subbabs.join(', ');
      b.sets=b.sets.filter(st=>st.tipe!=='modul'||st===keep);
    }
  });
  const remapSumber=it=>{if(it&&sumberIdMap[it.sumberId])it.sumberId=sumberIdMap[it.sumberId]};
  DB.students.forEach(s=>{if(!Array.isArray(s.plan))s.plan=[];if(!Array.isArray(s.sessions))s.sessions=[];if(!Array.isArray(s.pr))s.pr=[];if(!s.lebihBayar||typeof s.lebihBayar!=='object')s.lebihBayar={};s.plan.forEach(p=>{if(p.startDate==null)p.startDate=''});
    /* nama bab/sub-bab di item sesi cuma salinan; sumber kebenarannya lesson plan lewat planId.
       Kalau sub-bab di plan di-rename, salinan lama bikin nilainya lepas dari sub-bab itu. */
    s.sessions.forEach(se=>{if(!Array.isArray(se.items))se.items=[];se.items.forEach(it=>{
      migKoreksi(it);remapSumber(it);
      if(it.planId){const p=s.plan.find(x=>x.id===it.planId);if(p){it.bab=p.bab;it.subbab=p.subbab}}
    })});
    s.pr.forEach(p=>{migPr(p);(p.items||[]).forEach(remapSumber)})});
}
/* PR jadi multi-bagian: entri lama (satu set) dibungkus jadi items[0]; total tetap di tingkat PR */
function migPr(p){
  if(!Array.isArray(p.items)){
    /* JANGAN migKoreksi(p) di sini: `p.catatan` itu evaluasi PR (teks) dan akan tertimpa */
    const salah=Array.isArray(p.salah)?p.salah:[];
    const isi=Number(p.nSoal||0)||Number(p.nBenar||0)||p.nomor||salah.length;
    p.items=isi?[{sumberId:p.sumberId||'',sumberNama:p.sumberNama||'',nomor:p.nomor||'',salah,catNo:[],
      nSoal:Number(p.nSoal||0),nBenar:Number(p.nBenar||0)}]:[];
    delete p.sumberId;delete p.sumberNama;delete p.nomor;delete p.salah;
  }
  p.items.forEach(migKoreksi);
  p.items.forEach(it=>{if(it.subbab==null)it.subbab=''});   /* sub-bab per bagian (opsional; '' = campuran/umum) */
  if(p.items.length)totalPr(p);
}
function totalPr(p){
  p.nSoal=p.items.reduce((a,i)=>a+Number(i.nSoal||0),0);
  p.nBenar=p.items.reduce((a,i)=>a+Number(i.nBenar||0),0);
}
/* field koreksi per nomor — semuanya ADITIF, nSoal/nBenar lama tidak disentuh */
function migKoreksi(o){
  if(o.sumberId==null)o.sumberId='';
  if(o.sumberNama==null)o.sumberNama='';
  if(o.sumberTipe==null)o.sumberTipe='';
  if(o.nomor==null)o.nomor='';
  if(!Array.isArray(o.salah))o.salah=[];
  o.salah=o.salah.filter(x=>x&&x.no!=null).map(x=>({no:Number(x.no),tipe:x.tipe||'',cat:x.cat||''}));
  /* catatan untuk nomor yang TIDAK ditandai salah (mis. benar tapi caranya kurang lengkap).
     NAMA FIELD `catNo`, BUKAN `catatan` — `catatan` sudah dipakai sebagai catatan teks
     di tingkat sesi & PR, dan menimpanya akan menghapus evaluasi yang sudah ditulis. */
  if(!Array.isArray(o.catNo))o.catNo=[];
  o.catNo=o.catNo.filter(x=>x&&x.no!=null).map(x=>({no:Number(x.no),teks:x.teks||''}));
}
/* gabungan catatan per nomor (salah + benar-tapi-dicatat), urut nomor — dipakai rapor & teks WA */
function korPoin(o){
  const out=[];
  (o.salah||[]).forEach(x=>out.push({no:x.no,label:x.tipe||'salah',teks:x.cat||'',salah:true}));
  (o.catNo||[]).forEach(x=>{if(x.teks)out.push({no:x.no,label:'benar',teks:x.teks,salah:false})});
  return out.sort((a,b)=>a.no-b.no);
}
function save(){localStorage.setItem(KEY,JSON.stringify(DB));if(typeof FIREBASE_ENABLED!=='undefined'&&FIREBASE_ENABLED&&typeof cloudSave==='function')cloudSave()}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}

/* ============ HELPERS ============ */
const $=s=>document.querySelector(s);
const rp=n=>'Rp'+(n||0).toLocaleString('id-ID');
const initials=n=>n.trim().split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
const esc=s=>(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const MONTHS=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
function fmtDate(s){if(!s)return '-';const d=new Date(s+'T00:00');return d.getDate()+' '+MONTHS[d.getMonth()]+' '+d.getFullYear()}
function ymd(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function mondayStr(dateLike){const x=new Date(dateLike);x.setHours(0,0,0,0);const off=(x.getDay()+6)%7;x.setDate(x.getDate()-off);return ymd(x)}
function addDaysStr(s,n){const d=new Date(s+'T00:00');d.setDate(d.getDate()+n);return ymd(d)}
function weekLabel(monStr){const a=new Date(monStr+'T00:00');const b=new Date(addDaysStr(monStr,6)+'T00:00');
  const sameM=a.getMonth()===b.getMonth()&&a.getFullYear()===b.getFullYear();
  const left=sameM?(''+a.getDate()):a.getDate()+' '+MONTHS[a.getMonth()]+(a.getFullYear()!==b.getFullYear()?' '+a.getFullYear():'');
  return left+' – '+b.getDate()+' '+MONTHS[b.getMonth()]+' '+b.getFullYear();}
function stamp(){const d=new Date();return ''+d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0')}
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
function tarifOf(s){if(s.tarif!=null&&s.tarif!=='')return Number(s.tarif);const t=DB.settings.tarifPerJenjang[s.kelas];return t?Number(t):0}
function sesFee(st,se){if(se.fee!=null&&se.fee!=='')return Number(se.fee);const std=Number(DB.settings.durasiStandar||90);const dur=Number(se.durasi||std);return Math.round(tarifOf(st)*dur/std/1000)*1000}
function label(pct){if(pct==null)return '';if(pct>=85)return 'sudah sangat kuat';if(pct>=70)return 'pemahaman baik';if(pct>=55)return 'cukup, perlu latihan lagi';return 'perlu penguatan'}
const digits=v=>(''+(v==null?'':v)).replace(/\D/g,'');
const grp=v=>{const d=digits(v);return d?Number(d).toLocaleString('id-ID'):''};
function attachThousand(el){el.value=grp(el.value);el.addEventListener('input',()=>{el.value=grp(el.value)})}

/* aggregate */
function subbabPct(st,bab,subbab){let b=0,n=0;st.sessions.forEach(se=>se.items.forEach(it=>{if(it.bab===bab&&it.subbab===subbab){b+=Number(it.nBenar||0);n+=Number(it.nSoal||0)}}));return n?Math.round(b/n*100):null}
function babList(st){const seen=[];st.plan.forEach(p=>{if(!seen.includes(p.bab))seen.push(p.bab)});return seen}
function babPct(st,bab){const subs=st.plan.filter(p=>p.bab===bab);const vals=subs.map(p=>subbabPct(st,p.bab,p.subbab)).filter(v=>v!=null);if(!vals.length)return null;return Math.round(vals.reduce((a,c)=>a+c,0)/vals.length)}
function prPct(st,bab){let b=0,n=0;(st.pr||[]).forEach(p=>{if(p.bab===bab){b+=Number(p.nBenar||0);n+=Number(p.nSoal||0)}});return n?Math.round(b/n*100):null}
function overallPct(st){let b=0,n=0;st.sessions.forEach(se=>se.items.forEach(it=>{b+=Number(it.nBenar||0);n+=Number(it.nSoal||0)}));(st.pr||[]).forEach(p=>{b+=Number(p.nBenar||0);n+=Number(p.nSoal||0)});return n?Math.round(b/n*100):null}
function nextTopic(st){const un=st.plan.filter(p=>p.status!=='selesai');if(!un.length)return null;const dated=un.filter(p=>p.startDate).sort((a,b)=>a.startDate.localeCompare(b.startDate));return(dated.length?dated[0]:un[0]).subbab}
function babDone(st){return babList(st).filter(b=>{const subs=st.plan.filter(p=>p.bab===b);return subs.length&&subs.every(p=>p.status==='selesai')}).length}
function modulFor(kelas){return DB.modul.filter(x=>x.jenjang===kelas)}

/* ============ KOREKSI PER NOMOR ============ */
const NOMOR_MAX=200;   /* jaring pengaman kalau salah ketik "1-99999" */
/* "1-5, 7, 9 - 11" -> [1,2,3,4,5,7,9,10,11]; rentang terbalik dibalik, 0/negatif & duplikat dibuang */
function parseNomor(str){
  const out=[];
  (''+(str||'')).replace(/[–—]/g,'-').replace(/\bs\/?d\b/gi,'-').replace(/\.\./g,'-')
    .split(/[,;\n]+/).forEach(part=>{
      const p=part.trim();if(!p)return;
      const m=p.match(/^(\d+)\s*-\s*(\d+)$/);
      if(m){let a=Number(m[1]),b=Number(m[2]);if(a>b){const t=a;a=b;b=t}
        for(let i=Math.max(1,a);i<=b&&out.length<NOMOR_MAX;i++)if(!out.includes(i))out.push(i);return}
      const one=p.match(/^\d+$/);
      if(one){const v=Number(p);if(v>=1&&!out.includes(v)&&out.length<NOMOR_MAX)out.push(v)}
    });
  return out.sort((a,b)=>a-b);
}
/* [1,2,3,4,5,7,9,10,11] -> "1-5, 7, 9-11" */
function fmtNomor(arr){
  const a=[...new Set((arr||[]).map(Number))].filter(n=>n>=1).sort((x,y)=>x-y);
  const seg=[];let i=0;
  while(i<a.length){let j=i;while(j+1<a.length&&a[j+1]===a[j]+1)j++;
    seg.push(j-i>=1?a[i]+'-'+a[j]:''+a[i]);i=j+1}
  return seg.join(', ');
}
/* apakah entri (item sesi / PR) memakai mode checklist nomor */
function pakaiChecklist(o){return !!(o&&o.nomor&&parseNomor(o.nomor).length)}
/* hitung ulang nSoal & nBenar dari nomor+salah — dipanggil saat simpan */
function hitungKoreksi(o){
  const nos=parseNomor(o.nomor);
  if(!nos.length)return;                                   /* mode angka lama: biarkan apa adanya */
  o.salah=(o.salah||[]).filter(x=>nos.includes(Number(x.no)));
  o.nSoal=nos.length;
  o.nBenar=nos.length-o.salah.length;
}
/* set soal dari Bank Soal untuk jenjang+bab tertentu; sub-bab dipakai untuk mengurutkan, bukan menyaring */
const normNama=s=>(''+(s||'')).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
/* sub-bab sebuah kelompok: array `subbabs` (baru, boleh >1); fallback ke `subbab` string lama */
function setSubs(st){return (st&&Array.isArray(st.subbabs)&&st.subbabs.length)?st.subbabs:((st&&st.subbab)?[st.subbab]:[])}
function setFiles(st){return (st&&Array.isArray(st.files))?st.files:[]}
/* daftar sumber tingkat-FILE dari Bank Soal untuk jenjang+bab; tiap file = satu pilihan.
   Kelompok tanpa file tetap muncul satu kali (id=kelompok). sub-bab utk mengurutkan, bukan menyaring. */
function sumberFor(jenjang,bab,subbab){
  const out=[];
  DB.bank.filter(b=>b.jenjang===jenjang&&b.bab===bab).forEach(b=>{
    (b.sets||[]).forEach(st=>{
      const subs=setSubs(st),tipe=st.tipe||'tambahan',files=setFiles(st);
      const base={tipe,subbabs:subs,bab:b.bab,topik:st.topik||[]};
      if(files.length)files.forEach(f=>out.push({id:f.id,nama:f.nama,...base,label:tipeLabel(tipe)+' · '+b.bab+(f.nama?' · '+f.nama:'')}));
      else out.push({id:st.id,nama:'',...base,label:tipeLabel(tipe)+' · '+b.bab});
    });
  });
  if(!subbab)return out;
  /* SARING per sub-bab (bukan sekadar urutkan): tampilkan yang di-tag sub-bab ini,
     plus yang tak bertag (umum, mis. Modul yang mencakup seluruh bab). */
  const key=normNama(subbab);
  const cocok=s=>!s.subbabs.length||s.subbabs.some(sb=>{const k=normNama(sb);return k&&(k===key||k.includes(key)||key.includes(k))});
  return out.filter(cocok);
}
/* cari satu sumber (file, atau kelompok tanpa file) berdasar id, lintas semua Bank Soal */
function sumberById(id){
  for(const b of DB.bank)for(const st of(b.sets||[])){
    const tipe=st.tipe||'tambahan';
    if(st.id===id)return{id,nama:'',tipe,bab:b.bab,subbabs:setSubs(st),label:tipeLabel(tipe)+' · '+b.bab};
    for(const f of setFiles(st))if(f.id===id)return{id,nama:f.nama,tipe,bab:b.bab,subbabs:setSubs(st),label:tipeLabel(tipe)+' · '+b.bab+(f.nama?' · '+f.nama:'')};
  }
  return null;
}
