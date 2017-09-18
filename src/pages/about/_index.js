import React from 'react';
import PropTypes from 'prop-types';
import H1 from '../../components/H1';
import { getAuthor } from '../../data/authors';
import { getStructuredDataForAuthor } from '../../structuredData';
import BigFirstLetter from '../../components/BigFirstLetter';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';

const Header = styled.header`
  padding: 0 0 ${({ theme }) => theme.scale(2)} 0;
`;

const AboutMe = (props) => {
  const author = getAuthor('angeloocana');

  author.description = props.i18n.descriptionForGoogle;

  const structuredData = getStructuredDataForAuthor(author);

  return (
    <BigFirstLetter>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredData }}
      />
      <Header>
        <FormattedMessage id="about">
          {(txt) => (
            <H1>
              {txt}
            </H1>
          )}
        </FormattedMessage>
      </Header>
      {props.i18n.description}
    </BigFirstLetter>
  );
};

AboutMe.propTypes = {
  i18n: PropTypes.shape({
    description: PropTypes.object.isRequired,
    descriptionForGoogle: PropTypes.string.isRequired,
  }).isRequired
};

export default AboutMe;
