import { Injection } from "./injection";

export interface Factory<T> {
  create?(...args: any[]): T;
  instance?: T;
}

export interface Initializer<T> {
  name: string;
  initialize: (T, ...args: any[]) => void;
}

export interface Destructor<T> {
  name: string;
  teardown: (T, ...args: any[]) => void;
}

///////////////////////////////////////////////////////////////////////////////

export interface FactoryResolver<Specifier, T> {
  factoryFor(specifier: Specifier): Factory<T>;
  constructorArgumentsFor(specifier: Specifier): Injection<Specifier>[];

  destructorsFor(specifier: Specifier): Destructor<T>[];
  destructorArgumentsFor(specifier: Specifier, name: string): Injection<Specifier>[];

  initializersFor(specifier: Specifier): Initializer<T>[];
  initializerArgumentsFor(specifier: Specifier, name: string): Injection<Specifier>[];
}
