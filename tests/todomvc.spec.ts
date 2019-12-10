import { Selector } from 'testcafe';

import compareElement from '../framework/compare-screenshots';
import { Endpoints } from '../mocking/endpoints';
import { RequestMockBuilder } from '../mocking/request-mock-builder';

const mock = RequestMockBuilder.new()
  .selectScenario(Endpoints.FIRST_ENDPOINT, 'default')
  .build();

fixture(`todomvc`)
  .page(`http://todomvc.com/examples/angular2/`)
  .requestHooks(mock);

test('Input field', async t => {
  const inputFieldElement = Selector('body > todo-app > section > header > input');

  await t.expect(await compareElement(t, inputFieldElement)).eql(0, 'Images are not equal');
});
