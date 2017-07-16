import React from 'react';
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
    <img
      src={author.email}
      style={{
        borderRadius: '100%',
        float: 'left',
        marginRight: rhythm(1 / 4),
        marginBottom: 0,
        width: rhythm(2),
        height: rhythm(2),
      }}
    />
    Written by <strong>{author.name}</strong>{' '}
    who lives and works in {author.homeCity} building really useful things.
You should <a href="https://twitter.com/ocanaangelo">follow him on Twitter</a>
  </p>
  );
};

export default Footer;
