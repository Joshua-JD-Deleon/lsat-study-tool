/**
 * PWA Manifest and Configuration Tests
 * Tests PWA manifest file structure and icon availability
 */

import fs from 'fs';
import path from 'path';

describe('PWA Configuration', () => {
  describe('Manifest File', () => {
    let manifest: any;

    beforeAll(() => {
      const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json');
      const manifestContent = fs.readFileSync(manifestPath, 'utf8');
      manifest = JSON.parse(manifestContent);
    });

    test('has required PWA manifest fields', () => {
      expect(manifest.short_name).toBe('LSAT Study Tool');
      expect(manifest.name).toBe('LSAT Study Tool - Practice Questions');
      expect(manifest.start_url).toBe('/');
      expect(manifest.display).toBe('standalone');
      expect(manifest.theme_color).toBe('#3b82f6');
      expect(manifest.background_color).toBe('#ffffff');
    });

    test('includes proper icons for all required sizes', () => {
      const requiredSizes = ['72x72', '96x96', '128x128', '144x144', '152x152', '192x192', '384x384', '512x512'];
      
      expect(manifest.icons).toBeInstanceOf(Array);
      expect(manifest.icons.length).toBeGreaterThan(0);

      // Check each required size exists
      requiredSizes.forEach(size => {
        const iconWithSize = manifest.icons.find((icon: any) => icon.sizes === size);
        expect(iconWithSize).toBeDefined();
        expect(iconWithSize.type).toBe('image/png');
        expect(iconWithSize.src).toMatch(/^icons\/icon-\d+x\d+\.png$/);
      });
    });

    test('includes maskable icons for better OS integration', () => {
      const maskableIcons = manifest.icons.filter((icon: any) => 
        icon.purpose && icon.purpose.includes('maskable')
      );
      
      expect(maskableIcons.length).toBeGreaterThan(0);
      
      // Should have maskable icons for key sizes
      const maskableSizes = maskableIcons.map((icon: any) => icon.sizes);
      expect(maskableSizes).toContain('192x192');
      expect(maskableSizes).toContain('512x512');
    });

    test('includes app shortcuts for quick access', () => {
      expect(manifest.shortcuts).toBeInstanceOf(Array);
      expect(manifest.shortcuts.length).toBe(4);

      const expectedShortcuts = [
        { name: 'Start Practice', short_name: 'Practice', url: '/?shortcut=practice' },
        { name: 'Logical Reasoning', short_name: 'Logic', url: '/?type=logical_reasoning' },
        { name: 'Reading Comprehension', short_name: 'Reading', url: '/?type=reading_comprehension' },
        { name: 'Analytical Reasoning', short_name: 'Games', url: '/?type=analytical_reasoning' }
      ];

      expectedShortcuts.forEach((expected, index) => {
        expect(manifest.shortcuts[index].name).toBe(expected.name);
        expect(manifest.shortcuts[index].short_name).toBe(expected.short_name);
        expect(manifest.shortcuts[index].url).toBe(expected.url);
      });
    });

    test('includes proper categories for app stores', () => {
      expect(manifest.categories).toEqual(['education', 'productivity', 'reference']);
    });

    test('has correct internationalization settings', () => {
      expect(manifest.lang).toBe('en');
      expect(manifest.dir).toBe('ltr');
    });

    test('specifies no related native applications', () => {
      expect(manifest.related_applications).toEqual([]);
      expect(manifest.prefer_related_applications).toBe(false);
    });
  });

  describe('Icon Files Availability', () => {
    test('all manifest icons exist as physical files', () => {
      const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json');
      const manifestContent = fs.readFileSync(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestContent);

      manifest.icons.forEach((icon: any) => {
        if (icon.src !== 'favicon.ico') { // Skip favicon check
          const iconPath = path.join(__dirname, '..', 'public', icon.src);
          expect(fs.existsSync(iconPath)).toBe(true);
          
          // Check file size is reasonable (not empty, not too large)
          const stats = fs.statSync(iconPath);
          expect(stats.size).toBeGreaterThan(100); // At least 100 bytes
          expect(stats.size).toBeLessThan(50000); // Less than 50KB
        }
      });
    });

    test('favicon exists', () => {
      const faviconPath = path.join(__dirname, '..', 'public', 'favicon.ico');
      expect(fs.existsSync(faviconPath)).toBe(true);
    });
  });

  describe('Service Worker File', () => {
    test('service worker file exists', () => {
      const swPath = path.join(__dirname, '..', 'public', 'sw.js');
      expect(fs.existsSync(swPath)).toBe(true);
      
      const swContent = fs.readFileSync(swPath, 'utf8');
      expect(swContent).toContain('LSAT Study Tool Service Worker');
      expect(swContent).toContain('addEventListener');
      expect(swContent).toContain('install');
      expect(swContent).toContain('activate');
      expect(swContent).toContain('fetch');
    });

    test('service worker includes proper cache configuration', () => {
      const swPath = path.join(__dirname, '..', 'public', 'sw.js');
      const swContent = fs.readFileSync(swPath, 'utf8');
      
      expect(swContent).toContain('CACHE_NAME');
      expect(swContent).toContain('STATIC_CACHE_FILES');
      expect(swContent).toContain('RUNTIME_CACHE_PATTERNS');
      expect(swContent).toContain('lsat-study-tool-v1.0.0');
    });

    test('service worker includes PWA features', () => {
      const swPath = path.join(__dirname, '..', 'public', 'sw.js');
      const swContent = fs.readFileSync(swPath, 'utf8');
      
      // Check for push notifications
      expect(swContent).toContain('push');
      expect(swContent).toContain('showNotification');
      
      // Check for background sync
      expect(swContent).toContain('sync');
      expect(swContent).toContain('sync-study-progress');
      
      // Check for notification handling
      expect(swContent).toContain('notificationclick');
    });
  });

  describe('HTML PWA Configuration', () => {
    test('HTML includes PWA meta tags', () => {
      const htmlPath = path.join(__dirname, '..', 'public', 'index.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      // Check for PWA meta tags
      expect(htmlContent).toContain('name="theme-color"');
      expect(htmlContent).toContain('name="apple-mobile-web-app-capable"');
      expect(htmlContent).toContain('name="apple-mobile-web-app-status-bar-style"');
      expect(htmlContent).toContain('name="apple-mobile-web-app-title"');
      expect(htmlContent).toContain('name="mobile-web-app-capable"');
      
      // Check for manifest link
      expect(htmlContent).toContain('rel="manifest"');
      expect(htmlContent).toContain('href="%PUBLIC_URL%/manifest.json"');
      
      // Check for apple touch icons
      expect(htmlContent).toContain('rel="apple-touch-icon"');
    });

    test('HTML includes proper viewport and description', () => {
      const htmlPath = path.join(__dirname, '..', 'public', 'index.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      expect(htmlContent).toContain('name="viewport"');
      expect(htmlContent).toContain('width=device-width, initial-scale=1');
      expect(htmlContent).toContain('name="description"');
      expect(htmlContent).toContain('LSAT Study Tool');
      expect(htmlContent).toContain('name="keywords"');
    });
  });
});