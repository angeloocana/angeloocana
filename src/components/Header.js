import React from 'react';
import { Link } from 'react-router';
import { prefixLink } from 'gatsby-helpers';
import Menu from './Menu';

const Header = (props) => (
  <header id="header">
    <Link className="logo" to={prefixLink('/')}>
      <h1>Ângelo Ocanã</h1>
      <p>Software development</p>
    </Link>
    <Menu {...props} />
  </header>
);

export default Header;
