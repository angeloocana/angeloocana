import React from 'react';
import { Link } from 'react-router';
import { prefixLink } from 'gatsby-helpers';

const getMenuItem = ({ title, path }) => (
  <Link
    key={path + title}
    to={prefixLink(path)}>
    {title}
  </Link>);

const routesToMenu = (routes) => {
  console.log('routes', routes);
  const items = routes[0].pages.map(page => {
    return {
      title: page.data.title,
      path: page.path
    };
  });
  console.log(items);
  return items.map((item) => getMenuItem(item));
};

const Menu = ({ language, routes }) => {
  const menu = routesToMenu(routes);
  console.log('menu', menu);
  return (
    <nav>
      <label>Menu</label>
      <ul>{menu}</ul>
    </nav>
  );
};

export default Menu;
