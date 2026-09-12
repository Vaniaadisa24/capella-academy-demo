/* ============ DEMO SEED — data dummy untuk showcase publik ============
   Semua nama murid, tanggal, nilai di bawah ADALAH FIKTIF. Tidak ada data
   murid asli. Seed hanya jalan kalau localStorage masih kosong; hapus data
   lewat DevTools > Application > Local Storage untuk mereset ke seed ini. */
(function seedDemo(){
  var KEY='capella_v1';
  try{ if(localStorage.getItem(KEY)) return; }catch(e){ return; }

  var DEMO={
    settings:{
      namaLembaga:'Capella Academy',
      tarifPerJenjang:{'6 SD':150000,'7 SMP':175000,'8 SMP':175000,'11 SMA':225000},
      durasiStandar:90,
      showFooterName:true
    },
    modul:[
      {id:'m1',jenjang:'8 SMP',mapel:'',bab:'Bentuk Aljabar',link:'',
        subs:[{nama:'Operasi bentuk aljabar',link:''},{nama:'Pemfaktoran',link:''}]},
      {id:'m2',jenjang:'7 SMP',mapel:'',bab:'Bilangan Bulat',link:'',
        subs:[{nama:'Operasi campuran',link:''},{nama:'KPK dan FPB',link:''}]},
      {id:'m3',jenjang:'11 SMA',mapel:'Matematika Wajib',bab:'Limit Fungsi',link:'',
        subs:[{nama:'Limit fungsi aljabar',link:''},{nama:'Limit tak hingga',link:''}]}
    ],
    bank:[
      {id:'b1',jenjang:'8 SMP',mapel:'',bab:'Bentuk Aljabar',isi:'',link:'',
        sets:[{id:'set1',tipe:'tambahan',subbabs:['Pemfaktoran'],subbab:'Pemfaktoran',
          files:[{id:'f1',nama:'Latihan pemfaktoran.pdf'}],topik:[]}]},
      {id:'b2',jenjang:'7 SMP',mapel:'',bab:'Bilangan Bulat',isi:'',link:'',
        sets:[{id:'set2',tipe:'tambahan',subbabs:['Operasi campuran'],subbab:'Operasi campuran',
          files:[],topik:[]}]}
    ],
    students:[
      /* ---------- 1. Bella Kharisma — 8 SMP (~79%) ---------- */
      {id:'st1',nama:'Bella Kharisma',kelas:'8 SMP',mapel:'',mulai:'2026-07-15',lebihBayar:{},
        plan:[
          {id:'p11',bab:'Bentuk Aljabar',subbab:'Operasi bentuk aljabar',startDate:'2026-08-04',status:'selesai',catatan:''},
          {id:'p12',bab:'Bentuk Aljabar',subbab:'Pemfaktoran',startDate:'2026-08-18',status:'selesai',catatan:''},
          {id:'p13',bab:'Persamaan Garis Lurus',subbab:'Gradien',startDate:'2026-09-01',status:'berjalan',catatan:''},
          {id:'p14',bab:'Persamaan Garis Lurus',subbab:'Menyusun persamaan garis',startDate:'2026-09-15',status:'belum',catatan:''}
        ],
        sessions:[
          {id:'se11',tanggal:'2026-08-06',durasi:90,catatan:'Paham konsep suku sejenis; perlu hati-hati tanda negatif.',
            items:[{planId:'p11',bab:'Bentuk Aljabar',subbab:'Operasi bentuk aljabar',sumberId:'',sumberNama:'Modul - Bentuk Aljabar',sumberTipe:'modul',nomor:'1-10',
              salah:[{no:4,tipe:'salah hitung',cat:'lupa tanda negatif saat distribusi'},{no:9,tipe:'kurang teliti menulis',cat:''}],catNo:[],nSoal:10,nBenar:8}]},
          {id:'se12',tanggal:'2026-08-20',durasi:90,catatan:'',
            items:[{planId:'p12',bab:'Bentuk Aljabar',subbab:'Pemfaktoran',sumberId:'',sumberNama:'Soal tambahan - Bentuk Aljabar',sumberTipe:'tambahan',nomor:'1-8',
              salah:[{no:5,tipe:'salah konsep',cat:'bingung pola selisih dua kuadrat'}],catNo:[{no:7,teks:'benar, tapi langkah bisa lebih ringkas'}],nSoal:8,nBenar:7}]},
          {id:'se13',tanggal:'2026-09-03',durasi:90,catatan:'Mulai bab baru; rumus gradien perlu diulang.',
            items:[{planId:'p13',bab:'Persamaan Garis Lurus',subbab:'Gradien',sumberId:'',sumberNama:'Modul - Persamaan Garis Lurus',sumberTipe:'modul',nomor:'1-6',
              salah:[{no:2,tipe:'salah konsep',cat:'tertukar rumus gradien'},{no:6,tipe:'salah hitung',cat:''}],catNo:[],nSoal:6,nBenar:4}]}
        ],
        pr:[
          {id:'pr11',bab:'Bentuk Aljabar',judul:'PR pemfaktoran',tanggal:'2026-08-22',catatan:'Mayoritas benar; ulang selisih dua kuadrat.',
            items:[{sumberId:'',sumberNama:'Soal tambahan - Bentuk Aljabar',nomor:'1-10',subbab:'Pemfaktoran',
              salah:[{no:3,tipe:'salah konsep',cat:''},{no:8,tipe:'kurang teliti menulis',cat:''}],catNo:[],nSoal:10,nBenar:8}],nSoal:10,nBenar:8}
        ]},

      /* ---------- 2. Dimas Prayoga — 7 SMP (~71%) ---------- */
      {id:'st2',nama:'Dimas Prayoga',kelas:'7 SMP',mapel:'',mulai:'2026-08-01',lebihBayar:{},
        plan:[
          {id:'p21',bab:'Bilangan Bulat',subbab:'Operasi campuran',startDate:'2026-08-11',status:'selesai',catatan:''},
          {id:'p22',bab:'Bilangan Bulat',subbab:'KPK dan FPB',startDate:'2026-08-25',status:'berjalan',catatan:''},
          {id:'p23',bab:'Bangun Datar',subbab:'Keliling dan luas',startDate:'2026-09-08',status:'belum',catatan:''}
        ],
        sessions:[
          {id:'se21',tanggal:'2026-08-13',durasi:90,catatan:'Perlu latih urutan operasi (KABATAKU).',
            items:[{planId:'p21',bab:'Bilangan Bulat',subbab:'Operasi campuran',sumberId:'',sumberNama:'Modul - Bilangan Bulat',sumberTipe:'modul',nomor:'1-10',
              salah:[{no:3,tipe:'salah baca soal',cat:''},{no:7,tipe:'salah hitung',cat:''},{no:10,tipe:'salah hitung',cat:'urutan operasi'}],catNo:[],nSoal:10,nBenar:7}]},
          {id:'se22',tanggal:'2026-09-05',durasi:90,catatan:'KPK dan FPB masih tertukar.',
            items:[{planId:'p22',bab:'Bilangan Bulat',subbab:'KPK dan FPB',sumberId:'',sumberNama:'Soal tambahan - Bilangan Bulat',sumberTipe:'tambahan',nomor:'1-8',
              salah:[{no:4,tipe:'salah konsep',cat:'tertukar KPK vs FPB'},{no:6,tipe:'salah konsep',cat:''},{no:8,tipe:'kurang teliti menulis',cat:''}],catNo:[],nSoal:8,nBenar:5}]}
        ],
        pr:[
          {id:'pr21',bab:'Bilangan Bulat',judul:'PR operasi campuran',tanggal:'2026-08-15',catatan:'Tinggal teliti di tanda.',
            items:[{sumberId:'',sumberNama:'Soal tambahan - Bilangan Bulat',nomor:'1-10',subbab:'Operasi campuran',
              salah:[{no:2,tipe:'salah hitung',cat:''},{no:9,tipe:'kurang teliti menulis',cat:''}],catNo:[],nSoal:10,nBenar:8}],nSoal:10,nBenar:8}
        ]},

      /* ---------- 3. Nadia Putri — 11 SMA Matematika Wajib (~84%) ---------- */
      {id:'st3',nama:'Nadia Putri',kelas:'11 SMA',mapel:'Matematika Wajib',mulai:'2026-07-20',lebihBayar:{},
        plan:[
          {id:'p31',bab:'Limit Fungsi',subbab:'Limit fungsi aljabar',startDate:'2026-08-05',status:'selesai',catatan:''},
          {id:'p32',bab:'Limit Fungsi',subbab:'Limit tak hingga',startDate:'2026-08-19',status:'selesai',catatan:''},
          {id:'p33',bab:'Turunan Fungsi',subbab:'Aturan turunan',startDate:'2026-09-02',status:'berjalan',catatan:''},
          {id:'p34',bab:'Turunan Fungsi',subbab:'Aturan rantai',startDate:'2026-09-16',status:'belum',catatan:''}
        ],
        sessions:[
          {id:'se31',tanggal:'2026-08-07',durasi:90,catatan:'Cepat paham; hanya salah aritmetika kecil.',
            items:[{planId:'p31',bab:'Limit Fungsi',subbab:'Limit fungsi aljabar',sumberId:'',sumberNama:'Modul - Limit Fungsi',sumberTipe:'modul',nomor:'1-10',
              salah:[{no:8,tipe:'salah hitung',cat:''}],catNo:[],nSoal:10,nBenar:9}]},
          {id:'se32',tanggal:'2026-08-21',durasi:90,catatan:'',
            items:[{planId:'p32',bab:'Limit Fungsi',subbab:'Limit tak hingga',sumberId:'',sumberNama:'Modul - Limit Fungsi',sumberTipe:'modul',nomor:'1-8',
              salah:[{no:3,tipe:'salah konsep',cat:'bentuk tak tentu tak hingga per tak hingga'}],catNo:[],nSoal:8,nBenar:7}]},
          {id:'se33',tanggal:'2026-09-04',durasi:90,catatan:'Aturan turunan dasar aman; lanjut aturan rantai.',
            items:[{planId:'p33',bab:'Turunan Fungsi',subbab:'Aturan turunan',sumberId:'',sumberNama:'Modul - Turunan Fungsi',sumberTipe:'modul',nomor:'1-8',
              salah:[{no:5,tipe:'salah hitung',cat:''},{no:6,tipe:'kurang teliti menulis',cat:''}],catNo:[],nSoal:8,nBenar:6}]}
        ],
        pr:[
          {id:'pr31',bab:'Limit Fungsi',judul:'PR limit',tanggal:'2026-08-23',catatan:'Konsisten baik.',
            items:[{sumberId:'',sumberNama:'Soal tambahan - Limit Fungsi',nomor:'1-12',subbab:'Limit tak hingga',
              salah:[{no:4,tipe:'salah hitung',cat:''},{no:11,tipe:'salah konsep',cat:''}],catNo:[],nSoal:12,nBenar:10}],nSoal:12,nBenar:10}
        ]},

      /* ---------- 4. Aisyah Zahra — 6 SD (~77%) ---------- */
      {id:'st4',nama:'Aisyah Zahra',kelas:'6 SD',mapel:'',mulai:'2026-08-10',lebihBayar:{},
        plan:[
          {id:'p41',bab:'Pecahan',subbab:'Penjumlahan pecahan',startDate:'2026-08-20',status:'selesai',catatan:''},
          {id:'p42',bab:'Pecahan',subbab:'Perkalian pecahan',startDate:'2026-09-06',status:'berjalan',catatan:''},
          {id:'p43',bab:'Bangun Ruang',subbab:'Volume kubus dan balok',startDate:'',status:'belum',catatan:''}
        ],
        sessions:[
          {id:'se41',tanggal:'2026-08-22',durasi:90,catatan:'Ingatkan samakan penyebut dulu.',
            items:[{planId:'p41',bab:'Pecahan',subbab:'Penjumlahan pecahan',sumberId:'',sumberNama:'Modul - Pecahan',sumberTipe:'modul',nomor:'1-8',
              salah:[{no:2,tipe:'salah konsep',cat:'lupa samakan penyebut'},{no:5,tipe:'salah hitung',cat:''}],catNo:[],nSoal:8,nBenar:6}]},
          {id:'se42',tanggal:'2026-09-08',durasi:90,catatan:'Perkalian pecahan lebih lancar.',
            items:[{planId:'p42',bab:'Pecahan',subbab:'Perkalian pecahan',sumberId:'',sumberNama:'Soal tambahan - Pecahan',sumberTipe:'tambahan',nomor:'1-6',
              salah:[{no:3,tipe:'kurang teliti menulis',cat:''}],catNo:[],nSoal:6,nBenar:5}]}
        ],
        pr:[
          {id:'pr41',bab:'Pecahan',judul:'PR penjumlahan pecahan',tanggal:'2026-08-24',catatan:'Baik untuk usia; teruskan.',
            items:[{sumberId:'',sumberNama:'Soal tambahan - Pecahan',nomor:'1-8',subbab:'Penjumlahan pecahan',
              salah:[{no:1,tipe:'salah konsep',cat:''},{no:6,tipe:'salah hitung',cat:''}],catNo:[],nSoal:8,nBenar:6}],nSoal:8,nBenar:6}
        ]}
    ]
  };

  try{ localStorage.setItem(KEY,JSON.stringify(DEMO)); }catch(e){}
})();
