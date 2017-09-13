import styled from 'styled-components';

const BigFirstLetter = styled.section`
  p{
    font-size: ${props => props.theme.p.fontSize};
    line-height: ${props => props.theme.p.lineHeight};
  }

  p:first-of-type::first-letter {
      font-size: ${props => props.theme.p.firstLetter.fontSize};
      color: ${props => props.theme.p.firstLetter.color};
      float: left;
      line-height: ${props => props.theme.p.firstLetter.lineHeight};
      padding: ${props => props.theme.p.firstLetter.padding};
      margin: ${props => props.theme.p.firstLetter.margin};
  }
`;

export default BigFirstLetter;
