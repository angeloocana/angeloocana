import React from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import TranslatorSection from './components/TranslatorSection';

class Page extends React.Component {
  render() {
    const { locale } = this.props.intl;
    const routes = this.props.routes;

    return (
      <div>
        <Header routes={routes} language={locale} />

        <TranslatorSection language={locale} />
        <Footer language={locale} />
      </div>
    );
  }
}

export default Page;
