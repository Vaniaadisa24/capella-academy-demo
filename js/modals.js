/* ============ MODALS ============ */
function openModal(html){$('#modalRoot').innerHTML=`<div class="overlay">${html}</div>`;$('#modalRoot .overlay').onclick=e=>{if(e.target.classList.contains('overlay'))closeModal()}}
function closeModal(){$('#modalRoot').innerHTML=''}

/* ============ KOMPONEN KOREKSI PER NOMOR (dipakai modal PR & modal sesi) ============
   korInit(root,o,ctx) -> pasang; korCtx(root,ctx) -> ganti konteks bab/sub-bab;
   korRead(root) -> {sumberId,sumberNama,nomor,salah,nSoal,nBenar}
   ctx = {student, jenjang, bab, subbab, skipId}                                   */
function korInit(root,o,ctx){
  const ada=o&&(Number(o.nSoal||0)||Number(o.nBenar||0));
  root._kor={mode:pakaiChecklist(o)?'nomor':(ada?'angka':'nomor'),
    sumberId:(o&&o.sumberId)||'',sumberNama:(o&&o.sumberNama)||'',sumberTipe:(o&&o.sumberTipe)||'',nomor:(o&&o.nomor)||'',
    salah:((o&&o.salah)||[]).map(x=>({no:Number(x.no),tipe:x.tipe||'',cat:x.cat||''})),
    catNo:((o&&o.catNo)||[]).map(x=>({no:Number(x.no),teks:x.teks||''})),
    nSoal:o?Number(o.nSoal||0):0,nBenar:o?Number(o.nBenar||0):0,ctx:ctx||{}};
  korRender(root);
}
function korCtx(root,ctx){if(!root._kor)return;root._kor.ctx={...root._kor.ctx,...ctx};korRender(root)}
/* nomor yang sudah pernah tercatat untuk file/kelompok yang sama pada murid ini (cocok lewat id+tipe+sub-bab) */
function korTerpakai(k){
  const st=k.ctx.student;if(!st||!k.sumberId)return [];
  const tipe=k.sumberTipe||'';
  const sub=normNama(k.ctx.subbab||'');
  const match=it=>it.sumberId===k.sumberId&&(it.sumberTipe||'')===tipe&&normNama(it.subbab||'')===sub;
  const out=[];
  st.sessions.forEach(se=>se.items.forEach(it=>{if(it!==k.ctx.skipObj&&match(it))out.push(...parseNomor(it.nomor))}));
  (st.pr||[]).forEach(p=>(p.items||[]).forEach(it=>{if(it!==k.ctx.skipObj&&match(it))out.push(...parseNomor(it.nomor))}));
  return [...new Set(out)].sort((a,b)=>a-b);
}
function korRender(root){
  const k=root._kor,c=k.ctx;
  if(k.mode==='angka'){
    root.innerHTML=`<div class="row" style="align-items:end;margin:0">
      <div class="field" style="margin:0"><label>Jumlah soal</label><input class="k_n" type="number" min="0" value="${k.nSoal}"></div>
      <div class="field" style="margin:0"><label>Benar</label><input class="k_b" type="number" min="0" value="${k.nBenar}"></div></div>
      <a class="link k_mode" style="font-size:12px;display:inline-block;margin-top:6px">▤ Pakai checklist nomor</a>`;
    root.querySelector('.k_n').oninput=e=>{k.nSoal=Number(e.target.value||0);korUbah(k)};
    root.querySelector('.k_b').oninput=e=>{k.nBenar=Number(e.target.value||0);korUbah(k)};
    root.querySelector('.k_mode').onclick=()=>{k.mode='nomor';if(!k.nomor&&k.nSoal)k.nomor='1-'+k.nSoal;korRender(root)};
    korUbah(k);
    return;
  }
  const sumberList=sumberFor(c.jenjang,c.bab,c.subbab);
  const known=(!k.sumberId)||sumberList.some(s=>s.id===k.sumberId);
  const grp={};sumberList.forEach(s=>{(grp[s.tipe]=grp[s.tipe]||[]).push(s)});
  const optOf=s=>`<option value="src:${esc(s.id)}" ${k.sumberId===s.id?'selected':''}>${esc(s.bab)}${s.nama?' · '+esc(s.nama):''}</option>`;
  const opts=`<option value="">— tanpa sumber —</option>`
    +(grp.modul?`<optgroup label="Modul">`+grp.modul.map(optOf).join('')+`</optgroup>`:'')
    +(grp.tambahan?`<optgroup label="Soal tambahan">`+grp.tambahan.map(optOf).join('')+`</optgroup>`:'')
    +(!known?`<option value="keep:${esc(k.sumberId)}" selected>${esc(k.sumberNama||'(sumber sebelumnya)')}</option>`:'');
  const nos=parseNomor(k.nomor);
  k.salah=k.salah.filter(x=>nos.includes(x.no));
  k.catNo=k.catNo.filter(x=>nos.includes(x.no)&&!k.salah.some(y=>y.no===x.no));
  const salahNo=k.salah.map(x=>x.no),catNo=k.catNo.map(x=>x.no);
  const grid=nos.length?`<div class="numgrid">`+nos.map(n=>`<button type="button" class="numbtn${salahNo.includes(n)?' wrong':(catNo.includes(n)?' noted':'')}" data-no="${n}">${n}</button>`).join('')+`</div>`
    :`<div class="muted" style="font-size:12px;margin:5px 0">Isi nomor yang dikerjakan dulu, mis. <b>1-10</b> atau <b>1,3,7-10</b>.</div>`;
  const tipeOpts=t=>`<option value="">— penyebab —</option>`+(DB.settings.tipeSalah||[]).map(x=>`<option ${t===x?'selected':''}>${esc(x)}</option>`).join('')
    +(t&&!(DB.settings.tipeSalah||[]).includes(t)?`<option selected>${esc(t)}</option>`:'');
  const sisaOpts=n=>nos.filter(x=>x===n||(!salahNo.includes(x)&&!catNo.includes(x)))
    .map(x=>`<option value="${x}" ${x===n?'selected':''}>No. ${x}</option>`).join('');
  const tags=k.salah.slice().sort((a,b)=>a.no-b.no).map(x=>`<div class="korrow" data-no="${x.no}">
      <b>No. ${x.no}</b><select class="k_tipe">${tipeOpts(x.tipe)}</select>
      <input class="k_cat" value="${esc(x.cat)}" placeholder="catatan (opsional) — ikut ke teks WA"></div>`).join('')
    +k.catNo.slice().sort((a,b)=>a.no-b.no).map(x=>`<div class="catrow" data-no="${x.no}">
      <select class="c_no">${sisaOpts(x.no)}</select>
      <input class="c_teks" value="${esc(x.teks)}" placeholder="catatan untuk nomor ini — ikut ke rapor &amp; teks WA">
      <button type="button" class="btn sm c_del">×</button></div>`).join('');
  const bisaTambah=nos.filter(x=>!salahNo.includes(x)&&!catNo.includes(x)).length;
  const pakai=korTerpakai(k),tabrak=pakai.filter(n=>nos.includes(n));
  root.innerHTML=`
    <div class="field" style="margin-bottom:8px"><label>Sumber soal</label><select class="k_sumber">${opts}</select></div>
    <div class="field" style="margin-bottom:6px"><label>Nomor dikerjakan</label>
      <input class="k_nomor" value="${esc(k.nomor)}" placeholder="mis. 1-10 atau 1,3,7-10"></div>
    ${pakai.length?`<div class="muted" style="font-size:12px;margin-bottom:6px">Sudah pernah dikerjakan dari berkas ini: <b>${fmtNomor(pakai)}</b>${tabrak.length?` <span style="color:#C0392B">· nomor ${fmtNomor(tabrak)} tercatat dua kali</span>`:''}</div>`:''}
    ${nos.length?`<label style="font-size:12px">Tandai yang <b>SALAH</b> (ketuk nomornya)</label>`:''}
    ${grid}
    ${tags?`<div class="korlist">${tags}</div>`:''}
    ${bisaTambah?`<a class="link k_addcat" style="font-size:12px;display:inline-block;margin-top:8px">+ catatan nomor</a>`:''}
    <div class="korsum">Benar: <b>${nos.length-k.salah.length}</b> / ${nos.length}${nos.length?` · ${Math.round((nos.length-k.salah.length)/nos.length*100)}%`:''}
      <a class="link k_mode" style="font-size:12px;margin-left:10px">↢ input angka saja</a></div>`;
  const sel=root.querySelector('.k_sumber');
  sel.onchange=()=>{
    const v=sel.value;
    if(v.startsWith('src:')){const src=sumberById(v.slice(4));if(src){k.sumberId=src.id;k.sumberTipe=src.tipe;k.sumberNama=src.label;}}
    else if(v.startsWith('keep:')){/* sumber sebelumnya — biarkan apa adanya */}
    else{k.sumberTipe='';k.sumberId='';k.sumberNama='';}
    korRender(root);
  };
  const inp=root.querySelector('.k_nomor');
  inp.onchange=()=>{
    const baru=parseNomor(inp.value);
    const hilang=[...k.salah.filter(x=>!baru.includes(x.no)).map(x=>x.no),...k.catNo.filter(x=>x.teks&&!baru.includes(x.no)).map(x=>x.no)];
    if(hilang.length&&!confirm('Nomor '+fmtNomor(hilang)+' sudah punya tanda/catatan tapi di luar rentang baru. Hapus?')){inp.value=k.nomor;return}
    k.nomor=fmtNomor(baru);korRender(root);
  };
  /* ketuk nomor = tandai salah; catatan yang sudah ada ikut pindah, tidak hilang */
  root.querySelectorAll('.numbtn').forEach(b=>b.onclick=()=>{
    const n=Number(b.dataset.no),i=k.salah.findIndex(x=>x.no===n);
    if(i<0){
      const j=k.catNo.findIndex(x=>x.no===n),teks=j<0?'':k.catNo[j].teks;
      if(j>=0)k.catNo.splice(j,1);
      k.salah.push({no:n,tipe:'',cat:teks});
    }else{
      const teks=k.salah[i].cat;k.salah.splice(i,1);
      if(teks)k.catNo.push({no:n,teks});
    }
    korRender(root);
  });
  root.querySelectorAll('.korrow').forEach(r=>{
    const n=Number(r.dataset.no),x=k.salah.find(y=>y.no===n);
    r.querySelector('.k_tipe').onchange=e=>{x.tipe=e.target.value};
    r.querySelector('.k_cat').oninput=e=>{x.cat=e.target.value};
  });
  root.querySelectorAll('.catrow').forEach(r=>{
    const n=Number(r.dataset.no),x=k.catNo.find(y=>y.no===n);
    r.querySelector('.c_no').onchange=e=>{x.no=Number(e.target.value);korRender(root)};
    r.querySelector('.c_teks').oninput=e=>{x.teks=e.target.value};
    r.querySelector('.c_del').onclick=()=>{k.catNo=k.catNo.filter(y=>y!==x);korRender(root)};
  });
  const add=root.querySelector('.k_addcat');
  if(add)add.onclick=()=>{
    const kosong=nos.find(x=>!k.salah.some(y=>y.no===x)&&!k.catNo.some(y=>y.no===x));
    if(kosong==null){toast('Semua nomor sudah punya catatan');return}
    k.catNo.push({no:kosong,teks:''});korRender(root);
    const el=[...root.querySelectorAll('.c_teks')].pop();if(el)el.focus();
  };
  root.querySelector('.k_mode').onclick=()=>{k.mode='angka';k.nSoal=nos.length;k.nBenar=nos.length-k.salah.length;korRender(root)};
  korUbah(k);
}
/* beri tahu pemanggil (mis. total PR multi-bagian) bahwa isinya berubah */
function korUbah(k){if(k.ctx&&typeof k.ctx.onChange==='function')k.ctx.onChange()}
function korRead(root){
  const k=root._kor;if(!k)return null;
  if(k.mode==='angka')return {sumberId:k.sumberId,sumberNama:k.sumberNama,sumberTipe:k.sumberTipe||'',nomor:'',salah:[],catNo:[],nSoal:Number(k.nSoal||0),nBenar:Number(k.nBenar||0)};
  const nos=parseNomor(k.nomor),salah=k.salah.filter(x=>nos.includes(x.no));
  const cat=k.catNo.filter(x=>x.teks&&nos.includes(x.no)&&!salah.some(y=>y.no===x.no));
  return {sumberId:k.sumberId,sumberNama:k.sumberNama||(sumberById(k.sumberId)||{}).label||'',sumberTipe:k.sumberTipe||'',nomor:fmtNomor(nos),
    salah:salah.map(x=>({no:x.no,tipe:x.tipe||'',cat:x.cat||''})),
    catNo:cat.map(x=>({no:x.no,teks:x.teks})),nSoal:nos.length,nBenar:nos.length-salah.length};
}

