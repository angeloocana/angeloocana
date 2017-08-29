import React from 'react';
import PropTypes from 'proptypes';
import Link from 'gatsby-link';
import styled from 'styled-components';

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
    float: left;

    &:not(:last-child):after{
        content: ',';
        margin-right: 1rem;
    }
`;

const A = styled(Link)`
  font-weight: bold;
  color: ${({theme}) => theme.colors.yellow};
  display: inline-block;
  position: relative;
  text-decoration: underline;
  transition: 0.2s;

  &:hover {
      color: ${({theme}) => theme.colors.white};
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
    display: inline-block;
`;

const Tags = ({tags}) => {
  if(!tags || tags.length === 0) return null;

  return (
    <Section>
      <Header>
        Tags:
      </Header>
      <Ul>
        {
          (tags || []).map((tag, i) =>
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
