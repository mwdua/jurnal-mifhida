/**
 * GOOGLE APPS SCRIPT - BACKEND API for YPI Miftahul Hidayah
 * Salin kode ini ke Google Apps Script (Extensions > Apps Script)
 * Pastikan untuk mengganti SPREADSHEET_ID dengan ID Spreadsheet Anda.
 * Kemudian Deploy sebagai Web App dengan akses "Anyone".
 */

const SPREADSHEET_ID = 'PASTE_YOUR_SPREADSHEET_ID_HERE';

/**
 * SETUP OTOMATIS: Jalankan fungsi ini sekali untuk membuat semua Sheet & Header
 */
function setupSpreadsheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const structures = {
    'tb_users': ['id', 'email', 'nama', 'role', 'jenjang_kelas'],
    'tb_siswa': ['id', 'nisn', 'nama_lengkap', 'jenjang', 'kelas', 'nama_wali', 'no_hp_wali', 'alamat', 'tanggal_lahir', 'tempat_lahir', 'jenis_kelamin', 'tahun_ajaran', 'foto_url', 'status_aktif'],
    'tb_guru': ['id', 'nip', 'nama_guru', 'jabatan', 'nuptk'],
    'tb_matapelajaran': ['id', 'nama_mapel', 'jenjang', 'kelas', 'guru_pengampu', 'alokasi_jam'],
    'tb_jadwal': ['id', 'hari', 'jam_mulai', 'jam_selesai', 'id_mapel', 'kelas', 'id_guru'],
    'tb_absensi': ['id_absensi', 'id_siswa', 'nisn', 'nama_siswa', 'kelas', 'jenjang', 'tanggal', 'status', 'keterangan', 'metode_input', 'id_guru', 'timestamp'],
    'tb_nilai_sd': ['id_nilai', 'id_siswa', 'nisn', 'nama_siswa', 'kelas', 'semester', 'mata_pelajaran', 'tujuan_pembelajaran', 'jenis_penilaian', 'nilai', 'tanggal', 'id_guru', 'catatan'],
    'tb_nilai_paud': ['id_nilai', 'id_siswa', 'nisn', 'nama_siswa', 'jenjang', 'kelas', 'semester', 'aspek_perkembangan', 'indikator', 'capaian', 'keterangan', 'tanggal', 'id_guru'],
    'tb_jurnal': ['id', 'tanggal', 'kelas', 'mapel', 'materi', 'tujuan_pembelajaran', 'metode', 'media', 'catatan', 'id_guru'],
    'tb_bk': ['id', 'tanggal', 'id_siswa', 'nama_siswa', 'jenis_masalah', 'deskripsi', 'tindak_lanjut', 'pihak_terlibat', 'status', 'follow_up'],
    'tb_settings': ['key', 'value', 'description']
  };

  for (let sheetName in structures) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(structures[sheetName]);
      // Format Header (Bold & Background)
      sheet.getRange(1, 1, 1, structures[sheetName].length)
           .setFontWeight('bold')
           .setBackground('#f3f3f3');
      Logger.log('Dibuat: ' + sheetName);
    }
  }

  // Tambahkan 1 user admin default jika tb_users kosong
  const userSheet = ss.getSheetByName('tb_users');
  if (userSheet.getLastRow() === 1) {
    userSheet.appendRow(['USR-001', 'email_anda@gmail.com', 'Administrator', 'admin', 'Semua']);
    Logger.log('User admin default ditambahkan. Silakan ganti email di Spreadsheet.');
  }

  return "Setup Selesai! Periksa Tab Log.";
}

/**
 * GET Handler - Untuk mengambil data
 */
function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  try {
    switch (action) {
      case 'getUserByEmail':
        return handleGetUserByEmail(ss, e.parameter.email);
      case 'getData':
        return handleGetData(ss, e.parameter.sheet);
      case 'getDashboardStats':
        return handleGetDashboardStats(ss);
      case 'getSettings':
        return handleGetSettings(ss);
      default:
        return returnJSON({ success: false, message: 'Action not found: ' + action });
    }
  } catch (error) {
    return returnJSON({ success: false, message: error.toString() });
  }
}

