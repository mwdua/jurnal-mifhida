/**
 * Mata Pelajaran & Jadwal Module
 */
import { api } from '../api';
import { Modal, Toast, Loader } from '../ui-elements';

export class ScheduleModule {
  private subjects: any[] = [];
  private schedules: any[] = [];

  async render(): Promise<string> {
    return `
      <div class="space-y-8">
        <!-- Tabs -->
        <div class="flex border-b border-border-light">
            <button id="tab-mapel" class="px-6 py-3 border-b-2 border-primary text-primary font-bold">Mata Pelajaran</button>
            <button id="tab-jadwal" class="px-6 py-3 border-b-2 border-transparent text-text-muted hover:text-gray-700">Jadwal Pelajaran</button>
        </div>

        <!-- Section Mapel -->
        <div id="section-mapel" class="fade-in">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-lg font-bold font-heading">Daftar Mata Pelajaran</h3>
                <button id="btn-add-mapel" class="btn btn-primary btn-sm">
                    <i data-lucide="plus" class="h-4 w-4 mr-2"></i> Tambah Mapel
                </button>
            </div>
            <div class="card p-0 overflow-hidden">
                <table class="w-full text-left">
                    <thead class="bg-app-bg/50 border-b">
                        <tr>
                            <th class="px-6 py-3 text-xs font-bold text-text-muted uppercase">Nama Mapel</th>
                            <th class="px-6 py-3 text-xs font-bold text-text-muted uppercase">Jenjang</th>
                            <th class="px-6 py-3 text-xs font-bold text-text-muted uppercase">Kelas</th>
                            <th class="px-6 py-3 text-xs font-bold text-text-muted uppercase">Pengampu</th>
                            <th class="px-6 py-3 text-xs font-bold text-text-muted uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="mapel-table-body" class="divide-y">
                        <!-- Data Mapel -->
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Section Jadwal -->
        <div id="section-jadwal" class="hidden fade-in">
            <div class="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
                <div class="flex items-center space-x-3">
                    <select id="filter-jadwal-jenjang" class="p-2 border rounded-lg bg-white text-sm">
                        <option value="SD">SD</option>
                        <option value="TK">TK</option>
                        <option value="KB">KB</option>
                    </select>
                    <select id="filter-jadwal-kelas" class="p-2 border rounded-lg bg-white text-sm">
                        <option value="1">Kelas 1</option>
                        <option value="2">Kelas 2</option>
                        <option value="3">Kelas 3</option>
                        <option value="4">Kelas 4</option>
                        <option value="5">Kelas 5</option>
                        <option value="6">Kelas 6</option>
                    </select>
                </div>
                <button id="btn-add-jadwal" class="btn btn-primary btn-sm">
                    <i data-lucide="plus" class="h-4 w-4 mr-2"></i> Atur Jadwal
                </button>
            </div>
            
            <div class="card p-0 overflow-x-auto">
                <table class="w-full border-collapse border border-border-light">
                    <thead class="bg-primary text-white">
                        <tr>
                            <th class="border p-3 w-24">Jam</th>
                            <th class="border p-3">Senin</th>
                            <th class="border p-3">Selasa</th>
                            <th class="border p-3">Rabu</th>
                            <th class="border p-3">Kamis</th>
                            <th class="border p-3">Jumat</th>
                            <th class="border p-3">Sabtu</th>
                        </tr>
                    </thead>
                    <tbody id="jadwal-grid-body">
                        <!-- Jadwal Grid -->
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    `;
  }

  async onMount() {
    this.refreshData();

    // Tab Logic
    document.getElementById('tab-mapel')?.addEventListener('click', (e) => this.switchTab('mapel', e.currentTarget as HTMLElement));
    document.getElementById('tab-jadwal')?.addEventListener('click', (e) => this.switchTab('jadwal', e.currentTarget as HTMLElement));

    // Action Buttons
    document.getElementById('btn-add-mapel')?.addEventListener('click', () => this.showMapelForm());
    
    // Lucide
    if ((window as any).lucide) (window as any).lucide.createIcons();
  }

  private switchTab(tab: string, el: HTMLElement) {
      document.querySelectorAll('[id^="tab-"]').forEach(btn => {
          btn.classList.remove('border-primary', 'text-primary', 'font-bold');
          btn.classList.add('border-transparent', 'text-text-muted');
      });
      el.classList.add('border-primary', 'text-primary', 'font-bold');
      el.classList.remove('border-transparent', 'text-text-muted');

      document.getElementById('section-mapel')?.classList.toggle('hidden', tab !== 'mapel');
      document.getElementById('section-jadwal')?.classList.toggle('hidden', tab !== 'jadwal');
      
      if (tab === 'jadwal') this.renderJadwalGrid();
  }

