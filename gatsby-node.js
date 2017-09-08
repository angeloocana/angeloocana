const webpackLodashPlugin = require('lodash-webpack-plugin');
const { GraphQLList, GraphQLObjectType, GraphQLString } = require('graphql');
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
  const randomPosts = R.range(0, nPosts).map(_ => ptzMath.getRandomItem(validPosts));
  return R.take(nPosts, R.concat(readNext, randomPosts));
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

const FrontmatterType = new GraphQLObjectType({
  name: `ReadNext_Frontmatter`,
  fields: {
    date: {
      type: GraphQLString
    },
    title: {
      type: GraphQLString
    }
  }
});

const FieldsType = new GraphQLObjectType({
  name: `ReadNext_Fields`,
  fields: {
    langKey: {
      type: GraphQLString
    },
    slug: {
      type: GraphQLString
    }
  }
});

const ReadNextType = new GraphQLObjectType({
  name: `ReadNext`,
  fields: {
    excerpt: {
      type: GraphQLString
    },
    frontmatter: {
      type: FrontmatterType
    },
    fields: {
      type: FieldsType
    }
  }
});

exports.setFieldsOnGraphQLNodeType = (args) => {
  return new Promise(function (resolve, reject) {
    resolve({
      readNext: {
        type: new GraphQLList(ReadNextType),
        resolve(markdownNode) {
          console.log('markdownNode: ', markdownNode);

          const nodes = args.getNodes()
            .filter(n => n.fields && n.fields.langKey);

          const readNext = getReadNext(3, markdownNode, nodes)
            .map(p => {
              return {
                excerpt: p.excerpt,
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
          return readNext;
        }
      }
    });
  });
};
