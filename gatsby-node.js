const webpackLodashPlugin = require('lodash-webpack-plugin');
const R = require('ramda');

// Add Lodash plugin
exports.modifyWebpackConfig = ({ config, stage }) => {
  if (stage === 'build-javascript') {
    config.plugin('Lodash', webpackLodashPlugin, null);
  }
};

const getPostsWithReadNext = R.filter(p => p.node.frontmatter.readNext && p.node.frontmatter.readNext.length > 0);

const getReadNextPosts = (readNext) => R.filter(p => R.contains(p.node.fields.slug, readNext));

exports.createPages = ({ graphql, boundActionCreators, getNode }, pluginOptions) => {
  return new Promise((resolve, reject) => {
    graphql(`
      {
        allMarkdownRemark{
          edges{
            node{
              id,
              excerpt,
              frontmatter{
                title
                readNext
              },
              fields{
                slug
              }
            }
          }
        }
      }
    `).then(result => {
      try {

        if (result.errors) {
          throw result.errors;
        }

        const posts = result.data.allMarkdownRemark.edges;
        const postsWithReadNext = getPostsWithReadNext(posts);
        const { createNodeField } = boundActionCreators;

        postsWithReadNext.forEach(post => {
          const readNextPosts = getReadNextPosts(post.node.frontmatter.readNext)(posts)
            .map(p => {
              const node = getNode(p.node.id);
              node.excerpt = p.node.excerpt;
              return node;
            });

          createNodeField({
            node: getNode(post.node.id),
            name: 'readNextPosts',
            value: readNextPosts
          });
        });

        resolve();

      } catch (e) {
        console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
        console.log('i18n createPage error:');
        console.log(e);
        console.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');
        reject(e);
      }
    });
  });
};
