import styled from 'styled-components';

const A = styled.a`
    font-family: ${props => props.theme.a.fontFamily};
    color: ${props => props.theme.a.color};
    text-decoration: ${props => props.theme.a.textDecoration};
    cursor: pointer;
    transition: 0.3s;

    &:hover {
        color: ${props => props.theme.a.hover.color};
        transition: 0.3s;
    }
`;

export default A;
