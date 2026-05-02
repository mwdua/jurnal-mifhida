/**
 * Attendance Module
 */
import { api } from '../api';
import { Modal, Toast, Loader } from '../ui-elements';

export class AttendanceModule {
  private students: any[] = [];
  private attendanceData: Record<string, string> = {}; // id_siswa: status
  private currentDate: string = new Date().toISOString().split('T')[0];

  async render(): Promise<string> {
    return `
      <div class="space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h3 class="text-xl font-bold font-heading">Absensi Siswa</h3>
                <p class="text-sm text-text-muted">Pencatatan kehadiran harian.</p>
            </div>
            <div class="flex items-center space-x-3">
                <input type="date" id="absensi-date" value="${this.currentDate}" 
                    class="p-2 border rounded-lg bg-white text-sm">
                <button id="btn-save-absensi" class="btn btn-primary">
                    <i data-lucide="save" class="h-4 w-4 mr-2"></i> Simpan
                </button>
            </div>
        </div>

        <!-- Tabs Absensi -->
        <div class="flex border-b">
            <button id="tab-abs-manual" class="px-6 py-3 border-b-2 border-primary text-primary font-bold">Input Manual</button>
            <button id="tab-abs-qr" class="px-6 py-3 border-b-2 border-transparent text-text-muted">QR Scanner</button>
        </div>

        <!-- Mode QR Scanner -->
        <div id="section-abs-qr" class="hidden fade-in">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div class="card p-0 overflow-hidden relative">
                    <div id="reader" style="width: 100%; min-height: 300px;" class="bg-black"></div>
                    <div id="scan-feedback" class="absolute inset-0 z-10 flex items-center justify-center bg-black/40 hidden">
                         <div id="scan-feedback-card" class="bg-white p-6 rounded-xl shadow-2xl text-center transform scale-0 transition-transform duration-300">
                            <!-- Feedback Card Injected -->
                         </div>
                    </div>
                    <div class="p-4 bg-app-bg/50 border-t flex justify-between items-center">
                        <p class="text-xs text-text-muted">Arahkan QR Code Kartu Pelajar ke kamera</p>
                        <button id="btn-toggle-scanner" class="btn btn-primary btn-sm">Mulai Scanner</button>
                    </div>
                </div>
                <div class="card">
                    <h4 class="font-bold mb-4 flex items-center">
                        <i data-lucide="list" class="h-4 w-4 mr-2"></i> Log Scan Masuk
                    </h4>
                    <div id="scan-log" class="space-y-3 max-h-[400px] overflow-y-auto">
                        <p class="text-center text-gray-400 py-10">Belum ada scan hari ini.</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Mode Manual -->
        <div id="section-abs-manual" class="fade-in">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div class="md:col-span-3">
                    <select id="abs-filter-group" class="w-full p-3 border border-border-light rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                        <option value="">-- Pilih Jenjang / Kelas --</option>
                        <option value="KB">KB (Kelompok Bermain)</option>
                        <option value="TK">TK (Taman Kanak-kanak)</option>
                        <option value="SD-1">KELAS 1</option>
                        <option value="SD-2">KELAS 2</option>
                        <option value="SD-3">KELAS 3</option>
                        <option value="SD-4">KELAS 4</option>
                        <option value="SD-5">KELAS 5</option>
                        <option value="SD-6">KELAS 6</option>
                    </select>
                </div>
                <button id="btn-load-siswa-abs" class="btn btn-accent rounded-xl shadow-lg shadow-orange-500/10">Tampilkan</button>
            </div>

            <div class="card p-0 overflow-hidden">
                <table class="w-full text-left">
                    <thead class="bg-app-bg/50 border-b">
                        <tr>
                            <th class="px-6 py-4 text-xs font-bold text-text-muted uppercase">Siswa</th>
                            <th class="px-6 py-4 text-xs font-bold text-text-muted uppercase text-center">H</th>
                            <th class="px-6 py-4 text-xs font-bold text-text-muted uppercase text-center">I</th>
                            <th class="px-6 py-4 text-xs font-bold text-text-muted uppercase text-center">S</th>
                            <th class="px-6 py-4 text-xs font-bold text-text-muted uppercase text-center">A</th>
                        </tr>
                    </thead>
                    <tbody id="absensi-table-body" class="divide-y">
                         <tr><td colspan="2" class="p-12 text-center text-gray-400">Pilih kelas lalu klik tampilkan.</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    `;
  }

