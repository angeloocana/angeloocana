import React from 'react';
import TechnologiesPage from '../../components/Resume/TechnologiesPage';
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
  header: {
    title: `Curriculum Vitae`,
    pages: [
      {
        label: 'Technologies',
        link: '/en/resume/',
        selected: true
      },
      {
        label: 'Jobs and Clients',
        link: '/en/resume/jobsAndClients'
      },
      {
        label: 'Educations',
        link: '/en/resume/educations'
      },
      {
        label: 'Languages',
        link: '/en/resume/languages'
      }
    ]
  },
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
  }
};

export default (props) =>
  <TechnologiesPage
    {...props}
    i18n={i18n}
  />;

export const pageQuery = graphql`
  query ResumeTechnologiesEn {
    site {
      siteMetadata {
        resume {
          technologies {
            name
            tags
            level
            years
            img
            needWhiteBg
            link
          }
        }
      }
    }
  }
`;
