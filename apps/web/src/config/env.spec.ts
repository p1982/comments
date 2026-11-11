import { theme } from '../lib/theme';
import { getApiUrl, getApiVersion } from '../lib/api';

describe('web config', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
    jest.resetModules();
  });

  it('reads public urls from the environment', async () => {
    process.env['NEXT_PUBLIC_API_URL'] = 'https://api.example';
    process.env['NEXT_PUBLIC_GRAPHQL_URL'] = 'https://gql.example';

    await jest.isolateModulesAsync(async () => {
      const { ENV: loaded } = await import('./env');
      expect(loaded.API_URL).toBe('https://api.example');
      expect(loaded.GRAPHQL_URL).toBe('https://gql.example');
    });
  });

  it('falls back to empty urls when the environment is unset', async () => {
    delete process.env['NEXT_PUBLIC_API_URL'];
    delete process.env['NEXT_PUBLIC_GRAPHQL_URL'];

    await jest.isolateModulesAsync(async () => {
      const { ENV: loaded } = await import('./env');
      expect(loaded.API_URL).toBe('');
      expect(loaded.GRAPHQL_URL).toBe('');
    });
  });

  it('exposes the light theme and the shared API helpers', () => {
    expect(theme.palette.primary.main).toBe('#1565c0');
    expect(theme.palette.secondary.main).toBe('#00897b');
    expect(getApiVersion()).toEqual(expect.any(String));
    expect(getApiUrl()).toEqual(expect.any(String));
  });
});
