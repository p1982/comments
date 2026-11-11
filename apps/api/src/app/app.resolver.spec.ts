import { AppResolver } from './app.resolver';
import { AppService } from './app.service';

describe('AppResolver', () => {
  it('returns the API message', () => {
    const resolver = new AppResolver(new AppService());

    expect(resolver.health()).toBe('API is running');
  });
});
