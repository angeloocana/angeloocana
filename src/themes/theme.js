const scale = (n) => Math.pow(1.414, n);

const white = '#D3D0CB';
const black = '#1E2019'; // #393E41
const yellow = '#E2C044';
// const red = 'red';
// const blue = '#587B7F';
// const gray = '#393E41';

const blackShades = [
  '#32342D'
];

const fontFamily = '"Cambo", serif';

const theme = {
  fontFamily,
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
  },
  a: {
    fontFamily,
    color: white,
    textDecoration: 'none'
  },
  header: {
    title: {
      fontSize: `${scale(4)}rem`,
      textAlign: 'center',
      paddingTop: `${scale(4)}rem`,
      paddingBottom: `${scale(1)}rem`
    },
    subTitle: {
      fontSize: `${scale(0)}rem`
    }
  },
  footer: {
    marginTop: `${scale(2)}rem`,
    marginBottom: `${scale(2)}rem`,
    hover: {
      backgroundColor: blackShades[0]
    }
  }
};

export default theme;
