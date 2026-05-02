/**
 * Dashboard Module - Statistic & Analytics
 */
import { api } from '../api';
import { Loader } from '../ui-elements';
import { INSTITUTION } from '../constants';
import { getDirectImageLink } from '../utils';

export class DashboardModule {
  private stats = {
    siswa: 0,
    kehadiran: '0%',
    guru: 0,
    jurnal: 0
  };

  private charts: { student?: any, attendance?: any } = {};

  async render(): Promise<string> {
    const hasUrl = !!api.getWebAppUrl();
    const logoUrl = await toDataURL(INSTITUTION.logo);

    return `
      <div class="mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div class="flex items-center space-x-5">
            <div class="h-20 w-20 bg-white p-3 rounded-3xl shadow-xl shadow-blue-900/10 border border-border-light flex items-center justify-center transform transition-all hover:rotate-6">
                <img src="${logoUrl}" referrerpolicy="no-referrer" onerror="this.src='${INSTITUTION.logoFallback}'" class="w-full h-full object-contain">
            </div>
            <div>
                <h2 class="text-3xl font-bold text-slate-900 font-heading tracking-tight leading-tight mb-1">${INSTITUTION.name}</h2>
                <div class="flex items-center text-sm text-text-muted font-medium">
                    <span class="bg-info-bg text-primary px-2.5 py-0.5 rounded-lg text-[10px] font-black mr-3 uppercase tracking-widest ring-1 ring-primary/10">SISTEM TERPADU</span>
                    <i data-lucide="map-pin" class="h-3.5 w-3.5 mr-1 text-accent"></i> ${INSTITUTION.address}
                </div>
            </div>
        </div>
        
        <div class="flex flex-wrap gap-3">
             <div class="flex items-center space-x-4 bg-white px-6 py-3.5 rounded-2xl shadow-sm border border-border-light group transition-all hover:shadow-md">
                <div class="h-11 w-11 bg-primary/5 text-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <i data-lucide="calendar" class="h-5 w-5"></i>
                </div>
                <div>
                    <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Hari Ini</p>
                    <p class="text-sm font-bold text-slate-700 leading-none">${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
            </div>
        </div>
      </div>

      <div class="mb-8 ${hasUrl ? 'hidden' : 'block'}">
          <div class="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-start space-x-4 animate-bounce-subtle">
              <div class="h-10 w-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <i data-lucide="database" class="h-5 w-5"></i>
              </div>
              <div>
                  <h4 class="font-bold text-amber-900">Backend Belum Terhubung</h4>
                  <p class="text-sm text-amber-700 mb-3 opacity-80">Hubungkan Google Sheets Web App URL di menu Pengaturan untuk menampilkan data riil sekolah Anda.</p>
                  <a href="#settings" class="inline-flex items-center text-xs font-bold text-amber-900 underline hover:no-underline">
                    Pergi ke Pengaturan <i data-lucide="arrow-right" class="h-3 w-3 ml-1"></i>
                  </a>
              </div>
          </div>
      </div>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <!-- Stat Card: Siswa -->
          <div class="card overflow-hidden group relative hover:-translate-y-1">
              <div class="absolute -right-4 -top-4 text-primary/5 group-hover:scale-110 transition-transform duration-500">
                  <i data-lucide="users" class="h-32 w-32"></i>
              </div>
              <div class="flex items-center justify-between mb-5 relative z-10">
                  <div class="h-14 w-14 bg-primary/5 text-primary rounded-2xl flex items-center justify-center shadow-inner">
                    <i data-lucide="users" class="h-7 w-7"></i>
                  </div>
                  <span class="badge bg-primary/10 text-primary">Aktif</span>
              </div>
              <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 relative z-10">Total Siswa</h4>
              <p id="stat-siswa" class="text-4xl font-bold text-slate-900 relative z-10 tracking-tight">${this.stats.siswa}</p>
          </div>

          <!-- Stat Card: Absensi -->
          <div class="card overflow-hidden group relative hover:-translate-y-1">
              <div class="absolute -right-4 -top-4 text-success/5 group-hover:scale-110 transition-transform duration-500">
                  <i data-lucide="check-circle" class="h-32 w-32"></i>
              </div>
              <div class="flex items-center justify-between mb-5 relative z-10">
                  <div class="h-14 w-14 bg-success/5 text-success rounded-2xl flex items-center justify-center shadow-inner">
                    <i data-lucide="check-circle" class="h-7 w-7"></i>
                  </div>
                  <span class="badge bg-success/10 text-success">Presensi</span>
              </div>
              <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 relative z-10">Kehadiran Hari Ini</h4>
              <p id="stat-absensi" class="text-4xl font-bold text-slate-900 relative z-10 tracking-tight">${this.stats.kehadiran}</p>
          </div>

          <!-- Stat Card: Guru -->
          <div class="card overflow-hidden group relative hover:-translate-y-1">
              <div class="absolute -right-4 -top-4 text-accent/5 group-hover:scale-110 transition-transform duration-500">
                  <i data-lucide="graduation-cap" class="h-32 w-32"></i>
              </div>
              <div class="flex items-center justify-between mb-5 relative z-10">
                  <div class="h-14 w-14 bg-accent/5 text-accent rounded-2xl flex items-center justify-center shadow-inner">
                    <i data-lucide="graduation-cap" class="h-7 w-7"></i>
                  </div>
                  <span class="badge bg-accent/10 text-accent">Pendidik</span>
              </div>
              <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 relative z-10">Guru & Staf</h4>
              <p id="stat-guru" class="text-4xl font-bold text-slate-900 relative z-10 tracking-tight">${this.stats.guru}</p>
          </div>

          <!-- Stat Card: Jurnal -->
          <div class="card overflow-hidden group relative hover:-translate-y-1">
              <div class="absolute -right-4 -top-4 text-secondary/5 group-hover:scale-110 transition-transform duration-500">
                  <i data-lucide="book-open" class="h-32 w-32"></i>
              </div>
              <div class="flex items-center justify-between mb-5 relative z-10">
                  <div class="h-14 w-14 bg-secondary/5 text-secondary rounded-2xl flex items-center justify-center shadow-inner">
                    <i data-lucide="book-open" class="h-7 w-7"></i>
                  </div>
                  <span class="badge bg-secondary/10 text-secondary">Catatan</span>
              </div>
              <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 relative z-10">Jurnal Mengajar</h4>
              <p id="stat-jurnal" class="text-4xl font-bold text-slate-900 relative z-10 tracking-tight">${this.stats.jurnal}</p>
          </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div class="bg-white p-6 rounded-3xl shadow-sm border border-border-light">
              <div class="flex items-center justify-between mb-6">
                 <h4 class="text-lg font-bold text-gray-800 font-heading">Distribusi Siswa</h4>
                 <select class="text-xs font-bold text-gray-400 bg-app-bg/50 border-none rounded-lg p-1 outline-none">
                    <option>Per Jenjang</option>
                 </select>
              </div>
              <div class="h-[300px]"><canvas id="chart-students"></canvas></div>
          </div>
          <div class="bg-white p-6 rounded-3xl shadow-sm border border-border-light">
              <div class="flex items-center justify-between mb-6">
                 <h4 class="text-lg font-bold text-gray-800 font-heading">Performa Kehadiran</h4>
                 <div class="flex items-center text-[10px] font-bold text-green-500 bg-green-50 px-2 py-1 rounded-full">
                    <i data-lucide="trending-up" class="h-3 w-3 mr-1"></i> +2.4%
                 </div>
              </div>
              <div class="h-[300px]"><canvas id="chart-attendance"></canvas></div>
          </div>
      </div>
    `;
  }

