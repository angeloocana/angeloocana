import React from 'react';
import Gravatar from 'react-gravatar';
import HeartIcon from 'react-icons/lib/fa/heart';
import GithubIcon from 'react-icons/lib/fa/github';
import Link from './Link';

const Footer = () => {
  const author = {
    name: 'Angelo Ocana',
    homeCity: 'Ottawa',
    email: 'angeloocana@gmail.com'
  };

  const blogGithubLink = 'https://github.com/angeloocana/angeloocana';

  return (<footer>
    <Gravatar
      email={author.email}
      alt={author.name}
      width={60}
      height={60} />
    Built with <HeartIcon /> by <Link to={author.defaultLink}>{author.name}</Link>
    <p>
      <Link to={blogGithubLink}><GithubIcon /> Do you want to see the source code? It's opensource, It's free, check it out!!!</Link>
    </p>
  </footer>
  );
};

export default Footer;
