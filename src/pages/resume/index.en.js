import React from 'react';
import Resume from './_index';
import graphql from 'graphql';

export const yearsMsg = `{nYears, number} {nYears, plural,
  one {year}
  other {years}
}`;

export const getLevelMsg = (level) => {
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
    title="Curriculum Vitae"
    yearsMsg={yearsMsg}
    getLevelMsg={getLevelMsg}
  />;

export const pageQuery = graphql`
  query ResumeEn{
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