  async onMount() {
    this.initCharts();
    await this.fetchStats();
    if ((window as any).lucide) (window as any).lucide.createIcons();
  }

  private async fetchStats() {
    if (!api.getWebAppUrl()) return;
    
    try {
        const [siswaRes, absRes, jurnalRes, guruRes] = await Promise.all([
            api.getSheetData('tb_siswa'),
            api.getSheetData('tb_absensi'),
            api.getSheetData('tb_jurnal'),
            api.getSheetData('tb_guru')
        ]);

        if (siswaRes.success) {
            const activeStudents = siswaRes.data.filter((s: any) => s.status_aktif !== false);
            this.stats.siswa = activeStudents.length;
            document.getElementById('stat-siswa')!.textContent = this.stats.siswa.toString();
            this.updateSiswaChart(activeStudents);
        }

        if (guruRes.success) {
            this.stats.guru = guruRes.data.length;
            document.getElementById('stat-guru')!.textContent = this.stats.guru.toString();
        }

        if (jurnalRes.success) {
            this.stats.jurnal = jurnalRes.data.length;
            document.getElementById('stat-jurnal')!.textContent = this.stats.jurnal.toString();
        }

        if (absRes.success) {
            this.processAttendanceData(absRes.data);
        }
    } catch (e) {
        console.error('Failed to fetch dashboard stats', e);
    }
  }

