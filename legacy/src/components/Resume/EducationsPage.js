import React from 'react';
import PropTypes from 'prop-types';
import ResumeContainer from './ResumeContainer';
import Educations from './Educations';

const EducationsPage = (props) => {
  const { educations, menu } = props.data.site.siteMetadata.resume;
  const { langKey } = props.pathContext;

  return (
    <ResumeContainer
      menu={menu}
      selectedPage="/resume/education/"
    >
      <Educations
        educations={educations}
        langKey={langKey}
      />
    </ResumeContainer>
  );
};

EducationsPage.propTypes = {
  data: PropTypes.object.isRequired,
  pathContext: PropTypes.object.isRequired
};

export default EducationsPage;
