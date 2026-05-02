/**
 * Grades Module - Nilai SD & PAUD
 */
import { api } from '../api';
import { Toast, Loader } from '../ui-elements';

export class GradesModule {
  private mode: 'SD' | 'PAUD' | 'HOME' = 'HOME';
  private students: any[] = [];
  private selectedKelas: string = '';
  private selectedMapel: string = '';

  async render(): Promise<string> {
    if (this.mode === 'HOME') return this.renderHome();
    return this.renderInputNilai();
  }

  private renderHome(): string {
    return `
      <div class="space-y-6 fade-in">
        <h3 class="text-xl font-bold font-heading">Penilaian Akademik</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div id="card-sd" class="card bg-gradient-to-br from-blue-600 to-blue-800 text-white border-none cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
                <div class="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform">
                    <i data-lucide="graduation-cap" class="h-40 w-40"></i>
                </div>
                <div class="flex justify-between items-start mb-6">
                    <div class="p-3 bg-white/20 rounded-lg"><i data-lucide="graduation-cap" class="h-6 w-6"></i></div>
                    <span class="text-xs font-bold bg-white/20 px-2 py-1 rounded">Kurikulum Merdeka</span>
                </div>
                <h4 class="text-lg font-bold mb-1">Jenjang SD</h4>
                <p class="text-blue-100 text-sm mb-6">Penilaian per Tujuan Pembelajaran (TP) dan Sumatif.</p>
                <div class="w-full py-2 bg-white text-info text-center font-bold rounded-lg group-hover:bg-info-bg/50">Buka Modul Nilai SD</div>
            </div>

            <div id="card-paud" class="card bg-gradient-to-br from-orange-500 to-orange-600 text-white border-none cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
                <div class="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform">
                    <i data-lucide="baby" class="h-40 w-40"></i>
                </div>
                <div class="flex justify-between items-start mb-6">
                    <div class="p-3 bg-white/20 rounded-lg"><i data-lucide="baby" class="h-6 w-6"></i></div>
                    <span class="text-xs font-bold bg-white/20 px-2 py-1 rounded">Format PAUD</span>
                </div>
                <h4 class="text-lg font-bold mb-1">Jenjang KB / TK</h4>
                <p class="text-orange-100 text-sm mb-6">Capaian Perkembangan: BB, MB, BSH, BSB.</p>
                <div class="w-full py-2 bg-white text-orange-700 text-center font-bold rounded-lg group-hover:bg-orange-50">Buka Modul Nilai PAUD</div>
            </div>
        </div>
      </div>
    `;
  }

  private renderInputNilai(): string {
    const isSD = this.mode === 'SD';
    return `
      <div class="space-y-6 fade-in">
        <div class="flex items-center space-x-4 mb-4">
            <button id="btn-back-grade" class="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <i data-lucide="arrow-left" class="h-5 w-5 text-text-muted"></i>
            </button>
            <div>
                <h3 class="text-xl font-bold font-heading">Input Nilai ${this.mode}</h3>
                <p class="text-xs text-gray-400">Pastikan kelas dan mata pelajaran sudah sesuai.</p>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <select id="grade-filter-kelas" class="p-3 border border-border-light rounded-xl bg-white shadow-sm outline-none focus:ring-2 focus:ring-primary/10">
                <option value="">-- Pilih Kelas --</option>
                ${isSD ? `
                    <option value="1">KELAS 1</option><option value="2">KELAS 2</option>
                    <option value="3">KELAS 3</option><option value="4">KELAS 4</option>
                    <option value="5">KELAS 5</option><option value="6">KELAS 6</option>
                ` : `
                    <option value="KB">KB (Kelompok Bermain)</option>
                    <option value="TK">TK (Taman Kanak-kanak)</option>
                `}
            </select>
            <select id="grade-filter-mapel" class="p-3 border border-border-light rounded-xl bg-white shadow-sm outline-none focus:ring-2 focus:ring-primary/10">
                <option value="">-- Pilih Mapel --</option>
                ${isSD ? `
                    <option value="Pendidikan Agama dan Budi Pekerti">Pendidikan Agama dan Budi Pekerti</option>
                    <option value="Pendidikan Pancasila">Pendidikan Pancasila</option>
                    <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                    <option value="Matematika">Matematika</option>
                    <option value="Ilmu Pengetahuan Alam dan Sosial (IPAS)">Ilmu Pengetahuan Alam dan Sosial (IPAS)</option>
                    <option value="Pendidikan Jasmani Olahraga dan Kesehatan (PJOK)">Pendidikan Jasmani Olahraga dan Kesehatan (PJOK)</option>
                    <option value="Seni dan Budaya">Seni dan Budaya</option>
                    <option value="Bahasa Inggris">Bahasa Inggris</option>
                    <option value="Muatan Lokal">Muatan Lokal</option>
                ` : `
                    <option value="Nilai Agama dan Budi Pekerti">Nilai Agama dan Budi Pekerti</option>
                    <option value="Jati Diri">Jati Diri</option>
                    <option value="Literasi dan STEAM">Literasi dan STEAM</option>
                `}
            </select>
            <button id="btn-load-siswa-grade" class="btn btn-primary rounded-xl shadow-md shadow-primary/10">Daftar Siswa</button>
        </div>

        <div class="card p-0 overflow-x-auto border-border-light shadow-sm">
            <table class="w-full text-left min-w-[800px]">
                <thead class="bg-app-bg/50 border-b border-border-light">
                    <tr>
                        <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest sticky left-0 bg-app-bg/50 z-10 w-64">Nama Siswa</th>
                        ${isSD ? `
                            <th class="px-4 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Formatif (TP)</th>
                            <th class="px-4 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">NA Sumatif</th>
                            <th class="px-4 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Nilai Akhir</th>
                        ` : `
                            <th class="px-4 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Capaian Elemen</th>
                            <th class="px-4 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Deskripsi</th>
                        `}
                    </tr>
                </thead>
                <tbody id="grade-table-body" class="divide-y divide-gray-50">
                     <tr><td colspan="${isSD ? 4 : 3}" class="p-20 text-center text-gray-400 italic">Silakan pilih filter kelas dan mata pelajaran untuk memuat data.</td></tr>
                </tbody>
            </table>
        </div>

        <div class="flex justify-end mt-6">
            <button id="btn-save-grades" class="btn btn-accent px-10 rounded-xl hidden group">
                <i data-lucide="upload" class="h-4 w-4 mr-2 group-hover:-translate-y-0.5 transition-transform"></i> Simpan ke Database
            </button>
        </div>
      </div>
    `;
  }

