/* ============ ROUTER ============ */
let cur={view:'dashboard',sid:null};
let modulTab='modul';
let modulJenjang=null;
let planWeekMon=null,planAll=false;
let histMonth=null,histSid=null;   /* filter bulan riwayat sesi & PR (sinkron dua tabel) */
function go(view,sid){cur={view,sid:sid||null};if(window.matchMedia('(max-width:640px)').matches)$('#sidebar').classList.add('hidden');render()}
document.querySelectorAll('.navitem').forEach(el=>el.onclick=()=>go(el.dataset.view));

function render(){
  if(typeof FIREBASE_ENABLED!=='undefined'&&FIREBASE_ENABLED&&!fbUser){renderLogin();return;}
  document.querySelectorAll('.navitem').forEach(el=>el.classList.toggle('active',el.dataset.view===cur.view));
  const titles={dashboard:'Dashboard',murid:'Murid',modul:'Modul & bank soal',yt:'Math YouTube',settings:'Pengaturan',detail:'Detail murid'};
  $('#pageTitle').textContent=titles[cur.view]||'';
  const v=$('#view');
  if(cur.view==='dashboard')v.innerHTML=viewDashboard();
  else if(cur.view==='murid')v.innerHTML=viewMurid();
  else if(cur.view==='detail')v.innerHTML=viewDetail();
  else if(cur.view==='modul')v.innerHTML=viewModul();
  else if(cur.view==='yt')v.innerHTML=viewYT();
  else if(cur.view==='settings')v.innerHTML=viewSettings();
  bindView();
}

/* ============ VIEWS ============ */
function viewDashboard(){
  const n=DB.students.length;
  const now=new Date();
  const mSes=DB.students.reduce((a,s)=>a+s.sessions.filter(se=>{const d=new Date(se.tanggal+'T00:00');return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()}).length,0);
  let cards=DB.students.map(s=>{
    const pct=overallPct(s), nt=nextTopic(s);
    return `<div class="card" style="cursor:pointer" data-open="${s.id}">
      <div style="display:flex;align-items:center;gap:11px;margin-bottom:12px">
        <div class="avatar" style="width:38px;height:38px;font-size:14px">${initials(s.nama)}</div>
        <div><div style="font-weight:600">${esc(s.nama)}</div><div class="muted" style="font-size:12px">${esc(s.kelas)}</div></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px"><span class="muted">Pemahaman</span><span style="font-weight:600">${pct==null?'—':pct+'%'}</span></div>
      <div class="bar" style="margin-bottom:11px"><span style="width:${pct||0}%"></span></div>
      <div class="muted" style="font-size:12px">→ Lanjut: ${nt?esc(nt):'<i>belum ada rencana</i>'}</div>
    </div>`;
  }).join('');
  if(!n)cards=`<div class="empty" style="grid-column:1/-1"><div class="ic">◍</div>Belum ada murid. Tambahkan lewat menu <b>Murid</b>.</div>`;
  return `
    <div class="grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:22px">
      <div class="stat"><div class="lbl">Total murid</div><div class="val">${n}</div></div>
      <div class="stat"><div class="lbl">Sesi bulan ini</div><div class="val">${mSes}</div></div>
      <div class="stat"><div class="lbl">Hari ini</div><div class="val" style="font-size:15px;padding-top:5px">${now.getDate()} ${MONTHS[now.getMonth()]}</div></div>
    </div>
    <div class="sectitle">Muridku</div>
    <div class="grid" style="grid-template-columns:repeat(2,1fr)">${cards}</div>`;
}

function viewMurid(){
  let rows=DB.students.map(s=>{
    const pct=overallPct(s), nt=nextTopic(s);
    return `<tr class="click" data-open="${s.id}">
      <td><div style="display:flex;align-items:center;gap:9px"><div class="avatar" style="width:30px;height:30px;font-size:12px">${initials(s.nama)}</div>${esc(s.nama)}</div></td>
      <td>${esc(s.kelas)}</td>
      <td class="muted">${nt?esc(nt):'—'}</td>
      <td style="text-align:right;font-weight:600">${pct==null?'—':pct+'%'}</td>
    </tr>`;
  }).join('');
  if(!DB.students.length)rows=`<tr><td colspan="4"><div class="empty"><div class="ic">◍</div>Belum ada murid.</div></td></tr>`;
  return `
    <div style="display:flex;gap:12px;margin-bottom:16px">
      <input id="search" placeholder="🔍  Cari murid…" style="max-width:280px">
      <div style="flex:1"></div>
      <button class="btn primary" id="addStudent">+ Tambah murid</button>
    </div>
    <div class="card" style="padding:8px 14px">
      <table class="list"><thead><tr><th>NAMA</th><th>KELAS</th><th>LANJUT KE</th><th style="text-align:right">PEMAHAMAN</th></tr></thead>
      <tbody id="studentRows">${rows}</tbody></table>
    </div>`;
}

