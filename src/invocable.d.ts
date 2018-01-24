import { Injection } from "./injection";

export interface Invocable {
  invoke?(...args: any[]): any;
  result?: any;
}

export interface InvocableResolver<Specifier> {
  invocableFor(specifier: Specifier): Invocable;
  invocableArgumentsFor(specifier: Specifier): Injection<Specifier>[];
}