  private html5QrCode: any = null;

  async onMount() {
    document.getElementById('btn-load-siswa-abs')?.addEventListener('click', () => this.loadStudents());
    document.getElementById('btn-save-absensi')?.addEventListener('click', () => this.submitAttendance());
    
    // Tab Logic
    document.getElementById('tab-abs-manual')?.addEventListener('click', () => this.switchTab('manual'));
    document.getElementById('tab-abs-qr')?.addEventListener('click', () => this.switchTab('qr'));

    // Scan Logic
    document.getElementById('btn-toggle-scanner')?.addEventListener('click', () => this.toggleScanner());

    if ((window as any).lucide) (window as any).lucide.createIcons();
  }

  private switchTab(mode: string) {
      document.getElementById('section-abs-manual')?.classList.toggle('hidden', mode !== 'manual');
      document.getElementById('section-abs-qr')?.classList.toggle('hidden', mode !== 'qr');
      
      const tabManual = document.getElementById('tab-abs-manual')!;
      const tabQr = document.getElementById('tab-abs-qr')!;

      if (mode === 'manual') {
          tabManual.classList.add('border-primary', 'text-primary', 'font-bold');
          tabManual.classList.remove('border-transparent', 'text-text-muted');
          tabQr.classList.remove('border-primary', 'text-primary', 'font-bold');
          tabQr.classList.add('border-transparent', 'text-text-muted');
          this.stopScanner();
      } else {
          tabQr.classList.add('border-primary', 'text-primary', 'font-bold');
          tabQr.classList.remove('border-transparent', 'text-text-muted');
          tabManual.classList.remove('border-primary', 'text-primary', 'font-bold');
          tabManual.classList.add('border-transparent', 'text-text-muted');
      }
  }

  private toggleScanner() {
      if (this.html5QrCode && this.html5QrCode.isScanning) {
          this.stopScanner();
          document.getElementById('btn-toggle-scanner')!.textContent = 'Mulai Scanner';
      } else {
          this.startScanner();
          document.getElementById('btn-toggle-scanner')!.textContent = 'Berhenti';
      }
  }

  private async startScanner() {
      if (!this.html5QrCode) {
          this.html5QrCode = new (window as any).Html5Qrcode("reader");
      }

      try {
          await this.html5QrCode.start(
              { facingMode: "environment" },
              { fps: 10, qrbox: { width: 250, height: 250 } },
              (decodedText: string) => this.onScanSuccess(decodedText),
              () => {} 
          );
      } catch (err) {
          Toast.show('Kamera gagal diakses atau tidak ditemukan', 'error');
      }
  }

  private stopScanner() {
      if (this.html5QrCode) {
          this.html5QrCode.stop().catch(() => {});
      }
  }

  private onScanSuccess(nisn: string) {
      // Find Student by NISN
      // Logic: If found, record attendance as 'H' and show feedback
      console.log('Scanned NISN:', nisn);
      
      this.playBeep();
      this.showScanFeedback({ nisn, nama_lengkap: 'Siswa Terdeteksi', kelas: '...' });
      
      // Push to Log and Update Data
      this.updateLog(nisn);
  }

  private playBeep() {
      const audioCtx = new (window as any).AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
  }

