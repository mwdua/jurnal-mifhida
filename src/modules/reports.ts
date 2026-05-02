/**
 * Reports Module - PDF & Excel Expert
 */
import { api } from '../api';
import { Loader, Toast } from '../ui-elements';
import { INSTITUTION } from '../constants';
import { toDataURL } from '../utils';

export class ReportsModule {
  async render(): Promise<string> {
    return `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="card p-6 flex flex-col justify-between">
              <div>
                  <div class="h-12 w-12 bg-info-bg rounded-xl flex items-center justify-center text-primary mb-4">
                      <i data-lucide="users" class="h-6 w-6"></i>
                  </div>
                  <h4 class="text-lg font-bold mb-2">Data Induk Siswa</h4>
                  <p class="text-sm text-text-muted mb-6">Cetak seluruh daftar siswa aktif per jenjang dalam format PDF.</p>
              </div>
              <button id="export-siswa-pdf" class="btn btn-primary w-full">
                  <i data-lucide="printer" class="h-4 w-4 mr-2"></i> Cetak PDF
              </button>
          </div>

          <div class="card p-6 flex flex-col justify-between">
              <div>
                  <div class="h-12 w-12 bg-success-bg rounded-xl flex items-center justify-center text-success mb-4">
                      <i data-lucide="check-square" class="h-6 w-6"></i>
                  </div>
                  <h4 class="text-lg font-bold mb-2">Laporan Absensi</h4>
                  <p class="text-sm text-text-muted mb-6">Rekapitulasi kehadiran bulanan siswa untuk evaluasi.</p>
              </div>
              <button id="export-absensi-pdf" class="btn btn-primary w-full">
                  <i data-lucide="printer" class="h-4 w-4 mr-2"></i> Cetak PDF
              </button>
          </div>

          <div class="card p-6 flex flex-col justify-between">
              <div>
                  <div class="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center text-warning mb-4">
                      <i data-lucide="award" class="h-6 w-6"></i>
                  </div>
                  <h4 class="text-lg font-bold mb-2">Ledger Nilai</h4>
                  <p class="text-sm text-text-muted mb-6">Daftar nilai kolektif per mata pelajaran dan semester.</p>
              </div>
              <button id="export-nilai-excel" class="btn border border-orange-500 text-orange-600 hover:bg-orange-50 w-full">
                  <i data-lucide="file-spreadsheet" class="h-4 w-4 mr-2"></i> Ekspor Excel
              </button>
          </div>
      </div>

      <div id="report-preview-container" class="mt-12 hidden">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold font-heading italic text-text-muted">Preview Laporan</h3>
            <button id="btn-close-preview" class="text-red-500 hover:underline text-sm">Tutup Preview</button>
          </div>
          <div id="report-canvas" class="bg-white p-12 shadow-2xl mx-auto w-[210mm] min-h-[297mm] overflow-hidden">
              <!-- Report content will be injected here for PDF generation -->
          </div>
      </div>
    `;
  }

  async onMount() {
    if ((window as any).lucide) (window as any).lucide.createIcons();

    document.getElementById('export-siswa-pdf')?.addEventListener('click', () => this.generateSiswaReport());
    document.getElementById('btn-close-preview')?.addEventListener('click', () => {
        document.getElementById('report-preview-container')?.classList.add('hidden');
    });
  }

  private async generateSiswaReport() {
    Loader.show();
    try {
        const res = await api.getSheetData('tb_siswa');
        if (!res.success) throw new Error('Data tidak tersedia');
        
        const data = res.data.filter((s: any) => s.status_aktif !== false);
        this.showPreview();
        
        const logoUrl = await toDataURL(INSTITUTION.logo);
        const canvas = document.getElementById('report-canvas')!;
        canvas.innerHTML = `
            <div class="flex items-center justify-between border-b-4 border-double border-gray-800 pb-4 mb-8">
                <div class="h-20 w-20 flex-shrink-0 flex items-center justify-center">
                    <img src="${logoUrl}" style="width: 80px; height: 80px; object-fit: contain;" crossorigin="anonymous" referrerpolicy="no-referrer" onerror="this.src='${INSTITUTION.logoFallback}'" class="block">
                </div>
                <div class="text-center flex-grow">
                    <h1 class="text-2xl font-bold uppercase">${INSTITUTION.name}</h1>
                    <p class="text-sm italic">${INSTITUTION.address}</p>
                    <p class="text-xs">Email: info@miftahulhidayah.sch.id | Website: ${INSTITUTION.website}</p>
                </div>
            </div>

            <h2 class="text-center text-xl font-bold underline mb-8">LAPORAN DATA INDUK SISWA</h2>
            
            <table class="w-full border-collapse border border-gray-800 text-sm">
                <thead>
                    <tr class="bg-gray-100">
                        <th class="border border-gray-800 p-2">NO</th>
                        <th class="border border-gray-800 p-2">NISN</th>
                        <th class="border border-gray-800 p-2">NAMA LENGKAP</th>
                        <th class="border border-gray-800 p-2">JENJANG</th>
                        <th class="border border-gray-800 p-2">KELAS</th>
                        <th class="border border-gray-800 p-2">WALI MURID</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map((s: any, i: number) => `
                        <tr>
                            <td class="border border-gray-800 p-2 text-center">${i + 1}</td>
                            <td class="border border-gray-800 p-2 text-center">${s.nisn}</td>
                            <td class="border border-gray-800 p-2">${s.nama_lengkap}</td>
                            <td class="border border-gray-800 p-2 text-center">${s.jenjang}</td>
                            <td class="border border-gray-800 p-2 text-center">${s.kelas}</td>
                            <td class="border border-gray-800 p-2">${s.nama_wali}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="mt-12 flex justify-end">
                <div class="text-center">
                    <p>Gonggang, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p class="mb-20">Kepala Sekolah,</p>
                    <p class="font-bold underline">H. Ahmad Fauzi, S.Pd.I</p>
                    <p class="text-xs">NIP. - / Yayasan</p>
                </div>
            </div>
        `;

        // Direct print trigger or PDF DL
        setTimeout(async () => {
             const jsPDF = (window as any).jspdf.jsPDF;
             const html2canvas = (window as any).html2canvas;
             
             const reportCanvas = await html2canvas(canvas, { scale: 2 });
             const imgData = reportCanvas.toDataURL('image/png');
             const pdf = new jsPDF('p', 'mm', 'a4');
             const imgWidth = 210;
             const imgHeight = (reportCanvas.height * imgWidth) / reportCanvas.width;
             
             pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
             pdf.save('Laporan_Siswa_MI.pdf');
             Toast.show('PDF Laporan berhasil dibuat', 'success');
        }, 500);

    } catch (e) {
        Toast.show('Gagal mencetak laporan', 'error');
    } finally {
        Loader.hide();
    }
  }

  private showPreview() {
      document.getElementById('report-preview-container')?.classList.remove('hidden');
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }
}
