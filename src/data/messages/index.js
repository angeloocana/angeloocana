import en from './en';
import pt from './pt';
import fr from './fr';

const getMessages = (langKey) => {
  switch (langKey) {
    case 'en': return en;
    case 'pt': return pt;
    case 'fr': return fr;
    default: return en;
  }
};

module.exports = {
  getMessages
};
