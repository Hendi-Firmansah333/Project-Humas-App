RANCANG BANGUN APLIKASI KEHUMASAN MOBILE BERBASIS GPS UNTUK KOORDINASI TIM POLINELA 

(Proposal Proyek Mandiri) 






Oleh

I Komang Ari Wijaya Saputra        24783080















POLITEKNIK NEGERI LAMPUNG 
BANDAR LAMPUNG
2026




DAFTAR ISI
Halaman
DAFTAR TABEL	iv
DAFTAR GAMBAR	v
I. PENDAHULUAN	4
1.1 Latar Belakang	4
1.2 Perumusan Masalah	5
1.3 Tujuan Penelitian	5
1.4 Kerangka Pemikiran	6
1.5 Batasan Masalah	6
1.6 Kontribusi Penelitian	7
II. TINJAUAN PUSTAKA	7
2.1 Sistem Informasi	7
2.2 Sistem Informasi Kehumasan	7
2.3 Mobile Application	8
2.4 Global Positioning System (GPS)	8
2.5 Live Location Tracking	8
2.6 Real-Time Notification	8
2.7 Firebase Cloud Messaging (FCM)	9
2.8 REST API	9
2.9 Database MySQL	9
2.10 Google Maps API	9
2.11 Metode Waterfall	10
2.12 Unified Modeling Language (UML)	10
2.13 Android	11
2.14 Penelitian Terdahulu	11
Tabel 2.1 Penelitian Terdahulu	12
2.15 Research Gap	13
2.16 Kerangka Pemikiran	13
1. Identifikasi Masalah (Input)	14
2. Pendekatan Sistem (Process)	14
3. Solusi yang Dihasilkan (Output)	14
III. METODOLOGI PENELITIAN	15
3.1 Tempat dan Waktu Penelitian	15
3.2 Alat dan Bahan	15
3.2.1 Perangkat Keras (Hardware)	15
3.2.2 Perangkat Lunak (Software)	16
3.3 Metode Pengembangan Sistem	17
3.4 Teknik Pengumpulan Data	17
3.4.1 Observasi	17
3.4.2 Wawancara	17
3.4.3 Studi Literatur	18
3.5 Analisis Kebutuhan Sistem	18
3.5.1 Kebutuhan Fungsional	18
3.5.2 Kebutuhan Nonfungsional	18
3.6 Perancangan Sistem	18
3.6.1 Use Case Diagram	18
3.6.2 Activity Diagram	19
3.6.3 Desain Basis Data	19
3.6.4 Desain Antarmuka (Mockup)	19
3.7 Arsitektur Sistem	20
3.8 Metode Pengujian Sistem	20
3.8.1 Blackbox Testing	20
3.8.2 User Acceptance Test (UAT)	21
3.9 Kerangka Alur Penelitian	21
DAFTAR PUSTAKA	21















I. PENDAHULUAN
1.1 Latar Belakang
Hubungan Masyarakat (Humas) dalam institusi pendidikan tinggi vokasi memiliki peran strategis sebagai fasilitator komunikasi dan teknisi komunikasi yang bertanggung jawab dalam mengelola informasi publik serta membangun citra positif institusi. Menurut Sari dan Supriyanto (2022), humas dalam dunia pendidikan berfungsi menciptakan hubungan yang harmonis antara lembaga dengan masyarakat melalui proses komunikasi dua arah. Seiring dengan perkembangan teknologi informasi yang semakin pesat, organisasi dituntut untuk melakukan transformasi digital guna menyediakan akses informasi yang lebih akurat, cepat, dan efisien bagi seluruh anggota organisasi (Rahman et al., 2025).
Berdasarkan hasil observasi dan wawancara yang dilakukan pada bagian Humas Politeknik Negeri Lampung, ditemukan bahwa koordinasi tim dan manajemen kegiatan lapangan masih menghadapi berbagai kendala teknis akibat proses operasional yang masih dilakukan secara manual. Permasalahan utama yang teridentifikasi adalah sulitnya melakukan pemantauan kehadiran anggota tim secara real-time, sehingga admin humas sering kali tidak mengetahui posisi pasti personel saat kegiatan kampus berlangsung. Kondisi tersebut menyebabkan proses koordinasi menjadi kurang optimal, terutama ketika terdapat kegiatan mendadak yang membutuhkan respons cepat dari anggota tim terdekat. Selain itu, belum adanya sistem pengingat (reminder) otomatis juga menyebabkan keterlambatan dalam penyampaian informasi dan koordinasi tugas (Wahyudin et al., 2024).
Permasalahan lain ditemukan pada aspek pengelolaan dokumentasi kegiatan dan perencanaan konten (content plan) media sosial. Penyimpanan tautan dokumentasi kegiatan saat ini masih dilakukan secara terpisah sehingga menyulitkan proses pencarian data kembali ketika dibutuhkan. Selain itu, proses peminjaman alat dokumentasi masih menggunakan pencatatan manual melalui media kertas yang memiliki risiko kehilangan data, kesalahan pencatatan, serta keterlambatan pengembalian alat. Menurut Mujahid dan Handayanto (2024), penerapan sistem manajemen kegiatan berbasis digital sangat penting dalam meningkatkan efisiensi kerja organisasi melalui pengelolaan data yang terintegrasi dan terstruktur.
Pemanfaatan teknologi Global Positioning System (GPS) dan geolocation dapat menjadi solusi untuk melakukan monitoring keberadaan personel secara akurat melalui koordinat lokasi. Pratama dan Harahap (2024) menjelaskan bahwa penggunaan teknologi GPS yang diintegrasikan dengan aplikasi mobile mampu membantu proses pemantauan posisi objek secara waktu nyata. Selain itu, teknologi real-time notification berbasis Firebase Cloud Messaging (FCM) terbukti mampu mempercepat penyampaian informasi kepada pengguna melalui sistem push notification (Safitri et al., 2024). Integrasi teknologi lokasi dan notifikasi pada aplikasi Android diharapkan dapat meningkatkan efektivitas koordinasi tim dalam menjalankan kegiatan lapangan.
Berdasarkan permasalahan tersebut, diperlukan pengembangan sebuah sistem informasi kehumasan berbasis mobile yang mampu mengintegrasikan teknologi GPS dan real-time notification. Sistem ini dirancang untuk membantu proses monitoring kehadiran anggota tim melalui fitur GPS check-in dan live location tracking, mendukung pengelolaan dokumentasi kegiatan, mempermudah manajemen content plan, serta meningkatkan efisiensi pengelolaan peminjaman alat dokumentasi. Oleh karena itu, penelitian ini mengambil judul “Rancang Bangun Sistem Informasi Kehumasan Berbasis Mobile dengan Teknologi GPS dan Real-Time Notification untuk Optimalisasi Koordinasi Tim Kehumasan Politeknik Negeri Lampung”.
1.2 Perumusan Masalah
Berdasarkan latar belakang yang telah diuraikan, maka perumusan masalah dalam penelitian ini adalah sebagai berikut:
Bagaimana merancang sistem informasi kehumasan berbasis mobile yang mengintegrasikan fitur GPS check-in untuk memvalidasi kehadiran tim di lokasi kegiatan secara otomatis?
Bagaimana mengimplementasikan teknologi real-time notification untuk memberikan pengingat jadwal kegiatan dan manajemen pengembalian alat dokumentasi?
Bagaimana mengoptimalkan koordinasi penugasan lapangan melalui fitur live location tracking untuk merespons kegiatan kampus yang bersifat mendadak?
Bagaimana membangun modul manajemen content plan media sosial dan dokumentasi kegiatan yang terorganisasi dalam sistem terpusat?
1.3 Tujuan Penelitian
Tujuan yang ingin dicapai dalam penelitian ini adalah sebagai berikut:
Membangun aplikasi kehumasan berbasis mobile yang memudahkan pemantauan kehadiran tim secara otomatis menggunakan teknologi GPS.
Menerapkan sistem notifikasi otomatis berbasis FCM sebagai mekanisme pengingat tugas dan manajemen peminjaman alat dokumentasi.
Menyediakan fitur pemetaan lokasi anggota tim (live location tracking) untuk mempercepat proses koordinasi penugasan di lingkungan Politeknik Negeri Lampung.
Mengembangkan modul manajemen perencanaan konten dan penyimpanan tautan dokumentasi kegiatan yang terstruktur bagi Humas Polinela.

