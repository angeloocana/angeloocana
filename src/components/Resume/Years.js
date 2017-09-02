import React from 'react';
import PropTypes from 'proptypes';
import styled from 'styled-components';
import BtnAllYears from './BtnAllYears';
import Year from './Year';
import {contains} from 'ramda';

const Ul = styled.ul`
    display: flex;
    flex-flow: row wrap;
    justify-content: center;
    margin: 1rem 0 0 0;
    padding: 0;
`;

const Years = ({ i18n, years, selectYear, selectAllYears, selectedYears }) => {
  return (
    <section>
      <header>
        {i18n.title}
      </header>
      <BtnAllYears
        selectAllYears={selectAllYears} 
        i18n={i18n.btnAllYears}
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
  i18n: PropTypes.shape({
    title: PropTypes.string.isRequired,
    btnAllYears: PropTypes.object.isRequired
  })
};

export default Years;
