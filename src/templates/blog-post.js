import React from 'react';
import PropTypes from 'proptypes';
import graphql from 'graphql';
import Helmet from 'react-helmet';
import ReadNext from '../components/ReadNext';
import styled from 'styled-components';
import EditBtn from '../components/EditBtn';
import { getCurrentLangKey } from '../i18n/langs';
import Tags from '../components/Tags';
import {getStructuredData} from '../structuredData';

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
  code {
    color: ${props => props.theme.blog.post.content.code.color};
    font-size: ${props => props.theme.blog.post.content.code.fontSize};
  }

  .gatsby-highlight{
    margin:${props => props.theme.blog.post.content.highlight.margin};
    padding:${props => props.theme.blog.post.content.highlight.padding};
    background-color: ${props => props.theme.blog.post.content.highlight.backgroundColor};
    display: flex;
    border-radius: ${props => props.theme.blog.post.content.highlight.borderRadius};
    overflow: auto;

    code {
      color: ${props => props.theme.blog.post.content.highlight.code.color};
    }
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

  & > p:first-of-type::first-letter {
      font-size: ${props => props.theme.p.firstLetter.fontSize};
      color: ${props => props.theme.p.firstLetter.color};
      float: left;
      line-height: ${props => props.theme.p.firstLetter.lineHeight};
      padding: ${props => props.theme.p.firstLetter.padding};
      margin: ${props => props.theme.p.firstLetter.margin};
  }

  strong{
    font-weight: bold;
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

const Iframe = styled.iframe`
  width: 100%;
  max-width: 40rem;
  height: 20rem;
  margin: auto;
  display: block;
`;

const getYoutube = (markdownRemark) => {
  const youtubeId = markdownRemark.frontmatter.youtubeId;
  return youtubeId
    ? (
      <Iframe
        width="560"
        height="315"
        src={'https://www.youtube.com/embed/' + youtubeId}
        frameBorder="0"
        allowFullScreen />
    )
    : null;
};

class BlogPostRoute extends React.Component {
  static propTypes = {
    data: PropTypes.object,
    location: PropTypes.object
  }

  render() {
    const url = this.props.location.pathname;
    const currentLangKey = getCurrentLangKey(url);

    const { markdownRemark } = this.props.data;
    const youtube = getYoutube(markdownRemark);
    const structuredData = getStructuredData(markdownRemark);

    return (
      <Post>
        <Helmet
          title={`${markdownRemark.frontmatter.title}`}
          meta={[{ name: 'description', content: markdownRemark.excerpt }]}
        />
        <script type="application/ld+json">
          {structuredData}
        </script>
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
        <Tags tags={markdownRemark.fields.tagSlugs} />
        {youtube}
        <Content dangerouslySetInnerHTML={{ __html: markdownRemark.html }} />
        <Tags tags={markdownRemark.fields.tagSlugs} />
        <ReadNext nextPost={markdownRemark.frontmatter.readNext} />
      </Post>
    );
  }
}

export default BlogPostRoute;

export const pageQuery = graphql`
  query BlogPostByPath($path: String!) {
    markdownRemark(fields: {path: {eq: $path}}) {
      fileAbsolutePath
      html
      excerpt
      fields {
        tagSlugs {
          tag
          link
        }
        path
      }
      frontmatter {
        youtubeId
        title
        tags
        date
        structuredData {
          type
          dependencies
          proficiencyLevel
          articleSection
          pageStart
          pageEnd
          pagination
          about {
            name
            alternateName
            description
            identifier
            image
            sameAs
          }
          accessMode
          accessModeSufficient
          accessibilityAPI
          accessibilityControl
          accessibilitySummary
          accountablePerson {
            additionalName
          }
        }
      }
    }
  }
`;