/**
 * POST Handler - Untuk simpan/edit/delete data
 */
function doPost(e) {
  let params;
  try {
    params = JSON.parse(e.postData.contents);
  } catch (err) {
    return returnJSON({ success: false, message: 'Invalid JSON body' });
  }

  const action = params.action;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  try {
    switch (action) {
      case 'upsertRecord':
        return handleUpsertRecord(ss, params.sheet, params.data, params.idColumn);
      case 'batchInsert':
        return handleBatchInsert(ss, params.sheet, params.data);
      case 'softDelete':
        return handleSoftDelete(ss, params.sheet, params.id);
      case 'saveSettings':
        return handleSaveSettings(ss, params.data);
      default:
        return returnJSON({ success: false, message: 'Action not found: ' + action });
    }
  } catch (error) {
    return returnJSON({ success: false, message: error.toString() });
  }
}

/** 
 * Helper Functions 
 */

function handleGetUserByEmail(ss, email) {
  const users = getSheetDataAsObjects(ss, 'tb_users');
  const user = users.find(u => u.email === email);
  if (user) {
    return returnJSON({ success: true, data: user });
  }
  return returnJSON({ success: false, message: 'User tidak ditemukan di tb_users' });
}

function handleGetData(ss, sheetName) {
  const data = getSheetDataAsObjects(ss, sheetName);
  return returnJSON({ success: true, data: data });
}

function handleGetSettings(ss) {
  const data = getSheetDataAsObjects(ss, 'tb_settings');
  // Settings usually key-value pairs or a single row
  return returnJSON({ success: true, data: data[0] || {} });
}

function handleUpsertRecord(ss, sheetName, data, idColumn = 'id') {
  const sheet = ss.getSheetByName(sheetName);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idIndex = headers.indexOf(idColumn);
  
  if (idIndex === -1) throw new Error('ID Column not found');

  let targetRowIndex = -1;
  const idValue = data[idColumn];

  if (idValue) {
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][idIndex] == idValue) {
        targetRowIndex = i + 1;
        break;
      }
    }
  }

  const rowValues = headers.map(h => data[h] !== undefined ? data[h] : "");

  if (targetRowIndex !== -1) {
    sheet.getRange(targetRowIndex, 1, 1, headers.length).setValues([rowValues]);
  } else {
    // Generate ID if missing
    if (!idValue) {
      rowValues[idIndex] = 'ID-' + new Date().getTime();
    }
    sheet.appendRow(rowValues);
  }

  return returnJSON({ success: true, message: 'Data berhasil disimpan' });
}

function handleBatchInsert(ss, sheetName, dataArray) {
  const sheet = ss.getSheetByName(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  const values = dataArray.map(item => {
    return headers.map(h => item[h] !== undefined ? item[h] : "");
  });

  sheet.getRange(sheet.getLastRow() + 1, 1, values.length, headers.length).setValues(values);
  return returnJSON({ success: true, message: values.length + ' baris diimpor' });
}

function handleSoftDelete(ss, sheetName, id) {
  const sheet = ss.getSheetByName(sheetName);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idIndex = headers.indexOf('id'); // Assumed id column name
  const statusIndex = headers.indexOf('status_aktif');

  if (idIndex === -1) return returnJSON({ success: false, message: 'ID column not found' });

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idIndex] == id) {
      if (statusIndex !== -1) {
        sheet.getRange(i + 1, statusIndex + 1).setValue(false);
        return returnJSON({ success: true, message: 'Status dinonaktfikan' });
      } else {
        // Fallback to real delete if no status_aktif column
        sheet.deleteRow(i + 1);
        return returnJSON({ success: true, message: 'Baris dihapus permanen' });
      }
    }
  }
  return returnJSON({ success: false, message: 'Data tidak ditemukan' });
}

/** 
 * Utility: Convert Sheet to Array of Objects 
 */
function getSheetDataAsObjects(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  
  const headers = data[0];
  const results = [];
  
  for (let i = 1; i < data.length; i++) {
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    results.push(obj);
  }
  return results;
}

function returnJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
