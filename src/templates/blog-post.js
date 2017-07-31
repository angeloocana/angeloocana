import React from 'react';
import PropTypes from 'proptypes';
import graphql from 'graphql';
import Helmet from 'react-helmet';
import Link from '../components/Link';
import ReadNext from '../components/ReadNext';

class BlogPostRoute extends React.Component {
  static propTypes = {
    data: PropTypes.object
  }

  render() {
    const { markdownRemark } = this.props.data;

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
        <em>Tagged with {tags}</em>
      );
    }

    return (
      <div>
        <Helmet
          title={`${markdownRemark.frontmatter.title}`}
          meta={[{ name: 'description', content: markdownRemark.excerpt }]}
        />
        <h1>
          {markdownRemark.frontmatter.title}
        </h1>
        <div dangerouslySetInnerHTML={{ __html: markdownRemark.html }} />
        {tagsSection}
        <p>
          Posted {markdownRemark.frontmatter.date}
        </p>
        <hr />
        <ReadNext nextPost={markdownRemark.frontmatter.readNext} />
      </div>
    );
  }
}

export default BlogPostRoute;

// export const pageQuery = graphql`
//   query TestBlogPost {
//     allMarkdownRemark{
//       edges{
//         node{
//           fileAbsolutePath
//         }
//       }
//     }
//   }
// `;

export const pageQuery = graphql`
  query BlogPostByPath($path: String!) {
    markdownRemark(frontmatter: { path: { eq: $path } }) {
      html
      excerpt
      fields {
        tagSlugs
      }
      frontmatter {
        title
        tags
        date(formatString: "MMMM DD, YYYY")
        path
      }
    }
  }
`;
