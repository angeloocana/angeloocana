import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { head, last } from 'ramda';

const Img = styled.img`
  max-width: 90%;
  max-height: ${({ theme }) => theme.scale(8)};
`;

const Name = styled.cite`
  font-size: ${({ theme }) => theme.scale(0)};
`;

const Li = styled.li`  
  width: ${({ theme }) => theme.scale(13)};
`;

const ImgContainer = styled.div`
  width: 90%;
  height: ${({ theme }) => theme.scale(8)};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem auto;

  ${(props) => props.needWhiteBg
    ? `background-color: ${props.theme.colors.white};`
    : ``};
`;

const Years = styled.span`
  display: block;
  font-weight: bold;
  padding: ${({ theme }) => theme.scale(-6)} 0 0 0;
`;

const A = styled.a`
  display: block;
  padding: 1rem ${({ theme }) => theme.scale(-6)};
  text-align: center;
  cursor: pointer;
  text-decoration: none;
  color: ${({theme}) => theme.colors.white};

  &:hover {
    background-color: ${({ theme }) => theme.colors.blackShades[0]};
  }
`;
const getYears = (years) => `${head(years)}/${last(years)}`;

const Education = (props) => {
  return (
    <Li>
      <A href={props.link} target="_blank">
        <figure>
          <ImgContainer needWhiteBg={props.needWhiteBg}>
            <Img src={`/imgs/${props.img}`} alt={props.name} title={props.fullName} />
          </ImgContainer>
          <figcaption>
            <Name>{props.subject[props.langKey]}</Name>
            <Years>{getYears(props.years)}</Years>
          </figcaption>
        </figure>
      </A>
    </Li>
  );
};

Education.propTypes = {
  name: PropTypes.string.isRequired,
  needWhiteBg: PropTypes.bool,
  years: PropTypes.array.isRequired,
  img: PropTypes.string.isRequired,
  fullName: PropTypes.string,
  subject: PropTypes.object.isRequired,
  langKey: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired
};

export default Education;