  private async refreshData() {
      Loader.show();
      try {
          const res = await api.getSheetData('tb_matapelajaran');
          if (res.success) {
              this.subjects = res.data;
              this.renderMapelTable();
          }
      } catch (e) {
          Toast.show('Gagal memuat data', 'error');
      } finally {
          Loader.hide();
      }
  }

  private renderMapelTable() {
      const tbody = document.getElementById('mapel-table-body');
      if (!tbody) return;
      
      if (this.subjects.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-gray-400">Belum ada mata pelajaran.</td></tr>';
          return;
      }

      tbody.innerHTML = this.subjects.map(m => `
        <tr>
            <td class="px-6 py-4 font-medium text-gray-800">${m.nama_mapel}</td>
            <td class="px-6 py-4 text-sm">${m.jenjang}</td>
            <td class="px-6 py-4 text-sm">${m.kelas}</td>
            <td class="px-6 py-4 text-sm">${m.guru_pengampu || '-'}</td>
            <td class="px-6 py-4">
                <button class="text-info hover:underline text-sm mr-3">Edit</button>
                <button class="text-danger hover:underline text-sm">Hapus</button>
            </td>
        </tr>
      `).join('');
  }

  private renderJadwalGrid() {
      const tbody = document.getElementById('jadwal-grid-body');
      if (!tbody) return;

      const timeSlots = ["07:00 - 07:45", "07:45 - 08:30", "08:30 - 09:15", "09:15 - 09:45 (Istirahat)", "09:45 - 10:30", "10:30 - 11:15"];
      
      tbody.innerHTML = timeSlots.map(time => `
        <tr>
            <td class="border p-2 text-xs font-bold bg-app-bg/50 text-center">${time}</td>
            <td class="border p-2 text-center h-16 hover:bg-info-bg/50 cursor-pointer transition-colors"></td>
            <td class="border p-2 text-center h-16 hover:bg-info-bg/50 cursor-pointer"></td>
            <td class="border p-2 text-center h-16 hover:bg-info-bg/50 cursor-pointer"></td>
            <td class="border p-2 text-center h-16 hover:bg-info-bg/50 cursor-pointer"></td>
            <td class="border p-2 text-center h-16 hover:bg-info-bg/50 cursor-pointer"></td>
            <td class="border p-2 text-center h-16 hover:bg-info-bg/50 cursor-pointer"></td>
        </tr>
      `).join('');
  }

  private showMapelForm() {
      const content = `
        <form id="mapel-form" class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-1">Nama Mata Pelajaran</label>
                <input type="text" name="nama_mapel" list="mapel-list" class="w-full p-2 border rounded-md" required placeholder="Ketik atau pilih dari daftar...">
                <datalist id="mapel-list">
                    <option value="Pendidikan Agama dan Budi Pekerti">
                    <option value="Pendidikan Pancasila">
                    <option value="Bahasa Indonesia">
                    <option value="Matematika">
                    <option value="Ilmu Pengetahuan Alam dan Sosial (IPAS)">
                    <option value="Pendidikan Jasmani Olahraga dan Kesehatan (PJOK)">
                    <option value="Seni dan Budaya">
                    <option value="Bahasa Inggris">
                    <option value="Muatan Lokal">
                    <option value="Nilai Agama dan Budi Pekerti">
                    <option value="Jati Diri">
                    <option value="Literasi dan STEAM">
                </datalist>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-1">Jenjang</label>
                    <select name="jenjang" class="w-full p-2 border rounded-md">
                        <option value="SD">SD</option>
                        <option value="TK">TK</option>
                        <option value="KB">KB</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Kelas</label>
                    <input type="text" name="kelas" class="w-full p-2 border rounded-md" placeholder="Contoh: 1">
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Alokasi Jam/Minggu</label>
                <input type="number" name="alokasi_jam" class="w-full p-2 border rounded-md">
            </div>
        </form>
      `;

      Modal.open('Tambah Mata Pelajaran', content, async () => {
          const form = document.getElementById('mapel-form') as HTMLFormElement;
          const data = Object.fromEntries(new FormData(form).entries());
          
          Loader.show();
          try {
              const res = await api.upsertRecord('tb_matapelajaran', data, 'id');
              if (res.success) {
                  Toast.show('Mapel berhasil ditambahkan', 'success');
                  location.reload();
              }
          } catch (e) {
              Toast.show('Gagal menyimpan', 'error');
          } finally {
              Loader.hide();
          }
      });
  }
}
