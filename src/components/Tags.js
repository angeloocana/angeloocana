import React from 'react';
import PropTypes from 'proptypes';
import Link from 'gatsby-link';
import styled from 'styled-components';

const Header = styled.header`
    padding: 1rem 0;
`;

const Li = styled.li`
    float: left;
`;

const A = styled(Link)`
  font-weight: bold;
  background: ${({theme}) => theme.colors.red};
  border-radius: 0.2rem;
  color: ${({theme}) => theme.colors.white};
  display: inline-block;
  height: ${({theme}) => theme.scale(3)};
  line-height: 1;
  padding: ${({theme}) => `${theme.scale(-3)} ${theme.scale(2)} 0 ${theme.scale(2)}` };
  position: relative;
  margin: ${({theme}) => `0 ${theme.scale(1)} ${theme.scale(1)} 0`};
  text-decoration: none;
  transition: 0.2s;

  &::before {
    background: ${({theme}) => theme.colors.white};
    border-radius: ${({theme}) => theme.scale(1)};
    box-shadow: inset 0 1px rgba(0, 0, 0, 0.25);
    content: '';
    height: ${({theme}) => theme.scale(-4)};
    left: ${({theme}) => theme.scale(-3)};
    position: absolute;
    width: ${({theme}) => theme.scale(-4)};
    top: ${({theme}) => theme.scale(-2)};
  }

    &:hover {
        background-color: ${({theme}) => theme.colors.white};
        color: ${({theme}) => theme.colors.black};
    }
`;

const Tag = ({tag}) => {
  return (
    <Li>
      <A to={tag}>
        {tag}
      </A>
    </Li>
  );
};

Tag.propTypes = {
  tag: PropTypes.Object
};

const Ul = styled.ul`    
    list-style: none;
    margin: 0;
    overflow: hidden; 
    padding: 0;
`;

const Tags = ({tags}) => {
  if(!tags || tags.length === 0)
    return null;

  return (
    <section>
      <Header>
        Tags:
      </Header>
      <Ul>
        {
          (tags || []).map((tag, i) =>
            <Tag tag={tag} key={i} />)
        }
      </Ul>
    </section>
  );
};

Tags.propTypes = {
  tags: PropTypes.array
};

export default Tags;

