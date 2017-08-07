import React from 'react';
import PropTypes from 'proptypes';
import graphql from 'graphql';
import Helmet from 'react-helmet';
import Link from '../components/Link';
import ReadNext from '../components/ReadNext';
import styled from 'styled-components';
import EditBtn from '../components/EditBtn';
import { getCurrentLangKey } from '../i18n/langs';

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
  text-align: center;
  font-size: ${props => props.theme.blog.post.header.time.fontSize};
  font-weight: bold;
  color: ${props => props.theme.blog.post.header.time.color};
  width: 100%;
  display: block;
`;

const Content = styled.section`
  .gatsby-highlight{
    margin:${props => props.theme.blog.post.content.highlight.margin};
    padding:${props => props.theme.blog.post.content.highlight.padding};
    background-color: ${props => props.theme.blog.post.content.highlight.backgroundColor};
    display: flex;
    border-radius: ${props => props.theme.blog.post.content.highlight.borderRadius};
    overflow: auto;
  }

  a{
    color: ${props => props.theme.blog.post.content.a.color};
  }

  h1{
    margin:${props => props.theme.blog.post.content.h1.margin};
    padding:${props => props.theme.blog.post.content.h1.padding};
    font-size:${props => props.theme.blog.post.content.h1.fontSize};
  }

  h2{
    margin:${props => props.theme.blog.post.content.h2.margin};
    padding:${props => props.theme.blog.post.content.h2.padding};
    font-size:${props => props.theme.blog.post.content.h2.fontSize};
  }

  h3{
    margin:${props => props.theme.blog.post.content.h3.margin};
    padding:${props => props.theme.blog.post.content.h3.padding};
    font-size:${props => props.theme.blog.post.content.h3.fontSize};
  }

  h4{
    margin:${props => props.theme.blog.post.content.h4.margin};
    padding:${props => props.theme.blog.post.content.h4.padding};
    font-size:${props => props.theme.blog.post.content.h4.fontSize};
  }

  h5{
    margin:${props => props.theme.blog.post.content.h5.margin};
    padding:${props => props.theme.blog.post.content.h5.padding};
    font-size:${props => props.theme.blog.post.content.h5.fontSize};
  }

  h6{
    margin:${props => props.theme.blog.post.content.h6.margin};
    padding:${props => props.theme.blog.post.content.h6.padding};
    font-size:${props => props.theme.blog.post.content.h6.fontSize};
  }

  p{
    margin:${props => props.theme.blog.post.content.p.margin};
    padding:${props => props.theme.blog.post.content.p.padding};
    font-size: ${props => props.theme.p.fontSize};
    line-height: ${props => props.theme.p.lineHeight};
  }

  p:first-of-type::first-letter {
      font-size: ${props => props.theme.p.firstLetter.fontSize};
      color: ${props => props.theme.p.firstLetter.color};
      float: left;
      line-height: ${props => props.theme.p.firstLetter.lineHeight};
      padding-top: ${props => props.theme.p.firstLetter.paddingTop};
  }

  ul, ol {
    margin:${props => props.theme.blog.post.content.ul.margin};
    padding:${props => props.theme.blog.post.content.ul.padding};
    font-size:${props => props.theme.blog.post.content.ul.fontSize};
  }

  ul {
    list-style: disc;
  }
`;

class BlogPostRoute extends React.Component {
  static propTypes = {
    data: PropTypes.object,
    location: PropTypes.object
  }

  render() {
    const url = this.props.location.pathname;
    const currentLangKey = getCurrentLangKey(url);
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
        <EditBtn
          fileAbsolutePath={markdownRemark.fileAbsolutePath}
          currentLangKey={currentLangKey}
        />
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
      fileAbsolutePath,
      html
      excerpt
      fields {
        tagSlugs
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
