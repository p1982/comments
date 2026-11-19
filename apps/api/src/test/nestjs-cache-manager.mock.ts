export const CACHE_MANAGER = 'CACHE_MANAGER';

const memoryCache = {
  get: (_key: string) => Promise.resolve(undefined),
  set: (_key: string, _value: unknown) => Promise.resolve(undefined),
  del: (_key: string) => Promise.resolve(undefined),
  reset: () => Promise.resolve(undefined),
};

export class CacheModule {
  static register() {
    return {
      module: CacheModule,
      providers: [{ provide: CACHE_MANAGER, useValue: memoryCache }],
      exports: [CACHE_MANAGER],
    };
  }

  static registerAsync() {
    return CacheModule.register();
  }
}
