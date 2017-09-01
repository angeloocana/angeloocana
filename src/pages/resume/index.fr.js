import React from 'react';
import Resume from './_index';
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

export default (props) => 
  <Resume 
    {...props}
    title="Résumé"
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