  private processAttendanceData(data: any[]) {
      if (!data || data.length === 0) return;

      // 1. Calculate today's attendance
      const today = new Date().toISOString().split('T')[0];
      const todayAbs = data.filter((a: any) => {
          const dateStr = a.tanggal ? (typeof a.tanggal === 'string' ? a.tanggal.split('T')[0] : new Date(a.tanggal).toISOString().split('T')[0]) : '';
          return dateStr === today;
      });

      if (todayAbs.length > 0) {
          const hadir = todayAbs.filter((a: any) => a.status === 'H').length;
          this.stats.kehadiran = Math.round((hadir / todayAbs.length) * 100) + '%';
          const statEl = document.getElementById('stat-absensi');
          if (statEl) statEl.textContent = this.stats.kehadiran;
      }

      // 2. Update trend chart (last 7 days)
      const last7Days: string[] = [];
      for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          last7Days.push(d.toISOString().split('T')[0]);
      }

      const trendData = last7Days.map(date => {
          const dayData = data.filter(a => {
               const dateStr = a.tanggal ? (typeof a.tanggal === 'string' ? a.tanggal.split('T')[0] : new Date(a.tanggal).toISOString().split('T')[0]) : '';
               return dateStr === date;
          });
          if (dayData.length === 0) return null;
          const hadir = dayData.filter(a => a.status === 'H').length;
          return Math.round((hadir / dayData.length) * 100);
      });

      const dayLabels = last7Days.map(d => {
          const date = new Date(d);
          return date.toLocaleDateString('id-ID', { weekday: 'short' });
      });

      this.updateAttendanceChart(dayLabels, trendData);
  }

  private initCharts() {
    const Chart = (window as any).Chart;
    if (!Chart) return;

    // Student Chart
    const ctx1 = document.getElementById('chart-students') as HTMLCanvasElement;
    if (ctx1) {
        this.charts.student = new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: ['TK', 'SD', 'SMP', 'SMA'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: ['#f39c12', '#1B4332', '#2980b9', '#3498db'],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: { 
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { 
                        position: 'bottom',
                        labels: { padding: 20, usePointStyle: true, font: { size: 10, weight: 'bold' } }
                    }
                }
            }
        });
    }

    // Attendance Chart
    const ctx2 = document.getElementById('chart-attendance') as HTMLCanvasElement;
    if (ctx2) {
        this.charts.attendance = new Chart(ctx2, {
            type: 'line',
            data: {
                labels: ['...', '...', '...', '...', '...', '...', '...'],
                datasets: [{
                    label: 'Kehadiran (%)',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#2ecc71',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: { 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, max: 100, grid: { display: false } },
                    x: { grid: { display: false } }
                }
            }
        });
    }
  }

  private updateSiswaChart(data: any[]) {
      if (!this.charts.student) return;

      const levels: Record<string, number> = { 'KB/TK': 0, 'SD': 0, 'SMP': 0, 'SMA': 0 };
      data.forEach(s => {
          const jenjang = String(s.jenjang || '').toUpperCase();
          if (jenjang === 'KB' || jenjang === 'TK' || jenjang.includes('PAUD')) levels['KB/TK']++;
          else if (jenjang === 'SD') levels['SD']++;
          else if (jenjang === 'SMP') levels['SMP']++;
          else if (jenjang === 'SMA') levels['SMA']++;
      });

      this.charts.student.data.labels = ['KB/TK', 'SD', 'SMP', 'SMA'];
      this.charts.student.data.datasets[0].data = Object.values(levels);
      this.charts.student.update();
  }

  private updateAttendanceChart(labels: string[], data: (number|null)[]) {
      if (!this.charts.attendance) return;
      this.charts.attendance.data.labels = labels;
      this.charts.attendance.data.datasets[0].data = data;
      this.charts.attendance.update();
  }
}
