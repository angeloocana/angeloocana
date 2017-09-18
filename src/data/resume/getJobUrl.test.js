import { getJobUrl } from './getJobUrl';
import * as assert from 'ptz-assert';

describe('getJobUrl', () => {
  it('en /job/ /project/ => /en/job/project/', () => {
    const langKey = 'en';
    const jobSlug = '/job/';
    const projectSlug = '/project/';

    const expectedUrl = '/en/resume/jobs-and-clients/job/project/';

    const actualUrl = getJobUrl(langKey, jobSlug, projectSlug);

    assert.equal(actualUrl, expectedUrl);
  });

  it('en /job/ undefined => /en/job/project/', () => {
    const langKey = 'en';
    const jobSlug = '/job/';

    const expectedUrl = '/en/resume/jobs-and-clients/job/';

    const actualUrl = getJobUrl(langKey, jobSlug);

    assert.equal(actualUrl, expectedUrl);
  });
});
