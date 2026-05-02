/**
 * Logic for Routing in YPI Miftahul Hidayah SPA
 */

export interface Route {
  path: string;
  title: string;
  icon: string;
  roles: string[];
  render: () => string | Promise<string>;
  onMount?: () => void;
}

export class Router {
  private routes: Route[] = [];
  private currentRoute: Route | null = null;
  private container: HTMLElement;
  private onBeforeNavigate: (route: Route) => boolean;

  constructor(containerId: string, onBeforeNavigate: (route: Route) => boolean) {
    this.container = document.getElementById(containerId) as HTMLElement;
    this.onBeforeNavigate = onBeforeNavigate;
    window.addEventListener('hashchange', () => this.handleRouting());
  }

  addRoute(route: Route) {
    this.routes.push(route);
  }

  getRoutesForRole(role: string): Route[] {
    return this.routes.filter(r => r.roles.includes(role) || r.roles.includes('all'));
  }

  async navigate(path: string) {
    window.location.hash = path;
  }

  private async handleRouting() {
    const hash = window.location.hash.slice(1) || 'dashboard';
    const route = this.routes.find(r => r.path === hash);

    if (!route) {
      this.navigate('dashboard');
      return;
    }

    // Check permissions
    if (!this.onBeforeNavigate(route)) {
        console.warn('Unauthorized access to ', hash);
        this.navigate('dashboard');
        return;
    }

    this.currentRoute = route;
    
    // UI Updates
    document.getElementById('current-page-title')!.textContent = route.title;
    
    // Highlight Active Nav
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${hash}`) {
        link.classList.add('active');
      }
    });

    // Render Content
    this.container.innerHTML = `<div class="flex items-center justify-center h-64">
      <div class="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>`;
    
    try {
      const html = await route.render();
      this.container.innerHTML = `<div class="fade-in">${html}</div>`;
      
      // Re-initialize icons
      if ((window as any).lucide) {
        (window as any).lucide.createIcons();
      }

      if (route.onMount) {
        route.onMount();
      }
    } catch (error) {
      this.container.innerHTML = `
        <div class="flex flex-col items-center justify-center h-64 text-center">
          <div class="text-danger mb-4"><i data-lucide="alert-triangle" class="h-12 w-12"></i></div>
          <h2 class="text-xl font-bold">Gagal Memuat Halaman</h2>
          <p class="text-text-muted">Terjadi kesalahan saat mengambil data.</p>
          <button onclick="location.reload()" class="mt-4 btn btn-primary">Refresh</button>
        </div>
      `;
      if ((window as any).lucide) (window as any).lucide.createIcons();
    }
  }

  init() {
    this.handleRouting();
  }
}
