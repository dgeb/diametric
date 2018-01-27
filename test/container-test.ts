import {
  Container,
  Factory,
  FactoryRegistry,
  SpecifierResolver,
  Initializer,
  Destructor,
  CreatableInjection,
  StaticInjection,
  Invocable,
  InvocableRegistry,
  MethodInjection
} from '../src/index';
import {
  SimpleSpecifier,
  SimpleSpecifierResolver
} from './test-helpers';

const { module, test } = QUnit;

class Foo {
  id: number;
  className: string;

  constructor(id: number) {
    this.id = id;
    this.className = 'Foo';
  }

  sayHello(name: string) {
    return `hello ${name}!`;
  }
}

class Bar {

}

const fooFactory: Factory<Foo> = {
  create(id: number): Foo {
    return new Foo(id);
  }
}

const initializeOwner: Initializer<Foo> = {
  name: 'initializeOwner',
  initialize(foo: Foo) {
    foo['owner'] = '123';
  }
}

const callInit: Initializer<Foo> = {
  name: 'callInit',
  initialize(foo: Foo) {
    foo['init']();
  }
}

const teardownOwner: Destructor<Foo> = {
  name: 'teardownOwner',
  teardown(foo: Foo) {
    delete foo['owner'];
  }
}

const callDestroy: Destructor<Foo> = {
  name: 'callDestroy',
  teardown(foo: Foo) {
    foo['destroy']();
  }
}

const generateID: Invocable = {
  invoke(): number {
    this._id = this._id || 0;
    return ++this._id;
  }
};

const add: Invocable = {
  invoke(...args: number[]): number {
    return args.reduce((prev: number, current: number) => { return prev + current; }, 0);
  }
}

module('Container');

test('can invoke registered invocables', function(assert) {
  let specifierResolver = new SimpleSpecifierResolver;
  let invocableRegistry = new InvocableRegistry<SimpleSpecifier>(specifierResolver);
  let container = new Container(null, invocableRegistry);

  invocableRegistry.registerInvocable('add', add);
  let result = container.invoke('add');

  assert.strictEqual(result, 0, 'add has been called with no arguments');
});

test('can invoke registered invocables with custom arguments', function(assert) {
  let specifierResolver = new SimpleSpecifierResolver;
  let invocableRegistry = new InvocableRegistry<SimpleSpecifier>(specifierResolver);
  let container = new Container(null, invocableRegistry);

  invocableRegistry.registerInvocable('add', add);
  let result = container.invoke('add', [1, 2, 3]);

  assert.strictEqual(result, 6, 'add has been called with custom arguments');
});

test('can look up instances based on registered factories', function(assert) {
  let specifierResolver = new SimpleSpecifierResolver;
  let factoryRegistry = new FactoryRegistry<SimpleSpecifier, Foo>(specifierResolver);
  let container = new Container(factoryRegistry);

  factoryRegistry.registerFactory('foo', fooFactory);
  let instance = container.lookup('foo');

  assert.ok(instance instanceof Foo);
  assert.strictEqual(instance.id, undefined);
});

test('can look up instances and pass registered constructor arguments', function(assert) {
  let specifierResolver = new SimpleSpecifierResolver;
  let factoryRegistry = new FactoryRegistry<SimpleSpecifier, Foo>(specifierResolver);
  let invocableRegistry = new InvocableRegistry<SimpleSpecifier>(specifierResolver);
  let container = new Container(factoryRegistry, invocableRegistry);

  factoryRegistry.registerFactory('foo', fooFactory);
  invocableRegistry.registerInvocable('generateId', generateID);
  factoryRegistry.registerConstructorArguments('foo', [{
    type: 'invocable',
    source: 'generateId'
  }]);
  let instance = container.lookup('foo');

  assert.ok(instance instanceof Foo);
  assert.ok(instance.id > 0);
});

test('can look up instances and pass custom constructor arguments', function(assert) {
  let specifierResolver = new SimpleSpecifierResolver;
  let factoryRegistry = new FactoryRegistry<SimpleSpecifier, Foo>(specifierResolver);
  let invocableRegistry = new InvocableRegistry<SimpleSpecifier>(specifierResolver);
  let container = new Container(factoryRegistry, invocableRegistry);

  factoryRegistry.registerFactory('foo', fooFactory);
  let instance = container.lookup('foo', [123]);

  assert.ok(instance instanceof Foo);
  assert.equal(instance.id, 123);
});

module('Container#evaluateInjection')

test('can evaluate static injections', function(assert) {
  let specifierResolver = new SimpleSpecifierResolver;
  let factoryRegistry = new FactoryRegistry<SimpleSpecifier, Foo>(specifierResolver);
  let invocableRegistry = new InvocableRegistry<SimpleSpecifier>(specifierResolver);
  let container = new Container(factoryRegistry, invocableRegistry);

  let result = container.evaluateInjection({
    type: 'static',
    value: 'abc'
  });

  assert.equal(result, 'abc');
});

