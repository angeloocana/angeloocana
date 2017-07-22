import styled from 'styled-components';

const A = styled.a`
    font-family: ${props => props.theme.a.fontFamily};
    color: ${props => props.theme.a.color};
    text-decoration: ${props => props.theme.a.textDecoration};

    &:hover {
        color: ${props => props.theme.a.hover.color};
        transition: 0.5s color;
    }
`;

export default A;
