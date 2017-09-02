import React from 'react';
import Resume from '../../components/Resume';
import graphql from 'graphql';

export const yearsMsg = `{nYears, number} {nYears, plural,
  one {ano}
  other {anos}
}`;

export const getLevelMsg = (level) => {
  switch(level){
  case 'expert': return 'Expert';
  case 'novice': return 'Novice';
  case 'proficient': return 'Proficient';
  default: return '';
  }
};

export const technologiesTitle = `Tecnologias`;

export const i18n = {
  title: `Currículo`,
  years: {
    title: `Anos`,
    btnAllYears: {
      selectAllYears: `Todos os anos`
    }
  }
};

export default (props) =>
  <Resume 
    {...props}
    i18n={i18n}
    yearsMsg={yearsMsg}
    getLevelMsg={getLevelMsg}
    technologiesTitle={technologiesTitle}
  />;

export const pageQuery = graphql`
  query ResumePt{
    site{
      siteMetadata{
        resume{
          technologies{
            name,
            tags,
            level,
            years,
            img
          }
        }
      }
    }
  }
`;
