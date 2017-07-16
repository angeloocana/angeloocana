import React from 'react';
import PropTypes from 'proptypes';
import graphql from 'graphql';
import Helmet from 'react-helmet';
import Link from 'gatsby-link';
import typography from '../utils/typography';
import ReadNext from '../components/ReadNext';

const { rhythm, scale } = typography;

class BlogPostRoute extends React.Component {
  static propTypes = {
    data: PropTypes.object
  }

  render() {
    console.log('blog-post props', this.props);
    
    const { markdownRemark } = this.props.data;
    console.log('markdownRemark', markdownRemark);
    const { post } = markdownRemark;

    let tags;
    let tagsSection;
    if (markdownRemark.fields.tagSlugs) {
      const tagsArray = markdownRemark.fields.tagSlugs;
      tags = tagsArray.map((tag, i) => {
        const divider =
          i < tagsArray.length - 1 &&
          <span>
            {' | '}
          </span>;
        return (
          <span key={tag}>
            <Link to={tag}>
              {markdownRemark.frontmatter.tags[i]}
            </Link>
            {divider}
          </span>
        );
      });
      tagsSection = (
        <em
          style={{
            ...scale(-1 / 5),
            display: 'block',
            marginBottom: rhythm(1),
          }}
        >
          Tagged with {tags}
        </em>
      );
    }

    return (
      <div>
        <Helmet
          title={`${post.frontmatter.title}`}
          meta={[{ name: 'description', content: post.excerpt }]}
        />
        <h1>
          {post.frontmatter.title}
        </h1>
        <div dangerouslySetInnerHTML={{ __html: post.html }} />
        {tagsSection}
        <p
          style={{
            ...scale(-1 / 5),
            display: 'block',
            marginBottom: rhythm(1),
          }}
        >
          Posted {post.frontmatter.date}
        </p>
        <hr
          style={{
            marginBottom: rhythm(1),
          }}
        />
        <ReadNext nextPost={post.frontmatter.readNext} />
      </div>
    );
  }
}

export default BlogPostRoute;

export const pageQuery = graphql`
  query BlogPostBySlug($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      excerpt
      fields {
        tagSlugs
      }
      frontmatter {
        title
        tags
        date(formatString: "MMMM DD, YYYY")
      }
    }
  }
`;
