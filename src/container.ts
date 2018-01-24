import {
  Factory,
  FactoryResolver
} from './factory';
import {
  Invocable,
  InvocableResolver
} from './invocable';
import {
  Injection,
  StaticInjection,
  CreatableInjection,
  DictionaryInjection,
  PropertyInjection,
  MethodInjection,
  InvocableInjection,
  ObjectInjection,
  ArrayInjection
} from './injection';

export default class Container<Specifier, T> {
  private _factoryResolver: FactoryResolver<Specifier, T>;
  private _invocableResolver: InvocableResolver<Specifier>;

  constructor(factoryResolver: FactoryResolver<Specifier, T>,
              invocableResolver?: InvocableResolver<Specifier>) {

    this._factoryResolver = factoryResolver;
    this._invocableResolver = invocableResolver;
  }

  lookup(specifier: Specifier): T {
    let factory: Factory<any> = this._factoryResolver.factoryFor(specifier);

    let instance = factory.instance;

    if (instance === undefined) {
      let constructorInjections = this._factoryResolver.constructorArgumentsFor(specifier);
      let constructorArgs = constructorInjections && constructorInjections.map(i => this.evaluateInjection(i));

      instance = factory.create(...constructorArgs);

      let initializers = this._factoryResolver.initializersFor(specifier);
      if (initializers) {
        initializers.forEach(initializer => {
          let initializerInjections = this._factoryResolver.initializerArgumentsFor(specifier, initializer.name);
          let initializerArgs = initializerInjections && initializerInjections.map(i => this.evaluateInjection(i));
          initializer.initialize(instance, ...initializerArgs);
        });
      }
    }

    return instance;
  }

  teardown(specifier: Specifier, instance?: any) {
    let i = instance || this.lookup(specifier);

    let destructors = this._factoryResolver.destructorsFor(specifier);
    if (destructors) {
      destructors.forEach(destructor => {
        let destructorInjections = this._factoryResolver.destructorArgumentsFor(specifier, destructor.name);
        let destructorArgs = destructorInjections && destructorInjections.map(i => this.evaluateInjection(i));
        destructor.teardown(i, ...destructorArgs);
      });
    }
  }

  invoke(specifier: Specifier): any {
    let invocable = this._invocableResolver.invocableFor(specifier);

    let result = invocable.result;

    if (result === undefined) {
      let args = this._invocableResolver.invocableArgumentsFor(specifier) || [];
      let result = invocable.invoke(...args);
    }

    return result;
  }

  private evaluateInjection(injection: Injection<Specifier>): any {
    if (typeof injection === 'object') {
      switch (injection.type) {
        case 'static':
          return this.evaluateStaticInjection(injection as StaticInjection);

        case 'creatable':
          return this.evaluateCreatableInjection(injection as CreatableInjection<Specifier>);

        case 'property':
          return this.evaluatePropertyInjection(injection as PropertyInjection<Specifier>);

        case 'method':
          return this.evaluateMethodInjection(injection as MethodInjection<Specifier>);

        case 'invocable':
          return this.evaluateInvocableInjection(injection as InvocableInjection<Specifier>);

        case 'dictionary':
          return this.evaluateDictionaryInjection(injection as DictionaryInjection<Specifier>);

        case 'object':
          return this.evaluateObjectInjection(injection as ObjectInjection<Specifier>);

        case 'array':
          return this.evaluateArrayInjection(injection as ArrayInjection<Specifier>);

        default:
          throw new Error('Unknown injection type: ${injection.type}');
      }
    } else {
      return injection;
    }
  }

  private evaluateStaticInjection(injection: StaticInjection): any {
    return injection.value;
  }

  private evaluateCreatableInjection(injection: CreatableInjection<Specifier>): any {
    return this.lookup(injection.source);
  }

  private evaluatePropertyInjection(injection: PropertyInjection<Specifier>): any {
    let instance = this.lookup(injection.source);
    return instance[injection.property];
  }

  private evaluateMethodInjection(injection: MethodInjection<Specifier>): any {
    let instance = this.lookup(injection.source);
    let method = instance[injection.method];
    let args = injection.args ? injection.args.map(i => this.evaluateInjection(i)) : [];
    return method.apply(instance, args);
  }

  private evaluateInvocableInjection(injection: InvocableInjection<Specifier>): any {
    return this.invoke(injection.source);
  }

  private evaluateDictionaryInjection(injection: DictionaryInjection<Specifier>): object {
    let source = injection.value;
    let result = {};
    Object.keys(source).forEach(k => {
      result[k] = this.evaluateInjection(source[k]);
    });
    return result;
  }

  private evaluateObjectInjection(injection: ObjectInjection<Specifier>): object {
    let { keys, values } = injection;
    let result = {};
    for (let i = 0, l = keys.length; i < l; i++) {
      let key = keys[i];
      let value = values[i];
      result[this.evaluateInjection(key)] = this.evaluateInjection(value);
    }
    return result;
  }

  private evaluateArrayInjection(injection: ArrayInjection<Specifier>): object {
    return injection.values.map(i => this.evaluateInjection(i));
  }
}
