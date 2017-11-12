import React from 'react';
import PropTypes from 'prop-types';
import Link from 'gatsby-link';
import styled from 'styled-components';
import {FormattedMessage} from 'react-intl';

const Section = styled.section`
  text-align: center;
  margin: 1rem;
  padding: 0;
`;

const Header = styled.header`
    padding: ${({theme}) => theme.scale(-3)} 0;
    display: block;
`;

const Li = styled.li`
    display: inline;

    &:not(:last-child):after{
        content: ',';
        margin: 0 1rem 0 0;
        display: inline-block;
    }
`;

const A = styled(Link)`
  font-weight: bold;
  color: ${({theme}) => theme.colors.yellow};
  display: inline-block;
  position: relative;
  text-decoration: underline;
  transition: 0.3s;
  padding: ${({theme}) => theme.scale(-2)} 0 ${({theme}) => theme.scale(-2)} 0;

  &:hover {
      color: ${({theme}) => theme.colors.white};
      transition: 0.3s;
  }
`;

const Tag = ({tag}) => {
  return (
    <Li>
      <A to={tag.link}>
        {tag.tag}
      </A>
    </Li>
  );
};

Tag.propTypes = {
  tag: PropTypes.object
};

const Ul = styled.ul`
    list-style: none;
    margin: 0;
    padding: 0;
    display: block;
`;

const Tags = (props) => {
  if(!props.tags || props.tags.length === 0) return null;

  return (
    <Section>
      <Header>
        <FormattedMessage id="tags" />
      </Header>
      <Ul>
        {
          (props.tags || []).map((tag, i) =>
            <Tag tag={tag} key={i} />)
        }
      </Ul>
    </Section>
  );
};

Tags.propTypes = {
  tags: PropTypes.array
};

export default Tags;
