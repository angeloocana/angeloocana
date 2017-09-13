import React from 'react';
import PropTypes from 'proptypes';
import Header from './Header';

const LanguagesPage = (props) => {
  const { menu } = props.data.site.siteMetadata.resume;

  return (
    <section>
      <Header
        menu={menu}
        selectedPage="/resume/languages/"
      />
    </section>
  );
};

LanguagesPage.propTypes = {
  data: PropTypes.object.isRequired
};

export default LanguagesPage;
