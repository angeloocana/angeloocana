import styled from 'styled-components';

const Error = styled.p`
    background-color: ${({theme}) => theme.colors.red};
    display: block;
    font-weight: bold;
    text-align: center;
    padding: 1rem;
    border-radius: 0.2rem;
`;

export default Error;
