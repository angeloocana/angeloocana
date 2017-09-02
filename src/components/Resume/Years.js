import React from 'react';
import PropTypes from 'proptypes';
import styled from 'styled-components';
import Checkbox from '../Checkbox';
import { contains } from 'ramda';
import { InvisibleSpan } from '../Invisible';

const Ul = styled.ul`
    display: flex;
    flex-flow: row wrap;
    justify-content: center;
    margin: 0;
    padding: 0;
`;

const Div = styled.div`
  display: block;
  margin: auto;
  text-align: center;
`;

const Years = ({ i18n, years, selectYear, selectAllYears, selectedYears, allYearsSelected }) => {
  return (
    <section>
      <header>
        <InvisibleSpan>{i18n.title}</InvisibleSpan>
      </header>
      <Div>
        <Checkbox
          label={i18n.selectAllYears}
          check={selectAllYears}
          checked={allYearsSelected}
        />
      </Div>
      <Ul>
        {years.map(year => (
          <li>
            <Checkbox
              value={year}
              label={year}
              check={selectYear}
              checked={contains(year, selectedYears)}
            />
          </li>
        ))}
      </Ul>
    </section>
  );
};

Years.propTypes = {
  years: PropTypes.array.isRequired,
  selectYear: PropTypes.func.isRequired,
  selectedYears: PropTypes.array.isRequired,
  selectAllYears: PropTypes.func.isRequired,
  allYearsSelected: PropTypes.bool.isRequired,
  i18n: PropTypes.shape({
    title: PropTypes.string.isRequired,
    btnAllYears: PropTypes.object.isRequired
  })
};

export default Years;
