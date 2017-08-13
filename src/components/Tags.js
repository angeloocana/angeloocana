import React from 'react';
import PropTypes from 'proptypes';
import Link from './Link';

const Tag = ({tag}) => {
  return (
    <li>
      <Link to={tag}>
        {tag}
      </Link>
    </li>
  );
};

Tag.propTypes = {
  tag: PropTypes.Object
};

const Tags = ({tags}) => {
  return (
    <section>
      <header>
                Tagged with
      </header>
      { 
        tags.map((tag, i) => 
          <Tag tag={tag} key={i} />)
      }
    </section> 
  );
};

Tags.propTypes = {
  tags: PropTypes.Array
};

export default Tags;

