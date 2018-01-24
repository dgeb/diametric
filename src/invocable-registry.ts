import {
  Invocable,
  InvocableResolver
} from './invocable';
import { Injection } from './injection';
import { SpecifierResolver } from './specifier';
import { Dict } from './dict';

export default class InvocableRegistry<Specifier> implements InvocableResolver<Specifier> {
  private _specifierResolver: SpecifierResolver<Specifier>;
  private _invocables: Dict<Invocable>;
  private _invocableArguments: Dict<Injection<Specifier>[]>;

  constructor(specifierResolver: SpecifierResolver<Specifier>) {
    this._specifierResolver = specifierResolver;
    this._invocables = {};
    this._invocableArguments = {};
  }

  registerInvocable(specifier: Specifier, invocable: Invocable): void {
    let key = this._specifierResolver.specifierKey(specifier);
    this._invocables[key] = invocable;
  }

  unregisterInvocable(specifier: Specifier): void {
    let key = this._specifierResolver.specifierKey(specifier);
    delete this._invocables[key];
  }

  invocableFor(specifier: Specifier): Invocable {
    let specifiers = this._specifierResolver.matchingSpecifiers(specifier);
    for (let i = 0, l = specifiers.length; i < l; i++) {
      let invocable = this.retrieveInvocable(specifiers[i]);
      if (invocable !== undefined) {
        return invocable;
      }
    }
  }

  registerInvocableArguments(specifier: Specifier, args: Injection<Specifier>[]): void {
    let key = this._specifierResolver.specifierKey(specifier);
    this._invocableArguments[key] = args;
  }

  unregisterInvocableArguments(specifier: Specifier): void {
    let key = this._specifierResolver.specifierKey(specifier);
    delete this._invocableArguments[key];
  }

  invocableArgumentsFor(specifier: Specifier): Injection<Specifier>[] {
    let specifiers = this._specifierResolver.matchingSpecifiers(specifier);
    for (let i = 0, l = specifiers.length; i < l; i++) {
      let args = this.retrieveInvocableArguments(specifiers[i]);
      if (args !== undefined) {
        return args;
      }
    }
  }

  retrieveInvocable(specifier: Specifier): Invocable {
    let key = this._specifierResolver.specifierKey(specifier);
    return this._invocables[key];
  }

  retrieveInvocableArguments(specifier: Specifier): Injection<Specifier>[] {
    let key = this._specifierResolver.specifierKey(specifier);
    return this._invocableArguments[key];
  }
}
