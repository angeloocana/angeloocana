import React from 'react';
import PropTypes from 'proptypes';
import styled from 'styled-components';
import BtnAllYears from './BtnAllYears';
import Year from './Year';
import {contains} from 'ramda';
import {InvisibleSpan} from '../Invisible';

const Ul = styled.ul`
    display: flex;
    flex-flow: row wrap;
    justify-content: center;
    margin: 0;
    padding: 0;
`;

const Years = ({ i18n, years, selectYear, selectAllYears, selectedYears, allYearsSelected }) => {
  return (
    <section>
      <header>
        <InvisibleSpan>{i18n.title}</InvisibleSpan>
      </header>
      <BtnAllYears
        selectAllYears={selectAllYears} 
        i18n={i18n.btnAllYears}
        selected={allYearsSelected}
      />
      <Ul>
        {years.map(year => (
          <Year
            year={year}
            selectYear={selectYear}
            selected={contains(year, selectedYears)}
          />
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
