import { RequestMock } from 'testcafe';

import { Endpoints } from './endpoints';

export class RequestMockBuilder {

  static new(): RequestMockBuilder {
    return new RequestMockBuilder;
  }

  requestMock: RequestMock = RequestMock();

  selectScenario(endpoint: Endpoints, scenario: string): RequestMockBuilder {

    this.requestMock
      .onRequestTo(new RegExp(endpoint))
      .respond(this.getBody(endpoint, scenario), 200);

    return this;
  }

  build(): RequestMock {
    return this.requestMock;
  }

  private getBody(endpoint: Endpoints, scenarioFile: string): string {
    const fs = require('fs');
    const path = require('path');

    const rootDir = 'mocking/data/';
    const endpointDir = Object.keys(Endpoints).find(key => Endpoints[key] === endpoint).toLowerCase();

    const mockJsonPath = path.resolve(rootDir, endpointDir, `${scenarioFile}.json`);

    return fs.readFileSync(mockJsonPath, 'utf8');
  }
}
