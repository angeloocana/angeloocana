const levels = {
  native: 'Native',
  fluent: 'Fluent',
  proficient: 'Proficient',
  basic: 'Basic'
};

const languages = {
  'en': {
    level: levels.fluent,
    name: {
      'en': 'English',
      'pt': 'Inglês',
      'fr': 'Anglais'
    }
  },
  'pt': {
    level: levels.native,
    name: {
      'en': 'Portuguese',
      'pt': 'Português',
      'fr': 'Portugais'
    }
  },
  'fr': {
    level: levels.basic,
    name: {
      'en': 'French',
      'pt': 'Frances',
      'fr': 'Français'
    }
  },
  'es': {
    level: levels.proficient,
    name: {
      'en': 'Spanish',
      'pt': 'Espanhol',
      'fr': 'Espanol'
    }
  }
};

module.exports = {
  levels,
  languages
};
