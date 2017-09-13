import React from 'react';
import TechnologiesPage from '../../components/Resume/TechnologiesPage';
import graphql from 'graphql';

const yearsMsg = `{nYears, number} {nYears, plural,
  one {an}
  other {ans}
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
    title: `Résumé`,
    pages: [
      {
        label: 'Tecnologias',
        link: '/fr/resume/',
        selected: true
      },
      {
        label: 'Clients e Jobs',
        link: '/fr/resume/jobsAndClients'
      },
      {
        label: 'Educations',
        link: '/fr/resume/educations'
      },
      {
        label: 'Languages',
        link: '/fr/resume/languages'
      }
    ]
  },
  filters: {
    title: `Filtres`,
    years: {
      title: `Années`,
      checkAll: `Toutes les années`
    },
    tags: {
      title: `Tags`,
      checkAll: `Tous les tags`
    }
  },
  technologies: {
    title: `Les technologies`,
    noTechnologies: `0 Enseignants. Sélectionnez les autres années.`,
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
  query ResumeTechnologiesFr {
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
