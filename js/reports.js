/* ============ REPORTS ============ */
function footerCorner(){return DB.settings.showFooterName?`<div class="rcorner">${esc(DB.settings.namaLembaga)}</div>`:''}

/* rincian koreksi per nomor untuk satu entri (item sesi / bagian PR) — dipakai teks WA */
function korRincian(o){
  return korPoin(o).map(p=>`No. ${p.no} (${p.label})${p.teks?' — '+p.teks:''}`).join('\n');
}
function modalTeks(judul,txt){
  openModal(`<div class="modal"><h2>${esc(judul)}<span class="x" onclick="closeModal()">×</span></h2>
    <textarea id="rep_txt" style="min-height:190px">${esc(txt)}</textarea>
    <div class="modal-actions"><button class="btn" onclick="closeModal()">Tutup</button><button class="btn primary" id="rep_copy">⧉ Salin</button></div></div>`);
  $('#rep_copy').onclick=()=>{navigator.clipboard.writeText($('#rep_txt').value).then(()=>toast('Teks disalin — tempel ke WhatsApp'))};
}
function sessionReport(s,se){
  const tot=se.items.reduce((a,i)=>a+Number(i.nSoal||0),0),ben=se.items.reduce((a,i)=>a+Number(i.nBenar||0),0);
  const bab=[...new Set(se.items.map(i=>i.bab))].join(', ');
  const subs=se.items.map(i=>i.subbab);
  const subStr=subs.length>1?subs.slice(0,-1).join(', ')+' dan '+subs.slice(-1):subs[0];
  const det=se.catatan?se.catatan:'siswa mengerjakan latihan dengan baik';
  let txt=`Di pertemuan ${fmtDate(se.tanggal)}, ${s.nama} mempelajari bab ${bab} bagian ${subStr}. Dari ${tot} soal latihan yang ${s.nama} kerjakan secara mandiri, jumlah jawaban yang benar adalah ${ben} dari ${tot} soal. Untuk detailnya, ${det}.`;
  const rinci=se.items.filter(i=>korPoin(i).length).map(i=>
    `${i.subbab}${i.nomor?' (no. '+i.nomor+')':''} — benar ${i.nBenar}/${i.nSoal}\n`+korRincian(i)).join('\n\n');
  if(rinci)txt+=`\n\nRincian koreksi:\n${rinci}`;
  modalTeks('Laporan sesi (teks)',txt);
}
function prReport(s,pr){
  const items=pr.items||[];
  const jud=pr.judul||('PR '+fmtDate(pr.tanggal));
  const pct=pr.nSoal?Math.round(pr.nBenar/pr.nSoal*100):null;
  let txt=`Hasil koreksi PR — ${s.nama}\n${pr.bab?pr.bab+' · ':''}${jud} (${fmtDate(pr.tanggal)})\nBenar ${pr.nBenar} dari ${pr.nSoal}${pct!=null?' ('+pct+'%)':''}`;
  items.forEach(it=>{
    const nama=it.sumberNama||'Bagian';
    txt+=`\n\n${nama}${it.nomor?' (no. '+it.nomor+')':''} — benar ${it.nBenar}/${it.nSoal}`;
    const rinci=korRincian(it);
    if(rinci)txt+=`\n${rinci}`;
  });
  if(pr.catatan)txt+=`\n\nCatatan: ${pr.catatan}`;
  modalTeks('Hasil koreksi PR (teks)',txt);
}

