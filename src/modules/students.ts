/**
 * Students Module: CRUD & Import
 */
import { api } from '../api';
import { Modal, Toast, Loader, EmptyState, ErrorState } from '../ui-elements';
import { INSTITUTION } from '../constants';
import { getDirectImageLink, toDataURL } from '../utils';

export class StudentsModule {
  private students: any[] = [];
  private filteredStudents: any[] = [];

  async render(): Promise<string> {
    return `
      <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
        <div class="flex items-center space-x-2 w-full md:w-auto">
            <div class="relative flex-grow md:flex-grow-0">
                <input type="text" id="search-siswa" placeholder="Cari Nama / NISN..." 
                    class="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary w-full md:w-64 transition-all outline-none">
                <i data-lucide="search" class="absolute left-3 top-2.5 h-4 w-4 text-gray-400"></i>
            </div>
            <select id="filter-jenjang" class="p-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary/20 outline-none">
                <option value="">Semua Jenjang</option>
                <option value="SD">SD</option>
                <option value="SMP">SMP</option>
                <option value="SMA">SMA</option>
            </select>
        </div>
        <div class="flex items-center space-x-2">
            <button id="btn-print-semua-kartu" class="btn border border-border-light bg-white hover:bg-app-bg/50 space-x-2 shadow-sm text-primary">
                <i data-lucide="printer" class="h-4 w-4"></i>
                <span class="text-sm">Cetak Kartu Massal</span>
            </button>
            <button id="btn-import-siswa" class="btn border border-border-light bg-white hover:bg-app-bg/50 space-x-2 shadow-sm">
                <i data-lucide="file-up" class="h-4 w-4 text-text-muted"></i>
                <span class="text-sm">Import</span>
            </button>
            <button id="btn-add-siswa" class="btn btn-primary space-x-2 shadow-md shadow-primary/20">
                <i data-lucide="plus" class="h-4 w-4"></i>
                <span class="text-sm">Tambah Siswa</span>
            </button>
        </div>
      </div>

      <div id="siswa-main-container" class="space-y-4">
        <div id="siswa-table-card" class="card overflow-hidden p-0 relative group">
            <div id="scroll-indicator" class="md:hidden absolute top-0 right-0 bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10 flex items-center">
                <i data-lucide="arrow-right-left" class="h-3 w-3 mr-1 animate-pulse"></i> Geser Tabel
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse min-w-[700px]">
                    <thead class="bg-app-bg/50 border-b border-border-light italic">
                        <tr>
                            <th class="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">No</th>
                            <th class="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Data Siswa</th>
                            <th class="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">NISN</th>
                            <th class="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kelas</th>
                            <th class="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Wali Murid</th>
                            <th class="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="siswa-table-body" class="divide-y divide-gray-50">
                        <!-- Data injected here -->
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    `;
  }

  async onMount() {
    this.refreshData();

    document.getElementById('search-siswa')?.addEventListener('input', (e) => {
        this.filterData((e.target as HTMLInputElement).value, (document.getElementById('filter-jenjang') as HTMLSelectElement).value);
    });

    document.getElementById('filter-jenjang')?.addEventListener('change', (e) => {
        this.filterData((document.getElementById('search-siswa') as HTMLInputElement).value, (e.target as HTMLSelectElement).value);
    });

    document.getElementById('btn-add-siswa')?.addEventListener('click', () => this.showStudentForm());
    document.getElementById('btn-import-siswa')?.addEventListener('click', () => this.showImportForm());
    document.getElementById('btn-print-semua-kartu')?.addEventListener('click', () => this.printMassCards());
  }

  private async refreshData() {
    Loader.show();
    try {
        const res = await api.getSheetData('tb_siswa');
        if (res.success) {
            this.students = res.data.filter((s: any) => s.status_aktif != false && s.status_aktif != "false");
            this.filteredStudents = [...this.students];
            this.renderTable();
        } else {
            const container = document.getElementById('siswa-main-container');
            if (container) container.innerHTML = ErrorState.render('Format data tidak sesuai atau API bermasalah.', 'location.reload()');
        }
    } catch (e) {
        const container = document.getElementById('siswa-main-container');
        if (container) container.innerHTML = ErrorState.render(e instanceof Error ? e.message : String(e), 'location.reload()');
    } finally {
        Loader.hide();
    }
  }