1.4 Kerangka Pemikiran
Kerangka pemikiran dalam penelitian ini menggambarkan alur penyelesaian masalah secara sistematis untuk menghasilkan solusi perangkat lunak yang sesuai dengan kebutuhan Humas Politeknik Negeri Lampung.
Identifikasi Masalah (Input)
Koordinasi kehadiran tim belum dapat dipantau secara real-time, pencatatan peminjaman alat masih dilakukan secara manual, serta pengelolaan dokumentasi dan content plan belum terintegrasi dalam satu sistem.
Metode Pengembangan (Process)
Pengembangan perangkat lunak menggunakan metode Waterfall yang meliputi tahapan requirement analysis, system design, implementation, testing, dan maintenance sesuai prinsip rekayasa perangkat lunak (Rahmi et al., 2023).
Implementasi Teknologi
Sistem memanfaatkan teknologi GPS untuk pelacakan lokasi personel serta Firebase Cloud Messaging (FCM) untuk pengiriman notifikasi secara waktu nyata kepada pengguna.
Hasil Akhir (Output)
Sistem Informasi Kehumasan Berbasis Mobile yang mampu meningkatkan efektivitas koordinasi tim, transparansi kehadiran, dan efisiensi pengelolaan aset dokumentasi secara digital.

Kerangka pemikiran penelitian ini disajikan dalam bentuk diagram Input, Process, dan Output (IPO) untuk menggambarkan hubungan antara permasalahan, proses pengembangan sistem, dan hasil akhir penelitian.
Diagram kerangka pemikiran dapat dilihat pada Gambar 1.1.


1.5 Batasan Masalah
Agar penelitian lebih terarah dan tidak menyimpang dari tujuan penelitian, maka batasan masalah dalam penelitian ini adalah sebagai berikut:
Sistem dikembangkan khusus untuk platform Android berbasis aplikasi mobile.
Pengguna sistem dibatasi pada admin humas dan anggota tim kehumasan Politeknik Negeri Lampung.
Fitur utama sistem meliputi GPS check-in, live location tracking, real-time notification, monitoring kegiatan, manajemen content plan, dan pencatatan peminjaman alat dokumentasi.
Penentuan lokasi kehadiran menggunakan metode geofencing berdasarkan koordinat GPS pada area kampus atau lokasi kegiatan yang telah ditentukan oleh admin.
1.6 Kontribusi Penelitian
Penelitian ini diharapkan dapat memberikan kontribusi sebagai berikut:
Bagi Humas Polinela
Membantu meningkatkan efektivitas koordinasi tim, akuntabilitas kehadiran personel, serta efisiensi pengelolaan aset dan dokumentasi kegiatan secara digital.
Bagi Tim Kehumasan
Mempermudah proses pelaporan kehadiran, akses informasi penugasan, serta penerimaan notifikasi kegiatan secara otomatis dan real-time.
Bagi Akademik
Menjadi referensi ilmiah dalam pengembangan sistem informasi berbasis lokasi dan notifikasi pada bidang Teknologi Rekayasa Perangkat Lunak (TRPL).

