import React from 'react';
import { FormattedMessage } from 'react-intl';

const Footer = ({ language }) => (
  <div id="footer">
    <div className="container small-container">
      <p>
        <FormattedMessage id='createdBy' />
      </p>
    </div>
  </div>
);

export default Footer;