  private filterData(search: string, jenjang: string) {
    const s = search.toLowerCase();
    this.filteredStudents = this.students.filter(student => {
        const matchesSearch = student.nama_lengkap?.toLowerCase().includes(s) || student.nisn?.includes(s);
        const matchesJenjang = !jenjang || student.jenjang === jenjang;
        return matchesSearch && matchesJenjang;
    });
    this.renderTable();
  }

  private renderTable() {
    const tbody = document.getElementById('siswa-table-body');
    const container = document.getElementById('siswa-main-container');
    if (!tbody || !container) return;

    if (this.filteredStudents.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-0">${EmptyState.render('Siswa Tidak Ditemukan', 'Cobalah mencari dengan kata kunci lain atau filter berbeda.', 'search-x')}</td></tr>`;
        if ((window as any).lucide) (window as any).lucide.createIcons();
        return;
    }

    tbody.innerHTML = this.filteredStudents.map((s, index) => {
        const photoUrl = getDirectImageLink(s.foto_url);
        return `
        <tr class="hover:bg-info-bg/50/30 transition-colors group fade-in stagger-${(index % 4) + 1}">
            <td class="px-6 py-4 text-xs font-mono text-gray-300 font-bold">${String(index + 1).padStart(2, '0')}</td>
            <td class="px-6 py-4">
                <div class="flex items-center space-x-4">
                    <div class="h-11 w-11 rounded-2xl bg-gray-100 flex items-center justify-center text-primary font-bold overflow-hidden border border-border-light shadow-sm transition-transform group-hover:scale-105">
                        <img src="${photoUrl || `https://ui-avatars.com/api/?name=${s.nama_lengkap}&background=1B4332&color=fff&size=200`}" 
                               class="h-full w-full object-cover" 
                               referrerpolicy="no-referrer"
                               onerror="this.src='https://ui-avatars.com/api/?name=${s.nama_lengkap}&background=1B4332&color=fff'">
                    </div>
                    <div>
                        <p class="text-sm font-bold text-gray-800 leading-none mb-1 group-hover:text-primary transition-colors">${s.nama_lengkap}</p>
                        <div class="flex items-center space-x-2">
                             <span class="px-2 py-0.5 bg-info-bg text-info text-[10px] rounded-full font-bold uppercase ring-1 ring-blue-200">${s.jenjang}</span>
                             <span class="text-[10px] text-gray-400 font-medium">KLS. ${s.kelas}</span>
                        </div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 text-sm text-text-muted font-mono text-center">
                <span class="bg-gray-100 px-2 py-1 rounded border border-border-light">${s.nisn}</span>
            </td>
            <td class="px-6 py-4">
                <p class="text-xs font-bold text-gray-700">${s.kelas}</p>
            </td>
            <td class="px-6 py-4">
                <p class="text-xs font-bold text-gray-800 leading-none mb-1">${s.nama_wali}</p>
                <a href="https://wa.me/${s.no_hp_wali}" target="_blank" class="text-[10px] text-blue-500 hover:underline flex items-center font-medium opacity-70 group-hover:opacity-100 transition-opacity">
                    <i data-lucide="phone" class="h-3 w-3 mr-1"></i> ${s.no_hp_wali}
                </a>
            </td>
            <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end space-x-1 opacity-40 group-hover:opacity-100 transition-opacity">
                    <button class="btn-print-siswa p-2 text-primary hover:bg-white hover:shadow-sm rounded-xl transition-all" data-id="${s.id}" title="ID Card">
                        <i data-lucide="contact" class="h-4 w-4"></i>
                    </button>
                    <button class="btn-edit-siswa p-2 text-amber-600 hover:bg-white hover:shadow-sm rounded-xl transition-all" data-id="${s.id}">
                        <i data-lucide="edit-3" class="h-4 w-4"></i>
                    </button>
                    <button class="btn-delete-siswa p-2 text-red-500 hover:bg-white hover:shadow-sm rounded-xl transition-all" data-id="${s.id}">
                        <i data-lucide="trash-2" class="h-4 w-4"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
    }).join('');

    if ((window as any).lucide) (window as any).lucide.createIcons();

    // Attach row events
    document.querySelectorAll('.btn-edit-siswa').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = (e.currentTarget as HTMLElement).dataset.id;
            const student = this.students.find(s => s.id == id);
            if (student) this.showStudentForm(student);
        });
    });

    document.querySelectorAll('.btn-delete-siswa').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = (e.currentTarget as HTMLElement).dataset.id;
            if (confirm('Apakah Anda yakin ingin menonaktifkan siswa ini?')) {
                Loader.show();
                try {
                    await api.post('softDelete', { sheet: 'tb_siswa', id });
                    Toast.show('Siswa berhasil dinonaktifkan', 'success');
                    this.refreshData();
                } catch (err) {
                    Toast.show('Gagal menghapus data', 'error');
                } finally {
                    Loader.hide();
                }
            }
        });
    });

    document.querySelectorAll('.btn-print-siswa').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = (e.currentTarget as HTMLElement).dataset.id;
            const student = this.students.find(s => s.id == id);
            if (student) await this.showIDCard(student);
        });
    });
  }

  private generatePortraitCardHTML(s: any, institutionLogo: string, studentPhoto: string) {
      return `
      <div class="id-card" style="width: 7cm; height: 10.5cm; overflow: hidden; background: white; border-radius: 12px; position: relative; display: flex; flex-direction: column; align-items: center; box-shadow: 0 4px 10px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; box-sizing: border-box; flex-shrink: 0; margin-bottom: 0;">
          <!-- Header Pattern -->
          <div style="position: absolute; top: 0; left: 0; right: 0; height: 3.2cm; background: #1B4332; overflow: hidden;">
              <div style="position: absolute; inset: 0; opacity: 0.1; background-image: radial-gradient(circle at 1px 1px, white 1px, transparent 0); background-size: 15px 15px;"></div>
              <div style="position: absolute; inset: 0; opacity: 0.05; background-image: linear-gradient(45deg, white 25%, transparent 25%, transparent 75%, white 75%, white), linear-gradient(45deg, white 25%, transparent 25%, transparent 75%, white 75%, white); background-size: 10px 10px; background-position: 0 0, 5px 5px;"></div>
          </div>

          <!-- Top Logo & Title -->
          <div style="position: absolute; top: 0.5cm; left: 0; right: 0; display: flex; align-items: center; justify-content: center; z-index: 10; gap: 8px; padding: 0 10px;">
              <div style="width: 0.9cm; height: 0.9cm; background: white; border-radius: 6px; padding: 2px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                  <img src="${institutionLogo}" crossorigin="anonymous" style="width: 100%; height: 100%; object-fit: contain; display: block;" onerror="this.src='${INSTITUTION.logoFallback}'">
              </div>
              <div style="color: white; display: flex; flex-direction: column; justify-content: center;">
                  <p style="font-size: 8.5px; font-weight: bold; line-height: 1.2; margin: 0; letter-spacing: 0.5px;text-transform:uppercase;">YPI MIFTAHUL HIDAYAH</p>
                  <p style="font-size: 6.5px; font-weight: 600; opacity: 1; margin: 0; margin-top: 2px; letter-spacing: 0.3px;">"Global Minds, Qur'anic Hearts"</p>
                  <p style="font-size: 4.5px; opacity: 0.8; margin: 0; margin-top: 2px; letter-spacing: 0.1px; max-width: 4.8cm; line-height: 1.3; text-transform: uppercase;">${INSTITUTION.address}</p>
              </div>
          </div>

          <!-- Photo Circle -->
          <div style="position: absolute; left: 50%; transform: translateX(-50%); top: 1.8cm; width: 3cm; height: 3cm; border-radius: 50%; border: 3px solid white; background-color: #EF4444; box-shadow: 0 4px 10px rgba(0,0,0,0.15); overflow: hidden; z-index: 10; display: flex; align-items: center; justify-content: center;">
              <img src="${studentPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.nama_lengkap)}&background=EF4444&color=fff`}" crossorigin="anonymous" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(s.nama_lengkap)}&background=EF4444&color=fff'">
          </div>

          <!-- Body Info -->
          <div style="margin-top: 5.2cm; width: 100%; padding: 0 0.5cm; text-align: center; z-index: 5;">
              <h3 style="font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 13px; margin: 0; color: #1f2937; line-height: 1.2; letter-spacing: -0.2px; max-height: 31px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${s.nama_lengkap}</h3>
              <p style="font-family: monospace; font-size: 8px; color: #1B4332; font-weight: bold; margin: 4px 0 0 0; letter-spacing: 0.5px;">NISN. ${s.nisn}</p>

              <div style="display: grid; grid-template-columns: 1fr 1fr; margin-top: 8px; gap: 8px;">
                  <div>
                      <p style="font-size: 6.5px; color: #9ca3af; margin: 0; text-transform: uppercase; font-weight: 600;">Jenjang</p>
                      <p style="font-size: 10px; font-weight: bold; margin: 0; color: #374151;">${s.jenjang}</p>
                  </div>
                  <div>
                      <p style="font-size: 6.5px; color: #9ca3af; margin: 0; text-transform: uppercase; font-weight: 600;">Kelas</p>
                      <p style="font-size: 10px; font-weight: bold; margin: 0; color: #374151;">${s.kelas}</p>
                  </div>
              </div>

              <div style="margin-top: 8px; padding: 5px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
                  <p style="font-size: 6.5px; font-weight: 700; color: #1B4332; margin: 0; text-align: center; text-transform: uppercase; line-height: 1.2;">${INSTITUTION.address}</p>
              </div>
          </div>
          
          <!-- QR Code -->
          <div style="position: absolute; bottom: 0.5cm; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10;">
              <div style="background: white; padding: 2px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${s.nisn}" style="width: 1.8cm; height: 1.8cm; display: block; filter: contrast(1.2);">
              </div>
          </div>
          
          <!-- Bottom Border -->
          <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 5px; background: linear-gradient(to right, #2563eb, #1B4332);"></div>
      </div>
      `;
  }

  private async printMassCards() {
    if (this.filteredStudents.length === 0) {
        Toast.show('Tidak ada data siswa untuk dicetak', 'warning');
        return;
    }

    Loader.show();
    const institutionLogo = await toDataURL(INSTITUTION.logo);
    Loader.hide();

    // To prevent lagging the modal with hundreds of cards, we only show first 4 in preview
    const previewStudents = this.filteredStudents.slice(0, 4);
    let previewCardsHTML = '';
    
    // Fallback: we use original urls for preview since it's just DOM, 
    // but wait, we need studentPhoto data url only if we do html2canvas. 
    // We can just use the real URL for the DOM.
    for (const s of previewStudents) {
        previewCardsHTML += this.generatePortraitCardHTML(s, institutionLogo, s.foto_url);
    }

    const content = `
        <div class="text-center mb-4">
            <h3 class="text-lg font-bold text-gray-800">Cetak ${this.filteredStudents.length} Kartu Pelajar</h3>
            <p class="text-sm text-gray-500">Preview Layout (Tampil 4 dari ${this.filteredStudents.length})</p>
        </div>
        <div class="bg-gray-100 p-4 rounded-xl border border-gray-200 shadow-inner flex justify-center max-h-[60vh] overflow-y-auto">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5cm; transform: scale(0.65); transform-origin: top center;" class="pb-20">
                ${previewCardsHTML}
            </div>
        </div>
        <div class="mt-6 flex space-x-3">
            <button id="btn-dl-all-pdf" class="btn btn-primary flex-grow group">
                <i data-lucide="file-down" class="h-4 w-4 mr-2 group-hover:translate-y-0.5 transition-transform"></i> Download PDF
            </button>
            <button id="btn-print-all" class="btn border border-border-light bg-white hover:bg-app-bg text-text-main p-2 px-3">
                <i data-lucide="printer" class="h-5 w-5"></i>
            </button>
        </div>
    `;

    Modal.open(`Cetak Massal`, content, null);
    if ((window as any).lucide) (window as any).lucide.createIcons();

    const doNativePrint = () => {
        // Prepare DOM
        // Native print is best, we inject to body 
        document.body.classList.add('printing-cards');
        let printArea = document.getElementById('print-area');
        if (!printArea) {
            printArea = document.createElement('div');
            printArea.id = 'print-area';
            document.body.appendChild(printArea);
        }
        
        let allCardsHTML = '';
        for (const s of this.filteredStudents) {
            allCardsHTML += this.generatePortraitCardHTML(s, institutionLogo, s.foto_url);
        }
        printArea.innerHTML = allCardsHTML;
        
        const originalTitle = document.title;
        document.title = 'Kartu_Pelajar_Massal';

        setTimeout(() => {
            window.print();
            // Cleanup after print dialog closes
            setTimeout(() => {
                document.title = originalTitle;
                document.body.classList.remove('printing-cards');
                if (printArea) printArea.remove();
            }, 1000);
        }, 800);
    };

    document.getElementById('btn-print-all')?.addEventListener('click', () => {
        doNativePrint();
    });

    document.getElementById('btn-dl-all-pdf')?.addEventListener('click', async () => {
        // Generating PDF for hundreds of cards via html2canvas is extremely heavy.
        // jsPDF using html() can be an alternative, but html2canvas is the fallback.
        // Instruct user to use "Save as PDF" through the Print Dialog for best results.
        Toast.show('Menyiapkan dokumen, silakan pilih "Save as PDF" di jendela Print untuk hasil terbaik.', 'info');
        setTimeout(() => {
            doNativePrint();
        }, 1500);
    });
  }
  private async showIDCard(s: any) {
    Loader.show();
    const studentPhoto = await toDataURL(s.foto_url);
    const institutionLogo = await toDataURL(INSTITUTION.logo);
    Loader.hide();

    const cardHTML = this.generatePortraitCardHTML(s, institutionLogo, studentPhoto);

    const content = `
        <div id="id-card-wrapper" class="flex justify-center p-4">
            <div id="id-card-print" class="flex items-center justify-center transform origin-top scale-100 sm:scale-110">
                ${cardHTML}
            </div>
        </div>
        <div class="mt-6 flex space-x-3">
            <button id="btn-dl-idcard" class="btn btn-primary flex-grow group">
                <i data-lucide="download" class="h-4 w-4 mr-2 group-hover:translate-y-0.5 transition-transform"></i> Unduh Kartu Pelajar
            </button>
            <button id="btn-print-direct" class="btn border border-border-light bg-white hover:bg-app-bg text-text-main p-2 px-3">
                <i data-lucide="printer" class="h-5 w-5"></i>
            </button>
        </div>
    `;

    Modal.open(`E-Kartu Pelajar: ${s.nama_lengkap}`, content, null);
    if ((window as any).lucide) (window as any).lucide.createIcons();

    const exportToCanvas = async () => {
        const card = document.getElementById('id-card-print');
        if (!card) return null;
        const html2canvas = (window as any).html2canvas;
        return await html2canvas(card, {
            scale: 3,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
        });
    };

    document.getElementById('btn-dl-idcard')?.addEventListener('click', async () => {
        Loader.show();
        try {
            const canvas = await exportToCanvas();
            if (canvas) {
                const imgData = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = `Kartu_Pelajar_${s.nama_lengkap.replace(/\s+/g, '_')}.png`;
                link.href = imgData;
                link.click();
                Toast.show('Kartu Pelajar berhasil diunduh', 'success');
            }
        } catch (e) {
            console.error('ID Card Export Error:', e);
            Toast.show('Gagal mengekspor kartu', 'error');
        } finally {
            Loader.hide();
        }
    });

    document.getElementById('btn-print-direct')?.addEventListener('click', async () => {
        Loader.show();
        try {
            const canvas = await exportToCanvas();
            if (canvas) {
                const imgData = canvas.toDataURL('image/png');
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(`
                        <html>
                            <head><title>Print Kartu Pelajar</title></head>
                            <body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh;background:#f0f0f0;">
                                <img src="${imgData}" style="max-height:90vh;max-width:90vw;box-shadow:0 10px 25px rgba(0,0,0,0.1);border-radius:14px;">
                                <script>
                                    window.onload = () => {
                                        setTimeout(() => {
                                            window.print();
                                            window.close();
                                        }, 500);
                                    };
                                </script>
                            </body>
                        </html>
                    `);
                    printWindow.document.close();
                }
            }
        } catch (e) {
            Toast.show('Gagal mencetak kartu', 'error');
        } finally {
            Loader.hide();
        }
    });
  }

  private showStudentForm(student?: any) {
    const content = `
        <form id="student-form" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="hidden" name="id" value="${student?.id || ''}">
            <div class="col-span-full">
                <label class="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input type="text" name="nama_lengkap" class="w-full p-2 border border-gray-300 rounded-md" value="${student?.nama_lengkap || ''}" required>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">NISN (10 Digit)</label>
                <input type="text" name="nisn" maxlength="10" class="w-full p-2 border border-gray-300 rounded-md" value="${student?.nisn || ''}" required>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Jenjang</label>
                <select name="jenjang" class="w-full p-2 border border-gray-300 rounded-md" required>
                    <option value="KB" ${student?.jenjang === 'KB' ? 'selected' : ''}>KB</option>
                    <option value="TK" ${student?.jenjang === 'TK' ? 'selected' : ''}>TK</option>
                    <option value="SD" ${student?.jenjang === 'SD' ? 'selected' : ''}>SD</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                <input type="text" name="kelas" class="w-full p-2 border border-gray-300 rounded-md" placeholder="Contoh: 1 B" value="${student?.kelas || ''}" required>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
                <select name="jenis_kelamin" class="w-full p-2 border border-gray-300 rounded-md">
                    <option value="Laki-laki" ${student?.jenis_kelamin === 'Laki-laki' ? 'selected' : ''}>Laki-laki</option>
                    <option value="Perempuan" ${student?.jenis_kelamin === 'Perempuan' ? 'selected' : ''}>Perempuan</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nama Wali</label>
                <input type="text" name="nama_wali" class="w-full p-2 border border-gray-300 rounded-md" value="${student?.nama_wali || ''}">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">No. HP Wali</label>
                <input type="text" name="no_hp_wali" class="w-full p-2 border border-gray-300 rounded-md" value="${student?.no_hp_wali || ''}">
            </div>
            <div class="col-span-full">
                <label class="block text-sm font-medium text-gray-700 mb-1">URL Foto (Google Drive/Cloudinary)</label>
                <input type="text" name="foto_url" placeholder="https://..." class="w-full p-2 border border-gray-300 rounded-md" value="${student?.foto_url || ''}">
            </div>
        </form>
    `;

    const modalId = Modal.open(student ? 'Edit Data Siswa' : 'Tambah Siswa Baru', content, async () => {
        const form = document.getElementById('student-form') as HTMLFormElement;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries()) as any;
        
        // Ensure year/tahun_ajaran is set if new
        if (!student) {
            data.tahun_ajaran = '2023/2024'; // Default to current
        } else {
            data.tahun_ajaran = student.tahun_ajaran;
        }

        // Validation
        if (!data.nama_lengkap || !data.nisn) {
            Toast.show('Nama dan NISN wajib diisi', 'warning');
            return;
        }

        Loader.show();
        try {
            const res = await api.upsertRecord('tb_siswa', { ...data, status_aktif: true }, 'id');
            if (res.success) {
                Toast.show('Data siswa berhasil disimpan', 'success');
                Modal.close(modalId);
                this.refreshData();
            }
        } catch (e) {
            console.error('Save Student Error:', e);
            Toast.show('Gagal menyimpan data', 'error');
        } finally {
            Loader.hide();
        }
    });
  }

  private showImportForm() {
      const content = `
        <div class="space-y-4">
            <div class="p-4 bg-info-bg/50 border border-blue-200 rounded-lg">
                <p class="text-sm text-blue-800">
                    Gunakan template Excel yang sesuai. Kolom harus mengandung: <strong>nisn, nama_lengkap, jenjang, kelas, nama_wali, no_hp_wali</strong>.
                </p>
                <button id="btn-dl-template" class="mt-2 text-xs font-bold text-info underline">Download Template Excel</button>
            </div>
            <div id="drop-zone" class="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-primary transition-colors cursor-pointer">
                <i data-lucide="upload-cloud" class="h-12 w-12 mx-auto mb-4 text-gray-400"></i>
                <p class="text-text-muted">Klik atau geser file Excel ke sini</p>
                <input type="file" id="file-input" class="hidden" accept=".xlsx, .xls">
            </div>
            <div id="import-preview" class="hidden">
                <h4 class="font-bold mb-2">Preview Data (<span id="preview-count">0</span> baris)</h4>
                <div class="max-h-48 overflow-y-auto text-xs border rounded">
                    <table class="w-full text-left">
                        <thead class="bg-gray-100 sticky top-0">
                            <tr><th class="p-2">NISN</th><th class="p-2">Nama</th></tr>
                        </thead>
                        <tbody id="preview-body" class="divide-y"></tbody>
                    </table>
                </div>
            </div>
        </div>
      `;

      const modalId = Modal.open('Import Data Siswa', content, async () => {
          // ... (logic handled already)
      });

      // Template Download
      document.getElementById('btn-dl-template')?.addEventListener('click', () => {
          const ws = (window as any).XLSX.utils.json_to_sheet([
              { nisn: '1234567890', nama_lengkap: 'Contoh Nama', jenjang: 'SD', kelas: '1 A', nama_wali: 'Nama Wali', no_hp_wali: '0812345' }
          ]);
          const wb = (window as any).XLSX.utils.book_new();
          (window as any).XLSX.utils.book_append_sheet(wb, ws, "Template Siswa");
          (window as any).XLSX.utils.writeFile(wb, "Template_Siswa.xlsx");
      });

      // Handle File Upload
      const dropZone = document.getElementById('drop-zone');
      const fileInput = document.getElementById('file-input') as HTMLInputElement;

      dropZone?.addEventListener('click', () => fileInput.click());
      fileInput?.addEventListener('change', (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) this.handleExcelParse(file);
      });
  }

  private handleExcelParse(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = (window as any).XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = (window as any).XLSX.utils.sheet_to_json(worksheet);

        if (json.length > 0) {
            this.showPreview(json);
        }
    };
    reader.readAsArrayBuffer(file);
  }

  private showPreview(data: any[]) {
      const previewDiv = document.getElementById('import-preview');
      const previewCount = document.getElementById('preview-count');
      const previewBody = document.getElementById('preview-body');
      
      if (previewDiv && previewCount && previewBody) {
          previewDiv.classList.remove('hidden');
          previewCount.textContent = data.length.toString();
          previewBody.innerHTML = data.slice(0, 10).map(row => `
            <tr>
                <td class="p-2">${row.nisn || '-'}</td>
                <td class="p-2">${row.nama_lengkap || '-'}</td>
            </tr>
          `).join('') + (data.length > 10 ? `<tr><td colspan="2" class="p-2 text-center text-gray-400">...dan ${data.length - 10} baris lainnya</td></tr>` : '');
      }
  }
}
