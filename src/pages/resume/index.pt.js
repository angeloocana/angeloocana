import React from 'react';
import Resume from './_index';
import graphql from 'graphql';

const yearsMsg = `{nYears, number} {nYears, plural,
  one {ano}
  other {anos}
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
    title="Currículo"
    yearsMsg={yearsMsg}
    getLevelMsg={getLevelMsg}
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
