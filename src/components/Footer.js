import React from 'react';
import PropTypes from 'proptypes';
import Gravatar from 'react-gravatar';
import HeartIcon from './HeartIcon';
import FaGithub from 'react-icons/lib/fa/github';
import A from './A';
import styled from 'styled-components';

const FooterSection = styled.section`
  text-align: center;
  padding: ${props => props.theme.footer.padding};
  margin: ${props => props.theme.footer.margin};
  line-height: 1.5;
  border-radius: ${props => props.theme.borderRadius};

  &:hover {
    background-color: ${props => props.theme.footer.hover.backgroundColor};
  }

  span {
    font-weight: bold;
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
          {'Built with '} <HeartIcon />
          {' by '} <span>{author.name}</span>
          {' who lives in '} <span>{author.homeCity}</span>.
        </FooterSection>
      </A>
      <A href={sourceCodeLink} target="_blank">
        <FooterSection>
          <p>
            <GithubIcon />
            Do you want to see the source code? <br />
            It's <span>FREE</span>!  <br />
            It's <span>OPEN SOURCE</span>! <br />
            Click <span>HERE</span> to check it out!!!
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
