import React from 'react';
import PropTypes from 'proptypes';
import styled from 'styled-components';
import H2 from '../H2';
import Technology from './Technology';
import Error from '../Error';

const Ul = styled.ul`
  display: flex;
  flex-flow: row wrap;
  justify-content: space-around;
  margin: 1rem 0 0 0;
  padding: 0;
`;

const Technologies = ({ technologies, i18n }) => {
  const noTechnologies = technologies && technologies.length > 0
    ? null
    : <Error>{i18n.noTechnologies}</Error>;

  return (
    <section>
      <header>
        <H2>{i18n.title}</H2>
      </header>
      <Ul>
        {
          technologies.map((technology, i) =>
            <Technology
              key={i}
              i18n={i18n.technology}
              {...technology}
            />
          )
        }
      </Ul>
      {noTechnologies}
    </section>
  );
};

Technologies.propTypes = {
  technologies: PropTypes.array.isRequired,
  i18n: PropTypes.shape({
    title: PropTypes.string.isRequired,
    technology: PropTypes.object.isRequired,
    noTechnologies: PropTypes.object.isRequired
  })
};

export default Technologies;