II. TINJAUAN PUSTAKA
2.1 Sistem Informasi
Sistem informasi didefinisikan sebagai sekumpulan komponen yang terdiri dari manusia, teknologi informasi, dan prosedur kerja yang saling berinteraksi untuk memproses, menyimpan, menganalisis, serta menyebarkan informasi guna mencapai tujuan tertentu dalam organisasi. Sejalan dengan hal tersebut, Rahmi et al. (2023) menjelaskan bahwa sistem informasi merupakan rangkaian aktivitas pengolahan data berbasis komputer yang bertujuan untuk menyelesaikan berbagai persoalan organisasi atau memanfaatkan peluang yang muncul.
Keberadaan sistem informasi sangat krusial di era transformasi digital karena mampu meningkatkan efisiensi waktu, mempermudah aksesibilitas data, serta mendukung pengambilan keputusan yang lebih tepat bagi manajemen (Zulfa et al., 2025).
2.2 Sistem Informasi Kehumasan
Hubungan Masyarakat (Humas) memiliki peran strategis sebagai pengelola informasi yang menjembatani hubungan antara individu atau organisasi dengan masyarakat guna membangun citra positif institusi (Ningsih et al., 2022). Menurut Sari dan Supriyanto (2022), manajemen humas dalam institusi pendidikan tinggi harus mampu menciptakan komunikasi dua arah yang harmonis dan transparan.
Implementasi sistem informasi manajemen kehumasan berbasis digital sangat diperlukan untuk mengoordinasikan berbagai aktivitas komunikasi, mengelola perencanaan konten media sosial, serta memonitor kinerja tim secara efektif dan konsisten (Mujahid & Handayanto, 2024). Tanpa adanya sistem yang terintegrasi, proses koordinasi internal humas berisiko menghadapi kendala teknis seperti hilangnya data penting dan keterlambatan respons terhadap agenda kegiatan (Wahyudin et al., 2024).
2.3 Mobile Application
Mobile application atau aplikasi bergerak merupakan perangkat lunak yang dirancang untuk dijalankan pada perangkat bergerak seperti smartphone guna menyediakan akses informasi yang lebih praktis, akurat, dan cepat bagi pengguna (Nurul Hikmah et al., 2024). Penggunaan teknologi mobile dalam manajemen organisasi memungkinkan seluruh proses kerja ditransformasikan dari bentuk fisik menjadi digital yang bersifat personal dan dapat diakses dari mana saja (Rahman et al., 2025).
Aplikasi berbasis mobile saat ini telah menjadi standar dalam pengembangan sistem informasi modern karena kemampuannya dalam mendukung mobilitas tinggi bagi personel lapangan (Safitri et al., 2024).
2.4 Global Positioning System (GPS)
Global Positioning System (GPS) merupakan sistem navigasi berbasis bantuan satelit yang berfungsi untuk menentukan posisi koordinat, kecepatan, dan waktu secara akurat di permukaan bumi (Winardi, 2006). Menurut Pratama dan Harahap (2024), integrasi modul GPS dengan aplikasi mobile sangat efektif untuk melakukan monitoring keberadaan objek atau personel secara real-time melalui titik koordinat lintang (latitude) dan bujur (longitude).
Teknologi ini memungkinkan sistem informasi melakukan validasi lokasi fisik pengguna secara otomatis ketika sedang menjalankan tugas di lapangan (Febriani et al., 2021).
2.5 Live Location Tracking
Live location tracking merupakan proses pelacakan posisi suatu objek secara berkelanjutan dan otomatis dengan memanfaatkan data dari sensor GPS pada perangkat mobile (Setiawan et al., 2022). Fitur ini memungkinkan admin sistem memantau pergerakan anggota tim di lapangan sehingga mempermudah koordinasi penugasan yang bersifat mendadak berdasarkan posisi terdekat personel dari lokasi kegiatan (Pratama & Harahap, 2024).
Pemanfaatan pelacakan lokasi secara real-time memberikan transparansi dan akuntabilitas yang lebih tinggi dalam manajemen kehadiran tim kehumasan (Dhemes & Dhemes, 2018).
2.6 Real-Time Notification
Real-time notification merupakan metode penyampaian pesan atau peringatan secara instan dari sistem ke perangkat pengguna guna memastikan informasi penting diterima tepat waktu tanpa harus membuka aplikasi terlebih dahulu (Safitri et al., 2024). Menurut Wahyudin et al. (2024), ketiadaan mekanisme pengingat otomatis sering menyebabkan keterlambatan respons terhadap dokumen penting atau koordinasi tugas.
Penggunaan notifikasi real-time sangat membantu dalam menginformasikan jadwal kegiatan terbaru maupun memberikan pengingat terkait batas waktu pengembalian aset peminjaman alat.

