import React from 'react';
import PropTypes from 'proptypes';
import Link from '../components/Link';
import kebabCase from 'lodash/kebabCase';

const TagsPageRoute = ({data, pathContext}) => {
  const allTags = data.allMarkdownRemark.group;

  return (
    <div>
      <h1>Tags</h1>
      <ul>
        {allTags.map(tag =>
          <li key={tag.fieldValue}>
            <Link
              style={{
                textDecoration: 'none',
              }}
              to={`${pathContext.langKey}/tags/${kebabCase(tag.fieldValue)}/`}
            >
              {tag.fieldValue} ({tag.totalCount})
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
};

TagsPageRoute.propTypes = {
  data: PropTypes.object,
  pathContext: PropTypes.object
};

export default TagsPageRoute;
