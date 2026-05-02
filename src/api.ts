/**
 * API Service to communicate with Google Apps Script
 */

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
}

class ApiService {
    private webAppUrl: string = '';
    private cache: Map<string, { data: any, timestamp: number }> = new Map();
    private readonly CACHE_TTL = 30000; // 30 seconds cache for same requests

    constructor() {
        // Get URL from settings or env
        this.webAppUrl = localStorage.getItem('gas_web_app_url') || '';
    }

    setWebAppUrl(url: string) {
        this.webAppUrl = url;
        localStorage.setItem('gas_web_app_url', url);
        this.clearCache();
    }

    clearCache() {
        this.cache.clear();
    }

    getWebAppUrl() {
        return this.webAppUrl;
    }

    /**
     * Common GET Request with simple cache
     */
    async get<T>(action: string, params: Record<string, string> = {}): Promise<ApiResponse<T>> {
        const cacheKey = `${action}_${JSON.stringify(params)}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
            return cached.data;
        }

        if (!this.webAppUrl) {
            throw new Error('Script URL Google Apps belum dikonfigurasi. Silakan ke menu Pengaturan.');
        }

        if (!this.webAppUrl.includes('/exec')) {
            throw new Error('URL Web App Tidak Valid. Pastikan menggunakan URL yang berakhiran /exec.');
        }

        const queryParams = new URLSearchParams({ action, ...params });
        const url = `${this.webAppUrl}?${queryParams.toString()}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache',
                redirect: 'follow'
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const payload = await response.json();
            
            // Success? Cache it
            if (payload.success) {
                this.cache.set(cacheKey, { data: payload, timestamp: Date.now() });
            }

            return payload;
        } catch (error) {
            console.error('API GET Error:', error);
            if (error instanceof TypeError) {
                throw new Error('Gagal terhubung ke Google Script.\n\nKEMUNGKINAN PENYEBAB:\n1. Belum di-Deploy sebagai "Anyone/Semua Orang".\n2. URL salah (pastikan klik "Copy" setelah Deploy).\n3. Browser memblokir redirect Google.');
            }
            throw error;
        }
    }

    /**
     * Common POST Request
     */
    async post<T>(action: string, data: any): Promise<ApiResponse<T>> {
        this.clearCache(); // Invalidate cache on mutations
        if (!this.webAppUrl) {
            throw new Error('Script URL Google Apps belum dikonfigurasi.');
        }

        try {
            // Using standard POST with JSON body as text/plain to avoid CORS preflight (OPTIONS)
            // which Google Apps Script doesn't handle well.
            const payload = { action, ...data };
            const response = await fetch(this.webAppUrl, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Simpan data gagal: ${response.status} ${errorText}`);
            }
            
            const result = await response.json();
            return result as ApiResponse<T>;
        } catch (error) {
            console.error('API POST Error:', error);
            // Re-throw the actual error so UI knows it failed
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                throw new Error('Gagal terhubung ke Google Script. Pastikan URL benar, sudah di-Deploy sebagai "Anyone", dan Anda mengizinkan CORS.');
            }
            throw error;
        }
    }

    // High-level methods
    async getUserByEmail(email: string) {
        return this.get('getUserByEmail', { email });
    }

    async getSheetData(sheet: string) {
        return this.get('getData', { sheet });
    }

    async getDashboardStats() {
        return this.get('getDashboardStats');
    }

    async upsertRecord(sheet: string, data: any, idColumn: string = 'id') {
        // Using POST for data mutations
        return this.post('upsertRecord', { sheet, data, idColumn });
    }
}

export const api = new ApiService();