2.7 Firebase Cloud Messaging (FCM)
Firebase Cloud Messaging (FCM) merupakan layanan pengiriman pesan lintas platform yang dikembangkan oleh Google untuk memfasilitasi pengiriman notifikasi dari server ke aplikasi klien secara efisien (Siddik & Nasution, 2018). FCM memungkinkan pengembang perangkat lunak mengirimkan push notification yang stabil ke perangkat pengguna Android maupun website tanpa memerlukan sumber daya yang besar (Wahyudin et al., 2024).
Teknologi ini menjadi solusi utama dalam membangun sistem notifikasi yang andal karena proses sinkronisasi data dilakukan secara real-time melalui jaringan internet (Hasibuan & Triase, 2022).
2.8 REST API
Representational State Transfer Application Programming Interface (REST API) merupakan arsitektur komunikasi data yang digunakan sebagai media integrasi antar aplikasi pada platform yang berbeda, seperti antara aplikasi Android dengan aplikasi berbasis website (Wahyudin et al., 2024). Penggunaan API memungkinkan beberapa sistem untuk saling berkomunikasi dan bertukar data melalui protokol HTTP secara fleksibel (Kurniawan & Rozi, 2020).
Dalam pengembangan sistem informasi, API berperan sebagai jembatan yang menghubungkan antarmuka aplikasi pengguna dengan basis data terpusat sehingga proses pertukaran data dapat dilakukan secara efektif dan efisien (Wahyudin et al., 2024).
2.9 Database MySQL
MySQL merupakan sistem manajemen basis data relasional (Relational Database Management System) yang digunakan untuk menyimpan, mengelola, dan memanipulasi data dalam jumlah besar secara terstruktur (Nugroho, 2009). Menurut Raharjo (2018), MySQL banyak digunakan dalam pengembangan sistem informasi karena memiliki performa yang cepat, aman, dan kompatibel dengan berbagai bahasa pemrograman seperti PHP.
Pengelolaan data kegiatan, dokumentasi, dan aset kehumasan dalam penelitian ini akan disimpan ke dalam tabel-tabel relasional di MySQL guna mempermudah proses pencarian, pengolahan, dan pelaporan data (Arief, 2011).
2.10 Google Maps API
Google Maps API merupakan layanan antarmuka pemrograman aplikasi yang disediakan oleh Google untuk mengintegrasikan fitur pemetaan digital ke dalam aplikasi yang dikembangkan pengguna (Setiawan et al., 2022). Layanan ini memungkinkan data koordinat dari GPS ditampilkan secara visual dalam bentuk peta interaktif yang mudah dipahami oleh pengguna (Muzakki & Pambudi, 2015).
Google Maps API juga menyediakan fitur pencarian rute dan sinkronisasi lokasi yang akurat guna mendukung fungsionalitas pelacakan personel di lapangan (Safitri et al., 2024).
2.11 Metode Waterfall
Metode Waterfall merupakan model pengembangan perangkat lunak yang dilakukan secara sistematis dan berurutan, di mana setiap tahapan harus diselesaikan terlebih dahulu sebelum melanjutkan ke tahap berikutnya (Rahmi et al., 2023). Menurut Mujahid dan Handayanto (2024), metode Waterfall memiliki beberapa tahapan utama sebagai berikut:
Requirement Analysis
Tahap ini dilakukan untuk mengidentifikasi kebutuhan pengguna dan permasalahan sistem melalui observasi dan wawancara.
System Design
Tahap perancangan arsitektur sistem, desain antarmuka, struktur basis data, serta pemodelan sistem menggunakan UML.
Implementation
Tahap pengkodean program berdasarkan rancangan sistem yang telah dibuat sebelumnya.
Testing
Tahap pengujian sistem untuk memastikan seluruh fungsi berjalan dengan baik menggunakan metode blackbox testing.
Maintenance
Tahap pemeliharaan dan perbaikan sistem berdasarkan umpan balik pengguna setelah sistem diimplementasikan.
2.12 Unified Modeling Language (UML)
Unified Modeling Language (UML) merupakan bahasa pemodelan standar yang digunakan dalam rekayasa perangkat lunak untuk mendokumentasikan, merancang, dan memvisualisasikan spesifikasi sistem yang akan dibangun (Mujahid & Handayanto, 2024). Menurut Mufida et al. (2019), diagram UML yang umum digunakan dalam perancangan sistem meliputi:
Use Case Diagram
Digunakan untuk menggambarkan interaksi antara pengguna dengan sistem.
Activity Diagram
Digunakan untuk memodelkan alur proses bisnis dalam sistem.
Class Diagram
Digunakan untuk menunjukkan struktur kelas dan relasi antarobjek dalam sistem basis data.
2.13 Android
Android merupakan sistem operasi seluler berbasis Linux yang bersifat open source dan dikelola oleh Google (Siddik & Nasution, 2018). Menurut Kocakoyun (2017), Android menyediakan platform terbuka bagi pengembang untuk menciptakan berbagai aplikasi bergerak yang inovatif guna memenuhi kebutuhan pengguna smartphone yang terus meningkat.
Pengembangan aplikasi Android umumnya dilakukan menggunakan Android Studio sebagai Integrated Development Environment (IDE) yang menyediakan berbagai alat pendukung untuk implementasi fitur seperti GPS, notifikasi, dan integrasi API (Safitri et al., 2024). Dalam penelitian ini, Android digunakan sebagai platform utama karena mendukung mobilitas tinggi serta kompatibel dengan berbagai layanan real-time.
2.14 Penelitian Terdahulu
Penelitian mengenai sistem informasi kehumasan dan teknologi berbasis lokasi telah banyak dilakukan sebelumnya. Mujahid dan Handayanto (2024) mengembangkan sistem manajemen kegiatan humas berbasis website yang mampu meningkatkan visibilitas dan konsistensi publikasi melalui pengarsipan dokumen yang lebih terstruktur. Namun, penelitian tersebut masih terbatas pada platform website dan belum mendukung mobilitas tim lapangan secara real-time.
Safitri et al. (2024) mengembangkan aplikasi notifikasi dan geolocation berbasis Android yang terbukti meningkatkan efisiensi tugas lapangan. Akan tetapi, penelitian tersebut lebih berfokus pada pelacakan pedagang keliling dan belum diterapkan pada sistem koordinasi organisasi internal.
Wahyudin et al. (2024) merancang sistem notifikasi otomatis menggunakan Firebase Cloud Messaging (FCM) untuk manajemen persuratan. Hasil penelitian menunjukkan bahwa teknologi notifikasi mampu membantu ketepatan waktu penerimaan informasi. Namun, sistem tersebut belum dilengkapi validasi lokasi pengguna menggunakan GPS.
Pratama dan Harahap (2024) merancang prototipe monitoring keberadaan objek menggunakan GPS tracker berbasis Android yang mengirimkan data lokasi ke Telegram. Penelitian ini berhasil melakukan pemantauan lokasi secara real-time, tetapi masih bergantung pada pihak ketiga dan belum memiliki modul manajemen internal yang terintegrasi.
Muzakki dan Pambudi (2015) mengimplementasikan sistem pengaduan pelanggan menggunakan Google Maps API dan notifikasi real-time untuk memetakan daerah pengaduan pelanggan PDAM. Penelitian tersebut berfokus pada pelayanan publik eksternal dan belum diterapkan untuk koordinasi internal organisasi.
Berdasarkan beberapa penelitian terdahulu tersebut, dapat disimpulkan bahwa belum terdapat penelitian yang mengintegrasikan fitur GPS check-in, live location tracking, real-time notification, manajemen content plan, dokumentasi kegiatan, dan peminjaman alat ke dalam satu sistem informasi kehumasan berbasis mobile secara terintegrasi.
Penelitian terdahulu digunakan sebagai referensi dan pembanding terhadap penelitian yang dilakukan. Perbandingan penelitian terdahulu bertujuan untuk mengetahui posisi penelitian, kekurangan penelitian sebelumnya, serta kebaruan (novelty) penelitian yang akan dikembangkan.
Adapun perbandingan penelitian terdahulu dapat dilihat pada Tabel 2.1.
Tabel 2.1 Penelitian Terdahulu
No
Peneliti
Metode
Teknologi
Hasil
Kekurangan
Research Gap
1
Mujahid & Handayanto (2024)
Waterfall
PHP, XAMPP, UML
Sistem manajemen kegiatan humas berbasis website
Belum mendukung mobilitas penugasan lapangan secara real-time
Penambahan fitur mobile application berbasis GPS
2
Safitri et al. (2024)
Waterfall
Android, Kotlin, GPS
Aplikasi notifikasi dan geolocation
Fokus pada perdagangan
Implementasi untuk koordinasi tim humas
3
Wahyudin et al. (2024)
Waterfall
FCM, API
Sistem notifikasi real-time
Belum ada validasi lokasi
Integrasi GPS check-in
4
Pratama & Harahap (2024)
Prototipe
GPS, ESP32
Sistem monitoring objek
Bergantung pada Telegram
Sistem manajemen internal mandiri
5
Siddik & Nasution (2018)
Pengembangan Sistem
Android, GCM/FCM
Aplikasi push notification
Hanya fokus notifikasi
Integrasi notifikasi dengan manajemen kegiatan
6
Muzakki & Pambudi (2015)
Pengembangan Sistem
Android, MQTT, Google Maps
Sistem pengaduan pelanggan
Fokus pelayanan eksternal
Fokus koordinasi internal humas
7
Rahman et al. (2025)
Waterfall
Website
Aplikasi E-Humas
Platform masih website
Pengembangan berbasis mobile
8
Mufida et al. (2019)
Waterfall
UML, PHP, MySQL
Sistem inventory barang
Belum ada pengingat otomatis
Integrasi notifikasi peminjaman alat

