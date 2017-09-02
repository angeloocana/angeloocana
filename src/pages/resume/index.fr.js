import React from 'react';
import Resume from '../../components/Resume';
import graphql from 'graphql';

export const yearsMsg = `{nYears, number} {nYears, plural,
  one {an}
  other {ans}
}`;

export const getLevelMsg = (level) => {
  switch(level){
  case 'expert': return 'Expert';
  case 'novice': return 'Novice';
  case 'proficient': return 'Proficient';
  default: return '';
  }
};

export const technologiesTitle = `Les technologies`;

export const i18n = {
  title: `Résumé`,
  years: {
    title: `Années`,
    btnAllYears: {
      selectAllYears: `Toutes les années`
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
  query ResumeFr{
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
