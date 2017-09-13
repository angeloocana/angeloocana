import React from 'react';
import TechnologiesPage from '../../components/Resume/TechnologiesPage';
import graphql from 'graphql';

const yearsMsg = `{nYears, number} {nYears, plural,
  one {ano}
  other {anos}
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
    title: `Currículo`,
    pages: [
      {
        label: 'Tecnologias',
        link: '/pt/resume/',
        selected: true
      },
      {
        label: 'Clients e Jobs',
        link: '/pt/resume/jobsAndClients'
      },
      {
        label: 'Educação',
        link: '/pt/resume/educations'
      },
      {
        label: 'Idiomas',
        link: '/pt/resume/languages'
      }
    ]
  },
  filters: {
    title: `Filtros`,
    years: {
      title: `Anos`,
      checkAll: `Todos os anos`
    },
    tags: {
      title: `Tags`,
      checkAll: `Todas as tags`
    }
  },
  technologies: {
    title: `Tecnologias`,
    noTechnologies: `0 Tecnologias. Selecione anos e tags`,
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
  query ResumeTechnologiesPt {
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
