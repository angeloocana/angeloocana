import React from 'react';
import PropTypes from 'prop-types';
import EmailIcon from 'react-icons/lib/md/email';
import PhoneIcon from 'react-icons/lib/md/phone-android';
import H1 from './H1';
import styled from 'styled-components';
import Br from './flags/Br';
import Ca from './flags/Ca';
import A from './A';
import { FormattedMessage } from 'react-intl';
import Helmet from 'react-helmet';

const getCountry = (country) => {
  switch (country) {
    case 'br': return (<Br className="country-icon" />);
    case 'ca': return (<Ca className="country-icon" />);
    default: return null;
  }
};

const getIcon = (type) => {
  switch (type) {
    case 'email': return (<EmailIcon className="contact-icon" />);
    case 'phone': return (<PhoneIcon className="contact-icon" />);
    default: return null;
  }
};

const Link = styled(A)`
  padding-top: ${({ theme }) => theme.scale(0)};
  padding-bottom: ${({ theme }) => theme.scale(1)};
  padding-right: 0;
  padding-left: ${({ theme }) => theme.scale(0)};
  margin: 0;

  color: ${({ theme }) => theme.colors.white};
  display: block;
  font-size: ${({ theme }) => theme.scale(1)};
  text-decoration: none;

  &:hover {
    background-color: ${({ theme }) => theme.colors.blackShades[0]}
  }

  .contact-icon {
    padding-right: ${({ theme }) => theme.scale(-2)};
    font-size: ${({ theme }) => theme.scale(4)};
  }

  .country-icon {
    padding-left: ${({ theme }) => theme.scale(-2)};
    font-size: ${({ theme }) => theme.scale(3)};
  }
`;

const ContactItem = (props) => {
  return (
    <li>
      <Link href={props.link}>
        {getIcon(props.type)}
        {props.value}
        {getCountry(props.country)}
      </Link>
    </li>
  );
};

ContactItem.propTypes = {
  value: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
  country: PropTypes.string
};

const Ul = styled.ul`
  padding-top: ${({ theme }) => theme.scale(0)};
  padding-bottom: ${({ theme }) => theme.scale(7)};
  padding-right: 0;
  padding-left: 0;
  margin: auto;

  width: 100%;
  max-width: 20rem;
`;

const Contact = (props) => {
  const contactList = props.data.site.siteMetadata.contact
    .map(contact => (
      <ContactItem {...contact} />
    ));

  return (
    <section>
      <FormattedMessage id="contact">
        {(txt) => (
          <header>
            <Helmet
              title={txt}
              meta={[{ name: 'description', content: txt }]}
            />
            <H1>
              {txt}
            </H1>
          </header>
        )}
      </FormattedMessage>

      <Ul>
        {contactList}
      </Ul>
    </section>
  );
};

Contact.propTypes = {
  data: PropTypes.shape({
    site: PropTypes.shape({
      siteMetadata: PropTypes.shape({
        contact: PropTypes.array
      }).isRequired
    }).isRequired
  }).isRequired
};

export default Contact;
