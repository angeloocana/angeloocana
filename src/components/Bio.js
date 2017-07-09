import React from 'react';
import PropTypes from 'proptypes';
import Link from 'gatsby-link';
import { rhythm } from '../utils/typography';
import Gravatar from 'react-gravatar';
import graphql from 'graphql';

const Bio = (props) => {

  const author = props.data.site.siteMetadata.author;

  return (
    <div
      style={{
        marginBottom: rhythm(2.5),
      }}
    >
      <Gravatar
        email={author.email}
        alt={author.name}
        width={60}
        height={60}
        style={{
          float: 'left',
          marginRight: rhythm(1 / 4),
          marginTop: -5,
          marginBottom: 0,
          borderRadius: '100%',
          border: '4px solid #f6f6f6',
          boxSizing: 'content-box',
        }} />
      <div
        style={{ marginLeft: 80 }}
      >
        Created by <strong>{author.name}</strong>.
          {' '}
        <Link className='text-link' to='/about/'>Follow me on social media</Link>.
        </div>
    </div>
  );
};

Bio.propTypes = {
  data: PropTypes.any
};

export default Bio;

export const pageQuery = graphql`
  query SiteMetadataLookup($slug: String!) {
    site {
      siteMetadata {
        author {
          name,
          email
        }
      }
    }
}
`;
