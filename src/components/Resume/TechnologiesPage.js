import React from 'react';
import PropTypes from 'proptypes';
import Header from './Header';
import Technologies from './Technologies';
import { InvisibleSpan } from '../Invisible';
import CheckboxList, {
  getCbListFromArray,
  i18nPropTypes
} from '../CheckboxList';
import {
  intersection,
  isEmpty,
  contains,
  uniq
} from 'ramda';
import styled from 'styled-components';

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

class Resume extends React.Component {
  constructor(props) {
    super(props);

    this.technologies = props.data.site.siteMetadata.resume.technologies;

    this.years = getUniqList(this.technologies, 'years');
    this.tags = getUniqList(this.technologies, 'tags');

    this.state = {
      selectedYears: this.years,
      selectedTags: this.tags
    };
  }

  selectYear = (year) => {
    this.setState({
      selectedYears: select(year, this.state.selectedYears)
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
    const { i18n } = this.props;
    const years = getCbListFromArray(this.years, this.state.selectedYears);
    const tags = getCbListFromArray(this.tags, this.state.selectedTags);
    const technologies = filterTechnologies(this.technologies, this.state.selectedYears, this.state.selectedTags);

    return (
      <section>
        <Header i18n={i18n.header} />
        <Filters>
          <legend>
            <InvisibleSpan>{i18n.filters.title}</InvisibleSpan>
          </legend>
          <CheckboxList
            items={tags}
            check={this.selectTag}
            checkAll={this.selectAllTags}
            i18n={i18n.filters.tags}
          />
          <CheckboxList
            items={years}
            check={this.selectYear}
            checkAll={this.selectAllYears}
            i18n={i18n.filters.years}
          />
        </Filters>
        <Technologies
          technologies={technologies}
          i18n={i18n.technologies}
        />
      </section>
    );
  }
}

Resume.propTypes = {
  data: PropTypes.object.isRequired,
  i18n: PropTypes.shape({
    filters: PropTypes.shape({
      title: PropTypes.string.isRequired,
      years: i18nPropTypes,
      tags: i18nPropTypes,
    }),
    technologies: PropTypes.object.isRequired,
    header: PropTypes.object.isRequired
  })
};

export default Resume;
