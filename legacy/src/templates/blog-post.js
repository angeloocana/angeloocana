import React from 'react';
import PropTypes from 'prop-types';
import graphql from 'graphql';
import Helmet from 'react-helmet';
import styled from 'styled-components';
import EditBtn from '../components/EditBtn';
import Tags from '../components/Tags';
import { getStructuredData } from '../structuredData';
import CleanTime from '../components/Time';
import Comments from '../components/Comments';
import Posts from '../components/Posts';
import AnchorJS from 'anchor-js';

const Time = styled(CleanTime)`
  text-align: center;
  font-size: ${props => props.theme.blog.post.header.time.fontSize};
  font-weight: bold;
  color: ${props => props.theme.blog.post.header.time.color};
  width: 100%;
  display: block;
  padding-top: 1rem;
`;

const Post = styled.article`
  margin: ${props => props.theme.blog.post.margin};
  padding: ${props => props.theme.blog.post.padding};
`;

const H1 = styled.h1`
  padding-bottom: 0;
  text-align: center;
  font-size: ${props => props.theme.blog.post.header.fontSize};
`;

const Content = styled.section`
  margin: 0 0 ${({ theme }) => theme.scale(6)} 0;

  p > code {
    color: ${props => props.theme.blog.post.content.code.color};
    font-size: ${props => props.theme.blog.post.content.code.fontSize};
    margin: ${props => props.theme.blog.post.content.code.margin};
    padding: ${props => props.theme.blog.post.content.code.padding};
    background-color: ${props => props.theme.blog.post.content.code.backgroundColor};
    border-radius: ${props => props.theme.blog.post.content.code.borderRadius};
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

    pre{
      width: 100%;
      border: 2px solid ${props => props.theme.colors.white};
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

  ol {
    list-style: decimal;
  }

  li {
    padding-top: 1rem;
  }

  blockquote {
    font-style: italic;
    margin: 0;
    padding: ${({ theme }) => theme.scale(3)};    
    position: relative;
    text-align: center;
    color: ${({ theme }) => theme.colors.white};
  }

  blockquote:before {
    line-height: 1.45;
    display: block;
    content: "\\201C";
    position: absolute;
    top: -${({ theme }) => theme.scale(-4)};
    left: -${({ theme }) => theme.scale(1)};
    font-size: ${({ theme }) => theme.scale(10)};
    color: ${({ theme }) => theme.colors.white};
  }

  blockquote:after {
    display: block;
    content: "\\201D";
    position: absolute;
    bottom: -${({ theme }) => theme.scale(6)};
    right: ${({ theme }) => theme.scale(1)};
    font-size: ${({ theme }) => theme.scale(10)};
    color: ${({ theme }) => theme.colors.white};
  }

  blockquote cite {
    color: ${({ theme }) => theme.colors.blue};
    font-size: ${({ theme }) => theme.scale(-1)};
    display: block;
  }
     
  blockquote cite:before {
    content: "\\2014 \\2009";
  }

  img {
    max-width: 100%;
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

class BlogPostRoute extends React.PureComponent {

  componentDidMount(){
    const anchors = new AnchorJS();
    anchors.add('h1, h2');
  }

  render(){
    const { markdownRemark } = this.props.data;
    const { langKey } = this.props.pathContext;
    const youtube = getYoutube(markdownRemark);
    const structuredData = getStructuredData(markdownRemark);
    const url = `https://angeloocana.com${markdownRemark.fields.slug}`;
  
    const tags = (
      <Tags tags={markdownRemark.fields.tagSlugs} />
    );
  
    return (
      <Post>
        <Helmet
          title={`${markdownRemark.frontmatter.title}`}
          meta={[{ name: 'description', content: markdownRemark.excerpt }]}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: structuredData }}
        />
        <header>
          <H1>
            {markdownRemark.frontmatter.title}
          </H1>
          <Time
            pubdate
            date={markdownRemark.frontmatter.date}
            langKey={langKey}
          />
        </header>
        <EditBtn
          fileAbsolutePath={markdownRemark.fileAbsolutePath}
          currentLangKey={langKey}
        />
        {tags}
        {youtube}
        <Content dangerouslySetInnerHTML={{ __html: markdownRemark.html }} />
        <Comments
          shortname="angeloocana-com"
          identifier={markdownRemark.fields.slug}
          title={markdownRemark.frontmatter.title}
          url={url}
        />
        {tags}
        <Posts
          posts={markdownRemark.fields.readNextPosts}
          langKey={langKey}
          showBtnMorePosts
          title="posts.readNext"
        />
      </Post>
    );
  }
}

BlogPostRoute.propTypes = {
  data: PropTypes.object,
  pathContext: PropTypes.object
};

export default BlogPostRoute;

export const pageQuery = graphql`
  query BlogPostByPath($path: String!) {
    markdownRemark(fields: {slug: {eq: $path}}) {
      fileAbsolutePath
      html
      excerpt
      fields {
        tagSlugs {
          tag
          link
        }
        slug        
        readNextPosts {
          excerpt
          frontmatter {
            title
            date
          }
          fields {
            slug
            langKey
          }
        }
      }      
      frontmatter {
        youtubeId
        title
        tags
        date
        structuredData {
          alternativeHeadline
          type
          dependencies
          proficiencyLevel
          articleSection
          pageEnd
          pageStart
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
          aggregateRating
          audience
          author
          comment
          commentCount
          contentLocation
          dateCreated
          dateModified
          datePublished
          discussionUrl
          educationalUse
          isAccessibleForFree
          isFamilyFriendly
          keywords
          locationCreated
          thumbnailUrl
          version
          video
        }
      }
    }
  }
`;
