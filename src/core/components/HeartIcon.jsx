import styled, { keyframes } from 'styled-components';
import FaHeart from 'react-icons/lib/fa/heart';

const beat = keyframes`
  to { transform: scale(1.2); }
`;

const HeartIcon = styled(FaHeart)`
  animation: ${beat} 0.42s infinite alternate;
  color: ${props => props.theme.colors.red}
`;

export default HeartIcon;
