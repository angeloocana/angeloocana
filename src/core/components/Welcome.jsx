import React from 'react';
import PropTypes from 'proptypes';
import styled from 'styled-components';

const Wrapper = styled.section`
  margin-top: ${props => props.theme.welcome.marginTop};
  margin-bottom: ${props => props.theme.welcome.marginBottom};

  p{
    font-size: ${props => props.theme.p.fontSize};
    line-height: ${props => props.theme.p.lineHeight};
  }

  p:first-of-type::first-letter {
      font-size: ${props => props.theme.p.firstLetter.fontSize};
      color: ${props => props.theme.p.firstLetter.color};
      float: left;
      line-height: ${props => props.theme.p.firstLetter.lineHeight};
      padding-top: ${props => props.theme.p.firstLetter.paddingTop};
  }
`;

const getWelcomeMsg = () => {
  return {
    en: (
      <p>
        Hi!!! Welcome to my site, where you can learn about Web, Apps and software development.
        I welcome you to accept my challenge: <mark>Study every day</mark>, at least 10 minutes. <br />
        Do NOT stop learning about tecnology, life, arts, languages, anything that you like.
        Face your fears! Learning keep us young, it makes us see the universe in a new perspective and fall in love.
        Are you ready to learn and change your life?
      </p>
    ),
    pt: (
      <p>
        Oi!!! Bem-vindo ao meu site, aqui você pode aprender sobre desenvolvimento de aplicações Web, Sites e Apps.
        Convido você a aceitar o meu desafio: <mark> Estude todos os dias </mark>, pelo menos 10 minutos. <br />
        NÃO pare de estudar sobre tecnologia, vida, artes, idiomas, qualquer coisa que você goste.
        Enfrente seus medos! Aprender nos mantém jovens, faz-nos ver o universo em nova perspectiva e se apaixonar.
        Você está pronto para aprender e mudar sua vida?
      </p>
    ),
    fr: (
      <p>
        Salut !!! Bienvenue sur mon site, ici vous pouvez en apprendre davantage sur le développement d'applications Web.
        Je vous invite à accepter mon défi: <mark> Étudie chaque jour </mark> au moins 10 minutes. <br />
        Ne cessez pas d'étudier la technologie, la vie, les arts, les langues, tout ce que vous aimez.
        Faites face à vos peurs! L'apprentissage nous garde jeune, nous fait voir l'univers d' une nouvelle perspective et nous fait tomber amoureux.
        Êtes-vous prêt à apprendre et à changer votre vie?
      </p>
    )
  };
};

const Welcome = ({ currentLangKey }) => {
  return (
    <Wrapper>
      {getWelcomeMsg()[currentLangKey]}
    </Wrapper>
  );
};

Welcome.propTypes = {
  currentLangKey: PropTypes.string
};

export default Welcome;
