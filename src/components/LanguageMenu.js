import React from 'react';
import { Link } from 'react-router';
import { prefixLink } from 'gatsby-helpers';
import languages from '../../i18n/languages.json';

const LanguageMenu = ({ language, routes }) => (
  <div className="language-menu">
    {languages.map(item => (
      <LanguageLink
        item={item}
        key={item.code}
        active={language === item.code}
      />
    ))}
  </div>
);

const LanguageLink = ({ item, active }) => {
  if (active) return (
    <span className="language-menu-item is-active">{item.text}</span>
  );
  return (
    <Link
      to={prefixLink(`/${item.code}/`)}
      className="language-menu-item"
    >
      {item.text}
    </Link>
  );
};

export default LanguageMenu;