2.15 Research Gap
Berdasarkan hasil tinjauan terhadap beberapa penelitian terdahulu, ditemukan adanya celah penelitian (research gap) yang menjadi dasar pengembangan sistem dalam penelitian ini. Sebagian besar penelitian mengenai sistem informasi kehumasan di perguruan tinggi masih berfokus pada platform berbasis website yang bersifat administratif dan belum mendukung mobilitas tim lapangan secara optimal (Mujahid & Handayanto, 2024; Rahman et al., 2025).
Di sisi lain, penelitian yang memanfaatkan teknologi GPS umumnya hanya digunakan untuk pelacakan objek atau monitoring sederhana tanpa integrasi dengan manajemen kegiatan, dokumentasi, dan aset organisasi secara menyeluruh (Pratama & Harahap, 2024). Penelitian terkait notifikasi real-time juga sebagian besar hanya berfokus pada pengiriman pesan tanpa dikombinasikan dengan validasi lokasi dan sistem koordinasi organisasi (Wahyudin et al., 2024).
Penelitian ini mengisi celah tersebut dengan mengembangkan sebuah sistem informasi kehumasan berbasis mobile yang mengintegrasikan beberapa fitur utama, yaitu:
GPS Check-in untuk validasi kehadiran personel berdasarkan lokasi.
Live Location Tracking untuk memantau posisi anggota tim secara real-time.
Real-Time Notification menggunakan Firebase Cloud Messaging (FCM).
Manajemen content plan media sosial.
Sistem dokumentasi kegiatan terpusat.
Sistem peminjaman alat dokumentasi berbasis digital.
Integrasi berbagai fitur tersebut diharapkan mampu meningkatkan efektivitas koordinasi tim Humas Politeknik Negeri Lampung yang memiliki mobilitas tinggi dalam pelaksanaan kegiatan kampus.
2.16 Kerangka Pemikiran
Kerangka pemikiran dalam penelitian ini disusun berdasarkan alur penyelesaian masalah yang terjadi pada sistem koordinasi tim Humas Politeknik Negeri Lampung.
1. Identifikasi Masalah (Input)
Permasalahan utama yang dihadapi meliputi:
Koordinasi tim humas masih dilakukan secara manual.
Kehadiran personel di lokasi kegiatan belum dapat dipantau secara real-time.
Dokumentasi kegiatan dan content plan media sosial belum tersimpan secara terpusat.
Peminjaman alat dokumentasi masih menggunakan pencatatan manual sehingga berisiko terjadi kehilangan data dan keterlambatan pengembalian alat.
Belum tersedia sistem notifikasi otomatis untuk pengingat jadwal kegiatan maupun pengembalian alat.
2. Pendekatan Sistem (Process)
Untuk menyelesaikan permasalahan tersebut, penelitian ini menggunakan metode pengembangan perangkat lunak Waterfall yang terdiri dari beberapa tahapan, yaitu:
Requirement Analysis
Melakukan observasi dan wawancara guna mengidentifikasi kebutuhan sistem.
System Design
Merancang arsitektur sistem, basis data MySQL, antarmuka aplikasi, serta pemodelan UML seperti Use Case Diagram, Activity Diagram, dan ERD.
Implementation
Melakukan proses pengkodean aplikasi Android serta integrasi REST API, GPS, Google Maps API, dan FCM.
Testing
Melakukan pengujian sistem menggunakan metode Blackbox Testing dan User Acceptance Test (UAT).
Maintenance
Melakukan pemeliharaan sistem berdasarkan hasil evaluasi pengguna.
3. Solusi yang Dihasilkan (Output)
Hasil akhir dari penelitian ini adalah sebuah Sistem Informasi Kehumasan Berbasis Mobile yang mampu:
Memvalidasi kehadiran anggota tim menggunakan fitur GPS check-in.
Menampilkan posisi anggota tim secara real-time melalui fitur live location tracking.
Mengirimkan notifikasi otomatis terkait jadwal kegiatan dan pengembalian alat.
Mengelola content plan media sosial secara terstruktur.
Menyimpan dokumentasi kegiatan dan data peminjaman alat secara terpusat.