function studentModal(s){
  const e=s||{nama:'',kelas:'7 SMP',mapel:'',mulai:new Date().toISOString().slice(0,10),tarif:'',kontak:'',catatan:''};
  const initTarif=(e.tarif!==''&&e.tarif!=null)?e.tarif:(DB.settings.tarifPerJenjang[e.kelas]||'');
  openModal(`<div class="modal"><h2>${s?'Edit murid':'Tambah murid'}<span class="x" onclick="closeModal()">×</span></h2>
    <div class="row"><div class="field"><label>Nama</label><input id="m_nama" value="${esc(e.nama)}"></div>
    <div class="field"><label>Kelas / jenjang</label><select id="m_kelas">${JENJANG.map(j=>`<option ${e.kelas===j?'selected':''}>${j}</option>`).join('')}</select></div></div>
    <div class="row"><div class="field"><label>Mapel (opsional)</label><input id="m_mapel" value="${esc(e.mapel)}" placeholder="mis. Matematika Wajib"></div>
    <div class="field"><label>Mulai les</label><input id="m_mulai" type="date" value="${e.mulai}"></div></div>
    <div class="row"><div class="field"><label>Tarif/sesi (otomatis ikut jenjang, bisa diubah)</label><input id="m_tarif" type="text" inputmode="numeric" value="${grp(initTarif)}"></div>
    <div class="field"><label>Kontak ortu (opsional)</label><input id="m_kontak" value="${esc(e.kontak)}"></div></div>
    <div class="field"><label>Catatan (opsional)</label><textarea id="m_cat">${esc(e.catatan)}</textarea></div>
    <div class="modal-actions"><button class="btn" onclick="closeModal()">Batal</button><button class="btn primary" id="m_save">Simpan</button></div></div>`);
  attachThousand($('#m_tarif'));
  $('#m_kelas').onchange=()=>{$('#m_tarif').value=grp(DB.settings.tarifPerJenjang[$('#m_kelas').value]||'')};
  $('#m_save').onclick=()=>{
    const nama=$('#m_nama').value.trim();if(!nama){toast('Nama wajib diisi');return}
    const kelas=$('#m_kelas').value;const jenDef=DB.settings.tarifPerJenjang[kelas];const tv=digits($('#m_tarif').value);
    const tarif=(tv===''||String(jenDef||'')===tv)?'':tv;
    const data={nama,kelas,mapel:$('#m_mapel').value.trim(),mulai:$('#m_mulai').value,tarif,kontak:$('#m_kontak').value.trim(),catatan:$('#m_cat').value.trim()};
    if(s){Object.assign(s,data)}else{DB.students.push({id:uid(),...data,plan:[],sessions:[]})}
    save();closeModal();cur.view==='detail'?render():go('murid');
  };
}

