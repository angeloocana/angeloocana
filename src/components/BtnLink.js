import Link from 'gatsby-link';
import styled from 'styled-components';

const BtnLink = styled(Link)`
    background-color: ${({theme}) => theme.colors.white};
    padding: 1rem;
    margin: ${({theme}) => theme.scale(2)} auto;
    color: ${({theme}) => theme.colors.black};
    border-radius: 0.2rem;
    text-decoration: none;
    display: table;
    transition: 0.3s;

    &:hover {
        background-color: ${props => props.theme.colors.blackShades[0]};
        color: ${({theme}) => theme.colors.yellow};
        transition: 0.3s;
    }
`;

export default BtnLink;
