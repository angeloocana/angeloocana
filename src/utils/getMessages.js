import flatten from 'flat';

import allMessages from '../../i18n/messages';

export default function getMessages(locale) {
  const messages = allMessages[locale];

  if (Object.keys(messages).length === 0) return {};
  return flatten(messages);
}