function modulModal(it){
  const e=it||{jenjang:modulJenjang||'7 SMP',mapel:'',bab:'',link:'',subs:[]};
  const subRow=(nama,link)=>`<div class="row subrow" style="align-items:center;margin-bottom:7px">
    <input class="sn" value="${esc(nama||'')}" placeholder="nama sub-bab" style="flex:1.2">
    <input class="sl" value="${esc(link||'')}" placeholder="link sub-bab (opsional)" style="flex:1.6">
    <button class="btn sm delsub" style="flex:0">×</button></div>`;
  const rows=(e.subs.length?e.subs:[{nama:'',link:''}]).map(sb=>subRow(sb.nama,sb.link)).join('');
  openModal(`<div class="modal wide"><h2>${it?'Edit modul':'Tambah modul'}<span class="x" onclick="closeModal()">×</span></h2>
    <div class="row"><div class="field"><label>Jenjang</label><select id="l_jen">${JENJANG.map(j=>`<option ${e.jenjang===j?'selected':''}>${j}</option>`).join('')}</select></div>
    <div class="field"><label>Mapel (opsional)</label><input id="l_mapel" value="${esc(e.mapel)}" placeholder="mis. Wajib / Tingkat Lanjut"></div></div>
    <div class="field"><label>Nama bab</label><input id="l_bab" value="${esc(e.bab)}"></div>
    <div class="field"><label>Tautan modul (URL, opsional)</label><input id="l_link" value="${esc(e.link)}" placeholder="https://..."></div>
    <label>Sub-bab (input satu per satu)</label>
    <div id="subs">${rows}</div>
    <button class="btn sm" id="addSub">+ sub-bab</button>
    <div class="modal-actions" style="margin-top:14px"><button class="btn" onclick="closeModal()">Batal</button><button class="btn primary" id="l_save">Simpan</button></div></div>`);
  const bindDel=()=>document.querySelectorAll('.delsub').forEach(b=>b.onclick=()=>b.parentElement.remove());
  bindDel();
  $('#addSub').onclick=()=>{$('#subs').insertAdjacentHTML('beforeend',subRow('',''));bindDel()};
  $('#l_save').onclick=()=>{
    const bab=$('#l_bab').value.trim();if(!bab){toast('Nama bab wajib');return}
    const subs=[...document.querySelectorAll('.subrow')].map(r=>({nama:r.querySelector('.sn').value.trim(),link:r.querySelector('.sl').value.trim()})).filter(x=>x.nama);
    const data={jenjang:$('#l_jen').value,mapel:$('#l_mapel').value.trim(),bab,link:$('#l_link').value.trim(),subs};
    if(it)Object.assign(it,data);else DB.modul.push({id:uid(),...data});
    save();closeModal();render();
  };
}
function bankModal(it){
  const e=it||{jenjang:modulJenjang||'7 SMP',mapel:'',bab:'',link:'',isi:'',sets:[]};
  const modulSet=(e.sets||[]).find(s=>s.tipe==='modul')||null;
  const tambahanSets=(e.sets||[]).filter(s=>s.tipe==='tambahan');
  const subRow=(name)=>`<div class="row subrow" style="align-items:center;margin:0 0 4px">
      <input class="m_sub" value="${esc(name||'')}" list="b_sublist" placeholder="sub-bab" style="flex:1">
      <button class="btn sm delsub" type="button" style="flex:0">×</button></div>`;
  const fileRow=(f)=>`<div class="row filerow" style="align-items:center;margin:0 0 4px">
      <input class="m_file" value="${esc(f&&f.nama||'')}" placeholder="nama file / path / link" style="flex:1">
      <input type="hidden" class="m_fid" value="${esc(f&&f.id||'')}">
      <button class="btn sm delfile" type="button" style="flex:0">×</button></div>`;
  /* Soal tambahan = pasangan sub-bab ↔ file, satu baris satu pasangan.
     Set lama yang punya >1 sub-bab / file dipecah jadi beberapa pasangan (tanpa kehilangan data). */
  const pairRow=(sub,f,sid,fid)=>`<div class="row pairrow" style="align-items:center;margin:0 0 5px;gap:5px">
      <input class="p_sub" value="${esc(sub||'')}" list="b_sublist" placeholder="sub-bab" style="flex:1">
      <span class="muted" style="flex:0">→</span>
      <input class="p_file" value="${esc(f&&f.nama||'')}" placeholder="file / path / link" style="flex:1.3">
      <input type="hidden" class="p_sid" value="${esc(sid||'')}">
      <input type="hidden" class="p_fid" value="${esc(fid||'')}">
      <button class="btn sm delpair" type="button" style="flex:0">×</button></div>`;
  const pairDescs=[];
  tambahanSets.forEach(st=>{
    const subs=setSubs(st),files=setFiles(st);
    const subList=subs.length?subs:[''],fileList=files.length?files:[null];
    let first=true;
    subList.forEach(sub=>fileList.forEach(f=>{pairDescs.push({sub,f,sid:first?st.id:'',fid:(first&&f)?f.id:''});first=false}));
  });
  const mSubs=modulSet?setSubs(modulSet):[], mFiles=modulSet?setFiles(modulSet):[];
  const modulSubsHtml=(mSubs.length?mSubs:['']).map(subRow).join('');
  const modulFilesHtml=(mFiles.length?mFiles:[null]).map(fileRow).join('');
  const pairsHtml=(pairDescs.length?pairDescs:[{sub:'',f:null,sid:'',fid:''}]).map(d=>pairRow(d.sub,d.f,d.sid,d.fid)).join('');
  openModal(`<div class="modal wide"><h2>${it?'Edit bank soal':'Tambah bank soal'}<span class="x" onclick="closeModal()">×</span></h2>
    <div class="row"><div class="field"><label>Jenjang</label><select id="b_jen">${JENJANG.map(j=>`<option ${e.jenjang===j?'selected':''}>${j}</option>`).join('')}</select></div>
    <div class="field"><label>Mapel (opsional)</label><input id="b_mapel" value="${esc(e.mapel)}" placeholder="mis. Wajib / Tingkat Lanjut"></div></div>
    <div class="field"><label>Nama bab (pilih dari modul atau ketik)</label>
      <input id="b_bab" value="${esc(e.bab)}" list="b_bablist" placeholder="pilih / ketik">
      <datalist id="b_bablist"></datalist></div>
    <div class="field"><label>Tautan bank soal (URL, opsional)</label><input id="b_link" value="${esc(e.link)}" placeholder="https://..."></div>
    <datalist id="b_sublist"></datalist>
    <label>Modul <span class="muted" style="font-weight:400">— sub-bab yang dicakup + file (boleh beberapa sub-bab satu file)</span></label>
    <div style="padding:9px;border:1px solid var(--line,#e2e8f0);border-radius:8px;margin-top:6px">
      <div class="muted" style="font-size:11.5px;margin-bottom:3px">Sub-bab</div>
      <div id="modulSubs">${modulSubsHtml}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin:2px 0 9px">
        <button class="btn sm" id="addModulSub" type="button">+ sub-bab</button>
        <button class="btn sm" id="fillSet" type="button">↧ Isi sub-bab dari Modul</button></div>
      <div class="muted" style="font-size:11.5px;margin-bottom:3px">File</div>
      <div id="modulFiles">${modulFilesHtml}</div>
      <button class="btn sm" id="addModulFile" type="button">+ file</button></div>
    <label style="display:block;margin-top:13px">Soal tambahan <span class="muted" style="font-weight:400">— tiap baris: sub-bab dan file-nya</span></label>
    <div id="pairs" style="margin-top:6px">${pairsHtml}</div>
    <button class="btn sm" id="addPair" type="button">+ pasangan sub-bab &amp; file</button>
    <div class="field" style="margin-top:13px"><label>Catatan / topik umum (opsional)</label><textarea id="b_isi" style="min-height:70px" placeholder="mis. soal HOTS sudut berpelurus, soal cerita gabungan">${esc(e.isi)}</textarea></div>
    <div class="modal-actions"><button class="btn" onclick="closeModal()">Batal</button><button class="btn primary" id="b_save">Simpan</button></div></div>`);
  const subsOf=()=>{const m=DB.modul.find(x=>x.jenjang===$('#b_jen').value&&x.bab===$('#b_bab').value.trim());return m?m.subs.map(s=>s.nama):[]};
  const refreshLists=()=>{
    $('#b_bablist').innerHTML=modulFor($('#b_jen').value).map(m=>`<option value="${esc(m.bab)}">`).join('');
    $('#b_sublist').innerHTML=subsOf().map(n=>`<option value="${esc(n)}">`).join('');
  };
  const bindDel=(sel,rowsel)=>document.querySelectorAll(sel).forEach(b=>b.onclick=()=>b.closest(rowsel).remove());
  const rebind=()=>{bindDel('.delsub','.subrow');bindDel('.delfile','.filerow');bindDel('.delpair','.pairrow')};
  refreshLists();rebind();
  $('#b_jen').onchange=refreshLists;
  $('#b_bab').oninput=refreshLists;
  $('#addModulSub').onclick=()=>{$('#modulSubs').insertAdjacentHTML('beforeend',subRow(''));rebind()};
  $('#addModulFile').onclick=()=>{$('#modulFiles').insertAdjacentHTML('beforeend',fileRow(null));rebind()};
  $('#addPair').onclick=()=>{$('#pairs').insertAdjacentHTML('beforeend',pairRow('',null,'',''));rebind()};
  $('#fillSet').onclick=()=>{
    const subs=subsOf();
    if(!subs.length){toast('Bab ini belum punya sub-bab di Modul');return}
    const ada=[...document.querySelectorAll('#modulSubs .m_sub')].map(i=>normNama(i.value));
    let n=0;subs.forEach(nm=>{if(!ada.includes(normNama(nm))){$('#modulSubs').insertAdjacentHTML('beforeend',subRow(nm));n++}});
    rebind();toast(n?n+' sub-bab ditambahkan':'Semua sub-bab sudah ada');
  };
  $('#b_save').onclick=()=>{
    const bab=$('#b_bab').value.trim();if(!bab){toast('Nama bab wajib');return}
    const sets=[];
    /* Modul: satu kelompok, sub-bab (bisa banyak) berbagi file */
    const subbabs=[...document.querySelectorAll('#modulSubs .m_sub')].map(i=>i.value.trim()).filter(Boolean);
    const files=[...document.querySelectorAll('#modulFiles .filerow')].map(fr=>({id:fr.querySelector('.m_fid').value||uid(),nama:fr.querySelector('.m_file').value.trim()})).filter(f=>f.nama);
    if(subbabs.length||files.length)sets.push({id:(modulSet&&modulSet.id)||uid(),tipe:'modul',subbabs,subbab:subbabs.join(', '),files,topik:(modulSet&&modulSet.topik)||[]});
    /* Soal tambahan: tiap pasangan = satu kelompok (sub-bab tunggal + file tunggal) */
    [...document.querySelectorAll('.pairrow')].forEach(r=>{
      const sub=r.querySelector('.p_sub').value.trim(),fnama=r.querySelector('.p_file').value.trim();
      if(!sub&&!fnama)return;
      const sid=r.querySelector('.p_sid').value||uid(),fid=r.querySelector('.p_fid').value||uid();
      const old=(it&&(it.sets||[]).find(x=>x.id===sid))||{};
      sets.push({id:sid,tipe:'tambahan',subbabs:sub?[sub]:[],subbab:sub,files:fnama?[{id:fid,nama:fnama}]:[],topik:old.topik||[]});
    });
    const data={jenjang:$('#b_jen').value,mapel:$('#b_mapel').value.trim(),bab,link:$('#b_link').value.trim(),isi:$('#b_isi').value.trim(),sets};
    if(it)Object.assign(it,data);else DB.bank.push({id:uid(),...data});
    save();closeModal();render();
  };
}

