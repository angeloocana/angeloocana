import React from 'react';
import PropTypes from 'prop-types';
import ResumeContainer from './ResumeContainer';
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
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import Helmet from 'react-helmet';

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
  z-index: 1;

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
    padding-right: 0;
    padding-left: 0;
    margin: 0;

    select {
      padding-top: ${({ theme }) => theme.scale(-6)};
      padding-bottom: ${({ theme }) => theme.scale(-4)};
      padding-left: ${({ theme }) => theme.scale(-6)};
      padding-right: ${({ theme }) => theme.scale(-4)};
  
      margin-top: 0;
      margin-bottom: 0;
      margin-left: ${({ theme }) => theme.scale(-6)};
      margin-right: 0;

      border-radius: 0.2rem;
    }
  }

  label:last-child {
    padding-left: ${({ theme }) => theme.scale(-1)};
  }
`;

class TechnologiesPage extends React.PureComponent {
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
    this.setState({
      selectedYear: year
    });
  }

  selectTag = (tag) => {
    this.setState({
      selectedTag: tag
    });
  }

  getTechnologies = () => pipe(
    filterTechBy('years', this.state.selectedYear),
    filterTechBy('tags', this.state.selectedTag)
  )(this.technologies);

  render() {
    const years = addAll(getItemsFromArray(this.years, this.state.selectedYear));
    const tags = addAll(getItemsFromArray(this.tags, this.state.selectedTag));
    const technologies = this.getTechnologies();
    const { menu } = this.props.data.site.siteMetadata.resume;

    return (
      <ResumeContainer
        menu={menu}
        selectedPage="/resume/"
      >
        <Filters>
          <FormattedMessage id="resume.technologies">
            {(txt) => (
              <legend>
                <Helmet
                  title={txt}
                  meta={[{ name: 'description', content: txt }]}
                />
                <InvisibleSpan>
                  {txt}
                </InvisibleSpan>
              </legend>
            )}
          </FormattedMessage>
          <Selects>
            <Select
              items={years}
              onChange={this.selectYear}
              selected={this.state.selectedYear}
              label="resume.filters.year"
            />
            <Select
              items={tags}
              onChange={this.selectTag}
              selected={this.state.selectedTag}
              label="resume.filters.tag"
            />
          </Selects>
        </Filters>
        <Technologies technologies={technologies} />
      </ResumeContainer>
    );
  }
}

TechnologiesPage.propTypes = {
  data: PropTypes.object.isRequired
};

export default TechnologiesPage;
