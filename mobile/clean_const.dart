import 'dart:io';

void main() {
  final projectDir = Directory.current.path;
  print('=== MEMULAI PEMBERSIHAN OTOMATIS CONST DENGAN BUILD LOOP ===');
  print('Direktori: $projectDir\n');

  int totalFixed = 0;
  int loopCount = 0;

  while (loopCount < 20) {
    loopCount++;
    print('Loop #$loopCount: Menjalankan "flutter build windows" untuk mendeteksi error const...');
    
    // Kita jalankan build windows karena compiler AOT/kernel compile di build phase 
    // melakukan evaluasi konstanta secara ketat, sedangkan flutter analyze seringkali meloloskannya.
    final result = Process.runSync(
      'flutter', 
      ['build', 'windows', '--debug'], // Menggunakan --debug agar cepat
      runInShell: true
    );
    
    final output = result.stdout.toString() + '\n' + result.stderr.toString();

    // Regex untuk mencocokkan format error build:
    // lib/screens/activities/activities_list_screen.dart(63,23): error G8388A750: Constant evaluation error
    // lib/screens/activities/activities_list_screen.dart:63:23: Error: Constant evaluation error
    final buildRegex = RegExp(
      r'([a-zA-Z0-9_\-\/]+\.dart)(?:\((\d+),\d+\)|:(\d+):\d+)',
      caseSensitive: false,
    );

    final matches = buildRegex.allMatches(output).toList();
    if (matches.isEmpty) {
      // Cek apakah build berhasil atau gagal karena error lain
      if (output.contains('Constant evaluation error')) {
        print('Gagal memparse output error, silakan periksa log di bawah ini secara manual.');
        print(output);
        break;
      }
      
      print('\n🎉 SUKSES: Tidak ditemukan error Constant Evaluation!');
      print('Aplikasi sekarang siap dijalankan dengan "flutter run".');
      break;
    }

    print('Menemukan ${matches.length} baris error. Memproses perbaikan...');
    int fixedInThisLoop = 0;
    final processedLocations = <String>{};

    for (final match in matches) {
      final filePathRaw = match.group(1)!;
      // Gunakan line number dari group 2 (format tanda kurung) atau group 3 (format titik dua)
      final lineStr = match.group(2) ?? match.group(3);
      if (lineStr == null) continue;
      
      final lineNum = int.parse(lineStr);

      // Kadang jalurnya relatif, ubah ke absolute jika diperlukan atau biarkan relatif
      final file = File(filePathRaw);
      if (!file.existsSync()) {
        // Coba cari di lib/
        final altFile = File('lib/' + filePathRaw.replaceAll(RegExp(r'^lib/'), ''));
        if (!altFile.existsSync()) continue;
      }

      final locationKey = '${file.absolute.path}:$lineNum';
      if (processedLocations.contains(locationKey)) continue;
      processedLocations.add(locationKey);

      final lines = file.readAsLinesSync();
      if (lineNum <= 0 || lineNum > lines.length) continue;

      // Cari kata kunci "const" dari baris error ke atas (maksimal 20 baris)
      int targetLine = lineNum - 1;
      bool found = false;
      while (targetLine >= 0 && (lineNum - targetLine) <= 20) {
        final line = lines[targetLine];
        
        if (line.contains('static const ')) {
          lines[targetLine] = line.replaceFirst('static const ', 'static final ');
          print('-> [${file.path}] Mengubah static const -> static final pada baris ${targetLine + 1}');
          found = true;
          break;
        } else if (line.contains('const ')) {
          lines[targetLine] = line.replaceFirst('const ', '');
          print('-> [${file.path}] Menghapus kata kunci const pada baris ${targetLine + 1}');
          found = true;
          break;
        }
        targetLine--;
      }

      if (found) {
        file.writeAsStringSync(lines.join('\n') + '\n');
        fixedInThisLoop++;
        totalFixed++;
      }
    }

    if (fixedInThisLoop == 0) {
      print('\n⚠️ Tidak ada const baru yang berhasil dibersihkan otomatis pada loop ini.');
      break;
    }

    print('Berhasil memperbaiki $fixedInThisLoop lokasi pada loop ini. Mengulang build...\n');
  }

  print('\n=== SELESAI ===');
  print('Total perbaikan otomatis: $totalFixed lokasi.');
}
