import React from 'react';
import PropTypes from 'proptypes';
import H1 from '../H1';
import Educations from './Educations';
import Technologies from './Technologies';
import {InvisibleSpan} from '../Invisible';
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

const filterEducations = (educations, years) => {
  return educations
    .filter(t => !isEmpty(intersection(t.years, years)));
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
    this.educations = props.data.site.siteMetadata.resume.educations;

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
    const { i18n, pathContext } = this.props;
    const years = getCbListFromArray(this.years, this.state.selectedYears);
    const tags = getCbListFromArray(this.tags, this.state.selectedTags);
    const technologies = filterTechnologies(this.technologies, this.state.selectedYears, this.state.selectedTags);
    const educations = filterEducations(this.educations, this.state.selectedYears);

    return (
      <section>
        <header>
          <H1>
            {i18n.title}
          </H1>
        </header>
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
        <Educations
          educations={educations}
          i18n={i18n.educations}
          langKey={pathContext.langKey}
        />
      </section>
    );
  }
}

Resume.propTypes = {
  data: PropTypes.object.isRequired,
  pathContext: PropTypes.object.isRequired,
  i18n: PropTypes.shape({
    title: PropTypes.string.isRequired,
    filters: PropTypes.shape({
      title: PropTypes.string.isRequired,
      years: i18nPropTypes,
      tags: i18nPropTypes,
    }),
    technologies: PropTypes.object.isRequired
  })
};

export default Resume;
