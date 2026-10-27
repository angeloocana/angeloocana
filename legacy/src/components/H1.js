import styled from 'styled-components';

const H1 = styled.h1`
  font-size: ${props => props.theme.h1.fontSize};
  margin: ${props => props.theme.h1.margin};
  padding: ${props => props.theme.h1.padding};
  text-align: ${props => props.theme.h1.textAlign};
`;

export default H1;