  async onMount() {
    if (this.mode === 'HOME') {
        document.getElementById('card-sd')?.addEventListener('click', () => { this.mode = 'SD'; this.reRender(); });
        document.getElementById('card-paud')?.addEventListener('click', () => { this.mode = 'PAUD'; this.reRender(); });
    } else {
        document.getElementById('btn-back-grade')?.addEventListener('click', () => { this.mode = 'HOME'; this.reRender(); });
        document.getElementById('btn-load-siswa-grade')?.addEventListener('click', () => this.loadStudents());
        document.getElementById('btn-save-grades')?.addEventListener('click', () => this.saveGrades());
        this.loadCustomMapels();
    }
    
    if ((window as any).lucide) (window as any).lucide.createIcons();
  }

  private async loadCustomMapels() {
      try {
          const res = await api.getSheetData('tb_matapelajaran');
          if (res.success && res.data) {
              const select = document.getElementById('grade-filter-mapel') as HTMLSelectElement;
              if (!select) return;
              
              // Get existing options to prevent duplicates
              const existingValues = Array.from(select.options).map(o => o.value);
              
              res.data.forEach((mapel: any) => {
                  const jenjangMatch = this.mode === 'SD' ? mapel.jenjang === 'SD' : (mapel.jenjang === 'TK' || mapel.jenjang === 'KB' || mapel.jenjang === 'PAUD');
                  if (jenjangMatch || !mapel.jenjang) {
                      if (mapel.nama_mapel && !existingValues.includes(mapel.nama_mapel)) {
                          const option = document.createElement('option');
                          option.value = mapel.nama_mapel;
                          option.textContent = mapel.nama_mapel;
                          select.appendChild(option);
                          // Add to existingValues to prevent duplicate generic mapels inside this loop
                          existingValues.push(mapel.nama_mapel);
                      }
                  }
              });
          }
      } catch (e) {
          console.error('Failed to load custom mapels', e);
      }
  }

  private async reRender() {
      const container = document.getElementById('content-viewport');
      if (container) {
          container.innerHTML = await this.render();
          this.onMount();
      }
  }

  private async loadStudents() {
      this.selectedKelas = (document.getElementById('grade-filter-kelas') as HTMLSelectElement).value;
      this.selectedMapel = (document.getElementById('grade-filter-mapel') as HTMLSelectElement).value;

      if (!this.selectedKelas) return Toast.show('Pilih jenjang/kelas dulu!', 'warning');

      Loader.show();
      try {
          const res = await api.getSheetData('tb_siswa');
          if (res.success) {
              this.students = res.data.filter((s: any) => {
                  const isActive = s.status_aktif !== false;
                  if (!isActive) return false;

                  if (this.mode === 'SD') {
                      const sKelas = String(s.kelas || '').trim().toLowerCase();
                      return s.jenjang === 'SD' && (sKelas === this.selectedKelas || sKelas.startsWith(this.selectedKelas + ' '));
                  } else {
                      // For PAUD, selectedKelas holds the Jenjang (KB/TK)
                      return s.jenjang === this.selectedKelas;
                  }
              });
              this.renderTable();
              if (this.students.length > 0) {
                  document.getElementById('btn-save-grades')?.classList.remove('hidden');
              }
          }
      } catch (e) {
          Toast.show('Gagal memuat data', 'error');
      } finally {
          Loader.hide();
      }
  }

