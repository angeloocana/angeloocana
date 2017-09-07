const webpackLodashPlugin = require('lodash-webpack-plugin');
const R = require('ramda');
const ptzMath = require('ptz-math');

// Add Lodash plugin
exports.modifyWebpackConfig = ({ config, stage }) => {
  if (stage === 'build-javascript') {
    config.plugin('Lodash', webpackLodashPlugin, null);
  }
};

const getReadNextPostsRandom = ({ nPosts, post, readNextPosts, posts }) => {
  const validPosts = posts.filter(p =>
    p.node.fields.slug !== post.node.fields.slug &&
    p.node.fields.langKey === post.node.fields.langKey);
  const randomPosts = R.range(0, nPosts).map(_ => ptzMath.getRandomItem(validPosts));
  return R.take(nPosts, R.concat(readNextPosts, randomPosts));
};

const filterReadNextPosts = (nPosts, readNext, posts) => {
  return !readNext || !posts
    ? []
    : R.filter(p => R.contains(p.node.fields.slug, readNext), posts);
};

const getReadNextPosts = (nPosts, post, posts) => {
  const readNextPosts = filterReadNextPosts(nPosts, post.node.frontmatter.readNext, posts);
  return readNextPosts.length === nPosts
    ? readNextPosts
    : getReadNextPostsRandom({ nPosts, post, readNextPosts, posts });
};

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
                langKey
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
        const { createNodeField } = boundActionCreators;

        posts.forEach(post => {
          const readNextPosts = getReadNextPosts(3, post, posts)
            .map(p => {
              const node = getNode(p.node.id);
              const pNode = { ...p.node, ...node };

              return {
                excerpt: pNode.excerpt,
                frontmatter: {
                  date: pNode.frontmatter.date,
                  title: pNode.frontmatter.title
                },
                fields: {
                  langKey: pNode.fields.langKey,
                  slug: pNode.fields.slug
                }
              };
            });

          console.log('post.node.id: ', getNode(post.node.id).id);
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
