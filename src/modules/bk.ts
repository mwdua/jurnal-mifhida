/**
 * BK / Counseling Module
 */
import { api } from '../api';
import { Modal, Toast, Loader } from '../ui-elements';

export class BKModule {
  private cases: any[] = [];

  async render(): Promise<string> {
    return `
      <div class="space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h3 class="text-xl font-bold font-heading">Bimbingan Konseling</h3>
                <p class="text-sm text-text-muted">Rekap kasus dan pembinaan siswa.</p>
            </div>
            <button id="btn-add-bk" class="btn bg-orange-600 text-white hover:bg-orange-700">
                <i data-lucide="alert-circle" class="h-4 w-4 mr-2"></i> Input Kasus Baru
            </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="card p-4 border-l-4 border-red-500 bg-red-50">
                <p class="text-xs font-bold text-danger uppercase">Perlu Tindak Lanjut</p>
                <p id="stat-bk-process" class="text-2xl font-bold">...</p>
            </div>
            <div class="card p-4 border-l-4 border-green-500 bg-green-50">
                <p class="text-xs font-bold text-success uppercase">Selesai / Teratasi</p>
                <p id="stat-bk-done" class="text-2xl font-bold">...</p>
            </div>
        </div>

        <div class="card p-0 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead class="bg-app-bg/50 border-b">
                        <tr>
                            <th class="px-6 py-4 text-xs font-bold text-text-muted uppercase">Siswa</th>
                            <th class="px-6 py-4 text-xs font-bold text-text-muted uppercase">Kategori</th>
                            <th class="px-6 py-4 text-xs font-bold text-text-muted uppercase">Status</th>
                            <th class="px-6 py-4 text-xs font-bold text-text-muted uppercase text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="bk-table-body" class="divide-y">
                        <!-- Data BK -->
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    `;
  }

  async onMount() {
    this.refreshData();
    document.getElementById('btn-add-bk')?.addEventListener('click', () => this.showBKForm());
    if ((window as any).lucide) (window as any).lucide.createIcons();
  }

  private async refreshData() {
    Loader.show();
    try {
        const res = await api.getSheetData('tb_bk');
        if (res.success) {
            this.cases = res.data;
            this.renderTable();
            this.updateStats();
        }
    } catch (e) {
        Toast.show('Gagal memuat data BK', 'error');
    } finally {
        Loader.hide();
    }
  }

  private updateStats() {
    const processCount = this.cases.filter(c => c.status !== 'Selesai').length;
    const doneCount = this.cases.filter(c => c.status === 'Selesai').length;
    
    document.getElementById('stat-bk-process')!.textContent = processCount.toString();
    document.getElementById('stat-bk-done')!.textContent = doneCount.toString();
  }

  private renderTable() {
    const tbody = document.getElementById('bk-table-body');
    if (!tbody) return;

    if (this.cases.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="p-12 text-center text-gray-400">Belum ada catatan BK.</td></tr>';
        return;
    }

    tbody.innerHTML = this.cases.map(c => {
        return `
            <tr class="hover:bg-app-bg/50">
                <td class="px-6 py-4">
                    <p class="text-sm font-bold text-gray-800">${c.id_siswa}</p>
                    <p class="text-xs text-text-muted">${new Date(c.tanggal).toLocaleDateString('id-ID')}</p>
                </td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 bg-gray-100 rounded text-xs text-text-muted font-bold">${c.kategori}</span>
                </td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 ${c.status === 'Selesai' ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'} rounded text-[10px] font-bold uppercase">
                        ${c.status || 'Proses'}
                    </span>
                </td>
                <td class="px-6 py-4 text-right">
                    <button class="text-primary hover:underline text-sm font-bold">Detail</button>
                </td>
            </tr>
        `;
    }).join('');
  }

  private showBKForm() {
      const content = `
        <form id="bk-form" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-1">Tanggal</label>
                    <input type="date" name="tanggal" class="w-full p-2 border rounded-md" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Kategori Masalah</label>
                    <select name="kategori" class="w-full p-2 border rounded-md">
                        <option value="Kedisiplinan">Kedisiplinan</option>
                        <option value="Akademik">Akademik</option>
                        <option value="Prestasi">Prestasi</option>
                        <option value="Pelanggaran">Pelanggaran</option>
                        <option value="Konseling">Konseling</option>
                    </select>
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Nama/ID Siswa</label>
                <input type="text" name="id_siswa" placeholder="Ketik nama atau ID siswa..." class="w-full p-2 border rounded-md" required>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Catatan / Deskripsi</label>
                <textarea name="catatan" class="w-full p-2 border rounded-md" rows="3" required></textarea>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Tindak Lanjut</label>
                <textarea name="tindak_lanjut" class="w-full p-2 border rounded-md" rows="2"></textarea>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Status</label>
                <select name="status" class="w-full p-2 border rounded-md">
                    <option value="Laporan Diterima">Laporan Diterima</option>
                    <option value="Proses Pembinaan">Proses Pembinaan</option>
                    <option value="Selesai">Selesai</option>
                </select>
            </div>
        </form>
      `;

      const id = Modal.open('Input Kasus/Bimbingan', content, async () => {
          const form = document.getElementById('bk-form') as HTMLFormElement;
          const data = Object.fromEntries(new FormData(form).entries());
          
          Loader.show();
          try {
              const res = await api.upsertRecord('tb_bk', data, 'id');
              if (res.success) {
                  Toast.show('Kasus berhasil dicatat', 'success');
                  Modal.close(id);
                  this.refreshData();
              }
          } catch (e) {
              Toast.show('Gagal menyimpan catatan', 'error');
          } finally {
              Loader.hide();
          }
      });
  }
}
