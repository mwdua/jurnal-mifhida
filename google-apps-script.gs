/**
 * SIKAD (Sistem Informasi Kehadiran & Akademik) - Backend Script
 * Versi: 2.0.0
 * 
 * PETUNJUK:
 * 1. Buka Spreadsheet Anda.
 * 2. Klik Extensions > Apps Script.
 * 3. Hapus semua kode yang ada dan tempel kode ini.
 * 4. Simpan (Ctrl+S) dengan nama "SIKAD_Backend".
 * 5. Klik "Deploy" > "New Deployment".
 * 6. Pilih Type: "Web App".
 * 7. Set "Execute as": "Me" dan "Who has access": "Anyone" (PENTING!).
 * 8. Klik Deploy dan Salin URL Web App-nya.
 */

const SS = SpreadsheetApp.getActiveSpreadsheet();

// Definisi Struktur Sheet & Dummy Data
const SHEETS_CONFIG = {
  'tb_siswa': {
    headers: ['id', 'nisn', 'nama_lengkap', 'jenjang', 'kelas', 'jenis_kelamin', 'nama_wali', 'no_hp_wali', 'foto_url', 'tahun_ajaran', 'status_aktif'],
    dummy: [
      ['1', '1234567890', 'Budi Santoso', 'SD', '1 A', 'Laki-laki', 'Ayah Budi', '08123456789', '', '2023/2024', true],
      ['2', '0987654321', 'Siti Aminah', 'SD', '2 B', 'Perempuan', 'Ibu Siti', '08987654321', '', '2023/2024', true]
    ]
  },
  'tb_absensi': {
    headers: ['id', 'id_siswa', 'tanggal', 'status', 'keterangan'],
    dummy: [
      ['1', '1234567890', '2024-05-01', 'H', 'Tepat waktu'],
      ['2', '0987654321', '2024-05-01', 'S', 'Sakit panas']
    ]
  },
  'tb_nilai': {
    headers: ['id', 'id_siswa', 'mapel', 'nilai', 'semester', 'tahun_ajaran', 'kategori'],
    dummy: [
      ['1', '1234567890', 'Matematika', 85, '1', '2023/2024', 'Sumatif']
    ]
  },
  'tb_jurnal': {
    headers: ['id', 'tanggal', 'jam', 'kelas', 'mapel', 'materi', 'rincian', 'guru'],
    dummy: [
      ['1', '2024-05-01', '1-2', '1 A', 'Matematika', 'Penjumlahan', 'Belajar tambah 1-10', 'Pak Guru']
    ]
  },
  'tb_bk': {
    headers: ['id', 'id_siswa', 'tanggal', 'kategori', 'catatan', 'tindak_lanjut', 'status'],
    dummy: [
      ['1', '1234567890', '2024-05-01', 'Prestasi', 'Menang lomba mewarnai', 'Bonus nilai', 'Selesai']
    ]
  },
  'tb_pengaturan': {
    headers: ['kunci', 'nilai'],
    dummy: [
      ['nama_sekolah', 'SIKAD Unggul'],
      ['tahun_ajaran_aktif', '2023/2024']
    ]
  }
};

/**
 * Endpoint GET - Membaca data
 */
function doGet(e) {
  try {
    // Inisialisasi sheet jika belum ada atau kosong
    initDatabase();

    const action = e.parameter.action;
    const sheetName = e.parameter.sheet || action; // Default sheet name equals action if not specified
    const result = getSheetData(sheetName);
    
    return Response(true, "Data Berhasil Dimuat", result);
  } catch (error) {
    return Response(false, error.toString());
  }
}

