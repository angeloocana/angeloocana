import React from 'react';
import PropTypes from 'proptypes';
import Header from './Header';
import Educations from './Educations';

const EducationsPage = (props) => {
  const { educations, menu } = props.data.site.siteMetadata.resume;
  const { langKey } = props.pathContext;

  return (
    <section>
      <Header
        menu={menu}
        selectedPage="/resume/education/"
      />
      <Educations
        educations={educations}
        langKey={langKey}
      />
    </section>
  );
};

EducationsPage.propTypes = {
  data: PropTypes.object.isRequired,
  pathContext: PropTypes.object.isRequired
};

export default EducationsPage;
