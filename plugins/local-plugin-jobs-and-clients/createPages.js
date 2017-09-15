const defaultOptions = require('./defaultOptions');
const { forEach, reduce, concat } = require('ramda');
const path = require('path');

const reduceJobs = (getJobUrl, langKey) => reduce((pages, job) =>
  concat(pages, [{
    path: getJobUrl(langKey, job.slug),
    context: {
      job
    }
  }]));

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

const createPageForEach = (createPage, component) => forEach(({path, context}) => {
  createPage({
    path,
    component,
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
    const component = path.resolve(options.component);

    graphql(options.createPagesQuery).then(result => {
      try {

        if (result.errors) {
          throw result.errors;
        }

        const { langs } = result.data.site.siteMetadata.languages;
        const { jobsAndClients } = result.data.site.siteMetadata.resume;

        const pages = getPages(options.getJobUrl, jobsAndClients, langs);

        createPageForEach(createPage, component)(pages);

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
