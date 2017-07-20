const scale = (n) => n * 1.6;

const white = '#D3D0CB';
const black = '#1E2019'; // #393E41
const yellow = '#E2C044';
// const red = 'red';
// const blue = '#587B7F';
// const gray = '#393E41';

const theme = {
  fontFamily: '"Cambo", serif',
  color: white,
  bg: black,
  padding: `0 ${scale(1)}rem ${scale(2)}rem ${scale(0)}rem`,
  margin: '0 auto',
  maxWidth: '60rem',
  p: {
    firstLetter: {
      fontSize: `${(scale(2) * 2) + scale(-3)}rem`,
      color: yellow,
      lineHeight: 0.8,
      paddingTop: '0.3rem'
    }
  }
};

export default theme;
