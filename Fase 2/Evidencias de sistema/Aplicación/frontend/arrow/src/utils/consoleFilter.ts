// utils/consoleFilter.ts
// Filtra errores de consola relacionados con iframes de terceros (Power BI, etc.)
// Solo para desarrollo - no afecta la funcionalidad real

if (import.meta.env.DEV) {
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalInfo = console.info;

  // Lista de mensajes a filtrar (puedes agregar más patrones)
  const filteredPatterns = [
    // Microsoft/Power BI domains
    'dc.services.visualstudio.com',
    'visualstudio.com',
    'powerbi.com',
    'app.powerbi.com',
    
    // Cookies
    'cookietest',
    'ai_session',
    'cookie particionada',
    'partitioned cookie',
    'cookie ha sido rechazada',
    'cookie will soon be rejected',
    'cookie rejected',
    'SameSite',
    
    // CORS
    'Solicitud de origen cruzado bloqueada',
    'Cross-origin request blocked',
    'CORS request failed',
    'origen cruzado',
    'cross-origin',
    
    // Power BI específicos
    'partición de estado dinámico',
    'dynamic state partitioning',
    'terceros',
    'third-party',
    'emulate-mousewheel-events',
  ];

  function shouldFilter(message: string): boolean {
    const msg = String(message).toLowerCase();
    return filteredPatterns.some(pattern => 
      msg.includes(pattern.toLowerCase())
    );
  }

  // Intercepta console.error
  console.error = function(...args: any[]) {
    const message = args.map(arg => 
      typeof arg === 'string' ? arg : 
      arg?.message || 
      arg?.toString() || 
      JSON.stringify(arg)
    ).join(' ');
    
    if (!shouldFilter(message)) {
      originalError.apply(console, args);
    }
    // Silenciosamente ignora los errores filtrados
  };

  // Intercepta console.warn
  console.warn = function(...args: any[]) {
    const message = args.map(arg => 
      typeof arg === 'string' ? arg : 
      arg?.message || 
      arg?.toString() || 
      JSON.stringify(arg)
    ).join(' ');
    
    if (!shouldFilter(message)) {
      originalWarn.apply(console, args);
    }
    // Silenciosamente ignora los warnings filtrados
  };

  // Intercepta console.info (algunos navegadores usan info para warnings)
  console.info = function(...args: any[]) {
    const message = args.map(arg => 
      typeof arg === 'string' ? arg : 
      arg?.message || 
      arg?.toString() || 
      JSON.stringify(arg)
    ).join(' ');
    
    if (!shouldFilter(message)) {
      originalInfo.apply(console, args);
    }
  };

  console.log('%c🔇 Filtro de consola activado (solo desarrollo)', 
    'color: #888; font-style: italic;');
}

