import React from 'react';
import PropTypes from 'proptypes';
import H1 from '../H1';
import Technologies from './Technologies';
import Years from './Years';
import {
  intersection,
  isEmpty,
  contains,
  uniq
} from 'ramda';

const getYears = (technologies) => {
  return uniq(technologies.reduce((years, tech) => {
    return years.concat(tech.years);
  }, []));
};

const filterTechnologies = (technologies, selectedYears) => {
  return technologies.filter(t => !isEmpty(intersection(t.years, selectedYears)));
};

class Resume extends React.Component {
  constructor(props) {
    super(props);

    this.technologies = props.data.site.siteMetadata.resume.technologies;
    this.years = getYears(this.technologies);

    this.state = {
      selectedYears: this.years
    };
  }

  selectYear = (year) => {
    const containsYear = contains(year, this.state.selectedYears);

    const selectedYears = containsYear
      ? this.state.selectedYears.filter(y => y !== year)
      : [...this.state.selectedYears, year];

    this.setState({
      selectedYears
    });
  }

  selectAllYears = () => {
    const selectedYears = this.years === this.state.selectedYears
      ? []
      : this.years;

    this.setState({
      selectedYears
    });
  }

  render() {
    const { i18n } = this.props;

    const technologies = filterTechnologies(this.technologies, this.state.selectedYears);

    return (
      <section>
        <header>
          <H1>
            {i18n.title}
          </H1>
        </header>
        <Years
          years={this.years}
          selectedYears={this.state.selectedYears}
          selectYear={this.selectYear}
          i18n={i18n.years}
          selectAllYears={this.selectAllYears}
        />
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
    title: PropTypes.string.isRequired,
    years: PropTypes.object.isRequired,
    technologies: PropTypes.object.isRequired
  })
};

export default Resume;
