export const schemas = {
  "registration": [
    {
      "name": "studentName",
      "label": "Nama lengkap calon santri",
      "options": null,
      "type": "text",
      "group": "Identitas calon santri",
      "required": true
    },
    {
      "name": "birthPlace",
      "label": "Tempat lahir",
      "options": null,
      "type": "text",
      "group": "Identitas calon santri",
      "required": true
    },
    {
      "name": "birthDate",
      "label": "Tanggal lahir",
      "options": null,
      "type": "date",
      "group": "Identitas calon santri",
      "required": true
    },
    {
      "name": "nisn",
      "label": "Nomor Induk Siswa Nasional (NISN) — isi - jika belum tahu",
      "options": null,
      "type": "text",
      "group": "Identitas calon santri",
      "required": true
    },
    {
      "name": "studentNik",
      "label": "Nomor Induk Kependudukan (NIK) santri",
      "options": null,
      "type": "text",
      "group": "Identitas calon santri",
      "required": true
    },
    {
      "name": "address",
      "label": "Alamat lengkap",
      "options": null,
      "type": "textarea",
      "group": "Identitas calon santri",
      "required": true
    },
    {
      "name": "parentPhone",
      "label": "No. handphone (WA) orang tua",
      "options": null,
      "type": "tel",
      "group": "Identitas calon santri",
      "required": true
    },
    {
      "name": "school",
      "label": "Asal sekolah",
      "options": null,
      "type": "text",
      "group": "Identitas calon santri",
      "required": true
    },
    {
      "name": "lastEducation",
      "label": "Jenjang/tingkat pendidikan terakhir",
      "options": [
        "SD/MI",
        "SMP/MTS",
        "SMA/MA"
      ],
      "type": "text",
      "group": "Identitas calon santri",
      "required": true
    },
    {
      "name": "level",
      "label": "Jenjang tujuan",
      "options": [
        "SMP",
        "SMA"
      ],
      "type": "text",
      "group": "Identitas calon santri",
      "required": true
    },
    {
      "name": "tpa",
      "label": "Asal Taman Pendidikan Al-Qur’an (TPA) — isi - jika tidak ada",
      "options": null,
      "type": "text",
      "group": "Identitas calon santri",
      "required": true
    },
    {
      "name": "weight",
      "label": "Berat badan (kg)",
      "options": null,
      "type": "number",
      "group": "Kesehatan dan keluarga",
      "required": true
    },
    {
      "name": "height",
      "label": "Tinggi badan (cm)",
      "options": null,
      "type": "number",
      "group": "Kesehatan dan keluarga",
      "required": true
    },
    {
      "name": "diseases",
      "label": "Riwayat penyakit",
      "options": [
        "Magh/Asam Lambung",
        "Penyakit Kulit (Scabies/Panu/Kurap/Gatal-Gatal)",
        "Gigi Berlubang",
        "Migrain",
        "Alergi",
        "Asma/Sesak Nafas/Infeksi Saluran Pernafasan",
        "Amandel",
        "Tipes",
        "Tidak ada"
      ],
      "type": "checkbox",
      "group": "Kesehatan dan keluarga",
      "required": true
    },
    {
      "name": "studentCondition",
      "label": "Keadaan santri",
      "options": [
        "Orang Tua Lengkap",
        "Yatim",
        "Piatu",
        "Yatim Piatu"
      ],
      "type": "text",
      "group": "Kesehatan dan keluarga",
      "required": true
    },
    {
      "name": "familyStatus",
      "label": "Status dalam keluarga",
      "options": [
        "Anak Kandung",
        "Anak Angkat/Adopsi",
        "Anak Tiri"
      ],
      "type": "text",
      "group": "Kesehatan dan keluarga",
      "required": true
    },
    {
      "name": "familyCardNumber",
      "label": "No. KK (Kartu Keluarga)",
      "options": null,
      "type": "text",
      "group": "Kesehatan dan keluarga",
      "required": true
    },
    {
      "name": "fatherName",
      "label": "Nama ayah kandung/wali",
      "options": null,
      "type": "text",
      "group": "Data ayah",
      "required": true
    },
    {
      "name": "fatherNik",
      "label": "NIK ayah — isi - jika tidak tersedia",
      "options": null,
      "type": "text",
      "group": "Data ayah",
      "required": true
    },
    {
      "name": "fatherEducation",
      "label": "Pendidikan terakhir ayah",
      "options": [
        "SD",
        "SMP",
        "SMA",
        "D3",
        "S1",
        "S2"
      ],
      "type": "text",
      "group": "Data ayah",
      "required": true
    },
    {
      "name": "fatherJob",
      "label": "Pekerjaan ayah",
      "options": [
        "Pegawai Negeri Sipil (PNS)",
        "Pegawai Pemerintah dengan Perjanjian Kerja (P3K)",
        "TNI",
        "POLRI",
        "Guru",
        "Dosen",
        "Karyawan Swasta",
        "Pegawai BUMN",
        "Pegawai Honorer",
        "Buruh Harian Lepas",
        "Wiraswasta",
        "Tenaga Kesehatan (Dokter/Perawat)",
        "Pedagang",
        "Nelayan",
        "Petani",
        "Pensiunan",
        "Tidak Bekerja"
      ],
      "type": "text",
      "group": "Data ayah",
      "required": true
    },
    {
      "name": "fatherIncome",
      "label": "Penghasilan ayah per bulan",
      "options": [
        "Tidak Berpenghasilan",
        "Rp. 500.000 – Rp. 1.000.000",
        "Rp. 1.000.000 – Rp. 2.000.000",
        "Rp. 2.000.000 – Rp. 3.000.000",
        "Rp. 3.000.000 – Rp. 4.000.000",
        "Rp. 4.000.000 – Rp. 5.000.000",
        "> Rp. 5.000.000"
      ],
      "type": "text",
      "group": "Data ayah",
      "required": true
    },
    {
      "name": "motherName",
      "label": "Nama ibu kandung/wali",
      "options": null,
      "type": "text",
      "group": "Data ibu",
      "required": true
    },
    {
      "name": "motherNik",
      "label": "NIK ibu — isi - jika tidak tersedia",
      "options": null,
      "type": "text",
      "group": "Data ibu",
      "required": true
    },
    {
      "name": "motherEducation",
      "label": "Pendidikan terakhir ibu",
      "options": [
        "SD",
        "SMP",
        "SMA",
        "D3",
        "S1",
        "S2"
      ],
      "type": "text",
      "group": "Data ibu",
      "required": true
    },
    {
      "name": "motherJob",
      "label": "Pekerjaan ibu",
      "options": [
        "Pegawai Negeri Sipil (PNS)",
        "Pegawai Pemerintah dengan Perjanjian Kerja (P3K)",
        "TNI",
        "POLRI",
        "Guru",
        "Dosen",
        "Karyawan Swasta",
        "Pegawai BUMN",
        "Pegawai Honorer",
        "Wiraswasta",
        "Tenaga Kesehatan (Dokter/Perawat/Bidan)",
        "Pedagang",
        "Nelayan",
        "Petani",
        "Ibu Rumah Tangga",
        "Pensiunan"
      ],
      "type": "text",
      "group": "Data ibu",
      "required": true
    },
    {
      "name": "motherIncome",
      "label": "Penghasilan ibu per bulan",
      "options": [
        "Tidak Berpenghasilan",
        "Rp. 500.000 – Rp. 1.000.000",
        "Rp. 1.000.000 – Rp. 2.000.000",
        "Rp. 2.000.000 – Rp. 3.000.000",
        "Rp. 3.000.000 – Rp. 4.000.000",
        "Rp. 4.000.000 – Rp. 5.000.000",
        "> Rp. 5.000.000"
      ],
      "type": "text",
      "group": "Data ibu",
      "required": true
    },
    {
      "name": "parentName",
      "label": "Nama orang tua/wali pengisi",
      "options": null,
      "type": "text",
      "group": "Kontak pengisi",
      "required": true
    }
  ],
  "santriAssessment": [
    {
      "name": "nama",
      "label": "NAMA LENGKAP",
      "type": "text",
      "required": true,
      "options": null,
      "id": "santri-nama"
    },
    {
      "name": "sekolah",
      "label": "ASAL SEKOLAH",
      "type": "text",
      "required": true,
      "options": null,
      "id": "santri-sekolah"
    },
    {
      "name": "wa",
      "label": "NO. WHATSAPP",
      "type": "tel",
      "required": true,
      "options": null,
      "id": "santri-wa"
    },
    {
      "name": "skalaTekad",
      "label": "Seberapa besar keinginanmu sendiri untuk mondok?",
      "type": "range",
      "required": false,
      "options": null,
      "id": "santri-skalaTekad"
    },
    {
      "name": "pendorong",
      "label": "Siapa pendorong utama masuk sini?",
      "type": "select",
      "required": false,
      "options": [
        [
          "Sendiri",
          "Keinginan Saya Sendiri"
        ],
        [
          "Ortu",
          "Disuruh Orang Tua"
        ],
        [
          "Bersama",
          "Kesepakatan Bersama"
        ]
      ],
      "id": "santri-pendorong"
    },
    {
      "name": "shalat",
      "label": "SHALAT 5 WAKTU",
      "type": "select",
      "required": true,
      "options": [
        [
          "Lengkap",
          "Selalu Lengkap"
        ],
        [
          "BolongDikit",
          "Kadang Bolong"
        ],
        [
          "SeringBolong",
          "Sering Bolong"
        ]
      ],
      "id": "santri-shalat"
    },
    {
      "name": "ngaji",
      "label": "BACA AL-QUR'AN",
      "type": "select",
      "required": true,
      "options": [
        [
          "TiapHari",
          "Setiap Hari"
        ],
        [
          "Mingguan",
          "Kadang-kadang"
        ],
        [
          "Jarang",
          "Jarang Sekali"
        ]
      ],
      "id": "santri-ngaji"
    },
    {
      "name": "responEjek",
      "label": "Jika diejek teman, apa reaksimu?",
      "type": "select",
      "required": true,
      "options": [
        [
          "Diam",
          "Diam saja / Lapor Ustadz"
        ],
        [
          "BalasLisan",
          "Membalas dengan Ejekan"
        ],
        [
          "BalasFisik",
          "Memukul / Mengajak Berkelahi"
        ]
      ],
      "id": "santri-responEjek"
    },
    {
      "name": "pernahBully",
      "label": "Pernahkah memukul teman / mem-bully?",
      "type": "radio",
      "required": false,
      "options": [
        [
          "Tidak",
          "Tidak Pernah"
        ],
        [
          "Ya",
          "Pernah"
        ]
      ],
      "id": "santri-bullyTidak"
    },
    {
      "name": "sukaPondok",
      "label": "Apa yang paling kamu SUKAI / HARAPKAN di pondok?",
      "type": "textarea",
      "required": true,
      "options": null,
      "id": "santri-sukaPondok"
    },
    {
      "name": "takutPondok",
      "label": "Apa yang paling kamu TAKUTI / KHAWATIRKAN di pondok?",
      "type": "textarea",
      "required": true,
      "options": null,
      "id": "santri-takutPondok"
    },
    {
      "name": "pelanggaranList",
      "label": "Riwayat Pelanggaran (Checklist Jujur)",
      "type": "checkbox",
      "required": false,
      "options": [
        [
          "Merokok",
          "Merokok"
        ],
        [
          "Pacaran",
          "Pacaran"
        ],
        [
          "Kabur",
          "Kabur"
        ],
        [
          "Begadang",
          "Begadang"
        ],
        [
          "Bully",
          "Berkelahi"
        ],
        [
          "Bersih",
          "Anak Baik"
        ]
      ],
      "id": "santri-c1"
    },
    {
      "name": "kelebihan",
      "label": "Apa kelebihan/bakatmu? (Hafalan, Olahraga, Seni, dll)",
      "type": "textarea",
      "required": true,
      "options": null,
      "id": "santri-kelebihan"
    }
  ],
  "waliAssessment": [
    {
      "name": "namaWali",
      "label": "NAMA ORANG TUA / WALI",
      "type": "text",
      "required": true,
      "options": null,
      "id": "wali-namaWali"
    },
    {
      "name": "namaAnak",
      "label": "NAMA CALON SANTRI",
      "type": "text",
      "required": true,
      "options": null,
      "id": "wali-namaAnak"
    },
    {
      "name": "waWali",
      "label": "NO. WHATSAPP AKTIF",
      "type": "tel",
      "required": true,
      "options": null,
      "id": "wali-waWali"
    },
    {
      "name": "penyakit",
      "label": "Apakah ada riwayat sakit berat? (Asma, Kejang, Maag Akut, Alergi, dll)",
      "type": "textarea",
      "required": false,
      "options": null,
      "id": "wali-penyakit"
    },
    {
      "name": "pelanggaran",
      "label": "Riwayat pelanggaran di sekolah lama? (Jujur lebih baik)",
      "type": "textarea",
      "required": false,
      "options": null,
      "id": "wali-pelanggaran"
    },
    {
      "name": "motivasiWali",
      "label": "Apa motivasi utama memasukkan anak ke sini?",
      "type": "radio",
      "required": true,
      "options": [
        [
          "VisiMisi",
          "Visi Misi Pesantren (Ingin anak sholeh)"
        ],
        [
          "Mandiri",
          "Agar anak Mandiri/Disiplin"
        ],
        [
          "BiayaLokasi",
          "Faktor Biaya Terjangkau / Lokasi Dekat"
        ]
      ],
      "id": "wali-m1"
    },
    {
      "name": "keuangan",
      "label": "KESIAPAN KEUANGAN (SPP)",
      "type": "select",
      "required": true,
      "options": [
        [
          "Sanggup",
          "Sanggup Bayar Tepat Waktu"
        ],
        [
          "ButuhBicara",
          "Butuh Pembicaraan Khusus"
        ]
      ],
      "id": "wali-keuangan"
    },
    {
      "name": "hadir",
      "label": "KESIAPAN HADIR (DARURAT)",
      "type": "select",
      "required": true,
      "options": [
        [
          "Ya",
          "Siap Hadir (1x24 Jam)"
        ],
        [
          "Tidak",
          "Sulit Hadir / Jauh"
        ]
      ],
      "id": "wali-hadir"
    },
    {
      "name": "sikap",
      "label": "Jika anak dihukum karena melanggar, sikap Bapak/Ibu?",
      "type": "select",
      "required": true,
      "options": [
        [
          "",
          "-- Pilih Sikap Jujur --"
        ],
        [
          "Tabayyun",
          "Konfirmasi dulu (Tabayyun)"
        ],
        [
          "Pasrah",
          "Pasrah pada kebijakan Pesantren"
        ],
        [
          "Protes",
          "Tidak Terima / Protes"
        ]
      ],
      "id": "wali-sikap"
    },
    {
      "name": "agree",
      "label": "Pernyataan kebenaran data dan penyerahan pengasuhan",
      "type": "checkbox",
      "required": true,
      "options": [
        [
          "on",
          "Saya menyatakan data di atas adalah benar. Saya menyerahkan anak saya kepada Pesantren."
        ]
      ],
      "id": "wali-agree"
    }
  ]
};
export function cleanForm(key, input) {
 const result={}; for(const f of schemas[key]) {const v=input[f.name];result[f.name]=f.type==='checkbox'?(Array.isArray(v)?v: v?[v]:[]):String(v??'').trim().slice(0,f.name==='studentName'?120:f.name==='address'?600:2000);}
 return result;
}
export function validateForm(key,data) {
 for(const f of schemas[key]) {
 const v=data?.[f.name];
 if(f.required&&(!v||Array.isArray(v)&&!v.length))throw Error('Lengkapi: '+f.label);
 if(f.options&&v&&(!Array.isArray(v)||v.length)){
 const allowed=f.options.map(o=>Array.isArray(o)?o[0]:o);for(const x of Array.isArray(v)?v:[v])if(!allowed.includes(x))throw Error('Periksa pilihan: '+f.label);
 }
 if(f.type==='range'&&(!(Number(v)>=1&&Number(v)<=10)||!Number.isInteger(Number(v))))throw Error('Pilih skala tekad 1–10.');
 if(f.type==='number'&&v&&(!(Number(v)>0)||Number(v)>500))throw Error('Periksa: '+f.label);
 }
 if(key==='registration'){
 for(const k of ['studentNik','familyCardNumber'])if(!/^\d{16}$/.test(data[k]||''))throw Error('NIK santri dan nomor KK harus 16 digit.');
 for(const k of ['fatherNik','motherNik'])if(!/^(\d{16}|-)$/.test(data[k]||''))throw Error('NIK orang tua harus 16 digit atau tanda -.');
 if(!/^(\d{10}|-)$/.test(data.nisn||''))throw Error('NISN harus 10 digit atau tanda -.');
 if(!/^\+?[0-9 ()-]{9,20}$/.test(data.parentPhone||''))throw Error('Periksa nomor WhatsApp orang tua.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(data.birthDate||'')||data.birthDate>new Date().toISOString().slice(0,10))throw Error('Periksa tanggal lahir.');
 if(data.diseases?.includes('Tidak ada')&&data.diseases.length>1)throw Error('Pilih Tidak ada atau riwayat penyakit yang sesuai.');
 }
 if(key==='santriAssessment'&&data.pelanggaranList?.includes('Bersih')&&data.pelanggaranList.length>1)throw Error('Pilihan Anak Baik tidak dapat digabung dengan riwayat pelanggaran.');
}
