const webpackLodashPlugin = require('lodash-webpack-plugin');
// const { GraphQLList, GraphQLObjectType, GraphQLString } = require('graphql');
const R = require('ramda');
const ptzMath = require('ptz-math');

// Add Lodash plugin
exports.modifyWebpackConfig = ({ config, stage }) => {
  if (stage === 'build-javascript') {
    config.plugin('Lodash', webpackLodashPlugin, null);
  }
};

const getReadNextRandom = ({ nPosts, post, readNext, posts }) => {
  const validPosts = posts.filter(p =>
    p.fields.slug !== post.fields.slug &&
    p.fields.langKey === post.fields.langKey);
  const randomPosts = R.range(0, nPosts + 2).map(_ => ptzMath.getRandomItem(validPosts));
  return R.take(nPosts, R.concat(readNext, R.uniq(randomPosts)));
};

const filterReadNext = (nPosts, readNext, posts) => {
  return !readNext || !posts
    ? []
    : R.filter(p => R.contains(p.fields.slug, readNext), posts);
};

const getReadNext = (nPosts, post, posts) => {
  const readNext = filterReadNext(nPosts, post.frontmatter.readNext, posts);
  return readNext.length === nPosts
    ? readNext
    : getReadNextRandom({ nPosts, post, readNext, posts });
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

        const posts = result.data.allMarkdownRemark.edges.map(n => n.node);
        const { createNodeField } = boundActionCreators;

        posts.forEach(post => {
          const readNextPosts = getReadNext(3, post, posts)
            .map(p => {
              const node = getNode(p.id);

              return {
                excerpt: p.excerpt,
                frontmatter: {
                  date: node.frontmatter.date,
                  title: p.frontmatter.title
                },
                fields: {
                  langKey: p.fields.langKey,
                  slug: p.fields.slug
                }
              };
            });

          createNodeField({
            node: getNode(post.id),
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

// Add readNextPosts fields
// Here we can't access the excerpt field
// If we use only the exports.createPages an error happens
exports.setFieldsOnGraphQLNodeType = (args) => {
  return new Promise(function (resolve, reject) {
    const { createNodeField } = args.boundActionCreators;

    const posts = args.getNodes().filter(n => n.fields && n.fields.langKey && !n.fields.readNextPosts);

    posts.forEach(post => {
      const readNextPosts = getReadNext(3, post, posts)
        .map(p => {
          return {
            excerpt: '',
            frontmatter: {
              date: p.frontmatter.date,
              title: p.frontmatter.title
            },
            fields: {
              langKey: p.fields.langKey,
              slug: p.fields.slug
            }
          };
        });

      createNodeField({
        node: post,
        name: 'readNextPosts',
        value: readNextPosts
      });
    });

    resolve();
  });
};
