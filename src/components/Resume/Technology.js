import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { head, last } from 'ramda';
import { FormattedMessage } from 'react-intl';

const Img = styled.img`
  max-width: 90%;
  max-height: ${({ theme }) => theme.scale(8)};
`;

const Name = styled.cite`
  font-size: ${({ theme }) => theme.scale(0)};
`;

const Li = styled.li`  
  width: ${({ theme }) => theme.scale(11)};
`;

const ImgContainer = styled.div`
  width: 90%;
  height: ${({ theme }) => theme.scale(9)};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem auto;  

  ${(props) => props.needWhiteBg
    ? `background-color: #fff;
       color: ${props.theme.colors.black};`
    : ``};
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

const A = styled.a`
  display: block;
  padding: 1rem;
  text-align: center;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.colors.white};

  &:hover {
    background-color: ${({ theme }) => theme.colors.blackShades[0]};
  }
`;

const getNYears = (years) => head(years) - last(years) + 1;

const Technology = (props) => {
  const { name, link, needWhiteBg, level, years, img } = props;

  const nYears = getNYears(years);

  return (
    <Li>
      <A href={link} target="_blank">
        <figure>
          <ImgContainer needWhiteBg={needWhiteBg}>
            <Img src={`/imgs/${img}`} alt={name} title={name} />
          </ImgContainer>
          <figcaption>
            <Name>{name}</Name>
            <FormattedMessage
              id={'resume.technologies.level.' + level}
            >
              {(txt) => (
                <Level level={level}>
                  {txt}
                </Level>
              )}
            </FormattedMessage>
            <FormattedMessage
              id="resume.technologies.yearsMsg"
              values={{ nYears }}
            />
          </figcaption>
        </figure>
      </A>
    </Li>
  );
};

Technology.propTypes = {
  name: PropTypes.string.isRequired,
  level: PropTypes.string.isRequired,
  years: PropTypes.array.isRequired,
  img: PropTypes.string.isRequired,
  link: PropTypes.string,
  needWhiteBg: PropTypes.bool
};

export default Technology;
