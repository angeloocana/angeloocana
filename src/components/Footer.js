import React from 'react';
import Gravatar from 'react-gravatar';

const Footer = () => {
  const author = {
    name: 'Angelo Ocana',
    homeCity: 'Ottawa',
    email: 'angeloocana@gmail.com'
  };

  return (<footer>
    <Gravatar
      email={author.email}
      alt={author.name}
      width={60}
      height={60} />
    Written by <strong>{author.name}</strong> {' '}
    who lives and works in {author.homeCity} building really useful things.
  You should <a href="https://twitter.com/ocanaangelo" > follow him on Twitter</a>
  </footer>
  );
};

export default Footer;
