import { jobsAndClients } from './jobsAndClients';
import * as assert from 'ptz-assert';
import R from 'ramda';

const anyNull = R.any(t => !t);

describe('data jobsAndClients', () => {
  it('Job Project has NO null technology', () => {
    const reduceProjects = R.reduce((projects, project) => {
      return anyNull(project.technologies)
        ? projects.concat({
          project: project.name
        })
        : projects;
    });

    const jobs = jobsAndClients.reduce((projects, job) =>
      reduceProjects(projects, job.projects), []);

    assert.equal(jobs, []);
  });
});
