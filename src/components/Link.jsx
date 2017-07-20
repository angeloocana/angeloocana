import Link from 'gatsby-link';
import styled from 'styled-components';

const StyledLink = styled(Link)`
    font-family: ${props => props.theme.a.fontFamily};
    color: ${props => props.theme.a.color};
    text-decoration: ${props => props.theme.a.textDecoration};

    &:hover {
        color: $yellow;
        transition: 0.5s color;
    }
`;

export default StyledLink;
