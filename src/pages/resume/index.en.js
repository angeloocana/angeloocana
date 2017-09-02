import React from 'react';
import Resume from '../../components/Resume';
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

export const technologiesTitle = `Technologies`;

export const i18n = {
  title: `Curriculum Vitae`,
  years: {
    title: `Years`,
    btnAllYears: {
      selectAllYears: `All years`
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
