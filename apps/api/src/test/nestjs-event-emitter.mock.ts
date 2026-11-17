export class EventEmitter2 {
  emit(..._args: unknown[]): boolean {
    return true;
  }

  on(..._args: unknown[]): this {
    return this;
  }

  once(..._args: unknown[]): this {
    return this;
  }

  off(..._args: unknown[]): this {
    return this;
  }
}

export const EventEmitterModule = {
  forRoot: () => ({
    module: class EventEmitterModule {},
    providers: [] as unknown[],
    exports: [] as unknown[],
    global: true,
  }),
};

export const OnEvent =
  () => (_target: unknown, _key?: string | symbol, descriptor?: PropertyDescriptor) =>
    descriptor;
