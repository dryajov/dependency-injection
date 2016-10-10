import {StrategyResolver, Resolver} from './resolvers';
import {Container} from './container';
import {metadata} from 'aurelia-metadata';

/**
* Decorator: Specifies a custom registration strategy for the decorated class/function.
*/
export function registration(value: Registration): any {
  return function (target, key, descriptor) {
    value.init(value, target, key, descriptor);
  };
}

/**
* Decorator: Specifies to register the decorated item with a "transient" lifetime.
*/
export function transient(key?: any): any {
  return registration(new TransientRegistration(key));
}

/**
* Decorator: Specifies to register the decorated item with a "singleton" lieftime.
*/
export function singleton(keyOrRegisterInChild?: any, registerInChild: boolean = false): any {
  return registration(new SingletonRegistration(keyOrRegisterInChild, registerInChild));
}

/**
* Customizes how a particular function is resolved by the Container.
*/
export class Registration {
  /**
   * Factory function invoked instead of the target
   */
  factoryFn:Function;

  /**
   * Called to perform initialization of a registration class
   * @param value The registration instance
   * @param target The target to attach the registration to
   * @param key An optional key for method invocations (method name)
   * @param descriptor An optional method descriptor of the method
     */
  init(value:Registration, target:any, key?:string, descriptor?:any) {
    if (key && key.length > 0) {
      value.factoryFn = target[key].bind(target);
      // TODO: move key to metadata
      target = metadata.get('design:returntype', target, key);
    }

    metadata.define(metadata.registration, value, target);
  }

  /**
   * Called by the container to register the resolver.
   * @param container The container the resolver is being registered with.
   * @param key The key the resolver should be registered as.
   * @param fn The function to create the resolver for.
   * @return The resolver that was registered.
   */
  registerResolver(container:Container, key:any, fn:Function):Resolver {
    if (this.factoryFn) {
      factory(this.factoryFn);
      return this.factoryFn;
    }

    return fn;
  }
}

/**
* Used to allow functions/classes to indicate that they should be registered as transients with the container.
*/
export class TransientRegistration {
  /** @internal */
  _key: any;

  /**
  * Creates an instance of TransientRegistration.
  * @param key The key to register as.
  */
  constructor(key?: any) {
    this._key = key;
  }

  /**
  * Called by the container to register the resolver.
  * @param container The container the resolver is being registered with.
  * @param key The key the resolver should be registered as.
  * @param fn The function to create the resolver for.
  * @return The resolver that was registered.
  */
  registerResolver(container: Container, key: any, fn: Function): Resolver {
    return container.registerTransient(this._key || key, fn);
  }
}

/**
* Used to allow functions/classes to indicate that they should be registered as singletons with the container.
*/
export class SingletonRegistration {
  /** @internal */
  _registerInChild: any;

  /** @internal */
  _key: any;

  /**
  * Creates an instance of SingletonRegistration.
  * @param key The key to register as.
  */
  constructor(keyOrRegisterInChild?: any, registerInChild: boolean = false) {
    if (typeof keyOrRegisterInChild === 'boolean') {
      this._registerInChild = keyOrRegisterInChild;
    } else {
      this._key = keyOrRegisterInChild;
      this._registerInChild = registerInChild;
    }
  }

  /**
  * Called by the container to register the resolver.
  * @param container The container the resolver is being registered with.
  * @param key The key the resolver should be registered as.
  * @param fn The function to create the resolver for.
  * @return The resolver that was registered.
  */
  registerResolver(container: Container, key: any, fn: Function): Resolver {
    return this._registerInChild
      ? container.registerSingleton(this._key || key, fn)
      : container.root.registerSingleton(this._key || key, fn);
  }
}
