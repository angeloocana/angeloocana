import React from 'react';
import PropTypes from 'prop-types';
import Link from '../Link';
import styled from 'styled-components';
import { FormattedMessage, injectIntl } from 'react-intl';
import BreadCrumb from '../BreadCrumb';
import ResumeDownloadPDF from './ResumeDownloadPDF';

const Li = styled.li`
  a {
    display: inline-block;
    border-radius: 0.2rem;
    padding-top: ${({ theme }) => theme.scale(-1)};
    padding-bottom: ${({ theme }) => theme.scale(0)};
    padding-left: ${({ theme }) => theme.scale(-1)};
    padding-right: ${({ theme }) => theme.scale(0)};

    margin-top: 0;
    margin-bottom: ${({ theme }) => theme.scale(0)};
    margin-left: 0;
    margin-right: 0;

    ${({ theme, selected }) => selected
    ? `
      color: ${theme.colors.black};
      font-size: ${theme.scale(1)};
      background-color: ${theme.colors.white};
    `
    : `
      color: ${theme.colors.white};
      font-size: ${theme.scale(0)};
      background-color: ${theme.colors.black};      
    `
}
}

  a:hover {
    color: ${({ theme }) => theme.colors.black};
    font-size: ${({ theme }) => theme.scale(1)};
    background-color: ${({ theme }) => theme.colors.white};
    margin-left: ${({ theme }) => theme.scale(-6)};
    margin-right: ${({ theme }) => theme.scale(-6)};
  }
`;

const Ul = styled.ul`
  padding-top: ${({ theme }) => theme.scale(2)};
  padding-bottom: ${({ theme }) => theme.scale(0)};
  padding-left: 0;
  padding-right: 0;
  
  margin: ${({ theme }) => theme.scale(8)} 0 0 0;

  justify-content: start;
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;

  @media (min-width: 650px) {
    flex-direction: row;
    justify-content: center;
  }
`;

const Page = ({ label, link, selected }) => {
  return (
    <Li selected={selected}>
      <FormattedMessage id={label}>
        {(txt) => (
          <Link to={link}>
            {txt}
          </Link>
        )}
      </FormattedMessage>
    </Li>
  );
};

Page.propTypes = {
  label: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
  selected: PropTypes.bool
};

const getMenu = (menu, selectedPage, langKey) =>
  menu.map((props) => ({
    link: `/${langKey}${props.link}`,
    label: props.label,
    selected: props.link === selectedPage
  }));

const getBreadCrumb = (langKey, items = []) => [
  {
    link: `/${langKey}/resume/`,
    label: 'resume'
  },
  ...items
];

const ResumeContainer = (props) => {
  const langKey = props.intl.locale;
  const menu = getMenu(props.menu, props.selectedPage, langKey);

  return (
    <section>
      <BreadCrumb
        items={getBreadCrumb(langKey, props.breadCrumb)}
      />
      <ResumeDownloadPDF />
      {props.children}
      <footer>
        <Ul>
          {menu.map(page => (<Page {...page} />))}
        </Ul>
      </footer>
    </section>
  );
};

ResumeContainer.propTypes = {
  menu: PropTypes.array.isRequired,
  selectedPage: PropTypes.string.isRequired,
  intl: PropTypes.object.isRequired,
  children: PropTypes.any,
  breadCrumb: PropTypes.array
};

export default injectIntl(ResumeContainer);
