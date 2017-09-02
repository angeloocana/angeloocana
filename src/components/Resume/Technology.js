import React from 'react';
import PropTypes from 'proptypes';
import styled from 'styled-components';
import { head, last } from 'ramda';
import { FormattedMessage } from 'react-intl';

const Img = styled.img`
  max-width: ${({ theme }) => theme.scale(8)};
  max-height: ${({ theme }) => theme.scale(8)};
`;

const Name = styled.cite`
  font-size: ${({ theme }) => theme.scale(0)};
`;

const Li = styled.li`
  padding: 1rem ${({ theme }) => theme.scale(-6)};
  text-align: center;
  width: ${({ theme }) => theme.scale(9)};
`;

const ImgContainer = styled.div`
  width: ${({ theme }) => theme.scale(9)};
  height: ${({ theme }) => theme.scale(9)};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Level = styled.p`
  color: ${({ theme, level }) => {
    switch (level) {
    case 'expert': return theme.colors.green;
    case 'novice': return theme.colors.darkBlue;
    case 'proficient': return theme.colors.blue;
    default: return '';
    }
  }};
  font-weight: bold;
  padding: ${({ theme }) => theme.scale(-6)} 0;
`;

const getNYears = (years) => last(years) - head(years) + 1;

const Technology = ({ name, level, years, img, i18n }) => {
  return (
    <Li>
      <figure>
        <ImgContainer>
          <Img src={`/imgs/${img}`} />
        </ImgContainer>
        <figcaption>
          <Name>{name}</Name>
          <Level level={level}>{i18n.getLevelMsg(level)}</Level>
          <FormattedMessage
            id="resume.technologies.years"
            defaultMessage={i18n.yearsMsg}
            values={{ nYears: getNYears(years) }}
          />
        </figcaption>
      </figure>
    </Li>
  );
};

Technology.propTypes = {
  name: PropTypes.string,
  level: PropTypes.string,
  years: PropTypes.array,
  img: PropTypes.string,
  i18n: PropTypes.shape({
    yearsMsg: PropTypes.string.isRequired,
    getLevelMsg: PropTypes.func.isRequired
  })
};

export default Technology;
