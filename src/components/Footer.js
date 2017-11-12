import React from 'react';
import PropTypes from 'prop-types';
import Gravatar from 'react-gravatar';
import HeartIcon from './HeartIcon';
import FaGithub from 'react-icons/lib/fa/github';
import A from './A';
import styled from 'styled-components';
import Ca from './flags/Ca';

const Link = styled(A)`
  display: inline-block;

  padding-top: ${({theme}) => theme.scale(6)};
  padding-bottom: ${({theme}) => theme.scale(7)};
  padding-right: ${({theme}) => theme.scale(0)};
  padding-left: ${({theme}) => theme.scale(0)};
  margin: 0;

  line-height: 1.5;
  border-radius: ${props => props.theme.borderRadius};
  transition: 0.3s;
  
  &:hover {
    background-color: ${props => props.theme.colors.blackShades[0]};
    transition: 0.3s;
  }
`;

const FooterSection = styled.section`
  text-align: center;
  
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
  font-size: ${({ theme }) => theme.scale(4)};
  display: inline-block;
  margin: auto;
  margin: 0;
  padding: 0 ${({ theme }) => theme.scale(-6)} 0 0;
`;

const HomeCountryIcon = styled(Ca)`
  top: -0.1rem;
  position: relative;
  font-size: ${({ theme }) => theme.scale(2)};
  margin-left: ${({ theme }) => theme.scale(-6)};
`;

const getGitHubMsg = () => {
  return {
    en: (
      <p>
        <GithubIcon />
        <span>OPEN SOURCE</span>!
      </p>
    ),
    pt: (
      <p>
        <GithubIcon />
        <span>OPEN SOURCE</span>!
      </p>
    ),
    fr: (
      <p>
        <GithubIcon />
        <span>SOURCE OUVERTE</span>!
      </p>
    )
  };
};

const getCreatedBy = (author) => {
  const profilePicture = (<ProfilePicture email={author.email} alt={author.name} width={60} height={60} />);
  return {
    en: (
      <FooterSection>
        <Link href={author.defaultLink} target="_blank">
          {profilePicture}
          {'Built with '} <HeartIcon />
          {' by '} <span>{author.name}</span>
          {' who lives in '} <span>{author.homeCity}</span>
          <HomeCountryIcon />
        </Link>
      </FooterSection>
    ),
    pt: (
      <FooterSection>
        <Link href={author.defaultLink} target="_blank">
          {profilePicture}
          {'Criado com '} <HeartIcon />
          {' por '} <span>{author.name}</span>
          {' que mora em '} <span>{author.homeCity}</span>
          <HomeCountryIcon />
        </Link>
      </FooterSection>
    ),
    fr: (
      <FooterSection>
        <Link href={author.defaultLink} target="_blank">
          {profilePicture}
          {'Créé avec '} <HeartIcon />
          {' par '} <span>{author.name}</span>
          {' qui vit à '} <span>{author.homeCity}</span>
          <HomeCountryIcon />
        </Link>
      </FooterSection>
    )
  };
};

const Footer = ({ author, sourceCodeLink, currentLangKey }) => {
  return (
    <footer>
      {getCreatedBy(author)[currentLangKey]}
      <FooterSection>
        <Link href={sourceCodeLink} target="_blank">
          {getGitHubMsg()[currentLangKey]}
        </Link>
      </FooterSection>
    </footer>
  );
};

Footer.propTypes = {
  author: PropTypes.object.isRequired,
  sourceCodeLink: PropTypes.string.isRequired,
  currentLangKey: PropTypes.string
};

export default Footer;
