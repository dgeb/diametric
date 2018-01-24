import {
  Factory,
  Initializer,
  Destructor,
  FactoryResolver
} from './factory';
import { Injection } from './injection';
import { SpecifierResolver } from './specifier';
import { Dict } from './dict';

export default class FactoryRegistry<Specifier, T> implements FactoryResolver<Specifier, T> {
  private _specifierResolver: SpecifierResolver<Specifier>;
  private _factories: Dict<Factory<T>>;
  private _initializers: Dict<Dict<Initializer<T>>>;
  private _destructors: Dict<Dict<Destructor<T>>>;
  private _constructorArguments: Dict<Injection<Specifier>[]>;
  private _initializerArguments: Dict<Dict<Injection<Specifier>[]>>;
  private _destructorArguments: Dict<Dict<Injection<Specifier>[]>>;

  constructor(specifierResolver: SpecifierResolver<Specifier>) {
    this._specifierResolver = specifierResolver;
    this._factories = {};
    this._initializers = {};
    this._destructors = {};
    this._constructorArguments = {};
    this._initializerArguments = {};
    this._destructorArguments = {};
  }

  registerFactory(specifier: Specifier, factory: Factory<T>): void {
    let key = this._specifierResolver.specifierKey(specifier);
    this._factories[key] = factory;
  }

  unregisterFactory(specifier: Specifier): void {
    let key = this._specifierResolver.specifierKey(specifier);
    delete this._factories[key];
  }

  factoryFor(specifier: Specifier): Factory<T> {
    let specifiers = this._specifierResolver.matchingSpecifiers(specifier);
    for (let i = 0, l = specifiers.length; i < l; i++) {
      let factory = this.retrieveFactory(specifiers[i]);
      if (factory !== undefined) {
        return factory;
      }
    }
  }

  registerInitializer(specifier: Specifier, initializer: Initializer<T>): void {
    let key = this._specifierResolver.specifierKey(specifier);
    this._initializers[key] = this._initializers[key] || {};
    this._initializers[key][initializer.name] = initializer;
  }

  unregisterInitializer(specifier: Specifier, name: string): void {
    let key = this._specifierResolver.specifierKey(specifier);
    if (this._initializers[key]) {
      delete this._initializers[key][name];
    }
  }

  unregisterInitializers(specifier: Specifier): void {
    let key = this._specifierResolver.specifierKey(specifier);
    delete this._initializers[key];
  }

  initializersFor(specifier: Specifier): Initializer<T>[] {
    let matches: Dict<Initializer<T>> = {};
    let specifiers = this._specifierResolver.matchingSpecifiers(specifier);
    for (let i = specifiers.length - 1; i >= 0; i--) {
      let initializers = this.retrieveInitializers(specifiers[i]);
      if (initializers !== undefined) {
        Object.assign(matches, initializers);
      }
    }
    return Object.values(matches);
  }

  registerDestructor(specifier: Specifier, destructor: Destructor<T>): void {
    let key = this._specifierResolver.specifierKey(specifier);
    this._destructors[key] = this._destructors[key] || {};
    this._destructors[key][destructor.name] = destructor;
  }

  unregisterDestructor(specifier: Specifier, name: string): void {
    let key = this._specifierResolver.specifierKey(specifier);
    if (this._destructors[key]) {
      delete this._destructors[key][name];
    }
  }

  unregisterDestructors(specifier: Specifier): void {
    let key = this._specifierResolver.specifierKey(specifier);
    delete this._destructors[key];
  }

  destructorsFor(specifier: Specifier): Destructor<T>[] {
    let matches: Dict<Destructor<T>> = {};
    let specifiers = this._specifierResolver.matchingSpecifiers(specifier);
    for (let i = specifiers.length - 1; i >= 0; i--) {
      let destructors = this.retrieveDestructors(specifiers[i]);
      if (destructors !== undefined) {
        Object.assign(matches, destructors);
      }
    }
    return Object.values(matches);
  }

