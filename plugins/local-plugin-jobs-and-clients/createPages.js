const defaultOptions = require('./defaultOptions');
const { forEach } = require('ramda');
const path = require('path');

const createPageForEach = (createPage, component) => forEach(edge => {
  const path = edge.node.fields.slug;
  const langKey = edge.node.fields.langKey;
  createPage({
    path, // required
    component,
    context: {
      path,
      langKey
    }
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

        createPageForEach(createPage, component)(result.data.allMarkdownRemark.edges);

        resolve();

      } catch (e) {
        console.log('ERROR plugin-jobs-and-clients: ', e);
        reject(e);
      }
    });
  });
};

export {
  createPageForEach,
  createPages
};
