const defaultOptions = require('./defaultOptions');
const { forEach, reduce, concat, pick } = require('ramda');
const path = require('path');

const getJobPropsForProjectPage = pick([
  'name', 'slug'
]);

const reduceJobProjects = (getJobUrl, langKey, job) => reduce((pages, project) => {
  const projectPage = {
    path: getJobUrl(langKey, job.slug, project.slug),
    type: 'project',
    context: {
      project,
      job: getJobPropsForProjectPage(job)
    }
  };

  return concat(pages, [projectPage]);
});

const reduceJobs = (getJobUrl, langKey) => reduce((pages, job) => {
  const jobPage = {
    path: getJobUrl(langKey, job.slug),
    type: 'job',
    context: {
      job
    },
  };
  
  const projectsPages = reduceJobProjects(getJobUrl, langKey, job)([], job.projects);

  return [...pages, jobPage, ...projectsPages];
});

const reduceLangs = (getJobUrl, jobsAndClients) => reduce((pages, langKey) =>
  reduceJobs(getJobUrl, langKey)(pages, jobsAndClients), []);

/**
 * Get page list for jobs and langs
 * @param {Function} getJobUrl (langKey, slug) => url
 * @param {*} jobsAndClients jobs
 * @param {*} langs langKey list
 * @return {[{slug: String, langKey: String}]} page list
 */
const getPages = (getJobUrl, jobsAndClients, langs) => {
  return reduceLangs(getJobUrl, jobsAndClients)(langs);
};

const createPageForEach = (createPage, components) => forEach(({ path, context, type }) => {
  createPage({
    path,
    component: components[type],
    context
  });
});

const createPages = ({ graphql, boundActionCreators }, pluginOptions) => {
  const { createPage } = boundActionCreators;
  const options = {
    ...defaultOptions,
    ...pluginOptions
  };

  return new Promise((resolve, reject) => {
    const components = {
      'job': path.resolve(options.jobComponent),
      'project': path.resolve(options.projectComponent)
    };

    graphql(options.createPagesQuery).then(result => {
      try {

        if (result.errors) {
          throw result.errors;
        }

        const { langs } = result.data.site.siteMetadata.languages;
        const { jobsAndClients } = result.data.site.siteMetadata.resume;

        const pages = getPages(options.getJobUrl, jobsAndClients, langs);

        createPageForEach(createPage, components)(pages);

        resolve();

      } catch (e) {
        console.log('ERROR plugin-jobs-and-clients: ', e);
        reject(e);
      }
    });
  });
};

module.exports = {
  createPageForEach,
  createPages
};
