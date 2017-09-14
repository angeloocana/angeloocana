import React from 'react';
import PropTypes from 'proptypes';
import Header from './Header';
import Technologies from './Technologies';
import { InvisibleSpan } from '../Invisible';
import Select, {
  addAll,
  getItemsFromArray
} from '../Select';
import {
  contains,
  uniq,
  head,
  pipe
} from 'ramda';
import { log } from 'ptz-fp';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';

const getUniqList = (technologies, prop) => {
  return uniq(technologies.reduce((years, tech) => {
    return years.concat(tech[prop]);
  }, []));
};

const filterTechBy = (prop, value) => (technologies) => {
  return value === ''
    ? technologies
    : technologies.filter(t => contains(value, t[prop]));
};

const Filters = styled.fieldset`
  display: flex;
  flex-flow: row wrap;
  justify-content: space-around;

  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: ${({ theme }) => theme.colors.blackShades[0]};  
`;

const Selects = styled.div`
  text-align: center;

  label {
    display: inline-block;

    padding-top: ${({ theme }) => theme.scale(-1)};
    padding-bottom: ${({ theme }) => theme.scale(0)};
    padding-left: ${({ theme }) => theme.scale(-1)};
    padding-right: ${({ theme }) => theme.scale(0)};

    margin: 0;

    select {
      padding: 0;
  
      margin-top: 0;
      margin-bottom: 0;
      margin-left: ${({ theme }) => theme.scale(-1)};
      margin-right: 0;
    }
  }
`;

class TechnologiesPage extends React.Component {
  constructor(props) {
    super(props);

    this.technologies = props.data.site.siteMetadata.resume.technologies;

    this.years = getUniqList(this.technologies, 'years');
    this.tags = getUniqList(this.technologies, 'tags');

    this.state = {
      selectedYear: head(this.years),
      selectedTag: ''
    };
  }

  selectYear = (year) => {
    console.log('page select year: ', year);
    this.setState({
      selectedYear: year
    });
  }

  selectTag = (tag) => {
    console.log('page select tag: ', tag);
    this.setState({
      selectedTag: tag
    });
  }

  getTechnologies = () => pipe(
    log,
    filterTechBy('years', this.state.selectedYear),
    log,
    filterTechBy('tags', this.state.selectedTag),
    log
  )(this.technologies);

  render() {
    const years = addAll(getItemsFromArray(this.years, this.state.selectedYear));
    const tags = addAll(getItemsFromArray(this.tags, this.state.selectedTag));
    const technologies = this.getTechnologies();
    const { menu } = this.props.data.site.siteMetadata.resume;

    return (
      <section>
        <Filters>
          <legend>
            <InvisibleSpan>
              <FormattedMessage id="resume.technologies" />
            </InvisibleSpan>
          </legend>
          <Selects>
            <Select
              items={years}
              onChange={this.selectYear}
              selected={this.state.selectedYear}
              label="resume.filters.years"
            />
            <Select
              items={tags}
              onChange={this.selectTag}
              selected={this.state.selectedTag}
              label="resume.filters.tags"
            />
          </Selects>
        </Filters>
        <Technologies technologies={technologies} />
        <Header
          menu={menu}
          selectedPage="/resume/"
        />
      </section>
    );
  }
}

TechnologiesPage.propTypes = {
  data: PropTypes.object.isRequired
};

export default TechnologiesPage;