function planModal(s,p){
  const e=p||{bab:'',subbab:'',catatan:'',status:'belum',startDate:''};
  const lib=modulFor(s.kelas);
  const babs=[...new Set(lib.map(x=>x.bab))];
  const subNames=bab=>[...new Set(lib.filter(x=>x.bab===bab).flatMap(x=>(x.subs||[]).map(sb=>sb.nama)))];
  const babManual=!!e.bab&&!babs.includes(e.bab);
  const babSel=`<select id="p_babsel">${babs.map(b=>`<option ${!babManual&&e.bab===b?'selected':''}>${esc(b)}</option>`).join('')}<option value="__m" ${babManual||!babs.length?'selected':''}>✎ Ketik manual…</option></select>`;
  const subInit=subNames(babManual?'':e.bab);
  const subManual=!!e.subbab&&!subInit.includes(e.subbab);
  const subSel=`<select id="p_subsel">${subInit.map(b=>`<option ${!subManual&&e.subbab===b?'selected':''}>${esc(b)}</option>`).join('')}<option value="__m" ${subManual||!subInit.length?'selected':''}>✎ Ketik manual…</option></select>`;
  openModal(`<div class="modal"><h2>${p?'Edit sub-bab':'Tambah sub-bab'}<span class="x" onclick="closeModal()">×</span></h2>
    <div class="field"><label>Bab ${babs.length?'(dari modul '+esc(s.kelas)+')':'(belum ada modul jenjang ini — ketik manual)'}</label>
      ${babSel}<input id="p_babman" value="${babManual?esc(e.bab):''}" placeholder="ketik nama bab" style="margin-top:6px;display:${babManual||!babs.length?'block':'none'}"></div>
    <div class="field"><label>Sub-bab</label>${subSel}
      <input id="p_subman" value="${subManual?esc(e.subbab):''}" placeholder="ketik nama sub-bab" style="margin-top:6px;display:${subManual||!subInit.length?'block':'none'}"></div>
    <div class="field"><label>Tanggal mulai (opsional — untuk penjadwalan)</label><input id="p_date" type="date" value="${e.startDate||''}"></div>
    <div class="field"><label>Status</label><select id="p_status">
      <option value="belum" ${e.status==='belum'?'selected':''}>belum</option>
      <option value="berjalan" ${e.status==='berjalan'?'selected':''}>berjalan</option>
      <option value="selesai" ${e.status==='selesai'?'selected':''}>selesai</option></select></div>
    <div class="field"><label>Catatan kekurangan (opsional)</label><textarea id="p_cat">${esc(e.catatan)}</textarea></div>
    <div class="modal-actions"><button class="btn" onclick="closeModal()">Batal</button><button class="btn primary" id="p_save">Simpan</button></div></div>`);
  const curBab=()=>{const v=$('#p_babsel').value;return v==='__m'?$('#p_babman').value.trim():v};
  const refreshSub=()=>{
    const names=subNames(curBab());
    $('#p_subsel').innerHTML=names.map(b=>`<option>${esc(b)}</option>`).join('')+`<option value="__m" ${names.length?'':'selected'}>✎ Ketik manual…</option>`;
    $('#p_subman').style.display=($('#p_subsel').value==='__m')?'block':'none';
  };
  $('#p_babsel').onchange=()=>{$('#p_babman').style.display=($('#p_babsel').value==='__m')?'block':'none';refreshSub()};
  $('#p_babman').oninput=refreshSub;
  $('#p_subsel').onchange=()=>{$('#p_subman').style.display=($('#p_subsel').value==='__m')?'block':'none'};
  $('#p_save').onclick=()=>{
    const bab=curBab();const sv=$('#p_subsel').value;const sub=sv==='__m'?$('#p_subman').value.trim():sv;
    if(!bab||!sub){toast('Bab & sub-bab wajib');return}
    if(p){p.bab=bab;p.subbab=sub;p.status=$('#p_status').value;p.catatan=$('#p_cat').value.trim();p.startDate=$('#p_date').value}
    else s.plan.push({id:uid(),bab,subbab:sub,status:$('#p_status').value,catatan:$('#p_cat').value.trim(),startDate:$('#p_date').value,postTest:null});
    save();closeModal();render();
  };
}

