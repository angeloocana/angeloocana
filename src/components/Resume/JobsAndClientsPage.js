import React from 'react';
import PropTypes from 'proptypes';
import Header from './Header';

const JobsAndClientsPage = (props) => {
  const { menu } = props.data.site.siteMetadata.resume;

  return (
    <section>
      <Header
        menu={menu}
        selectedPage="/resume/jobs-and-clients/"
      />
    </section>
  );
};

JobsAndClientsPage.propTypes = {
  data: PropTypes.object.isRequired
};

export default JobsAndClientsPage;
