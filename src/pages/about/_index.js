import React from 'react';
import PropTypes from 'proptypes';
import H1 from '../../components/H1';
import { getAuthor } from '../../data/authors';
import { getStructuredDataForAuthor } from '../../structuredData';
import BigFirstLetter from '../../components/BigFirstLetter';
import styled from 'styled-components';

const Header = styled.header`
  padding: 0 0 ${({theme}) => theme.scale(2)} 0;
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
        <H1>
          {props.i18n.title}
        </H1>
      </Header>
      {props.i18n.description}
    </BigFirstLetter>
  );
};

AboutMe.propTypes = {
  i18n: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.object.isRequired,
    descriptionForGoogle: PropTypes.string.isRequired,
  }).isRequired
};

export default AboutMe;
