/**
 * Journal / Jurnal Mengajar Module
 */
import { api } from '../api';
import { Modal, Toast, Loader } from '../ui-elements';

export class JournalModule {
  private journals: any[] = [];

  async render(): Promise<string> {
    return `
      <div class="space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h3 class="text-xl font-bold font-heading">Jurnal Mengajar Guru</h3>
                <p class="text-sm text-text-muted">Catat aktivitas belajar mengajar harian.</p>
            </div>
            <button id="btn-add-jurnal" class="btn btn-primary">
                <i data-lucide="plus" class="h-4 w-4 mr-2"></i> Buat Jurnal Baru
            </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
             <div class="col-span-full md:col-span-1">
                <label class="block text-xs font-bold text-gray-400 mb-1">Cari Materi</label>
                <input type="text" id="search-jurnal" placeholder="Ketik materi..." class="w-full p-2 border rounded-lg text-sm">
            </div>
        </div>

        <div class="card p-0 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead class="bg-app-bg/50 border-b">
                        <tr>
                            <th class="px-6 py-4 text-xs font-bold text-text-muted uppercase">Tanggal</th>
                            <th class="px-6 py-4 text-xs font-bold text-text-muted uppercase">Kelas & Mapel</th>
                            <th class="px-6 py-4 text-xs font-bold text-text-muted uppercase">Materi / TP</th>
                            <th class="px-6 py-4 text-xs font-bold text-text-muted uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="jurnal-table-body" class="divide-y">
                        <!-- Data Jurnal -->
                    </tbody>
                </table>
            </div>
            <div id="jurnal-empty" class="p-12 text-center text-gray-400 hidden">
                <i data-lucide="book-open" class="h-12 w-12 mx-auto mb-4 opacity-20"></i>
                <p>Belum ada data jurnal mengajar.</p>
            </div>
        </div>
      </div>
    `;
  }

  async onMount() {
    this.refreshData();
    document.getElementById('btn-add-jurnal')?.addEventListener('click', () => this.showJournalForm());
    if ((window as any).lucide) (window as any).lucide.createIcons();
  }

  private async refreshData() {
    Loader.show();
    try {
        const res = await api.getSheetData('tb_jurnal');
        if (res.success) {
            this.journals = res.data;
            this.renderTable();
        }
    } catch (e) {
        Toast.show('Gagal memuat jurnal', 'error');
    } finally {
        Loader.hide();
    }
  }

  private renderTable() {
    const tbody = document.getElementById('jurnal-table-body');
    const empty = document.getElementById('jurnal-empty');
    if (!tbody) return;

    if (this.journals.length === 0) {
        tbody.innerHTML = '';
        empty?.classList.remove('hidden');
        return;
    }

    empty?.classList.add('hidden');
    tbody.innerHTML = this.journals.reverse().map(j => `
        <tr class="hover:bg-app-bg/50">
            <td class="px-6 py-4 text-sm font-medium text-gray-700">
                ${new Date(j.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
            </td>
            <td class="px-6 py-4">
                <p class="text-sm font-bold text-primary">${j.mapel}</p>
                <p class="text-xs text-text-muted">Kelas ${j.kelas}</p>
            </td>
            <td class="px-6 py-4">
                <p class="text-sm text-gray-800 line-clamp-1">${j.materi}</p>
                <p class="text-xs text-gray-400">Metode: ${j.metode || '-'}</p>
            </td>
            <td class="px-6 py-4">
                <button class="p-2 hover:bg-info-bg/50 text-info rounded-lg"><i data-lucide="eye" class="h-4 w-4"></i></button>
            </td>
        </tr>
    `).join('');
    if ((window as any).lucide) (window as any).lucide.createIcons();
  }

  private showJournalForm() {
    const content = `
        <form id="jurnal-form" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-1">Tanggal</label>
                    <input type="date" name="tanggal" class="w-full p-2 border rounded-md" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Jam Ke-</label>
                    <input type="text" name="jam" placeholder="Contoh: 1-2" class="w-full p-2 border rounded-md" required>
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Kelas</label>
                <input type="text" name="kelas" placeholder="Contoh: 1 A" class="w-full p-2 border rounded-md" required>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Mata Pelajaran</label>
                <input type="text" name="mapel" list="journal-mapel-list" class="w-full p-2 border rounded-md" required placeholder="Ketik atau pilih dari daftar...">
                <datalist id="journal-mapel-list">
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
            <div>
                <label class="block text-sm font-medium mb-1">Materi / Tujuan Pembelajaran</label>
                <textarea name="materi" class="w-full p-2 border rounded-md" rows="3" required></textarea>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Rincian Kegiatan / Catatan</label>
                <textarea name="rincian" class="w-full p-2 border rounded-md" rows="3"></textarea>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Nama Guru</label>
                <input type="text" name="guru" class="w-full p-2 border rounded-md" required>
            </div>
        </form>
    `;

    const modalId = Modal.open('Isi Jurnal Mengajar', content, async () => {
        const form = document.getElementById('jurnal-form') as HTMLFormElement;
        const data = Object.fromEntries(new FormData(form).entries());
        
        Loader.show();
        try {
            const res = await api.upsertRecord('tb_jurnal', data, 'id');
            if (res.success) {
                Toast.show('Jurnal berhasil disimpan', 'success');
                Modal.close(modalId);
                this.refreshData();
            }
        } catch (e) {
            Toast.show('Gagal menyimpan jurnal', 'error');
        } finally {
            Loader.hide();
        }
    });
  }
}
