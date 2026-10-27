import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import H2 from '../H2';
import Education from './Education';
import { FormattedMessage } from 'react-intl';
import Helmet from 'react-helmet';

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

      <FormattedMessage id="resume.educations">
        {(txt) => (
          <header>
            <Helmet
              title={txt}
              meta={[{ name: 'description', content: txt }]}
            />
            <H2>
              {txt}
            </H2>
          </header>
        )}
      </FormattedMessage>
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
