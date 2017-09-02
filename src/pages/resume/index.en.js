import React from 'react';
import Resume from '../../components/Resume';
import graphql from 'graphql';

const yearsMsg = `{nYears, number} {nYears, plural,
  one {year}
  other {years}
}`;

const getLevelMsg = (level) => {
  switch (level) {
  case 'expert': return 'Expert';
  case 'novice': return 'Novice';
  case 'proficient': return 'Proficient';
  default: return '';
  }
};

export const i18n = {
  title: `Curriculum Vitae`,
  years: {
    title: `Years`,
    checkAll: `All years`
  },
  technologies: {
    title: `Technologies`,
    noTechnologies: `0 Technologies. Please select a year.`,
    technology: {
      getLevelMsg,
      yearsMsg
    }
  }
};

export default (props) =>
  <Resume
    {...props}
    i18n={i18n}
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