  registerConstructorArguments(specifier: Specifier, args: Injection<Specifier>[]): void {
    let key = this._specifierResolver.specifierKey(specifier);
    this._constructorArguments[key] = args;
  }

  unregisterConstructorArguments(specifier: Specifier): void {
    let key = this._specifierResolver.specifierKey(specifier);
    delete this._constructorArguments[key];
  }

  constructorArgumentsFor(specifier: Specifier): Injection<Specifier>[] {
    let specifiers = this._specifierResolver.matchingSpecifiers(specifier);
    for (let i = 0, l = specifiers.length; i < l; i++) {
      let args = this.retrieveConstructorArguments(specifiers[i]);
      if (args !== undefined) {
        return args;
      }
    }
  }

  registerInitializerArguments(specifier: Specifier, name: string, args: Injection<Specifier>[]): void {
    let key = this._specifierResolver.specifierKey(specifier);
    this._initializerArguments[key] = this._initializerArguments[key] || {};
    this._initializerArguments[key][name] = args;
  }

  unregisterInitializerArguments(specifier: Specifier, name?: string): void {
    let key = this._specifierResolver.specifierKey(specifier);
    if (this._initializerArguments[key]) {
      if (name) {
        delete this._initializerArguments[key][name];
      } else {
        delete this._initializerArguments[key];
      }
    }
  }

  initializerArgumentsFor(specifier: Specifier, name: string): Injection<Specifier>[] {
    let specifiers = this._specifierResolver.matchingSpecifiers(specifier);
    for (let i = 0, l = specifiers.length; i < l; i++) {
      let args = this.retrieveInitializerArguments(specifiers[i], name);
      if (args !== undefined) {
        return args;
      }
    }
  }

  registerDestructorArguments(specifier: Specifier, name: string, args: Injection<Specifier>[]): void {
    let key = this._specifierResolver.specifierKey(specifier);
    this._destructorArguments[key] = this._destructorArguments[key] || {};
    this._destructorArguments[key][name] = args;
  }

  unregisterDestructorArguments(specifier: Specifier, name?: string): void {
    let key = this._specifierResolver.specifierKey(specifier);
    if (this._destructorArguments[key]) {
      if (name) {
        delete this._destructorArguments[key][name];
      } else {
        delete this._destructorArguments[key];
      }
    }
  }

  destructorArgumentsFor(specifier: Specifier, name: string): Injection<Specifier>[] {
    let specifiers = this._specifierResolver.matchingSpecifiers(specifier);
    for (let i = 0, l = specifiers.length; i < l; i++) {
      let args = this.retrieveDestructorArguments(specifiers[i], name);
      if (args !== undefined) {
        return args;
      }
    }
  }

  retrieveFactory(specifier: Specifier): Factory<T> {
    let key = this._specifierResolver.specifierKey(specifier);
    return this._factories[key];
  }

  retrieveInitializers(specifier: Specifier): Dict<Initializer<T>> {
    let key = this._specifierResolver.specifierKey(specifier);
    return this._initializers[key];
  }

  retrieveDestructors(specifier: Specifier): Dict<Destructor<T>> {
    let key = this._specifierResolver.specifierKey(specifier);
    return this._destructors[key];
  }

  retrieveConstructorArguments(specifier: Specifier): Injection<Specifier>[] {
    let key = this._specifierResolver.specifierKey(specifier);
    return this._constructorArguments[key];
  }

  retrieveInitializerArguments(specifier: Specifier, name: string): Injection<Specifier>[] {
    let key = this._specifierResolver.specifierKey(specifier);
    if (this._initializerArguments[key]) {
      return this._initializerArguments[key][name];
    }
  }

  retrieveDestructorArguments(specifier: Specifier, name: string): Injection<Specifier>[] {
    let key = this._specifierResolver.specifierKey(specifier);
    if (this._destructorArguments[key]) {
      return this._destructorArguments[key][name];
    }
  }
}