test('can evaluate creatable injections', function(assert) {
  let specifierResolver = new SimpleSpecifierResolver;
  let factoryRegistry = new FactoryRegistry<SimpleSpecifier, Foo>(specifierResolver);
  let invocableRegistry = new InvocableRegistry<SimpleSpecifier>(specifierResolver);
  let container = new Container(factoryRegistry, invocableRegistry);

  factoryRegistry.registerFactory('foo', fooFactory);

  let result = container.evaluateInjection({
    type: 'creatable',
    source: 'foo'
  });

  assert.ok(result instanceof Foo);
});

test('can evaluate property injections', function(assert) {
  let specifierResolver = new SimpleSpecifierResolver;
  let factoryRegistry = new FactoryRegistry<SimpleSpecifier, Foo>(specifierResolver);
  let invocableRegistry = new InvocableRegistry<SimpleSpecifier>(specifierResolver);
  let container = new Container(factoryRegistry, invocableRegistry);

  factoryRegistry.registerFactory('foo', fooFactory);

  let result = container.evaluateInjection({
    type: 'method',
    source: 'foo',
    method: 'sayHello',
    args: ['rwjblue']
  });

  assert.equal(result, 'hello rwjblue!');
});

test('can evaluate method injections', function(assert) {
  let specifierResolver = new SimpleSpecifierResolver;
  let factoryRegistry = new FactoryRegistry<SimpleSpecifier, Foo>(specifierResolver);
  let invocableRegistry = new InvocableRegistry<SimpleSpecifier>(specifierResolver);
  let container = new Container(factoryRegistry, invocableRegistry);

  factoryRegistry.registerFactory('foo', fooFactory);

  let result = container.evaluateInjection({
    type: 'method',
    source: 'foo',
    method: 'sayHello',
    args: [{ type: 'static', value: 'rwjblue' }]
  });

  assert.equal(result, 'hello rwjblue!');
});

test('can evaluate invocable injections', function(assert) {
  let specifierResolver = new SimpleSpecifierResolver;
  let factoryRegistry = new FactoryRegistry<SimpleSpecifier, Foo>(specifierResolver);
  let invocableRegistry = new InvocableRegistry<SimpleSpecifier>(specifierResolver);
  let container = new Container(factoryRegistry, invocableRegistry);

  invocableRegistry.registerInvocable('add', add);

  let result = container.evaluateInjection({
    type: 'invocable',
    source: 'add'
  });

  assert.strictEqual(result, 0, 'add has been called with no arguments');

  invocableRegistry.registerInvocableArguments('add', [1, 2]);

  result = container.evaluateInjection({
    type: 'invocable',
    source: 'add'
  });

  assert.strictEqual(result, 3, 'add has been called with registered arguments');

  result = container.evaluateInjection({
    type: 'invocable',
    source: 'add',
    args: [5, { type: 'static', value: 99 }]
  });

  assert.strictEqual(result, 104, 'add has been called with injected arguments');
});

test('can evaluate dictionary injections', function(assert) {
  let specifierResolver = new SimpleSpecifierResolver;
  let factoryRegistry = new FactoryRegistry<SimpleSpecifier, Foo>(specifierResolver);
  let invocableRegistry = new InvocableRegistry<SimpleSpecifier>(specifierResolver);
  let container = new Container(factoryRegistry, invocableRegistry);

  factoryRegistry.registerFactory('foo', fooFactory);

  let result = container.evaluateInjection(
    {
      type: 'dictionary',
      value: {
        user: 'rwjblue',
        greeting: {
          type: 'method',
          source: 'foo',
          method: 'sayHello',
          args: [{ type: 'static', value: 'rwjblue' }]
        } as MethodInjection<SimpleSpecifier>
      }
    }
  );

  assert.deepEqual(result, { user: 'rwjblue', greeting: 'hello rwjblue!' });
});

test('can evaluate object injections', function(assert) {
  let specifierResolver = new SimpleSpecifierResolver;
  let factoryRegistry = new FactoryRegistry<SimpleSpecifier, Foo>(specifierResolver);
  let invocableRegistry = new InvocableRegistry<SimpleSpecifier>(specifierResolver);
  let container = new Container(factoryRegistry, invocableRegistry);

  factoryRegistry.registerFactory('foo', fooFactory);

  let result = container.evaluateInjection(
    {
      type: 'object',
      keys: [
        'user',
        {
          type: 'static',
          value: 'greeting'
        }
      ],
      values: [
        'rwjblue',
        {
          type: 'method',
          source: 'foo',
          method: 'sayHello',
          args: [{ type: 'static', value: 'rwjblue' }]
        } as MethodInjection<SimpleSpecifier>
      ]
    }
  );

  assert.deepEqual(result, { user: 'rwjblue', greeting: 'hello rwjblue!' });
});

test('can evaluate array injections', function(assert) {
  let specifierResolver = new SimpleSpecifierResolver;
  let factoryRegistry = new FactoryRegistry<SimpleSpecifier, Foo>(specifierResolver);
  let invocableRegistry = new InvocableRegistry<SimpleSpecifier>(specifierResolver);
  let container = new Container(factoryRegistry, invocableRegistry);

  factoryRegistry.registerFactory('foo', fooFactory);

  let result = container.evaluateInjection(
    {
      type: 'array',
      values: [
        'one',
        {
          type: 'static',
          value: 'two'
        }
      ]
    }
  );

  assert.deepEqual(result, ['one', 'two']);
});
