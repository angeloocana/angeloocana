import React from 'react';
import PropTypes from 'proptypes';
import Header from './Header';
import Educations from './Educations';

const EducationsPage = (props) => {
  const { educations } = props.data.site.siteMetadata.resume;
  const { langKey } = props.pathContext;

  return (
    <section>
      <Header i18n={props.i18n.header} />
      <Educations
        educations={educations}
        langKey={langKey}
        i18n={props.i18n.educations}
      />
    </section>
  );
};

EducationsPage.propTypes = {
  data: PropTypes.object.isRequired,
  pathContext: PropTypes.object.isRequired,
  i18n: PropTypes.shape({
    header: PropTypes.object.isRequired,
    educations: PropTypes.object.isRequired
  })
};

export default EducationsPage;
