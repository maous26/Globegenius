/**
 * Performance and optimization utilities
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

// Intersection Observer hook
export const useIntersectionObserver = (
  ref: React.RefObject<Element>,
  options?: IntersectionObserverInit
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting) {
          setHasIntersected(true);
        }
      },
      options
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, options]);

  return { isIntersecting, hasIntersected };
};

// Lazy loading utilities
export const lazyUtils = {
  /**
   * Lazy load a component with loading state
   */
  withLoading: <T extends React.ComponentType<any>>(
    importFunc: () => Promise<{ default: T }>,
    fallback?: React.ComponentType
  ) => {
    const LazyComponent = React.lazy(importFunc);
    
    return (props: React.ComponentProps<T>) => {
      const FallbackComponent = fallback || (() => React.createElement('div', {}, 'Loading...'));
      
      return React.createElement(
        React.Suspense,
        { fallback: React.createElement(FallbackComponent) },
        React.createElement(LazyComponent, props)
      );
    };
  },

  /**
   * Preload a component
   */
  preload: (importFunc: () => Promise<{ default: any }>) => {
    return importFunc();
  },

  /**
   * Intersection Observer for lazy loading
   */
  useIntersectionObserver,
};

// Code splitting utilities
export const codeSplitting = {
  /**
   * Split component by route
   */
  byRoute: (routes: Record<string, () => Promise<{ default: any }>>) => {
    const components: Record<string, React.ComponentType> = {};
    
    Object.entries(routes).forEach(([key, importFunc]) => {
      components[key] = React.lazy(importFunc);
    });
    
    return components;
  },

  /**
   * Split by feature
   */
  byFeature: (features: Record<string, () => Promise<{ default: any }>>) => {
    return codeSplitting.byRoute(features);
  },

  /**
   * Dynamic import with error handling
   */
  dynamicImport: async <T>(
    importFunc: () => Promise<{ default: T }>,
    retries = 3
  ): Promise<T> => {
    try {
      const module = await importFunc();
      return module.default;
    } catch (error) {
      if (retries > 0) {
        console.warn(`Import failed, retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return codeSplitting.dynamicImport(importFunc, retries - 1);
      }
      throw error;
    }
  },
};

// Performance monitoring
export const performanceMonitoring = {
  /**
   * Measure component render time
   */
  measureRender: (componentName: string) => {
    return function<T extends React.ComponentType<any>>(Component: T) {
      return function MeasuredComponent(props: React.ComponentProps<T>) {
        const renderStart = useRef<number>();
        const renderEnd = useRef<number>();

        useEffect(() => {
          renderEnd.current = window.performance.now();
          if (renderStart.current) {
            const renderTime = renderEnd.current - renderStart.current;
            console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
          }
        });

        renderStart.current = window.performance.now();
        return React.createElement(Component, props);
      };
    };
  },

  /**
   * Track component mount/unmount
   */
  trackLifecycle: (componentName: string) => {
    return function<T extends React.ComponentType<any>>(Component: T) {
      return function TrackedComponent(props: React.ComponentProps<T>) {
        useEffect(() => {
          console.log(`${componentName} mounted`);
          return () => {
            console.log(`${componentName} unmounted`);
          };
        }, []);

        return React.createElement(Component, props);
      };
    };
  },

  /**
   * Memory usage tracking
   */
  useMemoryUsage: () => {
    const [memoryUsage, setMemoryUsage] = useState<any>(null);

    useEffect(() => {
      const updateMemoryUsage = () => {
        if ('memory' in window.performance) {
          setMemoryUsage((window.performance as any).memory);
        }
      };

      updateMemoryUsage();
      const interval = setInterval(updateMemoryUsage, 5000);
      return () => clearInterval(interval);
    }, []);

    return memoryUsage;
  },

  /**
   * FPS monitoring
   */
  useFPS: () => {
    const [fps, setFps] = useState(0);
    const frameCount = useRef(0);
    const lastTime = useRef(window.performance.now());

    useEffect(() => {
      const updateFPS = () => {
        frameCount.current++;
        const currentTime = window.performance.now();
        
        if (currentTime - lastTime.current >= 1000) {
          setFps(frameCount.current);
          frameCount.current = 0;
          lastTime.current = currentTime;
        }
        
        requestAnimationFrame(updateFPS);
      };

      requestAnimationFrame(updateFPS);
    }, []);

    return fps;
  },
};

// Bundle analysis utilities
export const bundleAnalysis = {
  /**
   * Analyze bundle size
   */
  analyzeBundleSize: () => {
    if (process.env.NODE_ENV === 'development') {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      const totalSize = scripts.reduce((total, script) => {
        const src = script.getAttribute('src');
        if (src && src.includes('chunk')) {
          // This is a rough estimate - in practice you'd use proper bundle analysis tools
          return total + (src.length * 100); // Rough estimate
        }
        return total;
      }, 0);
      
      console.log(`Estimated bundle size: ${(totalSize / 1024).toFixed(2)}KB`);
    }
  },

  /**
   * Track chunk loading
   */
  trackChunkLoading: () => {
    const chunkLoadTimes = new Map<string, number>();
    
    // Check if webpack is available
    if (typeof (window as any).__webpack_require__ !== 'undefined') {
      const originalImport = (window as any).__webpack_require__;
      
      (window as any).__webpack_require__ = function(moduleId: string) {
        const start = window.performance.now();
        const result = originalImport.call(this, moduleId);
        const end = window.performance.now();
        
        chunkLoadTimes.set(moduleId, end - start);
        console.log(`Chunk ${moduleId} loaded in ${(end - start).toFixed(2)}ms`);
        
        return result;
      };
    }
    
    return chunkLoadTimes;
  },
};

// Image optimization utilities
export const imageOptimization = {
  /**
   * Lazy load images
   */
  useLazyImage: (src: string, options?: IntersectionObserverInit) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const { isIntersecting } = useIntersectionObserver(imgRef, options);

    useEffect(() => {
      if (isIntersecting && src) {
        const img = new Image();
        img.onload = () => {
          setImageSrc(src);
          setIsLoading(false);
        };
        img.onerror = () => {
          setError('Failed to load image');
          setIsLoading(false);
        };
        img.src = src;
      }
    }, [isIntersecting, src]);

    return { imageSrc, isLoading, error, imgRef };
  },

  /**
   * Generate responsive image sources
   */
  generateResponsiveSources: (
    baseSrc: string,
    sizes: Array<{ width: number; suffix?: string }>
  ) => {
    const extension = baseSrc.split('.').pop();
    const baseName = baseSrc.replace(`.${extension}`, '');
    
    return sizes.map(({ width, suffix = '' }) => ({
      src: `${baseName}${suffix}_${width}w.${extension}`,
      width,
      media: `(max-width: ${width}px)`,
    }));
  },

  /**
   * WebP support detection
   */
  useWebPSupport: () => {
    const [supportsWebP, setSupportsWebP] = useState(false);

    useEffect(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 1, 1);
        
        const dataURL = canvas.toDataURL('image/webp');
        setSupportsWebP(dataURL.indexOf('data:image/webp') === 0);
      }
    }, []);

    return supportsWebP;
  },
};

// Asset preloading
export const assetPreloading = {
  /**
   * Preload images
   */
  preloadImages: (urls: string[]) => {
    const promises = urls.map(url => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
      });
    });
    
    return Promise.all(promises);
  },

  /**
   * Preload fonts
   */
  preloadFonts: (fontFaces: Array<{ family: string; src: string; weight?: string }>) => {
    fontFaces.forEach(({ family, src, weight = 'normal' }) => {
      const font = new FontFace(family, `url(${src})`, { weight });
      font.load().then(() => {
        document.fonts.add(font);
      });
    });
  },

  /**
   * Preload CSS
   */
  preloadCSS: (href: string) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    document.head.appendChild(link);
    
    // Convert to actual stylesheet after load
    link.onload = () => {
      link.rel = 'stylesheet';
    };
  },
};

// Service Worker utilities
export const serviceWorker = {
  /**
   * Register service worker
   */
  register: async (swUrl: string) => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register(swUrl);
        console.log('SW registered: ', registration);
        return registration;
      } catch (error) {
        console.log('SW registration failed: ', error);
        throw error;
      }
    }
    throw new Error('Service Worker not supported');
  },

  /**
   * Update service worker
   */
  update: async (registration: ServiceWorkerRegistration) => {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    return registration.update();
  },

  /**
   * Listen for SW updates
   */
  onUpdate: (callback: (registration: ServiceWorkerRegistration) => void) => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        navigator.serviceWorker.ready.then(callback);
      });
    }
  },
};

// Export all performance utilities
export const performanceUtils = {
  lazyUtils,
  codeSplitting,
  performanceMonitoring,
  bundleAnalysis,
  imageOptimization,
  assetPreloading,
  serviceWorker,
};

export default performanceUtils;