function viewDetail(){
  const s=DB.students.find(x=>x.id===cur.sid);
  if(!s)return `<div class="empty">Murid tidak ditemukan. <a class="link" onclick="go('murid')">Kembali</a></div>`;
  const pct=overallPct(s);
  const babHtml=babList(s).map(b=>{const p=babPct(s,b);const pr=prPct(s,b);const subs=s.plan.filter(x=>x.bab===b);const done=subs.length&&subs.every(x=>x.status==='selesai');
    const parts=[];if(p!=null)parts.push('latihan <b>'+p+'%</b>');if(pr!=null)parts.push('PR <b>'+pr+'%</b>');
    const lbl=parts.length?parts.join(' · '):'<span class="muted">belum ada nilai</span>';
    return `<div style="margin-bottom:11px">
      <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:4px">
        <span>${esc(b)} ${done?'<span class="pill done">tuntas</span>':''}</span>
        <span>${lbl} <a class="link" data-babrep="${esc(b)}" style="margin-left:8px">rapor PDF</a></span>
      </div><div class="bar"><span style="width:${p||0}%"></span></div></div>`;
  }).join('')||`<div class="muted" style="font-size:13px">Belum ada bab di lesson plan.</div>`;

  /* ===== filter bulan riwayat (sesi + PR sinkron, default bulan terbaru) ===== */
  const monthKey=d=>{const x=new Date(d+'T00:00');return x.getFullYear()+'-'+x.getMonth()};
  const monthLbl=k=>{const[y,m]=k.split('-').map(Number);return MONTHS[m]+' '+y};
  const months=[...new Set([...s.sessions.map(se=>se.tanggal),...s.pr.map(p=>p.tanggal)].map(monthKey))]
    .sort((a,b)=>{const[ay,am]=a.split('-').map(Number),[by,bm]=b.split('-').map(Number);return (by-ay)||(bm-am)});
  if(histSid!==s.id){histSid=s.id;histMonth=months.length?months[0]:'all'}
  if(histMonth!=='all'&&!months.includes(histMonth))histMonth=months.length?months[0]:'all';
  const inHist=d=>histMonth==='all'||monthKey(d)===histMonth;
  const monthSelect=`<select class="histmonth" style="max-width:160px;font-size:12px;padding:5px 8px">${months.map(k=>`<option value="${k}" ${histMonth===k?'selected':''}>${monthLbl(k)}</option>`).join('')}<option value="all" ${histMonth==='all'?'selected':''}>Semua bulan</option></select>`;

  const sesFilt=s.sessions.filter(se=>inHist(se.tanggal));
  const sesHtml=sesFilt.slice().sort((a,b)=>b.tanggal.localeCompare(a.tanggal)).map(se=>{
    const tot=se.items.reduce((a,i)=>a+Number(i.nSoal||0),0),ben=se.items.reduce((a,i)=>a+Number(i.nBenar||0),0);
    const subs=se.items.map(i=>esc(i.subbab)).join(', ');
    const sal=se.items.flatMap(i=>(i.salah||[]).map(x=>x.no));
    return `<tr>
      <td>${fmtDate(se.tanggal)}</td><td>${subs}${sal.length?`<div class="muted" style="font-size:11.5px">salah: ${fmtNomor(sal)}</div>`:''}</td>
      <td>${ben}/${tot}${tot?' · '+Math.round(ben/tot*100)+'%':''}</td>
      <td style="text-align:right;white-space:nowrap"><a class="link" data-sesedit="${se.id}">edit</a> · <a class="link" data-sesrep="${se.id}">teks</a> · <a class="link" data-sesdel="${se.id}">×</a></td></tr>`;
  }).join('')||`<tr><td colspan="4" class="muted" style="padding:14px">${s.sessions.length?'Tidak ada sesi di bulan ini.':'Belum ada sesi.'}</td></tr>`;

  const prFilt=s.pr.filter(pr=>inHist(pr.tanggal));
  const prHtml=prFilt.length?prFilt.slice().sort((a,b)=>b.tanggal.localeCompare(a.tanggal)).map(pr=>`<tr>
      <td>${fmtDate(pr.tanggal)}</td><td>${esc(pr.bab||'—')}${pr.judul?' · '+esc(pr.judul):''}${(()=>{const its=(pr.items||[]).filter(i=>(i.salah||[]).length);
        if(its.length)return its.map(i=>`<div class="muted" style="font-size:11.5px">${esc(i.sumberNama||'bagian')}${i.nomor?' ('+esc(i.nomor)+')':''} — salah: ${fmtNomor(i.salah.map(x=>x.no))}</div>`).join('');
        return (pr.items||[]).length>1?`<div class="muted" style="font-size:11.5px">${pr.items.length} bagian</div>`:''})()}</td>
      <td>${pr.nBenar}/${pr.nSoal}${pr.nSoal?' · '+Math.round(pr.nBenar/pr.nSoal*100)+'%':''}</td>
      <td style="text-align:right;white-space:nowrap"><a class="link" data-predit="${pr.id}">edit</a> · <a class="link" data-prrep="${pr.id}">teks</a> · <a class="link" data-prdel="${pr.id}">×</a></td></tr>`).join(''):`<tr><td colspan="4" class="muted" style="padding:14px">${s.pr.length?'Tidak ada PR di bulan ini.':'Belum ada PR.'}</td></tr>`;

  return `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
      <a class="link" onclick="go('murid')">←</a>
      <div class="avatar" style="width:42px;height:42px;font-size:15px">${initials(s.nama)}</div>
      <div><div style="font-size:17px;font-weight:600">${esc(s.nama)}</div>
        <div class="muted" style="font-size:12px">${esc(s.kelas)}${s.mapel?' · '+esc(s.mapel):''} · mulai ${fmtDate(s.mulai)} · ${rp(tarifOf(s))}/${DB.settings.durasiStandar} menit</div></div>
      <div style="flex:1"></div>
      <button class="btn sm" data-editstudent><span>✎</span> Edit</button>
      <button class="btn sm" data-monthrep>▤ Laporan bulanan</button>
      <button class="btn sm danger" data-archive>⭳ Arsipkan</button>
    </div>

    <div class="grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:22px">
      <div class="stat"><div class="lbl">Bab selesai</div><div class="val">${babDone(s)}<small>/${babList(s).length||0}</small></div></div>
      <div class="stat"><div class="lbl">Pemahaman</div><div class="val">${pct==null?'—':pct+'<small>%</small>'}</div></div>
      <div class="stat"><div class="lbl">Total sesi</div><div class="val">${s.sessions.length}</div></div>
      <div class="stat"><div class="lbl">Lanjut ke</div><div class="val" style="font-size:14px;padding-top:6px">${nextTopic(s)?esc(nextTopic(s)):'—'}</div></div>
    </div>

    <div class="card" style="margin-bottom:18px"><div class="sectitle">Pemahaman per bab</div>${babHtml}</div>

    <div class="card" style="margin-bottom:18px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="sectitle" style="margin:0">Lesson plan</div>
        <button class="btn sm" id="addPlan">+ Sub-bab</button>
      </div>
      ${planSection(s)}
      <div class="muted" style="font-size:11.5px;margin-top:8px">Klik pill status untuk ubah (belum → berjalan → selesai), atau lewat tombol edit.</div>
    </div>

    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:8px;flex-wrap:wrap">
        <div class="sectitle" style="margin:0">Riwayat sesi</div>
        <div style="display:flex;gap:8px;align-items:center">${monthSelect}<button class="btn sm primary" id="addSession">+ Input sesi</button></div>
      </div>
      <div class="tablewrap"><table class="list"><thead><tr><th>TANGGAL</th><th>SUB-BAB</th><th>MANDIRI</th><th></th></tr></thead><tbody>${sesHtml}</tbody></table></div>
    </div>

    <div class="card" style="margin-top:18px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:8px;flex-wrap:wrap">
        <div class="sectitle" style="margin:0">PR / tugas rumah</div>
        <div style="display:flex;gap:8px;align-items:center">${monthSelect}<button class="btn sm" id="addPr">+ Input PR</button></div>
      </div>
      <div class="tablewrap"><table class="list"><thead><tr><th>TANGGAL</th><th>BAB / JUDUL</th><th>NILAI</th><th></th></tr></thead><tbody>${prHtml}</tbody></table></div>
      <div class="muted" style="font-size:11.5px;margin-top:8px">PR ikut dihitung ke persentase pemahaman keseluruhan (digabung dengan latihan sesi). Persentase per bab dihitung dari latihan sesi saja — nilai PR per bab ditampilkan terpisah di sebelahnya.</div>
    </div>`;
}