III. METODOLOGI PENELITIAN

3.1 Tempat dan Waktu Penelitian
Penelitian ini dilaksanakan pada Unit Hubungan Masyarakat (Humas) Politeknik Negeri Lampung yang berlokasi di Jalan Soekarno-Hatta No. 10, Rajabasa, Bandar Lampung. Lokasi penelitian dipilih karena berdasarkan hasil observasi lapangan, unit Humas Polinela memerlukan digitalisasi sistem untuk meningkatkan efektivitas koordinasi tim lapangan serta pengelolaan aset dokumentasi kegiatan.
Waktu pelaksanaan penelitian direncanakan selama enam bulan yang dimulai dari tahap identifikasi masalah, pengumpulan data, analisis kebutuhan sistem, perancangan sistem, implementasi program, hingga tahap pengujian sistem.
Jadwal pelaksanaan penelitian disusun untuk mempermudah proses pengembangan sistem mulai dari tahap observasi hingga penyusunan laporan akhir.



Adapun jadwal penelitian dapat dilihat pada Tabel 3.1.
No
Kegiatan Penelitian
Bln 1
Bln 2
Bln 3
Bln 4
Bln 5
Bln 6
1
Identifikasi Masalah
✓










2
Observasi dan Wawancara
✓
✓








3
Studi Literatur
✓
✓








4
Analisis Kebutuhan Sistem


✓
✓






5
Perancangan UML Sistem




✓
✓




6
Perancangan Basis Data




✓
✓




7
Perancangan Antarmuka (Mockup)




✓
✓




8
Implementasi Awal Sistem






✓
✓


9
Pengujian Blackbox








✓


10
User Acceptance Test (UAT)








✓
✓
11
Evaluasi dan Perbaikan Sistem










✓
12
Penyusunan Laporan Proposal/Skripsi
✓
✓
✓
✓
✓
✓



3.2 Alat dan Bahan
Alat dan bahan yang digunakan dalam penelitian ini terdiri dari perangkat keras (hardware) dan perangkat lunak (software) sebagai berikut.
3.2.1 Perangkat Keras (Hardware)
Laptop dengan spesifikasi minimal prosesor Quad-Core, RAM 8 GB, dan media penyimpanan SSD.
Smartphone Android yang memiliki sensor GPS aktif untuk pengujian fitur GPS check-in dan live location tracking.
3.2.2 Perangkat Lunak (Software)
Sistem operasi Windows 11 atau Linux.
Android Studio sebagai Integrated Development Environment (IDE).
Visual Studio Code sebagai editor pengembangan backend.
MySQL sebagai sistem manajemen basis data.
Firebase Cloud Messaging (FCM) sebagai layanan real-time notification.
Google Maps API sebagai layanan pemetaan lokasi.
Tabel 3.2 Teknologi yang Digunakan 

Komponen
Teknologi
Mobile App
Android Studio
Framework 
Flutter 
Bahasa Pemrograman
Dart 
IDE 
Visual Studio Code 
Database
MySQL
Backend
REST API
Maps
Google Maps API
Notification
Firebase Cloud Messaging
Penyimpanan File
Firebase Storage





















