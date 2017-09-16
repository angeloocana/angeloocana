import React from 'react';
import PropTypes from 'proptypes';
import Link from '../../components/Link';
import kebabCase from 'lodash/kebabCase';
import H1 from '../../components/H1';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';

const Nav = styled.nav`
  margin-top: ${({ theme }) => theme.scale(-1)};
  margin-bottom: ${({ theme }) => theme.scale(6)};
  column-count: 2;

  @media (min-width: 450px) {
    column-count: 3;
  }

  @media (min-width: 650px) {
    column-count: 4;
  }
`;

const Li = styled.li`
  font-size: ${({ theme }) => theme.scale(1)};
  padding: ${({ theme }) => theme.scale(-1)} 0;
`;

const TagsPageRoute = (props) => {
  const allTags = props.data.allMarkdownRemark.group;

  return (
    <section className="post-list">
      <header>
        <FormattedMessage id="tags" >
          {(txt) => (
            <H1>{txt}</H1>
          )}
        </FormattedMessage>
      </header>
      <Nav>
        <ul>
          {allTags.map(tag =>
            <Li key={tag.fieldValue}>
              <Link
                style={{
                  textDecoration: 'none',
                }}
                to={`${props.pathContext.langKey}/tags/${kebabCase(tag.fieldValue)}/`}
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