  private renderTable() {
      const tbody = document.getElementById('grade-table-body');
      if (!tbody) return;

      if (this.students.length === 0) {
          tbody.innerHTML = `<tr><td colspan="5" class="p-0">${EmptyState.render('Tidak Ada Siswa', 'Tidak ditemukan siswa aktif di kelas ini.', 'users')}</td></tr>`;
          if ((window as any).lucide) (window as any).lucide.createIcons();
          return;
      }

      const isSD = this.mode === 'SD';
      tbody.innerHTML = this.students.map((s, index) => `
        <tr class="hover:bg-info-bg/50/20 transition-colors fade-in stagger-${(index % 4) + 1}">
            <td class="px-6 py-4 sticky left-0 bg-white z-10 border-r border-gray-50">
                <div class="flex items-center space-x-3">
                    <div class="h-8 w-8 bg-app-bg/50 rounded-lg flex items-center justify-center text-[10px] font-bold text-gray-400 uppercase">${s.nama_lengkap.charAt(0)}</div>
                    <span class="text-sm font-bold text-gray-700">${s.nama_lengkap}</span>
                </div>
            </td>
            ${isSD ? `
                <td class="px-4 py-4 text-center">
                    <input type="number" class="w-16 p-2 border border-border-light rounded-lg text-center mx-auto block focus:ring-2 focus:ring-primary/20 outline-none" placeholder="0">
                </td>
                <td class="px-4 py-4 text-center">
                    <input type="number" class="w-16 p-2 border border-border-light rounded-lg text-center mx-auto block focus:ring-2 focus:ring-primary/20 outline-none" placeholder="0">
                </td>
                <td class="px-4 py-4 text-center">
                    <span class="inline-block w-16 p-2 bg-app-bg/50 border border-border-light rounded-lg text-center font-bold text-primary mx-auto">0</span>
                </td>
            ` : `
                <td class="px-4 py-4">
                    <select class="p-2 border border-border-light rounded-lg w-full text-xs bg-white focus:ring-2 focus:ring-primary/20 outline-none">
                        <option value="BB">BB (Belum Berkembang)</option>
                        <option value="MB">MB (Mulai Berkembang)</option>
                        <option value="BSH">BSH (Sesuai Harapan)</option>
                        <option value="BSB">BSB (Sangat Baik)</option>
                    </select>
                </td>
                <td class="px-4 py-4"><textarea class="w-full p-2 border border-border-light rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20" rows="1" placeholder="Catatan..."></textarea></td>
            `}
        </tr>
      `).join('');
  }

  private async saveGrades() {
      if (this.students.length === 0) return;

      Loader.show();
      try {
          const rows = document.querySelectorAll('#grade-table-body tr');
          const isSD = this.mode === 'SD';
          const payload: any[] = [];

          rows.forEach((row, index) => {
              const student = this.students[index];
              if (!student) return;

              let gradeData: any = {
                  id_siswa: student.id,
                  nama_siswa: student.nama_lengkap,
                  kelas: this.selectedKelas,
                  mapel: this.selectedMapel,
                  jenjang: student.jenjang,
                  timestamp: new Date().toISOString()
              };

              if (isSD) {
                  const inputs = row.querySelectorAll('input[type="number"]');
                  gradeData.nilai_formatif = (inputs[0] as HTMLInputElement).value;
                  gradeData.nilai_sumatif = (inputs[1] as HTMLInputElement).value;
                  gradeData.nilai_akhir = row.querySelector('span')?.textContent || '0';
              } else {
                  gradeData.capaian = (row.querySelector('select') as HTMLSelectElement).value;
                  gradeData.deskripsi = (row.querySelector('textarea') as HTMLTextAreaElement).value;
              }

              payload.push(gradeData);
          });

          console.log('Sending grades payload:', payload);
          const res = await api.post<any>('batchInsert', { sheet: 'tb_nilai', data: payload });

          if (res && res.success) {
              Toast.show('Data nilai berhasil disimpan ke Spreadsheet.', 'success');
          } else {
              throw new Error(res?.message || 'Gagal menyimpan ke server');
          }
      } catch (e) {
          console.error('Save Grades Error:', e);
          Toast.show(e instanceof Error ? e.message : 'Gagal menyimpan nilai', 'error');
      } finally {
          Loader.hide();
      }
  }
}
