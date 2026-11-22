export interface PlaceLocation {
  id: string;
  name: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
  category: 'KAMPUS_POLINELA' | 'INSTANSI' | 'VENUE' | 'JALAN' | 'TRANSPORTASI';
  categoryLabel: string;
  keywords: string[];
}

// Database Lokasi Kampus Politeknik Negeri Lampung (Polinela) & Bandar Lampung
export const KNOWN_LOCATIONS: PlaceLocation[] = [
  // ── KAMPUS POLITEKNIK NEGERI LAMPUNG ──
  {
    id: 'polinela-gsg',
    name: 'Gedung Serba Guna (GSG Polinela)',
    label: 'GSG Polinela',
    address: 'Gedung Serba Guna (GSG) Polinela, Jl. Soekarno Hatta No. 10, Rajabasa, Bandar Lampung',
    lat: -5.3592,
    lng: 105.2338,
    category: 'KAMPUS_POLINELA',
    categoryLabel: 'Kampus Polinela',
    keywords: ['gsg', 'gedung serbaguna', 'aula', 'auditorium', 'gedung serba guna', 'dies natalis', 'wisuda', 'hall'],
  },
  {
    id: 'polinela-direktorat',
    name: 'Gedung Direktorat / Rektorat Polinela',
    label: 'Gedung Direktorat',
    address: 'Gedung Direktorat Kampus Polinela, Jl. Soekarno Hatta No. 10, Rajabasa',
    lat: -5.3578,
    lng: 105.2341,
    category: 'KAMPUS_POLINELA',
    categoryLabel: 'Kampus Polinela',
    keywords: ['direktorat', 'rektorat', 'direktur', 'kantor pusat', 'pimpinan', 'tata usaha', 'wadir'],
  },
  {
    id: 'polinela-ruang-humas',
    name: 'Ruang Humas & Protokoler Polinela',
    label: 'Ruang Humas & Protokol',
    address: 'Ruang Unit Kehumasan & Publikasi, Gedung Direktorat Lt. 1 Polinela',
    lat: -5.3580,
    lng: 105.2343,
    category: 'KAMPUS_POLINELA',
    categoryLabel: 'Kampus Polinela',
    keywords: ['humas', 'unit humas', 'posko humas', 'ruang humas', 'protokoler', 'publikasi', 'kantor humas'],
  },
  {
    id: 'polinela-lab-humas',
    name: 'Lab Humas & Studio Multimedia Polinela',
    label: 'Lab Humas / Multimedia',
    address: 'Laboratorium Multimedia & Studio Podcast Humas Polinela',
    lat: -5.3582,
    lng: 105.2348,
    category: 'KAMPUS_POLINELA',
    categoryLabel: 'Kampus Polinela',
    keywords: ['lab humas', 'multimedia', 'studio', 'podcast', 'lab multimedia', 'editing', 'kreator'],
  },
  {
    id: 'polinela-ruang-sidang',
    name: 'Ruang Sidang Utama Direktorat Polinela',
    label: 'Ruang Sidang Utama',
    address: 'Ruang Sidang Utama, Gedung Direktorat Lt. 2 Polinela',
    lat: -5.3577,
    lng: 105.2342,
    category: 'KAMPUS_POLINELA',
    categoryLabel: 'Kampus Polinela',
    keywords: ['ruang sidang', 'sidang utama', 'rapat pimpinan', 'meeting room', 'aula rektorat'],
  },
  {
    id: 'polinela-jti',
    name: 'Gedung Jurusan Teknologi Informasi (JTI)',
    label: 'Gedung TI & Akuntansi',
    address: 'Gedung Jurusan Teknologi Informasi & Akuntansi Polinela',
    lat: -5.3586,
    lng: 105.2355,
    category: 'KAMPUS_POLINELA',
    categoryLabel: 'Kampus Polinela',
    keywords: ['ti', 'jti', 'teknologi informasi', 'komputer', 'informatika', 'akuntansi', 'lab komputer', 'gedung ti'],
  },
  {
    id: 'polinela-sakura-feb',
    name: 'Gedung Sakura (Ekonomi & Bisnis / FEB)',
    label: 'Gedung Sakura (FEB)',
    address: 'Gedung Sakura, Jurusan Ekonomi dan Bisnis Polinela',
    lat: -5.3601,
    lng: 105.2350,
    category: 'KAMPUS_POLINELA',
    categoryLabel: 'Kampus Polinela',
    keywords: ['sakura', 'feb', 'ekonomi', 'bisnis', 'gedung sakura', 'jurusan ekonomi', 'manajemen'],
  },
  {
    id: 'polinela-lapangan-utama',
    name: 'Lapangan Utama & Upacara Polinela',
    label: 'Lapangan Utama',
    address: 'Lapangan Olahraga & Upacara Utama Kampus Polinela',
    lat: -5.3589,
    lng: 105.2330,
    category: 'KAMPUS_POLINELA',
    categoryLabel: 'Kampus Polinela',
    keywords: ['lapangan', 'lapangan utama', 'lapangan upacara', 'stadion', 'olahraga', 'futsal', 'sepak bola'],
  },
  {
    id: 'polinela-pascasarjana',
    name: 'Gedung Pascasarjana Terapan Polinela',
    label: 'Gedung Pascasarjana',
    address: 'Gedung Program Pascasarjana Magister Terapan Polinela',
    lat: -5.3603,
    lng: 105.2342,
    category: 'KAMPUS_POLINELA',
    categoryLabel: 'Kampus Polinela',
    keywords: ['pasca', 'pascasarjana', 'magister', 's2', 'terapan', 'gedung pasca'],
  },
  {
    id: 'polinela-gpb',
    name: 'Gedung Perkuliahan Bersama (GPB Polinela)',
    label: 'Gedung GPB',
    address: 'Gedung Perkuliahan Bersama (GPB), Kampus Polinela',
    lat: -5.3596,
    lng: 105.2346,
    category: 'KAMPUS_POLINELA',
    categoryLabel: 'Kampus Polinela',
    keywords: ['gpb', 'gedung perkuliahan bersama', 'kelas bersama', 'kuliah umum', 'gedung baru'],
  },
  {
    id: 'polinela-perpustakaan',
    name: 'Gedung UPT Perpustakaan Pusat Polinela',
    label: 'Perpustakaan Pusat',
    address: 'Gedung Perpustakaan Pusat Polinela, Jl. Soekarno Hatta No. 10',
    lat: -5.3583,
    lng: 105.2337,
    category: 'KAMPUS_POLINELA',
    categoryLabel: 'Kampus Polinela',
    keywords: ['perpustakaan', 'perpus', 'library', 'ruang baca', 'upt perpustakaan', 'literasi'],
  },
  {
    id: 'polinela-poliklinik',
    name: 'Poliklinik & Layanan Kesehatan Polinela',
    label: 'Poliklinik Polinela',
    address: 'Poliklinik Kesehatan Mahasiswa & Pegawai Polinela',
    lat: -5.3595,
    lng: 105.2325,
    category: 'KAMPUS_POLINELA',
    categoryLabel: 'Kampus Polinela',
    keywords: ['poliklinik', 'klinik', 'kesehatan', 'dokter', 'posko kesehatan', 'medis'],
  },
  {
    id: 'polinela-masjid',
    name: 'Masjid Al-Banna Polinela',
    label: 'Masjid Al-Banna',
    address: 'Masjid Al-Banna Kampus Polinela, Rajabasa, Bandar Lampung',
    lat: -5.3568,
    lng: 105.2358,
    category: 'KAMPUS_POLINELA',
    categoryLabel: 'Kampus Polinela',
    keywords: ['masjid', 'al banna', 'al-banna', 'mushola', 'ibadah', 'pengajian'],
  },
  {
    id: 'polinela-mawar',
    name: 'Gedung Mawar (Budidaya Tanaman Pangan)',
    label: 'Gedung Mawar',
    address: 'Gedung Mawar Jurusan Budidaya Tanaman Pangan Polinela',
    lat: -5.3574,
    lng: 105.2352,
    category: 'KAMPUS_POLINELA',
    categoryLabel: 'Kampus Polinela',
    keywords: ['mawar', 'tanaman pangan', 'pertanian', 'budidaya'],
  },
  {
    id: 'polinela-melati',
    name: 'Gedung Melati (Budidaya Tanaman Perkebunan)',
    label: 'Gedung Melati',
    address: 'Gedung Melati Jurusan Budidaya Tanaman Perkebunan Polinela',
    lat: -5.3569,
    lng: 105.2345,
    category: 'KAMPUS_POLINELA',
    categoryLabel: 'Kampus Polinela',
    keywords: ['melati', 'perkebunan', 'tanaman perkebunan', 'sawit', 'kopi'],
  },
  {
    id: 'polinela-anggrek',
    name: 'Gedung Anggrek (Jurusan Peternakan)',
    label: 'Gedung Anggrek',
    address: 'Gedung Anggrek Jurusan Peternakan Polinela',
    lat: -5.3565,
    lng: 105.2335,
    category: 'KAMPUS_POLINELA',
    categoryLabel: 'Kampus Polinela',
    keywords: ['anggrek', 'peternakan', 'kandang', 'ternak'],
  },
  {
    id: 'polinela-teratai',
    name: 'Gedung Teratai (Teknologi Pertanian)',
    label: 'Gedung Teratai',
    address: 'Gedung Teratai Jurusan Teknologi Pertanian Polinela',
    lat: -5.3572,
    lng: 105.2328,
    category: 'KAMPUS_POLINELA',
    categoryLabel: 'Kampus Polinela',
    keywords: ['teratai', 'teknologi pertanian', 'mekanisasi', 'alsintan'],
  },
  {
    id: 'polinela-kantin',
    name: 'Food Court & Kantin Pusat Polinela',
    label: 'Kantin Pusat Polinela',
    address: 'Food Court & Kantin Mahasiswa Terpadu Polinela',
    lat: -5.3588,
    lng: 105.2345,
    category: 'KAMPUS_POLINELA',
    categoryLabel: 'Kampus Polinela',
    keywords: ['kantin', 'foodcourt', 'makan', 'kuliner', 'pujasera'],
  },
  {
    id: 'polinela-greenhouse',
    name: 'Greenhouse Smart Agriculture Polinela',
    label: 'Greenhouse Polinela',
    address: 'Greenhouse Smart Agriculture & Hidroponik Polinela',
    lat: -5.3562,
    lng: 105.2348,
    category: 'KAMPUS_POLINELA',
    categoryLabel: 'Kampus Polinela',
    keywords: ['greenhouse', 'hidroponik', 'smart agriculture', 'kebun', 'laboratorium lapang'],
  },
  {
    id: 'polinela-workshop',
    name: 'Gedung Workshop Mekanisasi Pertanian',
    label: 'Workshop Mekanisasi',
    address: 'Workshop Alat & Mesin Pertanian Polinela',
    lat: -5.3560,
    lng: 105.2340,
    category: 'KAMPUS_POLINELA',
    categoryLabel: 'Kampus Polinela',
    keywords: ['workshop', 'bengkel', 'alsintan', 'mesin pertanian', 'traktor'],
  },
  {
    id: 'polinela-gerbang',
    name: 'Pintu Gerbang Utama Polinela (Bypass)',
    label: 'Gerbang Utama Polinela',
    address: 'Gerbang Utama & Pos Keamanan Polinela, Jl. Soekarno Hatta',
    lat: -5.3605,
    lng: 105.2332,
    category: 'KAMPUS_POLINELA',
    categoryLabel: 'Kampus Polinela',
    keywords: ['gerbang', 'pintu masuk', 'pos satpam', 'pos keamanan', 'gapura', 'bypass'],
  },
  {
    id: 'polinela-asrama',
    name: 'Asrama Mahasiswa Polinela',
    label: 'Asrama Polinela',
    address: 'Kompleks Asrama Mahasiswa Polinela, Rajabasa',
    lat: -5.3558,
    lng: 105.2355,
    category: 'KAMPUS_POLINELA',
    categoryLabel: 'Kampus Polinela',
    keywords: ['asrama', 'rusunawa', 'dormitory', 'boarding', 'tempat tinggal'],
  },

  // ── INSTANSI PEMERINTAH & MITRA LAMPUNG ──
  {
    id: 'prov-balai-keratun',
    name: 'Kantor Gubernur Lampung (Balai Keratun)',
    label: 'Kantor Gubernur Lampung',
    address: 'Kompleks Kantor Gubernur Lampung, Jl. Wolter Monginsidi No. 69, Teluk Betung',
    lat: -5.4385,
    lng: 105.2605,
    category: 'INSTANSI',
    categoryLabel: 'Instansi / Pemprov',
    keywords: ['gubernur', 'pemprov', 'balai keratun', 'kantor gubernur', 'provinsi lampung'],
  },
  {
    id: 'prov-dprd',
    name: 'Gedung DPRD Provinsi Lampung',
    label: 'Gedung DPRD Lampung',
    address: 'Gedung DPRD Provinsi Lampung, Jl. Wolter Monginsidi, Bandar Lampung',
    lat: -5.4410,
    lng: 105.2590,
    category: 'INSTANSI',
    categoryLabel: 'Instansi / Legislatif',
    keywords: ['dprd', 'dewan', 'parlemen', 'sidang paripurna', 'dprd lampung'],
  },
  {
    id: 'prov-disdikbud',
    name: 'Dinas Pendidikan & Kebudayaan Provinsi Lampung',
    label: 'Dinas Pendidikan Lampung',
    address: 'Dinas Pendidikan & Kebudayaan Provinsi Lampung, Jl. Gatot Subroto / Cut Meutia',
    lat: -5.4290,
    lng: 105.2540,
    category: 'INSTANSI',
    categoryLabel: 'Instansi Pemerintah',
    keywords: ['disdik', 'dinas pendidikan', 'pendidikan', 'disdikbud', 'sekolah'],
  },
  {
    id: 'prov-diskominfotik',
    name: 'Dinas Kominfotik Provinsi Lampung',
    label: 'Diskominfotik Lampung',
    address: 'Dinas Komunikasi, Informatika dan Statistik Provinsi Lampung, Teluk Betung',
    lat: -5.4375,
    lng: 105.2595,
    category: 'INSTANSI',
    categoryLabel: 'Instansi Pemerintah',
    keywords: ['kominfo', 'diskominfotik', 'komunikasi', 'informasi', 'statistik', 'media'],
  },
  {
    id: 'kota-walikota',
    name: 'Kantor Walikota Bandar Lampung',
    label: 'Kantor Walikota B. Lampung',
    address: 'Pemerintah Kota Bandar Lampung, Jl. Dr. Susilo No. 2, Bandar Lampung',
    lat: -5.4265,
    lng: 105.2580,
    category: 'INSTANSI',
    categoryLabel: 'Instansi Pemerintah',
    keywords: ['walikota', 'pemkot', 'bandar lampung', 'pemda kota'],
  },
  {
    id: 'polda-lampung',
    name: 'Polda Lampung (Markas Kepolisian Daerah)',
    label: 'Polda Lampung',
    address: 'Mapolda Lampung, Jl. Terusan Ryacudu, Way Huwi / Sukarame',
    lat: -5.3620,
    lng: 105.3210,
    category: 'INSTANSI',
    categoryLabel: 'Instansi / Keamanan',
    keywords: ['polda', 'polisi', 'kepolisian', 'mapolda', 'polda lampung'],
  },
  {
    id: 'kejati-lampung',
    name: 'Kejaksaan Tinggi (Kejati) Lampung',
    label: 'Kejati Lampung',
    address: 'Kejaksaan Tinggi Lampung, Jl. Wolter Monginsidi No. 41, Bandar Lampung',
    lat: -5.4350,
    lng: 105.2610,
    category: 'INSTANSI',
    categoryLabel: 'Instansi / Hukum',
    keywords: ['kejati', 'kejaksaan', 'jaksa', 'hukum'],
  },

  // ── PERGURUAN TINGGI MITRA ──
  {
    id: 'unila-rektorat',
    name: 'Universitas Lampung (Unila) - Gedung Rektorat & GSG',
    label: 'GSG & Rektorat Unila',
    address: 'Universitas Lampung, Jl. Prof. Dr. Sumantri Brojonegoro No. 1, Gedong Meneng',
    lat: -5.3650,
    lng: 105.2440,
    category: 'KAMPUS_POLINELA',
    categoryLabel: 'Perguruan Tinggi',
    keywords: ['unila', 'universitas lampung', 'rektorat unila', 'gsg unila', 'gedong meneng'],
  },
  {
    id: 'itera-gedung-utama',
    name: 'Institut Teknologi Sumatera (ITERA)',
    label: 'Kampus ITERA',
    address: 'Gedung Kuliah Umum ITERA, Jl. Terusan Ryacudu, Way Huwi, Jati Agung',
    lat: -5.3580,
    lng: 105.3140,
    category: 'KAMPUS_POLINELA',
    categoryLabel: 'Perguruan Tinggi',
    keywords: ['itera', 'institut teknologi sumatera', 'gku itera', 'kampus itera'],
  },
  {
    id: 'uin-raden-intan',
    name: 'UIN Raden Intan Lampung (Kampus Sukarame)',
    label: 'UIN Raden Intan',
    address: 'UIN Raden Intan Lampung, Jl. Letnan Kolonel H. Endro Suratmin, Sukarame',
    lat: -5.3880,
    lng: 105.2920,
    category: 'KAMPUS_POLINELA',
    categoryLabel: 'Perguruan Tinggi',
    keywords: ['uin', 'raden intan', 'iain', 'sukarame', 'kampus uin'],
  },

  // ── VENUE & HOTEL KEGIATAN HUMAS ──
  {
    id: 'hotel-radisson',
    name: 'Hotel Radisson Lampung Kedaton',
    label: 'Hotel Radisson Kedaton',
    address: 'Hotel Radisson Lampung, Jl. Teuku Umar No. 1, Kedaton (Mall Boemi Kedaton)',
    lat: -5.3810,
    lng: 105.2590,
    category: 'VENUE',
    categoryLabel: 'Hotel & Venue',
    keywords: ['radisson', 'hotel radisson', 'kedaton', 'mbk', 'ballroom radisson'],
  },
  {
    id: 'hotel-novotel',
    name: 'Hotel Novotel Bandar Lampung',
    label: 'Hotel Novotel Lampung',
    address: 'Hotel Novotel Lampung, Jl. Gatot Subroto No. 136, Sukaraja, Teluk Betung',
    lat: -5.4480,
    lng: 105.2750,
    category: 'VENUE',
    categoryLabel: 'Hotel & Venue',
    keywords: ['novotel', 'hotel novotel', 'gatot subroto', 'ballroom novotel'],
  },
  {
    id: 'hotel-sheraton',
    name: 'Hotel Sheraton Lampung',
    label: 'Hotel Sheraton Lampung',
    address: 'Hotel Sheraton Lampung, Jl. Wolter Monginsidi No. 175, Bandar Lampung',
    lat: -5.4320,
    lng: 105.2580,
    category: 'VENUE',
    categoryLabel: 'Hotel & Venue',
    keywords: ['sheraton', 'hotel sheraton', 'monginsidi'],
  },
  {
    id: 'hotel-grand-mercure',
    name: 'Hotel Grand Mercure Lampung',
    label: 'Grand Mercure Lampung',
    address: 'Hotel Grand Mercure Lampung, Jl. Raden Intan, Pelita, Enggal',
    lat: -5.4180,
    lng: 105.2600,
    category: 'VENUE',
    categoryLabel: 'Hotel & Venue',
    keywords: ['grand mercure', 'mercure', 'hotel tertinggi', 'raden intan'],
  },
  {
    id: 'hotel-emersia',
    name: 'Hotel Emersia Bandar Lampung',
    label: 'Hotel Emersia',
    address: 'Hotel Emersia & Resort, Jl. Wolter Monginsidi No. 70, Pengajaran',
    lat: -5.4300,
    lng: 105.2500,
    category: 'VENUE',
    categoryLabel: 'Hotel & Venue',
    keywords: ['emersia', 'hotel emersia', 'resort'],
  },
  {
    id: 'venue-pkor-way-halim',
    name: 'PKOR Way Halim & Stadion Sumpah Pemuda',
    label: 'PKOR Way Halim',
    address: 'Pusat Kegiatan Olahraga (PKOR) Way Halim, Bandar Lampung',
    lat: -5.3890,
    lng: 105.2750,
    category: 'VENUE',
    categoryLabel: 'Venue Publik',
    keywords: ['pkor', 'way halim', 'sumpah pemuda', 'dkl', 'dewan kesenian lampung', 'pameran'],
  },
  {
    id: 'venue-islamic-centre',
    name: 'Islamic Centre Provinsi Lampung (Rajabasa)',
    label: 'Islamic Centre Rajabasa',
    address: 'Kompleks Islamic Centre Lampung, Jl. Soekarno Hatta, Rajabasa',
    lat: -5.3630,
    lng: 105.2420,
    category: 'VENUE',
    categoryLabel: 'Venue Publik',
    keywords: ['islamic centre', 'islamic center', 'rajabasa', 'masjid raya'],
  },

  // ── JALAN UTAMA & TITIK TRANSPORTASI ──
  {
    id: 'jalan-soekarno-hatta',
    name: 'Jl. Soekarno - Hatta (Bypass Rajabasa)',
    label: 'Jl. Soekarno Hatta (Bypass)',
    address: 'Jl. Soekarno - Hatta, Rajabasa, Kota Bandar Lampung',
    lat: -5.3590,
    lng: 105.2340,
    category: 'JALAN',
    categoryLabel: 'Jalan Utama',
    keywords: ['soekarno hatta', 'soekarno-hatta', 'bypass', 'by pass', 'depan polinela', 'jl soekarno'],
  },
  {
    id: 'jalan-za-pagar-alam',
    name: 'Jl. Zainal Abidin Pagar Alam (ZA Pagar Alam)',
    label: 'Jl. ZA Pagar Alam',
    address: 'Jl. ZA Pagar Alam, Rajabasa - Kedaton, Bandar Lampung',
    lat: -5.3720,
    lng: 105.2490,
    category: 'JALAN',
    categoryLabel: 'Jalan Utama',
    keywords: ['za pagar alam', 'pagar alam', 'zainal abidin', 'jalan utama rajabasa'],
  },
  {
    id: 'jalan-teuku-umar',
    name: 'Jl. Teuku Umar (Kedaton)',
    label: 'Jl. Teuku Umar',
    address: 'Jl. Teuku Umar, Kedaton, Kota Bandar Lampung',
    lat: -5.3920,
    lng: 105.2570,
    category: 'JALAN',
    categoryLabel: 'Jalan Utama',
    keywords: ['teuku umar', 'kedaton', 'jl teuku umar'],
  },
  {
    id: 'jalan-raden-intan',
    name: 'Jl. Raden Intan (Tanjung Karang)',
    label: 'Jl. Raden Intan',
    address: 'Jl. Raden Intan, Tanjung Karang Pusat, Bandar Lampung',
    lat: -5.4150,
    lng: 105.2580,
    category: 'JALAN',
    categoryLabel: 'Jalan Utama',
    keywords: ['raden intan', 'tanjung karang', 'pusat kota'],
  },
  {
    id: 'jalan-pramuka',
    name: 'Jl. Pramuka (Rajabasa - Kemiling)',
    label: 'Jl. Pramuka',
    address: 'Jl. Pramuka, Rajabasa, Bandar Lampung',
    lat: -5.3780,
    lng: 105.2250,
    category: 'JALAN',
    categoryLabel: 'Jalan Utama',
    keywords: ['pramuka', 'jl pramuka', 'kemiling', 'rajabasa'],
  },
  {
    id: 'jalan-ryacudu',
    name: 'Jl. Terusan Ryacudu (Sukarame - Korpri)',
    label: 'Jl. Ryacudu',
    address: 'Jl. Terusan Ryacudu, Sukarame, Bandar Lampung',
    lat: -5.3780,
    lng: 105.3010,
    category: 'JALAN',
    categoryLabel: 'Jalan Utama',
    keywords: ['ryacudu', 'terusan ryacudu', 'korpri', 'sukarame', 'akses tol itera'],
  },
  {
    id: 'transport-bandara-branti',
    name: 'Bandara Internasional Radin Inten II (Branti)',
    label: 'Bandara Radin Inten II',
    address: 'Bandara Radin Inten II, Jl. Raya Branti, Natar, Lampung Selatan',
    lat: -5.2430,
    lng: 105.1780,
    category: 'TRANSPORTASI',
    categoryLabel: 'Transportasi',
    keywords: ['bandara', 'airport', 'radin inten', 'branti', 'pesawat', 'vip bandara'],
  },
  {
    id: 'transport-stasiun-tjk',
    name: 'Stasiun Kereta Api Tanjung Karang',
    label: 'Stasiun Tanjung Karang',
    address: 'Stasiun Tanjung Karang, Jl. Kotaraja, Enggal, Bandar Lampung',
    lat: -5.4110,
    lng: 105.2580,
    category: 'TRANSPORTASI',
    categoryLabel: 'Transportasi',
    keywords: ['stasiun', 'kereta', 'tanjung karang', 'kai'],
  },
  {
    id: 'transport-terminal-rajabasa',
    name: 'Terminal Induk Rajabasa',
    label: 'Terminal Rajabasa',
    address: 'Terminal Tipe A Rajabasa, Jl. Zainal Abidin Pagar Alam, Bandar Lampung',
    lat: -5.3680,
    lng: 105.2280,
    category: 'TRANSPORTASI',
    categoryLabel: 'Transportasi',
    keywords: ['terminal', 'rajabasa', 'bus', 'damri'],
  },
];

