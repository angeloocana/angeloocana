import React from 'react';
import PropTypes from 'proptypes';
import Link from '../../components/Link';
import kebabCase from 'lodash/kebabCase';
import H1 from '../../components/H1';
import styled from 'styled-components';

const Nav = styled.nav`
  margin-top: ${({theme}) => theme.scale(-1)};
  column-count: 2;

  @media (min-width: 450px) {
    column-count: 3;
  }

  @media (min-width: 650px) {
    column-count: 4;
  }
`;

const Li = styled.li`
  font-size: ${({theme}) => theme.scale(1)};
  padding: ${({theme}) => theme.scale(-1)} 0;
`;

const TagsPageRoute = ({data, pathContext}) => {
  const allTags = data.allMarkdownRemark.group;

  return (
    <section className="post-list">
      <header>
        <H1>Tags</H1>
      </header>
      <Nav>
        <ul>
          {allTags.map(tag =>
            <Li key={tag.fieldValue}>
              <Link
                style={{
                  textDecoration: 'none',
                }}
                to={`${pathContext.langKey}/tags/${kebabCase(tag.fieldValue)}/`}
              >
                {tag.fieldValue} ({tag.totalCount})
              </Link>
            </Li>
          )}
        </ul>
      </Nav>
    </section>
  );
};

TagsPageRoute.propTypes = {
  data: PropTypes.object,
  pathContext: PropTypes.object
};

export default TagsPageRoute;
