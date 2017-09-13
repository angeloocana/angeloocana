import React from 'react';
import PropTypes from 'proptypes';
import styled from 'styled-components';
import H2 from '../H2';
import Education from './Education';
import { FormattedMessage } from 'react-intl';

const Ul = styled.ul`
  display: flex;
  flex-flow: row wrap;
  justify-content: space-around;
  margin: 1rem 0 0 0;
  padding: 0;
`;

const Educations = ({ educations, langKey }) => {
  return (
    <section>
      <header>
        <H2>
          <FormattedMessage id="resume.educations" />
        </H2>
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
    </section>
  );
};

Educations.propTypes = {
  educations: PropTypes.array.isRequired,
  langKey: PropTypes.string.isRequired
};

export default Educations;
