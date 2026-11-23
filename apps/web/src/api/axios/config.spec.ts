describe('API_CONFIG', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
    jest.resetModules();
  });

  it('uses the public API url when it is set', async () => {
    process.env['API_VERSION'] = '2';
    process.env['NEXT_PUBLIC_API_URL'] = 'https://api.example';

    await jest.isolateModulesAsync(async () => {
      const { API_CONFIG } = await import('./config');
      expect(API_CONFIG.baseURL).toBe('https://api.example');
    });
  });

  it('falls back to the local API when env values are missing', async () => {
    delete process.env['API_VERSION'];
    delete process.env['NEXT_PUBLIC_API_URL'];

    await jest.isolateModulesAsync(async () => {
      const { API_CONFIG } = await import('./config');
      expect(API_CONFIG.baseURL).toBe('http://localhost:3001/api/1');
      expect(API_CONFIG.timeout).toBe(15000);
      expect(API_CONFIG.withCredentials).toBe(true);
    });
  });
});
