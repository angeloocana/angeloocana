import React from 'react';
import Resume from '../../components/Resume';
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

export const i18n = {
  title: `Currículo`,
  years: {
    title: `Anos`,
    btnAllYears: {
      selectAllYears: `Todos os anos`
    }
  },
  technologies: {
    title: `Tecnologias`,
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
