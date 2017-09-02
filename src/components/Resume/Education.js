import React from 'react';
import PropTypes from 'proptypes';
import styled from 'styled-components';
import { head, last } from 'ramda';

const Img = styled.img`
  max-width: ${({ theme }) => theme.scale(12)};
  max-height: ${({ theme }) => theme.scale(8)};
`;

const Name = styled.cite`
  font-size: ${({ theme }) => theme.scale(0)};
`;

const Li = styled.li`
  padding: 1rem ${({ theme }) => theme.scale(-6)};
  text-align: center;
  width: ${({ theme }) => theme.scale(13)};
`;

const ImgContainer = styled.div`
  width: ${({ theme }) => theme.scale(13)};
  height: ${({ theme }) => theme.scale(8)};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 0 1rem 0;

  ${(props) => props.needWhiteBg
    ? `background-color: ${props.theme.colors.white};`
    : ``};
`;

const Years = styled.span`
  display: block;
`;

const getYears = (years) => `${head(years)}/${last(years)}`;

const Education = (props) => {
  return (
    <Li>
      <figure>
        <ImgContainer needWhiteBg={props.needWhiteBg}>
          <Img src={`/imgs/${props.img}`} alt={props.fullName} />
        </ImgContainer>
        <figcaption>
          <Name>{props.subject[props.langKey]}</Name>
          <Years>{getYears(props.years)}</Years>
        </figcaption>
      </figure>
    </Li>
  );
};

Education.propTypes = {
  needWhiteBg: PropTypes.bool,
  years: PropTypes.array,
  img: PropTypes.string,
  fullName: PropTypes.string,
  subject: PropTypes.string,
  langKey: PropTypes.string
};

export default Education;
