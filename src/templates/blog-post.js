import React from 'react';
import PropTypes from 'proptypes';
import graphql from 'graphql';
import Helmet from 'react-helmet';
import Link from '../core/components/Link';
import ReadNext from '../blog/components/ReadNext';
import styled from 'styled-components';

const Post = styled.article`
  margin: ${props => props.theme.blog.post.margin};
  padding: ${props => props.theme.blog.post.padding};
`;

const H1 = styled.h1`
  padding-bottom: 0;
  text-align: center;
  font-size: ${props => props.theme.blog.post.header.fontSize};
`;

const Time = styled.time`
  font-size: ${props => props.theme.blog.post.header.time.fontSize};
  font-style: italic;
  color: ${props => props.theme.blog.post.header.time.color};
  width: 100%;
  display: block;
`;

const Content = styled.section`
  .gatsby-highlight{
    background-color: ${props => props.theme.blog.post.content.highlight.backgroundColor};
    display: flex;
    border-radius: ${props => props.theme.blog.post.content.highlight.borderRadius};
    overflow: auto;
  }
`;

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
      <Post>
        <Helmet
          title={`${markdownRemark.frontmatter.title}`}
          meta={[{ name: 'description', content: markdownRemark.excerpt }]}
        />
        <header>
          <H1>
            {markdownRemark.frontmatter.title}
          </H1>
          <Time pubdate>{markdownRemark.frontmatter.date}</Time>
        </header>
        <Content dangerouslySetInnerHTML={{ __html: markdownRemark.html }} />
        {tagsSection}
        <ReadNext nextPost={markdownRemark.frontmatter.readNext} />
      </Post>
    );
  }
}

export default BlogPostRoute;

export const pageQuery = graphql`
  query BlogPostByPath($path: String!) {
    markdownRemark(fields: { path: { eq: $path } }) {
      html
      excerpt
      fields {
        tagSlugs,
        path
      }
      frontmatter {
        title
        tags
        date(formatString: "MMMM DD, YYYY")
      }
    }
  }
`;