function babReport(s,bab){
  const subs=s.plan.filter(p=>p.bab===bab);
  const rows=subs.map(p=>{const pc=subbabPct(s,p.bab,p.subbab);return `<li>${esc(p.subbab)}: ${pc==null?'—':pc+'%'}</li>`}).join('');
  const nSes=s.sessions.filter(se=>se.items.some(i=>i.bab===bab)).length;
  const avg=babPct(s,bab);
  const pravg=prPct(s,bab);
  const prList=s.pr.filter(p=>p.bab===bab);
  const prRows=prList.map(p=>`<li>${p.judul?esc(p.judul):'PR '+fmtDate(p.tanggal)}: ${p.nBenar}/${p.nSoal}${p.nSoal?' ('+Math.round(p.nBenar/p.nSoal*100)+'%)':''}</li>`).join('');
  /* jenis kesalahan — latihan & PR dihitung TERPISAH (konsisten dgn pemisahan persentase) */
  const tally=arr=>{const m={};arr.forEach(x=>{const t=x.tipe||'tanpa keterangan';m[t]=(m[t]||0)+1});
    return Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([t,n])=>n+' '+t).join(', ')};
  const salLat=s.sessions.flatMap(se=>se.items.filter(i=>i.bab===bab).flatMap(i=>i.salah||[]));
  const salPr=s.pr.filter(p=>p.bab===bab).flatMap(p=>(p.items||[]).flatMap(i=>i.salah||[]));
  const jenisHtml=(salLat.length||salPr.length)
    ?`<h3>Jenis kesalahan</h3><ul>${salLat.length?`<li>Saat latihan pertemuan: ${esc(tally(salLat))}</li>`:''}${salPr.length?`<li>Saat mengerjakan PR: ${esc(tally(salPr))}</li>`:''}</ul>`:'';
  /* catatan dikelompokkan per TANGGAL: sesi & PR bertanggal sama → satu blok.
     Di dalam blok: Umum (catatan bebas) lalu per sub-bab (sub-judul, bukan bullet);
     poin tanpa sub-bab menggantung langsung tanpa label. Label Latihan/PR hanya muncul
     bila perlu membedakan (hari yang ada sesi + PR sekaligus). */
  const poinDari=o=>korPoin(o).filter(p=>p.teks).map(p=>`No. ${p.no} (${p.label}) — ${p.teks}`);
  /* catatan Umum bebas: hormati marker yang diketik user → bullet (`- `/`* `) jadi <ul>,
     nomor (`1. `/`1) `) jadi <ol>, baris lain jadi paragraf. Semua kereflek di PDF. */
  const fmtUmum=txt=>{const lines=(txt||'').split(/\n+/).map(l=>l.trim()).filter(Boolean);if(!lines.length)return'';
    /* bullet (`- `) yang menyusul sebuah nomor jadi SUB-item nomor itu (menjorok);
       nomor yang diketik dipertahankan (`value`) → tak reset ke 1 walau diselang bullet. */
    const nodes=[];
    lines.forEach(l=>{let m;
      if(m=l.match(/^(\d+)[.)]\s+(.*)/))nodes.push({t:'num',num:m[1],teks:m[2],subs:[]});
      else if(m=l.match(/^[-•*]\s+(.*)/)){const last=nodes[nodes.length-1];
        if(last&&last.t==='num')last.subs.push(m[1]);else nodes.push({t:'bul',teks:m[1]})}
      else nodes.push({t:'par',teks:l})});
    const olS='margin:2px 0 5px;padding-left:22px;font-size:13px;line-height:1.7';
    const ulS='margin:2px 0 5px;padding-left:20px;font-size:13px;line-height:1.7';
    const subS='margin:1px 0 3px;padding-left:16px;font-size:13px;line-height:1.7';
    let h='',i=0;
    while(i<nodes.length){const n=nodes[i];
      if(n.t==='num'){let items='';
        while(i<nodes.length&&nodes[i].t==='num'){const x=nodes[i];
          const sub=x.subs.length?`<ul style="${subS}">${x.subs.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:'';
          items+=`<li value="${esc(x.num)}">${esc(x.teks)}${sub}</li>`;i++}
        h+=`<ol style="${olS}">${items}</ol>`}
      else if(n.t==='bul'){let items='';
        while(i<nodes.length&&nodes[i].t==='bul'){items+=`<li>${esc(nodes[i].teks)}</li>`;i++}
        h+=`<ul style="${ulS}">${items}</ul>`}
      else{h+=`<div style="font-size:13px;line-height:1.7;margin-bottom:1px">${esc(n.teks)}</div>`;i++}}
    return h};
  const mk=()=>({umum:[],subs:{},untag:[]});
  const blok={};
  const ambil=tgl=>blok[tgl]||(blok[tgl]={sesi:false,lat:mk(),pr:mk()});
  const addPoin=(bkt,sub,poin)=>{if(sub){(bkt.subs[sub]=bkt.subs[sub]||[]).push(...poin)}else bkt.untag.push(...poin)};
  const isi=x=>x.umum.length||Object.keys(x.subs).length||x.untag.length;
  s.sessions.forEach(se=>{if(!se.items.some(i=>i.bab===bab))return;
    const b=ambil(se.tanggal);b.sesi=true;
    /* catatan bebas sesi cuma masuk kalau SELURUH item sesi = bab ini; sesi campur bab
       → di-skip supaya materi bab lain tak bocor ke rapor ini (catatan per-nomor tetap tersaring bab) */
    if(se.catatan&&se.items.every(i=>i.bab===bab))b.lat.umum.push(se.catatan);
    se.items.filter(i=>i.bab===bab).forEach(i=>{const poin=poinDari(i);if(poin.length)addPoin(b.lat,i.subbab,poin)})});
  prList.forEach(p=>{const b=ambil(p.tanggal);
    if(p.catatan)b.pr.umum.push(p.catatan);
    (p.items||[]).forEach(i=>{const poin=poinDari(i);if(poin.length)addPoin(b.pr,i.subbab,poin)})});
  const streamHtml=(x,lbl)=>{let h='';
    if(lbl)h+=`<div style="font-weight:700;color:#1A1A2E;font-size:13px;text-decoration:underline;margin:7px 0 3px">${lbl}</div>`;
    if(x.umum.length){h+=`<div style="font-weight:700;color:#1A1A2E;font-size:12.5px;margin:4px 0 1px">Umum</div>`;h+=x.umum.map(fmtUmum).join('')}
    Object.keys(x.subs).forEach(k=>{h+=`<div style="font-weight:700;color:#1A1A2E;font-size:12.5px;margin:5px 0 1px">${esc(k)}</div><ul style="margin:0 0 6px">${x.subs[k].map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`});
    if(x.untag.length)h+=`<ul style="margin:3px 0 6px">${x.untag.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`;
    return h};
  const blocks=Object.keys(blok).sort((a,b)=>a.localeCompare(b)).map(tgl=>{
    const b=blok[tgl],latIsi=isi(b.lat),prIsi=isi(b.pr);if(!latIsi&&!prIsi)return'';
    const judul=(b.sesi?'Pertemuan · ':'PR · ')+fmtDate(tgl);let inner='';
    if(b.sesi){if(latIsi&&prIsi){inner+=streamHtml(b.lat,'Latihan');inner+=streamHtml(b.pr,'PR')}
      else if(latIsi)inner+=streamHtml(b.lat,'');else inner+=streamHtml(b.pr,'PR')}
    else inner+=streamHtml(b.pr,'');
    return `<div style="margin-bottom:15px"><div style="font-weight:600;color:#2E86C1;font-size:13px;margin-bottom:3px">${esc(judul)}</div>${inner}</div>`}).filter(Boolean);
  const noteHtml=blocks.length?`<div style="margin-bottom:16px">${blocks.join('')}</div>`:`<p>Pemahaman berkembang baik sepanjang bab ini.</p>`;
  const html=`<div class="report">
    <div class="rhead"><div class="sub">LAPORAN BELAJAR</div><div class="ttl">${esc(bab)}</div></div><div class="rrule"></div>
    <div class="rbody">
      <table class="info"><tr><td style="width:130px">Nama</td><td><b>${esc(s.nama)}</b></td><td style="width:70px">Jenjang</td><td><b>${esc(s.kelas)}</b></td></tr>
      <tr><td>Pertemuan</td><td><b>${nSes} sesi</b></td><td></td><td></td></tr>
      <tr><td>Pemahaman latihan</td><td><b>${avg==null?'—':avg+'%'}</b></td><td>Pemahaman PR</td><td><b>${pravg==null?'—':pravg+'%'}</b></td></tr></table>
      <h3>Ringkasan</h3><p>Bab ini diselesaikan dalam ${nSes} pertemuan. Pemahaman saat latihan pertemuan ${avg==null?'—':avg+'%'}${avg!=null?' ('+label(avg)+')':''}${pravg!=null?', sedangkan pemahaman saat mengerjakan PR secara mandiri '+pravg+'% ('+label(pravg)+')':''}.</p>
      <h3>Rincian per sub-bab (latihan)</h3><ul>${rows}</ul>
      ${prRows?`<h3>Hasil PR</h3><ul>${prRows}</ul>`:''}
      ${jenisHtml}
      <h3>Catatan keseluruhan</h3>${noteHtml}
      ${footerCorner()}
    </div></div>`;
  saveReport(html,`${stamp()} - Laporan Belajar ${s.nama} - ${bab}`);
}

function monthReportModal(s){
  const now=new Date();const opts=[];
  for(let i=0;i<6;i++){const d=new Date(now.getFullYear(),now.getMonth()-i,1);opts.push(`<option value="${d.getFullYear()}-${d.getMonth()}">${MONTHS[d.getMonth()]} ${d.getFullYear()}</option>`)}
  openModal(`<div class="modal"><h2>Laporan bulanan — ${esc(s.nama)}<span class="x" onclick="closeModal()">×</span></h2>
    <div class="field"><label>Pilih bulan</label><select id="mr_month">${opts.join('')}</select></div>
    <div class="field"><label>Lebih bayar bulan lalu (potongan)</label><input id="mr_lebih" inputmode="numeric" placeholder="0"></div>
    <div class="modal-actions"><button class="btn" onclick="closeModal()">Batal</button><button class="btn primary" id="mr_go">Unduh PDF</button></div></div>`);
  const inp=$('#mr_lebih');attachThousand(inp);
  const syncLebih=()=>{const[y,m]=$('#mr_month').value.split('-').map(Number);const v=(s.lebihBayar&&s.lebihBayar[y+'-'+m])||0;inp.value=v?grp(''+v):''};
  syncLebih();$('#mr_month').onchange=syncLebih;
  $('#mr_go').onclick=()=>{const[y,m]=$('#mr_month').value.split('-').map(Number);const lb=Number(digits(inp.value))||0;if(!s.lebihBayar)s.lebihBayar={};if(lb)s.lebihBayar[y+'-'+m]=lb;else delete s.lebihBayar[y+'-'+m];save();closeModal();monthReport(s,y,m)};
}
function monthReport(s,y,m){
  const ses=s.sessions.filter(se=>{const d=new Date(se.tanggal+'T00:00');return d.getFullYear()===y&&d.getMonth()===m}).sort((a,b)=>a.tanggal.localeCompare(b.tanggal));
  const std=Number(DB.settings.durasiStandar||90);
  const total=ses.reduce((a,se)=>a+sesFee(s,se),0);
  const feeRows=ses.map(se=>`<tr><td>${fmtDate(se.tanggal)}</td><td style="text-align:right">${Number(se.durasi||std)} menit</td><td style="text-align:right">${rp(sesFee(s,se))}</td></tr>`).join('');
  const babs=[...new Set(ses.flatMap(se=>se.items.map(i=>i.bab)))];
  const babStr=babs.length?(babs.length>1?babs.slice(0,-1).join(', ')+' serta '+babs.slice(-1):babs[0]):'—';
  const subs=[...new Set(ses.flatMap(se=>se.items.map(i=>i.subbab)))];
  const lebih=(s.lebihBayar&&s.lebihBayar[y+'-'+m])||0;
  const dibayar=Math.max(0,total-lebih);
  const html=`<div class="report">
    <div class="rhead"><div class="sub">LAPORAN BELAJAR BULANAN</div><div class="ttl">${MONTHS[m]} ${y}</div></div><div class="rrule"></div>
    <div class="rbody">
      <table class="info"><tr><td style="width:90px">Nama</td><td><b>${esc(s.nama)}</b></td><td style="width:80px">Jenjang</td><td><b>${esc(s.kelas)}</b></td></tr>
      <tr><td>Periode</td><td><b>${MONTHS[m]} ${y}</b></td><td>Pertemuan</td><td><b>${ses.length} sesi</b></td></tr></table>
      <h3>Ringkasan</h3><p>Bulan ini ${esc(s.nama)} mengikuti ${ses.length} pertemuan dan mempelajari materi ${esc(babStr)}.</p>
      ${subs.length?`<h3>Materi yang dipelajari</h3><ul>${subs.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}
      <h3>Rincian biaya</h3>
      <table class="fee"><tr class="hd"><td>Tanggal</td><td style="text-align:right">Durasi</td><td style="text-align:right">Fee</td></tr>
      ${feeRows}
      <tr><td colspan="2"><b>Total (${ses.length} sesi)</b></td><td style="text-align:right"><b>${rp(total)}</b></td></tr></table>
      ${lebih>0?`<h3>Ringkasan pembayaran</h3>
      <table class="fee"><tr><td>Total fee bulan ini</td><td style="text-align:right">${rp(total)}</td></tr>
      <tr><td>Lebih bayar bulan lalu</td><td style="text-align:right">− ${rp(lebih)}</td></tr>
      <tr><td><b>Total dibayar</b></td><td style="text-align:right"><b>${rp(dibayar)}</b></td></tr></table>`:''}
      <p style="font-size:12.5px;color:#34495E">Terima kasih atas kepercayaannya.</p>
      ${footerCorner()}
    </div></div>`;
  saveReport(html,`${stamp()} - Laporan Belajar ${s.nama} ${MONTHS[m]} ${y}`);
}

function saveReport(html,filename){
  if(!window.html2pdf){
    const h=$('#printArea');h.innerHTML=html;h.style.display='block';window.print();
    setTimeout(()=>{h.style.display='none';h.innerHTML=''},400);toast('Simpan sebagai PDF dari dialog cetak');return;
  }
  const holder=document.createElement('div');
  holder.style.cssText='position:absolute;left:0;top:0;width:680px;background:#fff;z-index:-1;opacity:0;pointer-events:none';
  holder.innerHTML=html;
  document.body.appendChild(holder);
  const el=holder.firstElementChild;
  toast('Menyiapkan PDF…');
  setTimeout(()=>{
    html2pdf().set({filename:filename+'.pdf',margin:[8,8,8,8],image:{type:'jpeg',quality:.98},html2canvas:{scale:2,backgroundColor:'#ffffff',scrollX:0,scrollY:0},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},pagebreak:{mode:['css','legacy'],avoid:['li','tr','p','h3','.info']}})
      .from(el).save().then(()=>holder.remove()).catch(()=>holder.remove());
  },60);
}

/* ============ ARCHIVE / EXPORT / IMPORT ============ */
function archiveStudent(s){
  if(!confirm(`Arsipkan ${s.nama}? Datanya akan diunduh sebagai file, lalu dihapus dari daftar aktif.`))return;
  download(`arsip-${s.nama.replace(/\s+/g,'-').toLowerCase()}.json`,JSON.stringify(s,null,2));
  DB.students=DB.students.filter(x=>x.id!==s.id);save();go('murid');toast('Murid diarsipkan & diunduh');
}
function download(name,text){const b=new Blob([text],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;a.click();URL.revokeObjectURL(a.href)}
$('#exportBtn').onclick=()=>{const d=new Date().toISOString().slice(0,10);download(`capella-data-${d}.json`,JSON.stringify(DB,null,2));toast('Data diexport')};
$('#importBtn').onclick=()=>$('#fileInput').click();
$('#fileInput').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);
  if(d.students){if(confirm('Ganti SEMUA data dengan file ini?')){DB=d;migrate();save();render();toast('Data diimport')}}
  else if(d.nama&&d.plan){DB.students.push({...d,id:uid()});save();go('murid');toast('Murid diimport dari arsip')}
  else toast('Format file tidak dikenali')}catch(x){toast('File rusak / bukan JSON')}};r.readAsText(f);e.target.value=''};

/* ============ MISC ============ */
$('#toggleNav').onclick=()=>$('#sidebar').classList.toggle('hidden');
/* default tampil sidebar mengikuti lebar layar; sinkron ulang tiap menyeberang breakpoint HP<->desktop
   supaya sidebar tak nyangkut di luar layar (margin-left:-210) saat window di-resize / dimaksimalkan */
const mqMobile=window.matchMedia('(max-width:640px)');
const syncSidebar=()=>$('#sidebar').classList.toggle('hidden',mqMobile.matches);
syncSidebar();
mqMobile.addEventListener('change',syncSidebar);
$('#brandName').textContent=(DB.settings.namaLembaga||'Capella').split(' ')[0];
window.go=go;window.closeModal=closeModal;
boot();
