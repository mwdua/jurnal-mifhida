import './index.css';
import { Router, Route } from './router';
import { AuthService, User } from './auth';
import { api } from './api';
import { StudentsModule } from './modules/students';
import { ScheduleModule } from './modules/schedule';
import { AttendanceModule } from './modules/attendance';
import { GradesModule } from './modules/grades';
import { JournalModule } from './modules/journal';
import { BKModule } from './modules/bk';
import { DashboardModule } from './modules/dashboard';
import { ReportsModule } from './modules/reports';

/**
 * Main App Controller
 */
class App {
  private router: Router;
  private auth: AuthService;
  private studentsModule: StudentsModule;
  private scheduleModule: ScheduleModule;
  private attendanceModule: AttendanceModule;
  private gradesModule: GradesModule;
  private journalModule: JournalModule;
  private bkModule: BKModule;
  private dashboardModule: DashboardModule;
  private reportsModule: ReportsModule;

  constructor() {
    this.auth = new AuthService(this.handleLogin.bind(this));
    this.router = new Router('content-viewport', this.checkAccess.bind(this));
    this.studentsModule = new StudentsModule();
    this.scheduleModule = new ScheduleModule();
    this.attendanceModule = new AttendanceModule();
    this.gradesModule = new GradesModule();
    this.journalModule = new JournalModule();
    this.bkModule = new BKModule();
    this.dashboardModule = new DashboardModule();
    this.reportsModule = new ReportsModule();
    
    this.setupGlobalEvents();
    this.registerRoutes();
  }

