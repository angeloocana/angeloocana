import React from 'react';
import PropTypes from 'proptypes';
import Gravatar from 'react-gravatar';
import HeartIcon from './HeartIcon';
import FaGithub from 'react-icons/lib/fa/github';
import A from './A';
import styled from 'styled-components';
import Ca from './flags/Ca';

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
  font-size: ${({theme}) => theme.scale(4)};
  display: block;
  margin: auto;
`;

const HomeCountryIcon = styled(Ca)`
  top: -0.1rem;
  position: relative;
  font-size: ${({theme}) => theme.scale(2)};
  margin-left: ${({theme}) => theme.scale(-6)};
`;

const getGitHubMsg = () => {
  return {
    en: (
      <p>
        <GithubIcon />
        Do you want to see the source code of this site? <br />
        It's <span>FREE</span>!  <br />
        It's <span>OPEN SOURCE</span>! <br />
        Click <span>HERE</span> to check it out!!!
      </p>
    ),
    pt: (
      <p>
        <GithubIcon />
        Você quer ver o codigo fonte deste site? <br />
        É <span>GRATUÍTO</span>!  <br />
        É <span>OPEN SOURCE</span>! <br />
        Click <span>AQUI</span> e confira!!!
      </p>
    ),
    fr: (
      <p>
        <GithubIcon />
        Voulez-vous voir le code source de ce site? <br />
        c'est <span>GRATUIT</span>!  <br />
        C'est une <span>SOURCE OUVERTE</span>! <br />
        Cliquez <span>ICI</span> pour vérifier!!!
      </p>
    )
  };
};

const getCreatedBy = (author) => {
  const profilePicture = (<ProfilePicture email={author.email} alt={author.name} width={60} height={60} />);
  return {
    en: (
      <FooterSection>
        {profilePicture}
        {'Built with '} <HeartIcon />
        {' by '} <span>{author.name}</span>
        {' who lives in '} <span>{author.homeCity}</span>
        <HomeCountryIcon />
      </FooterSection>
    ),
    pt: (
      <FooterSection>
        {profilePicture}
        {'Criado com '} <HeartIcon />
        {' por '} <span>{author.name}</span>
        {' que mora em '} <span>{author.homeCity}</span>
        <HomeCountryIcon />
      </FooterSection>
    ),
    fr: (
      <FooterSection>
        {profilePicture}
        {'Créé avec '} <HeartIcon />
        {' par '} <span>{author.name}</span>
        {' qui vit à '} <span>{author.homeCity}</span>
        <HomeCountryIcon />
      </FooterSection>
    )
  };
};

const Footer = ({ siteMetadata, currentLangKey }) => {
  const { author, sourceCodeLink } = siteMetadata;

  return (
    <footer>
      <A href={author.defaultLink} target="_blank">
        {getCreatedBy(author)[currentLangKey]}
      </A>
      <A href={sourceCodeLink} target="_blank">
        <FooterSection>
          {getGitHubMsg()[currentLangKey]}
        </FooterSection>
      </A>
    </footer>
  );
};

Footer.propTypes = {
  siteMetadata: PropTypes.object,
  currentLangKey: PropTypes.string
};

export default Footer;
