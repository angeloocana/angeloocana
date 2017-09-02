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
  filters: {
    title: `Filters`,
    years: {
      title: `Years`,
      checkAll: `All years`
    },
    tags: {
      title: `Tags`,
      checkAll: `All tags`
    }
  },
  technologies: {
    title: `Technologies`,
    noTechnologies: `0 Technologies. Please select years and tags.`,
    technology: {
      getLevelMsg,
      yearsMsg
    }
  },
  educations: {
    title: `Education`,
    noEducations: `0 Teaching Institutions. Select other years.`
  }
};

export default (props) =>
  <Resume
    {...props}
    i18n={i18n}
  />;

export const pageQuery = graphql`
  query ResumeEn {
    site {
      siteMetadata {
        resume {
          technologies {
            name
            tags
            level
            years
            img
          }
          educations {
            name
            subject {
              pt
              en
              fr
            }
            needWhiteBg
            link
            fullName
            years
            img
          }
        }
      }
    }
  }
`;