  private setupGlobalEvents() {
    // Mobile Menu Toggle
    document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
      this.toggleSidebar(true);
    });

    document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
      this.toggleSidebar(false);
    });

    // Close sidebar on link click (mobile)
    document.getElementById('main-nav')?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('a') && window.innerWidth < 768) {
        this.toggleSidebar(false);
      }
    });

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      this.auth.logout();
    });

    // Date
    const dateEl = document.getElementById('current-date');
    if (dateEl) {
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      dateEl.textContent = new Date().toLocaleDateString('id-ID', options);
    }
  }

  private handleLogin(user: User) {
    document.getElementById('auth-container')!.classList.add('hidden');
    document.getElementById('main-layout')!.classList.remove('hidden');
    
    // Update User Info in UI
    document.getElementById('user-name')!.textContent = user.name;
    document.getElementById('user-role')!.textContent = user.role.toUpperCase();
    
    const avatarEl = document.getElementById('user-avatar');
    if (avatarEl) {
        avatarEl.innerHTML = `<img src="${user.picture}" alt="${user.name}" class="h-full w-full object-cover ring-2 ring-white/20" onerror="this.src='https://ui-avatars.com/api/?name=${user.name}&background=1B4332&color=fff'">`;
    }

    // Build Nav based on role
    this.renderSidebar(user.role);
    
    // Init Router
    this.router.init();
    
    // Lucide icons
    if ((window as any).lucide) (window as any).lucide.createIcons();
  }

  private checkAccess(route: Route): boolean {
    const user = this.auth.getCurrentUser();
    if (!user) return false;
    return route.roles.includes('all') || route.roles.includes(user.role);
  }

  private toggleSidebar(show: boolean) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (show) {
      sidebar?.classList.remove('-translate-x-full');
      sidebar?.classList.add('translate-x-0');
      overlay?.classList.remove('hidden');
    } else {
      sidebar?.classList.add('-translate-x-full');
      sidebar?.classList.remove('translate-x-0');
      overlay?.classList.add('hidden');
    }
  }

  private renderSidebar(role: string) {
    const nav = document.getElementById('main-nav')!;
    const routes = this.router.getRoutesForRole(role);
    
    nav.innerHTML = routes.map((route, index) => `
      <a href="#${route.path}" class="nav-link slide-in-left" style="animation-delay: ${index * 0.05}s">
        <i data-lucide="${route.icon}" class="h-5 w-5"></i>
        <span>${route.title}</span>
      </a>
    `).join('');

    // Re-lucide for sidebar icons
    if ((window as any).lucide) (window as any).lucide.createIcons();
  }

  private registerRoutes() {
    // Add a simple transition wrapper to all routes
    const originalInit = this.router.init.bind(this.router);
    this.router.init = () => {
        originalInit();
        // Add listener for route changes to apply animations
        window.addEventListener('hashchange', () => {
            const viewport = document.getElementById('content-viewport');
            if (viewport) {
                viewport.classList.remove('fade-in');
                void (viewport as any).offsetWidth; // Trigger reflow
                viewport.classList.add('fade-in');
            }
        });
    };
    // Dashboard
    this.router.addRoute({
      path: 'dashboard',
      title: 'Dashboard Statistik',
      icon: 'layout-dashboard',
      roles: ['all'],
      render: () => this.dashboardModule.render(),
      onMount: () => this.dashboardModule.onMount()
    });

    this.router.addRoute({
        path: 'students',
        title: 'Kelola Data Siswa',
        icon: 'users',
        roles: ['admin', 'kepsek'],
        render: () => this.studentsModule.render(),
        onMount: () => this.studentsModule.onMount()
    });

    this.router.addRoute({
        path: 'schedule',
        title: 'Jadwal & Mata Pelajaran',
        icon: 'calendar',
        roles: ['admin', 'guru', 'kepsek'],
        render: () => this.scheduleModule.render(),
        onMount: () => this.scheduleModule.onMount()
    });

    this.router.addRoute({
        path: 'attendance',
        title: 'Absensi Siswa',
        icon: 'check-square',
        roles: ['admin', 'guru'],
        render: () => this.attendanceModule.render(),
        onMount: () => this.attendanceModule.onMount()
    });

    this.router.addRoute({
        path: 'grades',
        title: 'Penilaian Akademik',
        icon: 'edit-3',
        roles: ['admin', 'guru'],
        render: () => this.gradesModule.render(),
        onMount: () => this.gradesModule.onMount()
    });

    this.router.addRoute({
        path: 'journal',
        title: 'Jurnal Mengajar',
        icon: 'book-open',
        roles: ['admin', 'guru'],
        render: () => this.journalModule.render(),
        onMount: () => this.journalModule.onMount()
    });

    this.router.addRoute({
        path: 'bk',
        title: 'Bimbingan Konseling',
        icon: 'message-circle',
        roles: ['admin', 'guru'],
        render: () => this.bkModule.render(),
        onMount: () => this.bkModule.onMount()
    });

    this.router.addRoute({
        path: 'reports',
        title: 'Pusat Laporan',
        icon: 'printer',
        roles: ['admin', 'kepsek'],
        render: () => this.reportsModule.render(),
        onMount: () => this.reportsModule.onMount()
    });

    // Settings
    this.router.addRoute({
        path: 'settings',
        title: 'Pengaturan Sistem',
        icon: 'settings',
        roles: ['admin'],
        render: () => `
            <div class="max-w-4xl space-y-8">
                <div class="card">
                    <h3 class="text-xl font-bold mb-6 flex items-center font-heading">
                        <i data-lucide="database" class="mr-2 text-primary"></i>
                        Konfigurasi Backend
                    </h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Google Apps Script URL (Web App URL)</label>
                            <div class="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                                <input type="text" id="input-gas-url" 
                                    class="flex-grow p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm font-mono" 
                                    placeholder="https://script.google.com/macros/s/.../exec"
                                    value="${api.getWebAppUrl()}">
                                <button id="btn-save-url" class="btn btn-primary whitespace-nowrap">Simpan URL</button>
                            </div>
                            <p class="mt-2 text-xs text-text-muted">Pastikan script sudah di-Deploy sebagai "Web App" dengan akses "Anyone".</p>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3 class="text-xl font-bold mb-6 flex items-center font-heading">
                        <i data-lucide="users" class="mr-2 text-primary"></i>
                        Manajemen Pengguna
                    </h3>
                    <div class="card p-0 overflow-hidden mb-4">
                        <table class="w-full text-left text-sm">
                            <thead class="bg-app-bg/50 border-b">
                                <tr>
                                    <th class="px-4 py-3">Role Akses</th>
                                    <th class="px-4 py-3">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="border-b">
                                    <td class="px-4 py-3 font-bold text-purple-700">Admin</td>
                                    <td class="px-4 py-3">Akses penuh ke semua modul dan pengaturan.</td>
                                </tr>
                                <tr class="border-b">
                                    <td class="px-4 py-3 font-bold text-info">Guru</td>
                                    <td class="px-4 py-3">Akses ke absensi, nilai, jadwal, dan jurnal.</td>
                                </tr>
                                <tr class="border-b">
                                    <td class="px-4 py-3 font-bold text-gray-700">Kepsek</td>
                                    <td class="px-4 py-3">Akses baca semua data dan laporan.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p class="text-xs text-text-muted italic">* Izin akses login diatur melalui Google Apps Script tab 'tb_users'.</p>
                </div>
            </div>
        `,
        onMount: () => {
            document.getElementById('btn-save-url')?.addEventListener('click', () => {
                const url = (document.getElementById('input-gas-url') as HTMLInputElement).value;
                api.setWebAppUrl(url);
                alert('URL disimpan. Muat ulang aplikasi.');
                location.reload();
            });
        }
    });

    // Placeholders for remaining modules
    const placeholders = [
        { 
            path: 'stats-advanced', 
            title: 'Analytics Lanjut', 
            icon: 'bar-chart-3', 
            roles: ['admin'],
            description: 'Analisis prediktif performa siswa menggunakan AI.'
        }
    ];

    placeholders.forEach(m => {
        this.router.addRoute({
            ...m,
            render: async () => `
                <div class="card h-64 flex flex-col justify-center items-center text-gray-400 text-center">
                    <div class="bg-gray-100 p-6 rounded-full mb-4">
                        <i data-lucide="${m.icon}" class="h-10 w-10 opacity-40"></i>
                    </div>
                    <h4 class="text-xl font-bold text-text-muted mb-1">Modul ${m.title}</h4>
                    <p class="text-sm px-8">${m.description}</p>
                    <p class="text-xs mt-4 font-bold text-primary uppercase tracking-widest">Coming Soon in Phase 5</p>
                </div>
            `
        });
    });
  }

  start() {
    this.auth.init();
    
    // For Preview: Trigger Mock Login after 1.5s if no interaction
    setTimeout(() => {
        if (!this.auth.getCurrentUser()) {
            const urlParams = new URLSearchParams(window.location.search);
            const role = (urlParams.get('role') as any) || 'admin';
            this.auth.mockLogin(role);
        }
    }, 1500);
  }
}

// Start the Application
window.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.start();
});


