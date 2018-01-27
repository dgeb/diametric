import {
  Invocable,
  InvocableRegistry,
  CreatableInjection,
  StaticInjection
} from '../src/index';
import {
  SimpleSpecifier,
  SimpleSpecifierResolver
} from './test-helpers';

const { module, test } = QUnit;

const doSomething: Invocable = {
  invoke(...thingsToDo: string[]) {
    return 'Things to do: ' + thingsToDo.join(',');
  }
};

const doSomethingOnce: Invocable = {
  invoke() {
    this._result = "This is the only time I'm doing something";
    return this.result;
  },

  get result() {
    return this._result;
  }
}

module('InvocableRegistry');

test('invocables can be registered, unregistered, and resolved', function(assert) {
  let specifierResolver = new SimpleSpecifierResolver;
  let registry = new InvocableRegistry<SimpleSpecifier>(specifierResolver);

  registry.registerInvocable('doSomething', doSomething);
  assert.strictEqual(registry.invocableFor('doSomething'), doSomething);

  registry.unregisterInvocable('doSomething');
  assert.strictEqual(registry.invocableFor('doSomething'), undefined);
});

test('invocables can be registered and resolved with a priority', function(assert) {
  let specifierResolver = new SimpleSpecifierResolver;
  let registry = new InvocableRegistry<SimpleSpecifier>(specifierResolver);

  registry.registerInvocable('*', doSomething);
  assert.strictEqual(registry.invocableFor('doSomething'), doSomething);

  registry.registerInvocable('doSomething', doSomethingOnce);
  assert.strictEqual(registry.invocableFor('doSomething'), doSomethingOnce);

  registry.unregisterInvocable('doSomething');
  assert.strictEqual(registry.invocableFor('doSomething'), doSomething);
});

test('invocable args can be registered, unregistered, and resolved', function(assert) {
  let specifierResolver = new SimpleSpecifierResolver;
  let registry = new InvocableRegistry<SimpleSpecifier>(specifierResolver);
  let injections = [
    'write todo list', {
    type: 'static',
    value: 'dishes'
  } as StaticInjection];

  registry.registerInvocableArguments('doSomething', injections);
  assert.strictEqual(registry.invocableArgumentsFor('doSomething'), injections);

  registry.unregisterInvocableArguments('doSomething');
  assert.strictEqual(registry.invocableArgumentsFor('doSomething'), undefined);
});

test('invocable args can be registered and resolved with priority', function(assert) {
  let specifierResolver = new SimpleSpecifierResolver;
  let registry = new InvocableRegistry<SimpleSpecifier>(specifierResolver);
  let injections = [
    'write todo list', {
    type: 'static',
    value: 'dishes'
  } as StaticInjection];
  let injections2 = [
    'water plants',
    'change world'];

  registry.registerInvocableArguments('*', injections);
  assert.strictEqual(registry.invocableArgumentsFor('doSomething'), injections);

  registry.registerInvocableArguments('doSomething', injections2);
  assert.strictEqual(registry.invocableArgumentsFor('doSomething'), injections2);
});

