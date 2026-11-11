import { ENDPOINTS } from '../endpoints/endpoints.js';
import { getApiUrl, getApiVersion, shared } from '../index.js';

describe('shared package', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    delete process.env['NEXT_PUBLIC_API_VERSION'];
    delete process.env['API_VERSION'];
    delete process.env['NEXT_PUBLIC_API_URL'];
    delete process.env['API_BASE_URL'];
  });

  afterAll(() => {
    process.env = env;
  });

  it('exposes the shared marker and auth endpoints', () => {
    expect(shared()).toBe('shared');
    expect(ENDPOINTS.SIGNIN).toBe('/auth/signin');
    expect(ENDPOINTS.REFRESH).toBe('/auth/refresh');
  });

  it('reads the API version from the public env, then the server env', () => {
    expect(getApiVersion()).toBe('1');

    process.env['API_VERSION'] = '2';
    expect(getApiVersion()).toBe('2');

    process.env['NEXT_PUBLIC_API_VERSION'] = '3';
    expect(getApiVersion()).toBe('3');
  });

  it('builds the API url from the public url or the base url', () => {
    expect(getApiUrl()).toBe('http://localhost:3001/api/v1');

    process.env['API_BASE_URL'] = 'http://api.test/';
    process.env['API_VERSION'] = '4';
    expect(getApiUrl()).toBe('http://api.test/api/v4');

    process.env['NEXT_PUBLIC_API_URL'] = 'https://public.test/';
    expect(getApiUrl()).toBe('https://public.test');
  });
});
