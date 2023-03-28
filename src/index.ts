import "reflect-metadata";

const TKEY = 'design:type'
const PKEY = 'design:paramtypes'
const RKEY = 'design:returntype'

interface IScopeService {
  readonly cls: Function;
  instance(): any
}
class TransientScopeService implements IScopeService {
  cls: Function
  constructor(cls: Function) {
    this.cls = cls
  }
  instance() {
    return Object.create(this.cls.prototype)
  }
}
class SingletonScopeService implements IScopeService {
  cls: Function
  ins: any
  constructor(cls: Function) {
    this.cls = cls
  }
  instance() {
    if (!this.ins) this.ins = Object.create(this.cls.prototype)
    return this.ins
  }
}
const container = new WeakMap<Function, IScopeService>()

/**
 * 依赖生命周期
 */
export type Lifecycle = 'transient' | 'singleton'

/**
 * 装饰器：依赖
 * @param lifecycle 生命周期
 * @returns 
 */
export function resource(lifecycle: Lifecycle = 'transient'): ClassDecorator {
  return function <TFunction extends Function>(target: TFunction) {
    let service: IScopeService
    switch (lifecycle) {
      case "singleton":
        service = new SingletonScopeService(target)
        break;
      case "transient":
      default:
        service = new TransientScopeService(target)
        break;
    }
    container.set(target, service)
  }
}

/**
 * 装饰器：依赖注入（仅支持属性注入）
 * @returns 
 */
export function inject(): PropertyDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    const cls: Function = Reflect.getMetadata(TKEY, target, propertyKey);
    Reflect.defineProperty(target, propertyKey, {
      get() {
        if (container.has(cls)) {
          const instance = container.get(cls)?.instance()
          return instance
        } else {
          return undefined
        }
      }
    })
  }
}