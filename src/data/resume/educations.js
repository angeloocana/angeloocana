const {range, thisYear} = require('./time');

const educations = {
  'Pluralsight': {
    years: range(2012, thisYear),
    link: 'https://app.pluralsight.com/profile/ocanaangelo',
    img: 'pluralsight.png',
    needWhiteBg: true,
    subject: {
      pt: 'Tecnologia e Design',
      en: 'Technology and Design',
      fr: 'Technologie et Design'
    }
  },
  'FIAP': {
    subject: {
      pt: 'Análise e Desenvolvimento de Sistemas',
      en: 'Analysis and systems development',
      fr: 'Analyse et développement de systèmes'
    },
    fullName: 'Faculdade de Informática e Administração Paulista',
    years: range(2010, 2011),
    img: 'fiap.svg',
    link: 'https://www.fiap.com.br'
  },
  'UNIP': {
    subject: {
      pt: 'Análise e Desenvolvimento de Sistemas',
      en: 'Analysis and systems development',
      fr: 'Analyse et développement de systèmes'
    },
    fullName: 'Universidade Paulista',
    years: range(2013, 2014),
    img: 'unip.png',
    link: 'https://www.unip.br/'
  },
  'FIEB': {
    subject: {
      pt: 'Web Design com Ênfase em Mídias Digitais',
      en: 'Web Design with Emphasis on Digital Media',
      fr: 'Conception Web avec accent sur les médias numériques'
    },
    fullName: 'Instituto Técnico de Barueri',
    years: range(2007, 2009),
    img: 'fieb.png',
    link: 'http://www.fieb.edu.br'
  },
  'Inglês 200h': {
    years: range(2008, 2009),
    img: 'ingles200h.png',
    needWhiteBg: true,
    subject: {
      pt: 'Inglês',
      en: 'English',
      fr: 'Anglais'
    },
    link: 'https://www.ingles200h.com/'
  }
};

module.exports = {
  educations
};