3.3 Metode Pengembangan Sistem
Metode pengembangan perangkat lunak yang digunakan dalam penelitian ini adalah metode Waterfall. Menurut Rahmi et al. (2023), metode Waterfall merupakan model pengembangan sistem yang dilakukan secara bertahap dan sistematis, di mana setiap tahapan harus diselesaikan terlebih dahulu sebelum melanjutkan ke tahap berikutnya.
Tahapan metode Waterfall dalam penelitian ini meliputi:
Requirement Analysis
Tahap ini dilakukan untuk mengidentifikasi kebutuhan sistem melalui observasi dan wawancara dengan pihak Humas Polinela.
System Design
Tahap perancangan sistem meliputi desain antarmuka, perancangan basis data, dan perancangan alur sistem menggunakan UML.
Implementation
Tahap implementasi dilakukan dengan menerjemahkan rancangan sistem ke dalam bentuk kode program berbasis Android.
Testing
Tahap pengujian dilakukan untuk memastikan seluruh fungsi sistem berjalan sesuai kebutuhan pengguna.
Maintenance
Tahap pemeliharaan dilakukan apabila terdapat kesalahan sistem atau pengembangan fitur tambahan.
3.4 Teknik Pengumpulan Data
Teknik pengumpulan data yang digunakan dalam penelitian ini adalah sebagai berikut.
3.4.1 Observasi
Observasi dilakukan secara langsung pada Unit Humas Polinela untuk mengetahui proses koordinasi kegiatan, pengelolaan dokumentasi, dan proses peminjaman alat yang sedang berjalan.
3.4.2 Wawancara
Wawancara dilakukan dengan Kepala Humas dan staf Humas Polinela untuk memperoleh informasi mengenai kebutuhan sistem dan kendala yang dihadapi.
3.4.3 Studi Literatur
Studi literatur dilakukan dengan mempelajari jurnal, buku, dan referensi ilmiah lainnya yang berkaitan dengan sistem informasi, teknologi GPS, mobile application, dan real-time notification.
3.5 Analisis Kebutuhan Sistem
3.5.1 Kebutuhan Fungsional
Kebutuhan fungsional pada sistem yang akan dibangun meliputi:
Sistem dapat melakukan GPS check-in kehadiran anggota tim.
Sistem dapat menampilkan fitur live location tracking.
Sistem dapat mengirimkan real-time notification.
Sistem dapat mengelola content plan media sosial.
Sistem dapat mencatat peminjaman alat dokumentasi.
Sistem dapat menyimpan dokumentasi kegiatan secara terpusat.
3.5.2 Kebutuhan Nonfungsional
Kebutuhan nonfungsional sistem meliputi:
Sistem dapat diakses melalui perangkat Android.
Sistem memiliki keamanan data pengguna.
Sistem membutuhkan koneksi internet yang stabil.
Sistem memiliki akurasi lokasi yang baik melalui GPS.
3.6 Perancangan Sistem
Perancangan sistem dilakukan menggunakan metode Unified Modeling Language (UML) untuk menggambarkan proses kerja sistem yang akan dibangun. Tahapan perancangan ini bertujuan untuk memberikan gambaran alur sistem, hubungan antar data, serta interaksi pengguna dengan sistem secara terstruktur.
3.6.1 Use Case Diagram
Use Case Diagram digunakan untuk menggambarkan hubungan interaksi antara aktor dengan sistem yang dibangun. Diagram ini menunjukkan hak akses dan aktivitas yang dapat dilakukan oleh Admin Humas maupun anggota tim kehumasan.
Diagram Use Case Sistem Informasi Kehumasan dapat dilihat pada Gambar 3.1.

3.6.2 Activity Diagram
Activity Diagram digunakan untuk menggambarkan alur aktivitas sistem mulai dari proses login, GPS check-in, peminjaman alat, hingga pengelolaan dokumentasi kegiatan.
Diagram aktivitas sistem dapat dilihat pada Gambar 3.2 sampai dengan Gambar 3.5.
[Tempat Gambar Activity Diagram]
3.6.3 Class Diagram
Desain basis data digunakan untuk menjelaskan struktur tabel, atribut, tipe data, primary key, serta relasi antar tabel pada sistem.
Adapun rancangan tabel basis data sistem meliputi tabel pengguna, tabel kegiatan, tabel absensi, tabel peminjaman alat, tabel dokumentasi, dan tabel notifikasi.
3.6.4 Desain Antarmuka (Mockup)
Desain antarmuka bertujuan untuk memberikan gambaran tampilan aplikasi sebelum tahap implementasi dilakukan. Perancangan antarmuka dibuat agar pengguna dapat memahami alur penggunaan sistem dengan mudah.
Desain antarmuka yang dirancang meliputi:
Halaman Login
Dashboard Admin
Dashboard Anggota Tim
Halaman GPS Check-in
Halaman Live Location
Halaman Content Plan
Halaman Peminjaman Alat
Halaman Dokumentasi Kegiatan
Halaman Notifikasi
Mockup antarmuka sistem dapat dilihat pada Gambar 3.8 sampai dengan Gambar 3.16.


3.7 Arsitektur Sistem
Arsitektur sistem yang digunakan pada penelitian ini menerapkan konsep client-server. Aplikasi Android berfungsi sebagai client yang berkomunikasi dengan server melalui REST API.
Sistem memanfaatkan Firebase Cloud Messaging (FCM) untuk pengiriman notifikasi secara waktu nyata serta Google Maps API untuk menampilkan lokasi pengguna pada peta digital. Seluruh data sistem disimpan dalam basis data MySQL yang terintegrasi dengan server.
Arsitektur sistem menggambarkan hubungan antara aplikasi Android, server, REST API, Firebase Cloud Messaging (FCM), Google Maps API, dan database MySQL.

Arsitektur sistem dapat dilihat pada Gambar 3.2.


