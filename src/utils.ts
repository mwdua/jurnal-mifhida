/**
 * Shared Utility Functions
 */

export function getDirectImageLink(url: string | undefined): string {
    if (!url) return '';
    
    // Handle Google Drive links
    if (url.includes('drive.google.com')) {
        const match = url.match(/\/d\/(.+?)\/|id=(.+?)(&|$)/);
        const id = match ? (match[1] || match[2]) : null;
        if (id) return `https://lh3.googleusercontent.com/u/0/d/${id}`;
    }
    
    // Handle standard Dropbox sharing links
    if (url.includes('dropbox.com')) {
        return url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '');
    }

    // Removed Cloudinary optimization inside utils as it may cause html2canvas avif compatibility issues.
    return url;
}

/**
 * Converts a URL to a Data URL (Base64) to handle CORS issues with html2canvas
 */
export async function toDataURL(url: string | undefined): Promise<string> {
    if (!url) return '';
    try {
        const directUrl = getDirectImageLink(url);
        
        let response = await fetch(directUrl, {
            mode: 'cors',
            credentials: 'omit'
        }).catch(() => null);

        if (!response || !response.ok) {
            // Fallback to CORS proxy
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(directUrl)}`;
            response = await fetch(proxyUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        }
        
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error('Failed to convert image to Data URL:', e);
        return url; // Fallback to original URL
    }
}
