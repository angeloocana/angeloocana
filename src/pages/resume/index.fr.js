import React from 'react';
import Resume from './_index';
import graphql from 'graphql';

const yearsMsg = `{nYears, number} {nYears, plural,
  one {an}
  other {ans}
}`;

const getLevelMsg = (level) => {
  switch(level){
  case 'expert': return 'Expert';
  case 'novice': return 'Novice';
  case 'proficient': return 'Proficient';
  default: return '';
  }
};

export default (props) => 
  <Resume 
    {...props}
    title="Résumé"
    yearsMsg={yearsMsg}
    getLevelMsg={getLevelMsg}
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
