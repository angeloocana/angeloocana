const scale = (n) => Math.pow(1.414, n);

const colors = {
  white: '#D3D0CB',
  black: '#1E2019', // #393E41
  yellow: '#E2C044',
  red: '#FF0000',
  blue: '#587B7F',
  gray: '#393E41',

  blackShades: [
    '#32342D'
  ]
};

const fontFamily = '"Cambo", serif';

const theme = {
  colors,
  fontFamily,
  color: colors.white,
  bg: colors.black,
  padding: `0 ${scale(1)}rem ${scale(2)}rem ${scale(0)}rem`,
  margin: '0 auto',
  maxWidth: '60rem',
  p: {
    firstLetter: {
      fontSize: `${(scale(2) * 2) + scale(-3)}rem`,
      color: colors.yellow,
      lineHeight: 0.8,
      paddingTop: '0.3rem'
    }
  },
  a: {
    fontFamily,
    color: colors.white,
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
      backgroundColor: colors.blackShades[0]
    }
  }
};

export default theme;
