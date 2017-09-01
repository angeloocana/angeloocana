import React from 'react';
import PropTypes from 'proptypes';
import H1 from '../../components/H1';
import Technologies from '../../components/Technologies';

const Resume = ({data, title, yearsMsg, getLevelMsg}) => {  
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
      />
    </div>
  );
};

Resume.propTypes = {
  data: PropTypes.object,
  title: PropTypes.string,
  yearsMsg: PropTypes.string,
  getLevelMsg: PropTypes.func
};

export default Resume;
