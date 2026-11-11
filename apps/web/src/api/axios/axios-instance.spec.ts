import axiosInstance from './axios-instance';

describe('axios instance', () => {
  it('exports a client with the API defaults', () => {
    expect(axiosInstance.defaults.timeout).toBe(15000);
    expect(axiosInstance.defaults.withCredentials).toBe(true);
    expect(axiosInstance.defaults.headers['Content-Type']).toBe('application/json');
  });
});
