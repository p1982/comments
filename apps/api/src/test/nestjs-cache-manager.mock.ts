export const CACHE_MANAGER = 'CACHE_MANAGER';

export class CacheModule {
  static register() {
    return { module: CacheModule };
  }

  static registerAsync() {
    return { module: CacheModule };
  }
}
