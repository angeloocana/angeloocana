import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import BigFirstLetter from './BigFirstLetter';

const Wrapper = styled(BigFirstLetter)`
  margin-top: ${props => props.theme.welcome.marginTop};
  margin-bottom: ${props => props.theme.welcome.marginBottom};
`;

const getWelcomeMsg = () => {
  return {
    en: (
      <p>
        Hi! Welcome to my site, where you can learn about Web, App and software development.<br />
        I welcome you to accept my challenge: <mark> Study every day </mark>, at least 10 minutes.
        Do NOT stop learning about tecnology, life, arts, languages, anything that you like.<br /><br />
        Face your fears! Learning keeps us young, it makes us see the universe in a new perspective and fall in love.<br />
        Are you ready to learn and change your life?
      </p>
    ),
    pt: (
      <p>
        Oi! Bem-vindo ao meu site, aqui você pode aprender sobre desenvolvimento de aplicações Web, Sites e Apps.<br />
        Convido você a aceitar o meu desafio: <mark> Estude todos os dias </mark>, pelo menos 10 minutos.
        NÃO pare de estudar sobre tecnologia, vida, artes, idiomas, qualquer coisa que você goste.<br /><br />
        Enfrente seus medos! Aprender nos mantém jovens, faz-nos ver o universo em uma nova perspectiva e se apaixonar.<br />
        Você está pronto para aprender e mudar sua vida?
      </p>
    ),
    fr: (
      <p>
        Salut! Bienvenue sur mon site, ici vous pouvez en apprendre davantage sur le développement d'applications Web.<br />
        Je vous invite à accepter mon défi: <mark> Étudie chaque jour </mark> au moins 10 minutes.
        Ne cessez pas d'étudier la technologie, la vie, les arts, les langues, tout ce que vous aimez.<br /><br />
        Faites face à vos peurs! L'apprentissage nous garde jeune, nous fait voir l'univers d' une nouvelle perspective et nous fait tomber amoureux.<br />
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
