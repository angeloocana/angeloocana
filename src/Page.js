import React from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import TranslatorSection from './components/TranslatorSection';
import Introduction from './components/Introduction';
import graphFactory from './components/graphFactory';
import categories from './categories';

class Page extends React.Component {
  render () {
    const { entities, url, projects, intl } = this.props;
    const locale = intl.locale;
    const factory = graphFactory({ projects, entities, locale });
    const Graph = (props) => factory.createGraph(props);
    return (
      <div>
        <Header language={intl.locale} />
        <Introduction
          entities={entities}
          url={url}
          intl={intl}
        />
        {categories.map((item, i) => (
          <Graph
            key={item.tag}
            tag={item.tag}
            number={i + 1}
            title={item.title}
            excluded={item.excluded}
            count={item.count}
          />
        ))}
        <TranslatorSection language={intl.locale} />
        <Footer language={intl.locale} />
      </div>
    );
  }
}

export default Page;
