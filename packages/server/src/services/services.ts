const destroy = Symbol('destroy');
const instanceKey = Symbol('instances');

type ServiceConstructor<T> = new (services: Services) => T;

type Destroyable = {
  [destroy]?: () => Promise<void> | void;
};

class Services {
  [instanceKey]: Map<ServiceConstructor<unknown>, unknown>;

  constructor() {
    this[instanceKey] = new Map();
  }

  get = <T>(service: ServiceConstructor<T>): T => {
    if (!this[instanceKey].has(service)) {
      this[instanceKey].set(service, new service(this));
    }
    return this[instanceKey].get(service) as T;
  };

  set = <T>(service: ServiceConstructor<T>, instance: Partial<T>): void => {
    this[instanceKey].set(service, instance);
  };

  destroy = async (): Promise<void> => {
    await Promise.all(
      Array.from(this[instanceKey].values()).map(async (instance) => {
        if (
          typeof instance === 'object' &&
          instance !== null &&
          destroy in instance &&
          typeof (instance as Record<symbol, unknown>)[destroy] === 'function'
        ) {
          await (instance as Destroyable)[destroy]?.();
        }
      }),
    );
  };
}

export type { ServiceConstructor, Destroyable };
export { Services, destroy };