/**
 * Endpoint POST - Menyimpan/Update data
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    
    if (action === 'save' || action === 'upsertRecord') {
      const sheetName = payload.sheet || payload.data.sheet;
      const data = payload.data;
      saveData(sheetName, data);
      return Response(true, "Data Berhasil Disimpan");
    }

    if (action === 'batchInsert') {
       const sheetName = payload.sheet;
       const items = payload.data;
       if (Array.isArray(items)) {
         items.forEach(item => saveData(sheetName, item));
       }
       return Response(true, "Batch Data Berhasil Disimpan");
    }

    if (action === 'softDelete') {
       const sheetName = payload.sheet;
       const id = payload.id;
       updateData(sheetName, id, { 'status_aktif': false }, 'id');
       return Response(true, "Data Berhasil Dinonaktifkan");
    }

    return Response(false, "Aksi Tidak Dikenali: " + action);
  } catch (error) {
    return Response(false, error.toString());
  }
}

/**
 * Update Data di sheet based on ID
 */
function updateData(name, id, updateObj, idCol = 'id') {
  const sheet = SS.getSheetByName(name);
  if (!sheet) return;
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIdx = headers.indexOf(idCol);
  
  if (idIdx === -1) return;

  for (let i = 1; i < data.length; i++) {
    if (data[i][idIdx].toString() == id.toString()) {
      for (let key in updateObj) {
        let colIdx = headers.indexOf(key);
        if (colIdx !== -1) {
          sheet.getRange(i + 1, colIdx + 1).setValue(updateObj[key]);
        }
      }
      break;
    }
  }
}

/**
 * Inisialisasi Database & Dummy Data
 */
function initDatabase() {
  for (let name in SHEETS_CONFIG) {
    let sheet = SS.getSheetByName(name);
    if (!sheet) {
      sheet = SS.insertSheet(name);
      sheet.appendRow(SHEETS_CONFIG[name].headers);
      // Tambah dummy data jika baru dibuat
      const dummy = SHEETS_CONFIG[name].dummy;
      if (dummy.length > 0) {
        sheet.getRange(2, 1, dummy.length, dummy[0].length).setValues(dummy);
      }
    } else {
      // Jika sheet ada tapi hanya ada header (kosong), tambah dummy
      if (sheet.getLastRow() === 1) {
        const dummy = SHEETS_CONFIG[name].dummy;
        if (dummy.length > 0) {
          sheet.getRange(2, 1, dummy.length, dummy[0].length).setValues(dummy);
        }
      }
    }
  }
}

/**
 * Ambil data dari sheet
 */
function getSheetData(name) {
  const sheet = SS.getSheetByName(name);
  if (!sheet) throw new Error("Sheet '" + name + "' tidak ditemukan.");
  
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  
  const headers = values[0];
  const items = [];
  for (let i = 1; i < values.length; i++) {
    let obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = values[i][j];
    }
    items.push(obj);
  }
  return items;
}

/**
 * Simpan/Update Data ke sheet
 */
function saveData(name, data) {
  const sheet = SS.getSheetByName(name);
  if (!sheet) throw new Error("Sheet '" + name + "' tidak ditemukan.");
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Check if it's an update (has id)
  if (data.id) {
    const values = sheet.getDataRange().getValues();
    const idIdx = headers.indexOf('id');
    if (idIdx !== -1) {
      for (let i = 1; i < values.length; i++) {
        if (values[i][idIdx].toString() == data.id.toString()) {
          // Update existing row
          for (let key in data) {
            let colIdx = headers.indexOf(key);
            if (colIdx !== -1) {
              sheet.getRange(i + 1, colIdx + 1).setValue(data[key]);
            }
          }
          return;
        }
      }
    }
  }

  // Not an update or ID not found -> Append new row
  // Generate ID if missing
  if (!data.id) {
    data.id = new Date().getTime().toString() + Math.floor(Math.random() * 1000);
  }
  
  const row = headers.map(h => data[h] || "");
  sheet.appendRow(row);
}

/**
 * Format Response JSON
 */
function Response(success, message, data = null) {
  const output = {
    success: success,
    message: message,
    data: data
  };
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}
