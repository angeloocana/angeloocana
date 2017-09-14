import React from 'react';
import PropTypes from 'proptypes';
import Header from './Header';
import Technologies from './Technologies';
import { InvisibleSpan } from '../Invisible';
import CheckboxList, { getCbListFromArray } from '../CheckboxList';
import RadioList from '../RadioList';
import {
  intersection,
  isEmpty,
  contains,
  uniq,
  head
} from 'ramda';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';

const getUniqList = (technologies, prop) => {
  return uniq(technologies.reduce((years, tech) => {
    return years.concat(tech[prop]);
  }, []));
};

const filterTechnologies = (technologies, years, tags) => {
  return technologies
    .filter(t => !isEmpty(intersection(t.years, years)))
    .filter(t => !isEmpty(intersection(t.tags, tags)));
};

const select = (item, selectedItems) => {
  return contains(item, selectedItems)
    ? selectedItems.filter(i => i !== item)
    : [...selectedItems, item];
};

const selectAll = (items, selectedItems) =>
  items === selectedItems
    ? []
    : items;

const Filters = styled.fieldset`
  display: flex;
  flex-flow: row wrap;
  justify-content: space-around;
`;

class TechnologiesPage extends React.Component {
  constructor(props) {
    super(props);

    this.technologies = props.data.site.siteMetadata.resume.technologies;

    this.years = getUniqList(this.technologies, 'years');
    this.tags = getUniqList(this.technologies, 'tags');
    
    this.state = {
      selectedYears: [head(this.years)],
      selectedTags: ['FrontEnd', 'BackEnd']
    };
  }

  selectYear = (year) => {
    this.setState({
      selectedYears: [year]
    });
  }

  selectTag = (tag) => {
    this.setState({
      selectedTags: select(tag, this.state.selectedTags)
    });
  }

  selectAllYears = () => {
    this.setState({
      selectedYears: selectAll(this.years, this.state.selectedYears)
    });
  }

  selectAllTags = () => {
    this.setState({
      selectedTags: selectAll(this.tags, this.state.selectedTags)
    });
  }

  render() {
    const years = getCbListFromArray(this.years, this.state.selectedYears);
    const tags = getCbListFromArray(this.tags, this.state.selectedTags);
    const technologies = filterTechnologies(this.technologies, this.state.selectedYears, this.state.selectedTags);
    const { menu } = this.props.data.site.siteMetadata.resume;

    return (
      <section>
        <Header
          menu={menu}
          selectedPage="/resume/"
        />
        <Filters>
          <legend>
            <InvisibleSpan>
              <FormattedMessage id="resume.technologies" />
            </InvisibleSpan>
          </legend>
          <RadioList
            items={years}
            check={this.selectYear}
            i18n={{
              title: 'resume.filters.years'
            }}
          />
          <CheckboxList
            items={tags}
            check={this.selectTag}
            checkAll={this.selectAllTags}
            i18n={{
              title: 'resume.filters.tags',
              checkAll: 'resume.filters.tags.checkAll'
            }}
          />          
        </Filters>
        <Technologies technologies={technologies} />
      </section>
    );
  }
}

TechnologiesPage.propTypes = {
  data: PropTypes.object.isRequired
};

export default TechnologiesPage;