function planRow(s,p,showBab){
  const pc=subbabPct(s,p.bab,p.subbab);
  const cls=p.status==='selesai'?'done':p.status==='berjalan'?'prog':'';
  return `<tr>
    <td style="white-space:nowrap">${p.startDate?fmtDate(p.startDate):'<span class="muted">—</span>'}</td>
    ${showBab?`<td>${esc(p.bab)}</td>`:''}
    <td>${esc(p.subbab)}</td>
    <td>${pc==null?'—':pc+'%'}</td>
    <td><span class="pill statustoggle ${cls}" data-planstat="${p.id}" title="klik untuk ubah status">${p.status}</span></td>
    <td class="muted" style="font-size:12px">${esc(p.catatan||'')}</td>
    <td style="text-align:right;white-space:nowrap"><a class="link" data-planedit="${p.id}">edit</a> · <a class="link" data-plandel="${p.id}">×</a></td></tr>`;
}
function planGrouped(s,plans){
  const babs=[];plans.forEach(p=>{if(!babs.includes(p.bab))babs.push(p.bab)});
  let h=`<div class="tablewrap"><table class="list"><thead><tr><th>TANGGAL</th><th>SUB-BAB</th><th>PEMAHAMAN</th><th>STATUS</th><th>CATATAN</th><th></th></tr></thead><tbody>`;
  babs.forEach(b=>{
    h+=`<tr><td colspan="6" style="font-weight:600;font-size:12px;background:var(--sectionbg);color:var(--mainblue-dark);padding:5px 8px">${esc(b)}</td></tr>`;
    plans.filter(p=>p.bab===b).slice().sort((a,c)=>(a.startDate||'~').localeCompare(c.startDate||'~')).forEach(p=>h+=planRow(s,p,false));
  });
  return h+`</tbody></table></div>`;
}
function planSection(s){
  if(!s.plan.length)return `<div class="tablewrap"><table class="list"><thead><tr><th>TANGGAL</th><th>BAB</th><th>SUB-BAB</th><th>PEMAHAMAN</th><th>STATUS</th><th>CATATAN</th><th></th></tr></thead><tbody><tr><td colspan="7" class="muted" style="padding:14px">Belum ada sub-bab. Tambahkan untuk mulai.</td></tr></tbody></table></div>`;
  if(!planWeekMon)planWeekMon=mondayStr(new Date());
  const toolbar=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap">
    ${planAll?'':`<button class="btn sm" id="pw_prev">‹</button>
    <span style="font-size:12.5px;font-weight:600;min-width:160px;text-align:center">${weekLabel(planWeekMon)}</span>
    <button class="btn sm" id="pw_next">›</button>
    <button class="btn sm" id="pw_today">Minggu ini</button>`}
    <div style="flex:1"></div>
    <button class="btn sm ${planAll?'primary':''}" id="pw_all">${planAll?'‹ Per minggu':'Semua'}</button></div>`;
  if(planAll)return toolbar+planGrouped(s,s.plan);
  const mon=planWeekMon,sun=addDaysStr(mon,6);
  const inWeek=s.plan.filter(p=>p.startDate&&p.startDate>=mon&&p.startDate<=sun).slice().sort((a,b)=>a.startDate.localeCompare(b.startDate));
  const unsched=s.plan.filter(p=>!p.startDate);
  let html=toolbar+`<div class="tablewrap"><table class="list"><thead><tr><th>TANGGAL</th><th>BAB</th><th>SUB-BAB</th><th>PEMAHAMAN</th><th>STATUS</th><th>CATATAN</th><th></th></tr></thead><tbody>`;
  html+=inWeek.length?inWeek.map(p=>planRow(s,p,true)).join(''):`<tr><td colspan="7" class="muted" style="padding:14px">Tidak ada sub-bab dijadwalkan di minggu ini.</td></tr>`;
  html+=`</tbody></table></div>`;
  if(unsched.length)html+=`<div class="sectitle" style="font-size:12px;margin:16px 0 8px">Belum dijadwalkan</div>`+planGrouped(s,unsched);
  return html;
}
function viewModul(){
  const coll=modulTab==='modul'?DB.modul:DB.bank;
  const kind=modulTab==='modul'?'modul':'bank soal';
  const top=`<div style="display:flex;gap:8px;margin-bottom:14px">
    <button class="btn sm ${modulTab==='modul'?'primary':''}" data-tab="modul">Modul</button>
    <button class="btn sm ${modulTab==='bank'?'primary':''}" data-tab="bank">Bank soal</button>
    <div style="flex:1"></div>
    <button class="btn primary" id="addLib">+ Tambah ${kind}</button></div>`;
  if(!coll.length)return top+`<div class="empty"><div class="ic">▤</div>Belum ada ${kind}.<br><span>Tambahkan bab per jenjang.</span></div>`;
  const jens=JENJANG.filter(j=>coll.some(x=>x.jenjang===j));
  if(!jens.includes(modulJenjang))modulJenjang=jens[0];
  const jenBtns=`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">`+jens.map(j=>`<button class="btn sm ${modulJenjang===j?'primary':''}" data-jen="${esc(j)}">${esc(j)}</button>`).join('')+`</div>`;
  let body='';
  coll.filter(x=>x.jenjang===modulJenjang).forEach(it=>{
    const babLink=it.link?` &nbsp;<a class="link" href="${esc(it.link)}" target="_blank" onclick="event.stopPropagation()" style="font-size:12px">buka ${kind}</a>`:'';
    const cnt=modulTab==='modul'?`<span class="muted" style="font-size:11.5px;font-weight:400">${it.subs.length} sub-bab</span>`
      :((it.sets||[]).length?`<span class="muted" style="font-size:11.5px;font-weight:400">${it.sets.length} kelompok</span>`:'');
    body+=`<details class="card lib" style="margin-bottom:12px">
      <summary style="display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex;align-items:center;gap:8px"><span class="caret">▸</span><b style="font-size:13.5px">${esc(it.bab)}</b>${it.mapel?` <span class="muted" style="font-size:12px">· ${esc(it.mapel)}</span>`:''} ${cnt}${babLink}</div>
        <div style="white-space:nowrap"><a class="link" data-libedit="${it.id}">edit</a> · <a class="link" data-libdel="${it.id}">×</a></div></summary>
      <div style="margin-top:10px">`;
    if(modulTab==='modul'){
      if(it.subs.length)body+=`<table class="list"><tbody>`+it.subs.map(sb=>`<tr><td>${esc(sb.nama)}</td><td style="text-align:right">${sb.link?`<a class="link" href="${esc(sb.link)}" target="_blank">buka</a>`:'<span class="muted">—</span>'}</td></tr>`).join('')+`</tbody></table>`;
      else body+=`<div class="muted" style="font-size:12px">Belum ada sub-bab.</div>`;
    }else{
      if((it.sets||[]).length)body+=`<table class="list"><tbody>`+it.sets.map(st=>{const subs=setSubs(st);const shtml=subs.length?subs.map(x=>`<div>${esc(x)}</div>`).join(''):'<span class="muted">—</span>';const fhtml=setFiles(st).map(f=>`<div class="muted" style="font-size:11px">${esc(f.nama)}</div>`).join('');return `<tr><td>${shtml}${fhtml}</td><td style="text-align:right;white-space:nowrap;vertical-align:top"><span class="muted">${esc(tipeLabel(st.tipe))}</span>${st.topik&&st.topik.length?` · ${st.topik.length} topik`:''}</td></tr>`}).join('')+`</tbody></table>`;
      else body+=`<div class="muted" style="font-size:12px">Belum ada set soal.</div>`;
      if(it.isi)body+=`<div style="font-size:13px;white-space:pre-wrap;color:var(--medtext);margin-top:9px">${esc(it.isi)}</div>`;
    }
    body+=`</div></details>`;
  });
  return top+jenBtns+body;
}
function viewYT(){return `<div class="empty"><div class="ic">▷</div>Math YouTube — pipeline &amp; evaluasi video.<br><span class="muted">Menyusul setelah Math Class rampung.</span></div>`}

