import React from 'react';
import { Link } from 'react-router';
import { config } from 'config';
import { rhythm } from 'utils/typography';
import Gravatar from 'react-gravatar';

class Bio extends React.Component {
  render() {
    return (
      <div
        style={{
          marginBottom: rhythm(2.5),
        }}
      >
        <Gravatar
          email={config.authorEmail}
          alt={config.authorName}
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
          Created by <strong>{config.authorName}</strong>.
          {' '}
          <Link className='text-link' to='/about/'>Follow me on social media</Link>.
        </div>
      </div>
    );
  }
}

export default Bio;
