import React from 'react';
import Gravatar from 'react-gravatar';
import { rhythm } from '../utils/typography';

const Footer = () => {
  const author = {
    name: 'Angelo Ocana',
    homeCity: 'Ottawa',
    email: 'angeloocana@gmail.com'
  };

  return (<p
    style={{
      marginBottom: rhythm(1.5),
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
    Written by <strong>{author.name}</strong>{' '}
    who lives and works in {author.homeCity} building really useful things.
You should <a href="https://twitter.com/ocanaangelo">follow him on Twitter</a>
  </p>
  );
};

export default Footer;