  private showScanFeedback(student: any) {
      const container = document.getElementById('scan-feedback');
      const card = document.getElementById('scan-feedback-card');
      if (!container || !card) return;

      card.innerHTML = `
        <div class="h-20 w-20 bg-success-bg rounded-full mx-auto mb-4 flex items-center justify-center text-success">
            <i data-lucide="check" class="h-10 w-10"></i>
        </div>
        <h4 class="text-xl font-bold">${student.nama_lengkap}</h4>
        <p class="text-text-muted">${student.nisn}</p>
        <p class="mt-2 inline-block px-3 py-1 bg-green-500 text-white rounded-full text-xs font-bold">HADIR</p>
      `;
      if ((window as any).lucide) (window as any).lucide.createIcons();

      container.classList.remove('hidden');
      setTimeout(() => card.classList.remove('scale-0'), 10);

      setTimeout(() => {
          card.classList.add('scale-0');
          setTimeout(() => container.classList.add('hidden'), 300);
      }, 2000);
  }

  private updateLog(nisn: string) {
      const log = document.getElementById('scan-log');
      if (!log) return;

      if (log.querySelector('p.text-center')) log.innerHTML = '';
      
      const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const entry = document.createElement('div');
      entry.className = 'flex items-center justify-between p-3 bg-white border border-border-light rounded-lg shadow-sm fade-in';
      entry.innerHTML = `
        <div class="flex items-center space-x-3">
            <div class="h-8 w-8 bg-info-bg/50 rounded-full flex items-center justify-center text-xs font-bold text-info">${nisn.charAt(0)}</div>
            <div>
                <p class="text-sm font-bold text-gray-800">${nisn}</p>
                <p class="text-xs text-text-muted">Berhasil di-scan</p>
            </div>
        </div>
        <span class="text-xs font-mono text-primary">${time}</span>
      `;
      log.prepend(entry);
  }

  private async loadStudents() {
    const filterValue = (document.getElementById('abs-filter-group') as HTMLSelectElement).value;
    if (!filterValue) {
        Toast.show('Silakan pilih jenjang atau kelas terlebih dahulu', 'warning');
        return;
    }

    let searchJenjang = '';
    let searchKelas = '';

    if (filterValue === 'KB' || filterValue === 'TK') {
        searchJenjang = filterValue;
    } else {
        searchJenjang = 'SD';
        searchKelas = filterValue.split('-')[1];
    }

    Loader.show();
    try {
        const res = await api.getSheetData('tb_siswa');
        if (res.success) {
            this.students = res.data.filter((s: any) => {
                const isActive = s.status_aktif !== false;
                if (!isActive) return false;

                if (searchJenjang === 'SD') {
                    // Match SD and Kelas (handling '1', 'Kelas 1', etc)
                    const sKelas = String(s.kelas || '').trim().toLowerCase();
                    return s.jenjang === 'SD' && (sKelas === searchKelas || sKelas.startsWith(searchKelas + ' '));
                } else {
                    return s.jenjang === searchJenjang;
                }
            });
            this.renderTable();
        } else {
            Toast.show('Gagal mengambil data dari Google Sheets', 'error');
        }
    } catch (e) {
        Toast.show(e instanceof Error ? e.message : 'Gagal memuat data siswa', 'error');
    } finally {
        Loader.hide();
    }
  }