function prModal(s,pr){
  const e=pr||{tanggal:new Date().toISOString().slice(0,10),bab:'',judul:'',nSoal:10,nBenar:0,catatan:''};
  const babs=babList(s);
  openModal(`<div class="modal"><h2>${pr?'Edit PR':'Input PR'} — ${esc(s.nama)}<span class="x" onclick="closeModal()">×</span></h2>
    <div class="row"><div class="field"><label>Tanggal</label><input id="pr_date" type="date" value="${e.tanggal}"></div>
    <div class="field"><label>Bab</label><input id="pr_bab" list="prbabl" value="${esc(e.bab)}" placeholder="pilih / ketik">
      <datalist id="prbabl">${babs.map(b=>`<option value="${esc(b)}">`).join('')}</datalist></div></div>
    <label>Bagian PR <span class="muted" style="font-weight:400">— satu bagian per set soal</span></label>
    <datalist id="pr_sublist"></datalist>
    <div id="pr_items" style="margin-top:7px"></div>
    <button class="btn sm" id="pr_add">+ bagian lain</button>
    <div class="korsum" id="pr_total" style="margin-top:10px"></div>
    <div class="field" style="margin-top:12px"><label>Evaluasi PR (opsional — masuk ke ringkasan rapor)</label><textarea id="pr_cat" placeholder="mis. mandiri sudah bagus, tinggal ketelitian">${esc(e.catatan||'')}</textarea></div>
    <div class="modal-actions"><button class="btn" onclick="closeModal()">Batal</button><button class="btn primary" id="pr_save">Simpan</button></div></div>`);
  const bagianHtml=n=>`<div class="pritem" style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
        <b style="font-size:12.5px;color:var(--medtext)">Bagian ${n}</b>
        <button class="btn sm delbag">×</button></div>
      <input class="p_sub" list="pr_sublist" placeholder="sub-bab (opsional — kosongkan bila campuran)" style="width:100%;margin-bottom:8px">
      <div class="p_kor korblok"></div></div>`;
  const nomorUlang=()=>document.querySelectorAll('.pritem').forEach((el,i)=>el.querySelector('b').textContent='Bagian '+(i+1));
  const prTotal=()=>{
    let n=0,b=0;document.querySelectorAll('.p_kor').forEach(el=>{const k=korRead(el);if(k){n+=k.nSoal;b+=k.nBenar}});
    $('#pr_total').innerHTML=`Total: <b>${b}</b> / ${n} benar${n?` · ${Math.round(b/n*100)}%`:''}`;
  };
  const bindBag=()=>document.querySelectorAll('.pritem').forEach(el=>el.querySelector('.delbag').onclick=()=>{
    if(document.querySelectorAll('.pritem').length<2){toast('Minimal satu bagian');return}
    el.remove();nomorUlang();prTotal();
  });
  const subOpts=()=>{const bab=$('#pr_bab').value.trim();const subs=[...new Set(s.plan.filter(p=>p.bab===bab).map(p=>p.subbab).filter(Boolean))];$('#pr_sublist').innerHTML=subs.map(x=>`<option value="${esc(x)}">`).join('')};
  const tambahBagian=(it)=>{
    $('#pr_items').insertAdjacentHTML('beforeend',bagianHtml(document.querySelectorAll('.pritem').length+1));
    const wrap=[...document.querySelectorAll('.pritem')].pop();
    const el=wrap.querySelector('.p_kor'),sub=wrap.querySelector('.p_sub');
    if(it&&it.subbab)sub.value=it.subbab;
    korInit(el,it||null,{student:s,jenjang:s.kelas,bab:$('#pr_bab').value.trim(),subbab:sub.value.trim(),skipObj:it||null,onChange:prTotal});
    sub.oninput=()=>korCtx(el,{subbab:sub.value.trim()});
    bindBag();prTotal();
  };
  subOpts();
  ((pr&&pr.items&&pr.items.length?pr.items:[null])).forEach(tambahBagian);
  $('#pr_bab').oninput=()=>{subOpts();document.querySelectorAll('.p_kor').forEach(el=>korCtx(el,{bab:$('#pr_bab').value.trim()}))};
  $('#pr_add').onclick=()=>tambahBagian(null);
  $('#pr_save').onclick=()=>{
    const items=[];let bad=false;
    document.querySelectorAll('.pritem').forEach(wrap=>{const el=wrap.querySelector('.p_kor');const k=korRead(el);if(!k)return;if(k.nBenar>k.nSoal)bad=true;k.subbab=wrap.querySelector('.p_sub').value.trim();if(k.nSoal||k.nBenar)items.push(k)});
    if(bad){toast('Benar melebihi jumlah soal');return}
    if(!items.length){toast('Isi minimal satu bagian');return}
    /* judul PR tak lagi diinput; nilai lama (jika ada) dibiarkan utuh */
    const data={tanggal:$('#pr_date').value,bab:$('#pr_bab').value.trim(),catatan:$('#pr_cat').value.trim(),items};
    let target=pr;
    if(target)Object.assign(target,data);else{target={id:uid(),...data};s.pr.push(target)}
    totalPr(target);
    save();closeModal();render();
  };
}
function sessionModal(s,se){
  const today=new Date().toISOString().slice(0,10);
  function rowHtml(it){
    const sel=it&&it.planId&&s.plan.some(p=>p.id===it.planId);
    const manVal=(it&&!sel)?`${it.bab} · ${it.subbab}`:'';
    const opts=s.plan.map(p=>`<option value="${p.id}" ${sel&&it.planId===p.id?'selected':''}>${esc(p.bab)} — ${esc(p.subbab)}</option>`).join('');
    return `<div class="itemrow" style="margin-bottom:14px">
      <div class="row" style="align-items:end;margin:0">
        <div class="field" style="flex:2;margin:0"><label>Sub-bab</label><select class="i_plan"><option value="">— pilih / manual —</option>${opts}</select>
        <input class="i_manual" value="${esc(manVal)}" placeholder="atau ketik manual (bab · sub-bab)" style="margin-top:5px;display:${(it&&!sel)?'block':'none'}"></div>
        <button class="btn sm delrow" style="margin-bottom:2px">×</button></div>
      <div class="i_kor korblok" style="margin-top:9px"></div></div>`;
  }
  const initRows=(se&&se.items.length?se.items:[null]).map(rowHtml).join('');
  openModal(`<div class="modal wide"><h2>${se?'Edit sesi':'Input sesi'} — ${esc(s.nama)}<span class="x" onclick="closeModal()">×</span></h2>
    <div class="row"><div class="field"><label>Tanggal sesi</label><input id="se_date" type="date" value="${se?se.tanggal:today}"></div>
    <div class="field"><label>Durasi (menit)</label><input id="se_dur" type="number" min="0" value="${se?(se.durasi||DB.settings.durasiStandar):DB.settings.durasiStandar}"></div>
    <div class="field"><label>Fee sesi (auto, bisa diubah)</label><input id="se_fee" type="text" inputmode="numeric" value=""></div></div>
    <label>Materi yang dikerjakan (mandiri)</label>
    <div id="items">${initRows}</div>
    <button class="btn sm" id="addRow">+ sub-bab lain</button>
    <div class="field" style="margin-top:13px"><label>Catatan pemahaman</label><textarea id="se_cat" placeholder="mis. sudah paham konsep berpelurus, masih perlu latihan soal beraljabar">${se?esc(se.catatan):''}</textarea></div>
    <div class="modal-actions"><button class="btn" onclick="closeModal()">Batal</button><button class="btn primary" id="se_save">Simpan sesi</button></div></div>`);
  const stdDur=Number(DB.settings.durasiStandar||90);
  const proRata=()=>Math.round(tarifOf(s)*Number($('#se_dur').value||stdDur)/stdDur/1000)*1000;
  $('#se_fee').value=grp((se&&se.fee!=null&&se.fee!=='')?se.fee:proRata());
  attachThousand($('#se_fee'));
  $('#se_dur').oninput=()=>{$('#se_fee').value=grp(proRata())};
  /* konteks bab/sub-bab sebuah baris — dipakai komponen koreksi untuk menyaring set soal */
  function ctxOf(row){
    const planId=row.querySelector('.i_plan').value;
    if(planId){const p=s.plan.find(x=>x.id===planId);if(p)return{bab:p.bab,subbab:p.subbab}}
    const m=row.querySelector('.i_manual').value.trim();const parts=m.split('·');
    return {bab:(parts[0]||m).trim(),subbab:(parts[1]||parts[0]||m).trim()};
  }
  function bindRows(){
    document.querySelectorAll('.itemrow').forEach(row=>{
      const sel=row.querySelector('.i_plan');
      sel.onchange=()=>{const man=row.querySelector('.i_manual');man.style.display=sel.value?'none':'block';korCtx(row.querySelector('.i_kor'),ctxOf(row))};
      row.querySelector('.i_manual').onchange=()=>korCtx(row.querySelector('.i_kor'),ctxOf(row));
      row.querySelector('.delrow').onclick=()=>{if(document.querySelectorAll('.itemrow').length>1)row.remove()};
    });
  }
  bindRows();
  (se&&se.items.length?se.items:[null]).forEach((it,i)=>{
    const row=document.querySelectorAll('.itemrow')[i];
    korInit(row.querySelector('.i_kor'),it,{student:s,jenjang:s.kelas,skipObj:it||null,...ctxOf(row)});
  });
  $('#addRow').onclick=()=>{
    $('#items').insertAdjacentHTML('beforeend',rowHtml(null));bindRows();
    const row=[...document.querySelectorAll('.itemrow')].pop();
    korInit(row.querySelector('.i_kor'),null,{student:s,jenjang:s.kelas,skipObj:null,...ctxOf(row)});
  };
  $('#se_save').onclick=()=>{
    const items=[];let bad=false;
    document.querySelectorAll('.itemrow').forEach(r=>{
      const planId=r.querySelector('.i_plan').value;let bab,subbab;
      if(planId){const p=s.plan.find(x=>x.id===planId);bab=p.bab;subbab=p.subbab;if(p.status==='belum')p.status='berjalan'}
      else{const m=r.querySelector('.i_manual').value.trim();if(!m)return;const parts=m.split('·');bab=(parts[0]||m).trim();subbab=(parts[1]||parts[0]||m).trim()}
      const kor=korRead(r.querySelector('.i_kor'))||{nSoal:0,nBenar:0};
      if(kor.nBenar>kor.nSoal)bad=true;
      if(bab&&subbab)items.push({bab,subbab,planId:planId||null,...kor});
    });
    if(!items.length){toast('Isi minimal satu sub-bab');return}
    if(bad){toast('Jumlah benar melebihi jumlah soal');return}
    const dur=Number($('#se_dur').value||stdDur);const feeIn=digits($('#se_fee').value);const fee=(feeIn===''||String(proRata())===feeIn)?'':feeIn;
    if(se){se.tanggal=$('#se_date').value;se.durasi=dur;se.fee=fee;se.catatan=$('#se_cat').value.trim();se.items=items}
    else s.sessions.push({id:uid(),tanggal:$('#se_date').value,durasi:dur,fee,catatan:$('#se_cat').value.trim(),items});
    save();closeModal();render();toast('Sesi tersimpan');
  };
}
