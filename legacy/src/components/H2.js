import styled from 'styled-components';

const H2 = styled.h2`
  font-size: ${props => props.theme.h2.fontSize};
  margin: ${props => props.theme.h2.margin};
  padding: ${props => props.theme.h2.padding};
  text-align: ${props => props.theme.h2.textAlign};
`;

export default H2;
