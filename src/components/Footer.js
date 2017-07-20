import React from 'react';
import PropTypes from 'proptypes';
import Gravatar from 'react-gravatar';
import HeartIcon from 'react-icons/lib/fa/heart';
import FaGithub from 'react-icons/lib/fa/github';
import A from './A';
import styled from 'styled-components';

const FooterSection = styled.section`
  text-align: center;
  padding-top: ${props => props.theme.footer.marginTop};
  padding-bottom: ${props => props.theme.footer.marginBottom};
  line-height: 1.5;

  &:hover {
    background-color: ${props => props.theme.footer.hover.backgroundColor};
  }
`;

const ProfilePicture = styled(Gravatar)`
  display: block;
  margin: auto;
  border-radius: 50%;
  margin-bottom: 1rem;
`;

const GithubIcon = styled(FaGithub)`
  font-size: 2em;
  display: block;
  margin: auto;
`;

const Footer = ({ siteMetadata }) => {
  const { author, sourceCodeLink } = siteMetadata;
  return (
    <footer>
      <A href={author.defaultLink} target="_blank">
        <FooterSection>
          <ProfilePicture email={author.email} alt={author.name} width={60} height={60} />
          Built with <HeartIcon />
          {` by ${author.name} who lives in ${author.homeCity}`}.
        </FooterSection>
      </A>
      <A href={sourceCodeLink} target="_blank">
        <FooterSection>
          <p>
            <GithubIcon />
            Do you want to see the source code? <br />
            It's <mark>FREE</mark>!  <br />
            It's <mark>OPEN SOURCE</mark>! <br />
            Click <mark>HERE</mark> to check it out!!!
          </p>
        </FooterSection>
      </A>
    </footer>
  );
};

Footer.propTypes = {
  siteMetadata: PropTypes.object
};

export default Footer;