function viewSettings(){
  const s=DB.settings;
  const tarifInputs=JENJANG.map(j=>`<div class="field" style="margin-bottom:9px"><label>${j}</label><input type="text" inputmode="numeric" data-tarif="${j}" value="${grp(s.tarifPerJenjang[j]||'')}" placeholder="Rp"></div>`).join('');
  return `<div style="max-width:620px">
    <div class="card" style="margin-bottom:16px">
      <div class="sectitle">Umum</div>
      <div class="field"><label>Nama lembaga (muncul di footer laporan)</label><input id="setNama" value="${esc(s.namaLembaga)}"></div>
      <div class="field"><label>Durasi standar per sesi (menit) — dasar tarif</label><input id="setDur" type="number" min="1" value="${s.durasiStandar||90}"></div>
      <div class="field"><label><input type="checkbox" id="setFooter" ${s.showFooterName?'checked':''} style="width:auto;margin-right:6px">Tampilkan nama lembaga di pojok PDF</label></div>
    </div>
    <div class="card" style="margin-bottom:16px">
      <div class="sectitle">Jenis kesalahan (untuk koreksi per nomor)</div>
      <div class="muted" style="font-size:12px;margin-bottom:12px">Satu jenis per baris. Daftar ini muncul sebagai pilihan penyebab saat kamu menandai nomor yang salah.</div>
      <textarea id="setTipe" style="min-height:120px">${esc((s.tipeSalah||[]).join('\n'))}</textarea>
    </div>
    <div class="card">
      <div class="sectitle">Tarif per jenjang (per sesi)</div>
      <div class="muted" style="font-size:12px;margin-bottom:12px">Tarif ini otomatis terisi di form murid sesuai jenjangnya, dan tetap bisa ditimpa manual.</div>
      <div class="grid" style="grid-template-columns:repeat(2,1fr)">${tarifInputs}</div>
    </div>
    <button class="btn primary" id="saveSettings" style="margin-top:14px">Simpan pengaturan</button>
    ${(typeof FIREBASE_ENABLED!=='undefined'&&FIREBASE_ENABLED&&fbUser)?`<div class="card" style="margin-top:16px;display:flex;justify-content:space-between;align-items:center">
      <div><div class="sectitle" style="margin:0">Akun</div><div class="muted" style="font-size:12px">Masuk sebagai ${esc(fbUser.email||'')} · data tersinkron ke cloud</div></div>
      <button class="btn danger sm" id="logoutBtn">Keluar</button></div>`:''}
  </div>`;
}