  private renderTable() {
    const tbody = document.getElementById('absensi-table-body');
    if (!tbody) return;

    if (this.students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-0">${EmptyState.render('Tidak Ada Siswa', 'Tidak ditemukan siswa aktif untuk jenjang dan kelas yang dipilih.', 'users')}</td></tr>`;
        if ((window as any).lucide) (window as any).lucide.createIcons();
        return;
    }

    tbody.innerHTML = this.students.map((s, index) => {
        const status = this.attendanceData[s.id] || 'H';
        
        return `
            <tr class="hover:bg-info-bg/50/30 transition-colors fade-in stagger-${(index % 4) + 1}">
                <td class="px-6 py-4">
                    <div class="flex items-center space-x-3">
                        <div class="h-9 w-9 rounded-full bg-info-bg/50 text-primary flex items-center justify-center text-xs font-bold border border-blue-100 uppercase">
                            ${s.nama_lengkap.charAt(0)}
                        </div>
                        <div>
                            <p class="text-sm font-bold text-gray-800">${s.nama_lengkap}</p>
                            <p class="text-[10px] text-gray-400 font-mono">${s.nisn}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-center">
                    <label class="cursor-pointer group block">
                        <input type="radio" name="status-${s.id}" value="H" ${status === 'H' ? 'checked' : ''} 
                            class="hidden peer" onchange="window.updateAttendance('${s.id}', 'H')">
                        <div class="w-10 h-10 mx-auto rounded-xl flex items-center justify-center border-2 border-transparent bg-app-bg/50 text-gray-400 peer-checked:bg-success-bg peer-checked:text-success peer-checked:border-success transition-all group-hover:bg-gray-100">
                            <span class="text-xs font-bold">H</span>
                        </div>
                    </label>
                </td>
                <td class="px-6 py-4 text-center">
                    <label class="cursor-pointer group block">
                        <input type="radio" name="status-${s.id}" value="I" ${status === 'I' ? 'checked' : ''} 
                            class="hidden peer" onchange="window.updateAttendance('${s.id}', 'I')">
                        <div class="w-10 h-10 mx-auto rounded-xl flex items-center justify-center border-2 border-transparent bg-app-bg/50 text-gray-400 peer-checked:bg-warning-bg peer-checked:text-warning peer-checked:border-warning transition-all group-hover:bg-gray-100">
                            <span class="text-xs font-bold">I</span>
                        </div>
                    </label>
                </td>
                <td class="px-6 py-4 text-center">
                    <label class="cursor-pointer group block">
                        <input type="radio" name="status-${s.id}" value="S" ${status === 'S' ? 'checked' : ''} 
                            class="hidden peer" onchange="window.updateAttendance('${s.id}', 'S')">
                        <div class="w-10 h-10 mx-auto rounded-xl flex items-center justify-center border-2 border-transparent bg-app-bg/50 text-gray-400 peer-checked:bg-info-bg peer-checked:text-info peer-checked:border-info transition-all group-hover:bg-gray-100">
                            <span class="text-xs font-bold">S</span>
                        </div>
                    </label>
                </td>
                <td class="px-6 py-4 text-center">
                    <label class="cursor-pointer group block">
                        <input type="radio" name="status-${s.id}" value="A" ${status === 'A' ? 'checked' : ''} 
                            class="hidden peer" onchange="window.updateAttendance('${s.id}', 'A')">
                        <div class="w-10 h-10 mx-auto rounded-xl flex items-center justify-center border-2 border-transparent bg-app-bg/50 text-gray-400 peer-checked:bg-danger-bg peer-checked:text-danger peer-checked:border-danger transition-all group-hover:bg-gray-100">
                            <span class="text-xs font-bold">A</span>
                        </div>
                    </label>
                </td>
            </tr>
        `;
    }).join('');

    // Expose update function to window for the onchange
    (window as any).updateAttendance = (id: string, status: string) => {
        this.attendanceData[id] = status;
    };
  }

  private async submitAttendance() {
    if (this.students.length === 0) {
        Toast.show('Daftar siswa kosong', 'warning');
        return;
    }

    Loader.show();
    try {
        const dateInput = document.getElementById('absensi-date') as HTMLInputElement;
        const date = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
        
        const payload = this.students.map(s => ({
            id_siswa: s.id,
            nisn: s.nisn,
            nama_siswa: s.nama_lengkap,
            kelas: s.kelas,
            jenjang: s.jenjang,
            tanggal: date,
            status: this.attendanceData[s.id] || 'H',
            timestamp: new Date().toISOString()
        }));

        console.log('Sending attendance payload:', payload);

        const res = await api.post<any>('batchInsert', { sheet: 'tb_absensi', data: payload });
        
        if (res && res.success) {
            Toast.show('Absensi berhasil disimpan ke Spreadsheet', 'success');
        } else {
            throw new Error(res?.message || 'Server mengembalikan status gagal');
        }
    } catch (e) {
        console.error('Submit Attendance Error:', e);
        Toast.show(e instanceof Error ? e.message : 'Gagal menyimpan absensi', 'error');
    } finally {
        Loader.hide();
    }
  }
}