// Preset singkat untuk tombol cepat (Pilihan Cepat Titik Lokasi Kampus)
export const CAMPUS_SHORTCUT_PRESETS = [
  {
    name: 'GSG Polinela',
    label: 'GSG Polinela',
    address: 'Gedung Serba Guna (GSG) Polinela, Jl. Soekarno Hatta',
    lat: -5.3592,
    lng: 105.2338,
  },
  {
    name: 'Gedung Direktorat',
    label: 'Gedung Direktorat',
    address: 'Gedung Direktorat Kampus Polinela',
    lat: -5.3578,
    lng: 105.2341,
  },
  {
    name: 'Lab Humas & Multimedia',
    label: 'Lab Humas / Multimedia',
    address: 'Lab Multimedia & Ruang Humas Polinela',
    lat: -5.3582,
    lng: 105.2348,
  },
  {
    name: 'Gedung Sakura (FEB)',
    label: 'Gedung Sakura (FEB)',
    address: 'Gedung Sakura Polinela (Ekonomi & Bisnis)',
    lat: -5.3601,
    lng: 105.235,
  },
  {
    name: 'Gedung TI / Akuntansi',
    label: 'Gedung TI & Akuntansi',
    address: 'Gedung Jurusan Teknologi Informasi & Akuntansi Polinela',
    lat: -5.3586,
    lng: 105.2355,
  },
  {
    name: 'Lapangan Utama',
    label: 'Lapangan Utama',
    address: 'Lapangan Olahraga & Upacara Polinela',
    lat: -5.3589,
    lng: 105.233,
  },
  {
    name: 'Gedung Pascasarjana',
    label: 'Gedung Pascasarjana',
    address: 'Gedung Program Pascasarjana Terapan Polinela',
    lat: -5.3603,
    lng: 105.2342,
  },
  {
    name: 'Masjid Al-Banna',
    label: 'Masjid Al-Banna',
    address: 'Masjid Al-Banna Kampus Polinela',
    lat: -5.3568,
    lng: 105.2358,
  },
  {
    name: 'Poliklinik',
    label: 'Poliklinik',
    address: 'Poliklinik Kesehatan Polinela',
    lat: -5.3595,
    lng: 105.2325,
  },
];

