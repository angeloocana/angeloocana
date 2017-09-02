import React from 'react';
import PropTypes from 'proptypes';
import styled from 'styled-components';
import H2 from '../H2';
import Technology from './Technology';

const Ul = styled.ul`
  display: flex;
  flex-flow: row wrap;
  justify-content: space-around;
  margin: 1rem 0 0 0;
  padding: 0;
`;

const Technologies = ({ technologies, i18n }) => {
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
    </section>
  );
};

Technologies.propTypes = {
  technologies: PropTypes.array.isRequired,  
  i18n: PropTypes.shape({
    title: PropTypes.string.isRequired,
    technology: PropTypes.object.isRequired
  })  
};

export default Technologies;
