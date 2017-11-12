import { jobsAndClients, games } from './jobsAndClients';
import R from 'ramda';
import * as assert from 'ptz-assert';

describe('data jobsAndClients', () => {
  it('no null technologies', () => {
    const mapTechs = (jobName, projectName) => (errors, techs) =>
      techs.map((tech, i) => tech ? null : i)
        .filter(i => i)
        .map(index => ({
          jobName,
          projectName,
          index
        }))
        .concat(errors);

    // const reduceTechs = (jobName, projectName) => R.reduce((errors, tech) =>
    //   tech ? errors : R.concat(errors, [{ jobName, projectName }])
    // );

    const reduceProjects = (jobName) => R.reduce((errors, project) => {
      return project.technologies
        ? mapTechs(jobName, project.name)(errors, project.technologies)
        : errors;
    });

    const reduceJobs = R.reduce((errors, job) => {
      const newErrors = mapTechs(job.name)(errors, job.technologies);
      return reduceProjects(job.name)(newErrors, job.projects);
    });

    const errors = reduceJobs([], jobsAndClients);

    assert.deepEqual(errors, []);
  });

  it('2 Games', () => {
    assert.equal(games.length, 2, 'Did u add a new game? Just update the test');
  });
});
