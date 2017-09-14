import React from 'react';
import PropTypes from 'proptypes';
import ResumeContainer from './ResumeContainer';

const LanguagesPage = (props) => {
  const { menu } = props.data.site.siteMetadata.resume;

  return (
    <ResumeContainer
      menu={menu}
      selectedPage="/resume/languages/"
    >
      <div>languages</div>
    </ResumeContainer>
  );
};

LanguagesPage.propTypes = {
  data: PropTypes.object.isRequired
};

export default LanguagesPage;
