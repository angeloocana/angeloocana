import React from 'react';
import PropTypes from 'proptypes';
import styled from 'styled-components';
import H2 from '../H2';
import Education from './Education';
import Error from '../Error';

const Ul = styled.ul`
  display: flex;
  flex-flow: row wrap;
  justify-content: space-around;
  margin: 1rem 0 0 0;
  padding: 0;
`;

const Educations = ({ educations, i18n, langKey }) => {
  const noEducations = educations && educations.length > 0
    ? null
    : <Error>{i18n.noEducations}</Error>;

  return (
    <section>
      <header>
        <H2>{i18n.title}</H2>
      </header>
      <Ul>
        {
          educations.map((education, i) =>
            <Education
              key={i}
              langKey={langKey}
              {...education}
            />
          )
        }
      </Ul>
      {noEducations}
    </section>
  );
};

Educations.propTypes = {
  educations: PropTypes.array.isRequired,
  langKey: PropTypes.string.isRequired,
  i18n: PropTypes.shape({
    title: PropTypes.string.isRequired,
    education: PropTypes.object.isRequired,
    noEducations: PropTypes.string.isRequired
  })
};

export default Educations;
