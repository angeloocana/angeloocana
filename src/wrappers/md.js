import React from 'react';
import PropTypes from 'proptypes';
import moment from 'moment';
import Helmet from "react-helmet";
import styled from 'styled-components';
import ReadNext from '../components/ReadNext';
import { rhythm } from 'utils/typography';
import Footer from 'components/Footer';
import PageTitle from 'components/PageTitle';
import ReactDisqusThread from 'react-disqus-thread';
import graphql from 'graphql';

import '../css/zenburn.css';

const Content = styled(
  (props) =>
    <div
      className={`${props.className} textual-content`}
      dangerouslySetInnerHTML={{ __html: props.body }}
    />
)`
    img {
      border-radius: 10px;
    }
    h2, h3 {
      font-weight: normal;
    }
    blockquote {
      border-left: 3px solid gray;
      margin-left: 0;
    }
    ul {
      list-style-position: outside;
      margin-left: 1.5em;
      margin-top: 0.5em;
      li {
        margin-bottom: 0;
      }
      p {
        margin: 0;
      }
    }
  `;

const PostTitle = styled(
  (props) =>
    <h3 className={props.className}>
      {props.title}
      {props.sub &&
        <div style={{ borderTop: '1px solid #aaa', width: '60%', margin: 'auto' }}>
          <small className='mute'>{props.sub}</small>
        </div>
      }
    </h3>
)`
    font-weight: 100;
    margin: 40px 0;
    text-align: center;
  `;

const MarkdownWrapper = (props) => {
  const post = props.route.page.data;

  return (
    <div className="markdown">
      <Helmet
        title={`${post.title} | ${props.data.site.siteMetadata.title}`}
      />
      <PageTitle link='/'>Articles</PageTitle>
      <PostTitle title={post.title} sub={post.sub} />

      <Content body={post.body} />

      <em
        className='mute'
        style={{
          display: 'block',
          marginBottom: rhythm(1.5),
        }}
      >
        Posted {moment(post.date).format('MMMM D, YYYY')}
      </em>
      <ReadNext post={post} pages={props.route.pages} />

      <ReactDisqusThread
        shortname="pixareablog"
        identifier={props.route.path}
        title={post.title}
        url={`http://blog.pixarea.com${props.route.path}`}
      />

      <Footer />
    </div>
  );
};

MarkdownWrapper.propTypes = {
  route: PropTypes.object,
  data: PropTypes.any
};

export default MarkdownWrapper;

export const pageQuery = graphql`
  query SiteMetadataLookup($slug: String!) {
    site {
      siteMetadata {
        title
      }
    }
}
`;