3.8 Metode Pengujian Sistem
3.8.1 Blackbox Testing
Metode Blackbox Testing digunakan untuk menguji fungsi sistem berdasarkan masukan dan keluaran tanpa melihat kode program secara langsung.
Pengujian dilakukan pada fitur:
Login sistem
GPS check-in
Live location tracking
Real-time notification
Peminjaman alat
Manajemen dokumentasi
3.8.2 User Acceptance Test (UAT)
User Acceptance Test (UAT) dilakukan untuk mengetahui tingkat penerimaan pengguna terhadap sistem yang dibangun.
Pengujian dilakukan menggunakan kuesioner dengan skala Likert kepada staf Humas Polinela untuk menilai:
Kemudahan penggunaan sistem
Tampilan antarmuka
Kecepatan sistem
Kesesuaian fitur dengan kebutuhan pengguna
3.9 Kerangka Alur Penelitian
Kerangka alur penelitian dimulai dari tahap identifikasi masalah, pengumpulan data, analisis kebutuhan sistem, perancangan sistem, implementasi program, pengujian sistem, hingga tahap evaluasi hasil penelitian.

Kerangka alur penelitian digunakan untuk menggambarkan tahapan penelitian secara sistematis mulai dari identifikasi masalah hingga evaluasi sistem.
Diagram alur penelitian dapat dilihat pada Gambar 3.3.




DAFTAR PUSTAKA
Arief, M. R. (2011). Pemrograman web dinamis menggunakan PHP dan MySQL. Andi Publisher.
Iqbal, M. (2023). Manajemen humas dalam upaya meningkatkan mutu pendidikan perguruan tinggi. Jurnal Humaniora dan Ilmu Pendidikan (Jahidik), 2(2), 71–78. https://doi.org/10.35912/jahidik.v2i2.1565
Mufida, E., Rahmawati, E., & Hertiana, H. (2019). Rancang bangun sistem informasi inventory pada salon kecantikan. Jurnal Mantik Penusa, 3(3), 99–102.
Mujahid, A., & Handayanto, A. (2024). Sistem manajemen kegiatan kehumasan berbasis website. IN-FEST 2024 Seminar Nasional Informatika – FTI UPGRIS, 2(1), 79–85.
Muzakki, & Pambudi. (2015). Sistem pengaduan pelanggan dan pemetaan daerah pengaduan menggunakan Google Maps API. Jurnal Teknik Informatika Universitas Muhammadiyah Sidoarjo, 1–7.
Ningsih, I., Arman, & Harnalia. (2022). Strategi manajemen humas dalam meningkatkan citra sekolah di SMPN 1 Tellu Siattinge. Jurnal Mappesona, 5(1), 11–21. https://doi.org/10.30863/mappesona.v5i1.2495
Nugroho, B. (2009). Database relasional dengan MySQL. Andi Publisher.
Pratama, S., & Harahap, M. K. (2024). Perancangan prototipe monitoring keberadaan objek menggunakan GPS tracker berbasis Android. Remik: Riset dan E-Jurnal Manajemen Informatika Komputer, 8(3), 821–830.
Raharjo, B. (2018). Belajar otodidak framework CodeIgniter: Teknik pemrograman web dengan PHP 7 dan framework 3 (Revisi). Informatika.
Rahman, F. Y., Purnomo, I. I., Rizal, A., Habibullah, A., & Rahman, M. W. (2025). Aplikasi E-Humas dalam peningkatan pelayanan kehumasan Universitas Islam Kalimantan MAB Banjarmasin. Technologia: Jurnal Ilmiah, 16(1), 1–7. http://dx.doi.org/10.31602/tji.v16i1.16379
Rahmi, E., Yumami, E., & Hidayasari, N. (2023). Analisis metode pengembangan sistem informasi berbasis website: Systematic literature review. Remik: Riset dan E-Jurnal Manajemen Informatika Komputer, 7(1), 821–834. https://doi.org/10.33395/remik.v7i1.12177
Ratnasari, E., Rahmat, A., & Prastowo, F. A. A. (2018). Peran humas perguruan tinggi negeri badan hukum dalam implementasi kebijakan keterbukaan informasi. PRofesi Humas, 3(1), 21–38.
Safitri, R., Setiawan, H., Ariyanti, N., & Dijaya, R. (2024). Rancang bangun aplikasi notifikasi dan geolocation pada pedagang keliling terdekat berbasis Android. DECODE: Jurnal Pendidikan Teknologi Informasi, 4(1), 52–64. https://doi.org/10.51454/decode.v4i1.173
Sari, L. A., & Supriyanto, A. (2022). Peran humas sebagai fasilitator publikasi informasi dan dokumentasi di perguruan tinggi. Jurnal Manajemen Pendidikan, 13(1), 1–5. https://doi.org/10.21009/jmp.v13i1.27048
Septiyani, D. A. (2024). Evolusi public relation di era digital: Strategi untuk membangun reputasi di dunia maya. Journal Media Public Relations, 4(1), 1–9.
Sugiyono. (2017). Metode penelitian kuantitatif, kualitatif, dan R&D. Alfabeta.
Wahyudin, Y., Anisyah, A., & Ahmaddifa, D. (2024). Pengembangan sistem notifikasi real-time untuk aplikasi manajemen persuratan multiplatform menggunakan Firebase Cloud Messaging dan Application Programming Interface. Jurnal Teknik Informatika Unika ST. Thomas (JTIUST), 9(2), 106–113.
Winardi. (2006). Penentuan posisi dengan GPS untuk survei terumbu karang. Puslit.
Yuliana, C. A. (2025). Perancangan sistem informasi layanan humas Politeknik Negeri Media Kreatif menggunakan metode agile development [Laporan Tugas Akhir, Politeknik Negeri Media Kreatif].
Zulfa, A. A., Ibrahim, T., & Arifudin, O. (2025). Peran sistem informasi akademik berbasis web dalam upaya meningkatkan efektivitas dan efisiensi pengelolaan akademik di perguruan tinggi. Jurnal Tahsinia, 6(1), 115–134.