/**
 * Cari tempat di database lokal secara cerdas (case-insensitive substring & keywords)
 */
export function searchLocalLocations(query: string, limit = 8): PlaceLocation[] {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return [];

  // Pisahkan query menjadi kata-kata (contoh: "gsg polinela" -> ["gsg", "polinela"])
  const tokens = cleanQ.split(/\s+/).filter(Boolean);

  const scored = KNOWN_LOCATIONS.map((loc) => {
    let score = 0;
    const nameLower = loc.name.toLowerCase();
    const labelLower = loc.label.toLowerCase();
    const addressLower = loc.address.toLowerCase();

    // Exact name match
    if (nameLower === cleanQ || labelLower === cleanQ) {
      score += 100;
    }

    // Name starts with query
    if (nameLower.startsWith(cleanQ) || labelLower.startsWith(cleanQ)) {
      score += 50;
    }

    // Keyword match
    if (loc.keywords.some((k) => k.toLowerCase() === cleanQ)) {
      score += 40;
    } else if (loc.keywords.some((k) => k.toLowerCase().includes(cleanQ))) {
      score += 25;
    }

    // Substring match
    if (nameLower.includes(cleanQ)) {
      score += 30;
    }
    if (labelLower.includes(cleanQ)) {
      score += 25;
    }
    if (addressLower.includes(cleanQ)) {
      score += 15;
    }

    // Token match
    tokens.forEach((token) => {
      if (nameLower.includes(token)) score += 10;
      if (labelLower.includes(token)) score += 8;
      if (loc.keywords.some((k) => k.toLowerCase().includes(token))) score += 6;
      if (addressLower.includes(token)) score += 4;
    });

    // Campus priority bias
    if (loc.category === 'KAMPUS_POLINELA') {
      score += 5;
    }

    return { loc, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.loc);
}

