import React from 'react';
import PropTypes from 'proptypes';
import H1 from '../../components/H1';
import Technologies from '../../components/Technologies';

const Resume = ({data, title, yearsMsg, getLevelMsg, technologiesTitle}) => {  
  return (
    <div>
      <header>
        <H1>
          {title}
        </H1>
      </header>
      <Technologies 
        technologies={data.site.siteMetadata.resume.technologies}
        yearsMsg={yearsMsg}
        getLevelMsg={getLevelMsg}
        title={technologiesTitle}
      />
    </div>
  );
};

Resume.propTypes = {
  data: PropTypes.object,
  title: PropTypes.string,
  yearsMsg: PropTypes.string,
  getLevelMsg: PropTypes.func,
  technologiesTitle: PropTypes.string
};

export default Resume;
