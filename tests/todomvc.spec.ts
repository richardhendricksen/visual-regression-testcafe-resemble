import { Selector } from 'testcafe';

import { compareElementScreenshot } from '../framework/compare-screenshots';
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

    const comparedImages = await compareElementScreenshot(t, inputFieldElement, 'inputfield');
    await t.expect(comparedImages.areEqual).ok(comparedImages.errorMessage);
});

test('Input field with diff', async t => {

    const inputFieldElement = Selector('body > todo-app > section > header > input');
    await t.typeText(inputFieldElement, 'My Todo');

    const comparedImages = await compareElementScreenshot(t, inputFieldElement, 'inputfield');
    await t.expect(comparedImages.areEqual).ok(comparedImages.errorMessage);
});
