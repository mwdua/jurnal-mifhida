/**
 * UI Components: Modal, Toast, Loader
 */

export class Toast {
    static show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
        const container = document.getElementById('toast-container') || this.createContainer();
        const toast = document.createElement('div');
        
        const colors = {
            success: 'bg-emerald-600 shadow-emerald-200',
            error: 'bg-rose-600 shadow-rose-200',
            warning: 'bg-amber-600 shadow-amber-200',
            info: 'bg-sky-600 shadow-sky-200'
        };

        toast.className = `${colors[type]} text-white px-6 py-4 rounded-2xl shadow-xl mb-3 flex items-center space-x-3 fade-in transform transition-all duration-300`;
        toast.innerHTML = `
            <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}" class="h-5 w-5"></i>
            <span class="font-bold text-sm">${message}</span>
        `;

        container.appendChild(toast);
        if ((window as any).lucide) (window as any).lucide.createIcons();

        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-2');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    private static createContainer() {
        const div = document.createElement('div');
        div.id = 'toast-container';
        div.className = 'fixed bottom-6 right-6 z-[100] flex flex-col items-end';
        document.body.appendChild(div);
        return div;
    }
}

export class Modal {
    static open(title: string, content: string, onConfirm?: () => void) {
        const modalId = 'modal-' + Date.now();
        const modalHtml = `
            <div id="${modalId}" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 fade-in">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                    <div class="px-6 py-4 border-b border-border-light flex items-center justify-between">
                        <h3 class="text-xl font-bold text-gray-800">${title}</h3>
                        <button onclick="this.closest('#${modalId}').remove()" class="text-gray-400 hover:text-text-muted">
                            <i data-lucide="x" class="h-6 w-6"></i>
                        </button>
                    </div>
                    <div class="px-6 py-4 overflow-y-auto flex-grow">
                        ${content}
                    </div>
                    <div class="px-6 py-4 border-t border-border-light flex justify-end space-x-3 bg-app-bg/50">
                        <button onclick="this.closest('#${modalId}').remove()" class="btn border border-gray-300 text-text-muted hover:bg-gray-100">Batal</button>
                        ${onConfirm ? `<button id="btn-confirm-${modalId}" class="btn btn-primary">Simpan Data</button>` : ''}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        if ((window as any).lucide) (window as any).lucide.createIcons();

        if (onConfirm) {
            document.getElementById(`btn-confirm-${modalId}`)?.addEventListener('click', onConfirm);
        }

        return modalId;
    }

    static close(id: string) {
        document.getElementById(id)?.remove();
    }
}

export class Loader {
    static show() {
        if (document.getElementById('app-loader')) return;
        const loader = document.createElement('div');
        loader.id = 'app-loader';
        loader.className = 'fixed inset-0 z-[100] bg-slate-900/10 backdrop-blur-sm flex items-center justify-center fade-in';
        loader.innerHTML = `
            <div class="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center">
                <div class="spinner"></div>
                <p class="mt-4 text-primary font-bold text-sm tracking-widest uppercase">Memuat Data...</p>
            </div>
        `;
        document.body.appendChild(loader);
    }

    static hide() {
        document.getElementById('app-loader')?.remove();
    }
}

export class EmptyState {
    static render(title: string, message: string, icon: string = 'info') {
        return `
            <div class="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border-2 border-dashed border-border-light animate-pulse-slow">
                <div class="h-20 w-20 bg-app-bg/50 rounded-full flex items-center justify-center text-gray-300 mb-6 group-hover:scale-110 transition-transform">
                    <i data-lucide="${icon}" class="h-10 w-10"></i>
                </div>
                <h4 class="text-xl font-bold text-gray-700 font-heading mb-2">${title}</h4>
                <p class="text-sm text-text-muted max-w-sm mx-auto leading-relaxed">${message}</p>
            </div>
        `;
    }
}

export class ErrorState {
    static render(error: string, onRetry?: string) {
        return `
            <div class="card bg-red-50 border border-red-100 p-8 text-center">
                <div class="h-16 w-16 bg-danger-bg text-danger rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="alert-triangle" class="h-8 w-8"></i>
                </div>
                <h4 class="text-lg font-bold text-red-800 mb-2">Terjadi Kesalahan</h4>
                <p class="text-sm text-danger mb-6 max-w-md mx-auto whitespace-pre-wrap">${error}</p>
                ${onRetry ? `<button onclick="${onRetry}" class="btn bg-red-600 text-white hover:bg-red-700">Coba Lagi</button>` : ''}
            </div>
        `;
    }
}
