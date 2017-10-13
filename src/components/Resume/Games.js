import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import H2 from '../H2';
import Game from './Game';
import { FormattedMessage } from 'react-intl';

const Ul = styled.ul`
  display: flex;
  flex-flow: row wrap;
  justify-content: space-around;
  margin: 1rem 0 0 0;
  padding: 0;
`;

const Games = ({ games }) => {
  return (
    <section>
      <header>
        <FormattedMessage id="resume.games">
          {(txt) => (
            <H2>
              {txt}
            </H2>
          )}
        </FormattedMessage>
      </header>
      <Ul>
        {
          games.map((game, i) =>
            <Game
              key={i}
              {...game}
            />
          )
        }
      </Ul>
    </section>
  );
};

Games.propTypes = {
  games: PropTypes.array.isRequired
};

export default Games;
