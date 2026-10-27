import React from 'react';
import PropTypes from 'prop-types';
import ResumeContainer from './ResumeContainer';
import { FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';
import H2 from '../H2';
import Ca from '../flags/Ca';
import Fr from '../flags/Fr';
import Br from '../flags/Br';
import Es from '../flags/Es';
import Helmet from 'react-helmet';

const getFlag = (langKey) => {
  switch (langKey) {
    case 'pt': return (<Br />);
    case 'en': return (<Ca />);
    case 'fr': return (<Fr />);
    case 'es': return (<Es />);
    default: return null;
  }
};

const Ul = styled.ul`
  padding-top: ${({ theme }) => theme.scale(4)};

  justify-content: start;
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  margin: auto;
  width: 13rem;

  @media (min-width: 60rem) {
    width: 100%;
    flex-direction: row;
    justify-content: center;
  }
`;

const Li = styled.li`
  display: block;

  svg {
    font-size: ${({ theme }) => theme.scale(8)};
    padding-right: ${({ theme }) => theme.scale(-2)};
    vertical-align: top !important;
  }
`;

const Figcaption = styled.figcaption`
  display: inline-block;

  @media (min-width: 60rem) {
    padding-right: ${({ theme }) => theme.scale(4)};
  }
`;

const Name = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.scale(1)};
  margin-top: ${({ theme }) => theme.scale(-2)};
`;

const Level = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.scale(0)};
  margin-top: ${({ theme }) => theme.scale(-2)};
  font-weight: bold;

  color: ${({ theme, level }) => {
    switch (level) {
      case 'native': return theme.colors.green;
      case 'fluent': return theme.colors.green;
      case 'proficient': return theme.colors.darkBlue;
      case 'basic': return theme.colors.blue;
      default: return '';
    }
  }};
`;

const LanguagesPage = (props) => {
  const { menu, languages } = props.data.site.siteMetadata.resume;

  return (
    <ResumeContainer
      menu={menu}
      selectedPage="/resume/languages/"
    >
      <FormattedMessage id="resume.languages">
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
          languages.map(lang => (
            <Li>
              <figure>
                {getFlag(lang.key)}
                <Figcaption>
                  <Name>{lang.name[props.intl.locale]}</Name>
                  <FormattedMessage
                    id={'resume.languages.level.' + lang.level}
                  >
                    {(txt) => (
                      <Level level={lang.level}>
                        {txt}
                      </Level>
                    )}
                  </FormattedMessage>
                </Figcaption>
              </figure>
            </Li>
          ))
        }
      </Ul>
    </ResumeContainer>
  );
};

LanguagesPage.propTypes = {
  data: PropTypes.object.isRequired,
  intl: PropTypes.object.isRequired
};

export default injectIntl(LanguagesPage);