/* ============ BIND ============ */
function bindView(){
  document.querySelectorAll('[data-open]').forEach(el=>el.onclick=()=>go('detail',el.dataset.open));
  if(cur.view==='murid'){
    $('#addStudent').onclick=()=>studentModal();
    $('#search').oninput=e=>{const q=e.target.value.toLowerCase();document.querySelectorAll('#studentRows tr').forEach(tr=>{tr.style.display=tr.textContent.toLowerCase().includes(q)?'':'none'})};
  }
  if(cur.view==='modul'){
    document.querySelectorAll('[data-tab]').forEach(el=>el.onclick=()=>{modulTab=el.dataset.tab;render()});
    document.querySelectorAll('[data-jen]').forEach(el=>el.onclick=()=>{modulJenjang=el.dataset.jen;render()});
    const coll=modulTab==='modul'?DB.modul:DB.bank;
    $('#addLib').onclick=()=>modulTab==='modul'?modulModal():bankModal();
    document.querySelectorAll('[data-libedit]').forEach(el=>el.onclick=e=>{e.preventDefault();e.stopPropagation();const it=coll.find(x=>x.id===el.dataset.libedit);modulTab==='modul'?modulModal(it):bankModal(it)});
    document.querySelectorAll('[data-libdel]').forEach(el=>el.onclick=e=>{e.preventDefault();e.stopPropagation();if(confirm('Hapus item ini?')){if(modulTab==='modul')DB.modul=DB.modul.filter(x=>x.id!==el.dataset.libdel);else DB.bank=DB.bank.filter(x=>x.id!==el.dataset.libdel);save();render()}});
  }
  if(cur.view==='settings'){
    document.querySelectorAll('[data-tarif]').forEach(el=>attachThousand(el));
    $('#saveSettings').onclick=()=>{
      DB.settings.namaLembaga=$('#setNama').value;DB.settings.showFooterName=$('#setFooter').checked;DB.settings.durasiStandar=Number($('#setDur').value)||90;
      const tipe=$('#setTipe').value.split('\n').map(x=>x.trim()).filter(Boolean);
      DB.settings.tipeSalah=tipe.length?[...new Set(tipe)]:TIPE_SALAH_DEFAULT.slice();
      document.querySelectorAll('[data-tarif]').forEach(el=>{const v=digits(el.value);DB.settings.tarifPerJenjang[el.dataset.tarif]=v?Number(v):''});
      save();$('#brandName').textContent=(DB.settings.namaLembaga||'Capella').split(' ')[0];toast('Pengaturan disimpan');
    };
    const lo=$('#logoutBtn');if(lo)lo.onclick=()=>{if(confirm('Keluar dari akun? Data tetap aman di cloud.'))fbLogout()};
  }
  if(cur.view==='detail')bindDetail();
}
function bindDetail(){
  const s=DB.students.find(x=>x.id===cur.sid);if(!s)return;
  $('[data-editstudent]').onclick=()=>studentModal(s);
  $('[data-archive]').onclick=()=>archiveStudent(s);
  $('[data-monthrep]').onclick=()=>monthReportModal(s);
  $('#addPlan').onclick=()=>planModal(s);
  const pwPrev=$('#pw_prev');if(pwPrev)pwPrev.onclick=()=>{planWeekMon=addDaysStr(planWeekMon,-7);render()};
  const pwNext=$('#pw_next');if(pwNext)pwNext.onclick=()=>{planWeekMon=addDaysStr(planWeekMon,7);render()};
  const pwToday=$('#pw_today');if(pwToday)pwToday.onclick=()=>{planWeekMon=mondayStr(new Date());render()};
  const pwAll=$('#pw_all');if(pwAll)pwAll.onclick=()=>{planAll=!planAll;render()};
  $('#addSession').onclick=()=>sessionModal(s);
  document.querySelectorAll('.histmonth').forEach(el=>el.onchange=()=>{histMonth=el.value;render()});
  document.querySelectorAll('[data-planstat]').forEach(el=>el.onclick=()=>{const p=s.plan.find(x=>x.id===el.dataset.planstat);p.status=p.status==='belum'?'berjalan':p.status==='berjalan'?'selesai':'belum';save();render()});
  document.querySelectorAll('[data-planedit]').forEach(el=>el.onclick=()=>planModal(s,s.plan.find(x=>x.id===el.dataset.planedit)));
  document.querySelectorAll('[data-plandel]').forEach(el=>el.onclick=()=>{if(confirm('Hapus sub-bab ini?')){s.plan=s.plan.filter(x=>x.id!==el.dataset.plandel);save();render()}});
  document.querySelectorAll('[data-sesedit]').forEach(el=>el.onclick=()=>sessionModal(s,s.sessions.find(x=>x.id===el.dataset.sesedit)));
  document.querySelectorAll('[data-sesdel]').forEach(el=>el.onclick=()=>{if(confirm('Hapus sesi ini?')){s.sessions=s.sessions.filter(x=>x.id!==el.dataset.sesdel);save();render()}});
  document.querySelectorAll('[data-sesrep]').forEach(el=>el.onclick=()=>sessionReport(s,s.sessions.find(x=>x.id===el.dataset.sesrep)));
  document.querySelectorAll('[data-babrep]').forEach(el=>el.onclick=()=>babReport(s,el.dataset.babrep));
  $('#addPr').onclick=()=>prModal(s);
  document.querySelectorAll('[data-predit]').forEach(el=>el.onclick=()=>prModal(s,s.pr.find(x=>x.id===el.dataset.predit)));
  document.querySelectorAll('[data-prrep]').forEach(el=>el.onclick=()=>prReport(s,s.pr.find(x=>x.id===el.dataset.prrep)));
  document.querySelectorAll('[data-prdel]').forEach(el=>el.onclick=()=>{if(confirm('Hapus PR ini?')){s.pr=s.pr.filter(x=>x.id!==el.dataset.prdel);save();render()}});
}
