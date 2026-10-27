import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import A from '../A';

const Li = styled.li`
  margin-top: ${({ theme }) => theme.scale(0)};
  margin-bottom: ${({ theme }) => theme.scale(0)};

  padding-top: ${({ theme }) => theme.scale(0)};
  padding-bottom: ${({ theme }) => theme.scale(0)};
`;

const Img = styled.img`
  max-width: 80%;
  max-height: ${({ theme }) => theme.scale(12)};
`;

const Figcaption = styled.figcaption`
  font-size: ${({ theme }) => theme.scale(0)};
  text-align: center;
  padding-top: 1rem;
`;

const Figure = styled.figure`
  text-align: center;
`;

const Game = (props) => {
  const { link, name, img } = props;

  return (
    <Li>
      <A href={link} target="_blank">
        <Figure>
          <Img src={`/imgs/${img}`} alt={name} title={name} />
          <Figcaption>
            {name}
          </Figcaption>
        </Figure>
      </A>
    </Li>
  );
};

Game.propTypes = {
  name: PropTypes.string.isRequired,
  img: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired
};

export default Game;
