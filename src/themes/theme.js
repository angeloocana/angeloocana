/**
 * Round x with n decimal.
 * @param {Number} x Number to be rounded.
 * @param {Number} n Number of digits after semi column.
 * @returns {Number} Number rounded.
 */
const round = (x, n) => Math.round(x * (n * 10)) / (n * 10);


const scale = (n) => round(Math.pow(1.414, n), 3);

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
  borderRadius: '0.3rem',
  lineHeight: 1.5,
  focus: {
    border: '0.4rem red solid'
  },
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
    textDecoration: 'none',
    hover: {
      color: colors.yellow
    }
  },
  header: {
    title: {
      fontSize: `${scale(4)}rem`,
      textAlign: 'center',
      paddingTop: `${scale(4)}rem`,
      paddingBottom: `${scale(1)}rem`
    },
    subTitle: {
      fontSize: `${scale(0)}rem`,
      paddingTop: `${scale(-2)}rem`,
    }
  },
  menu: {
    padding: `${scale(1)}rem`,
    opened: {
      bg: colors.blackShades[0]
    },
    closed: {
      bg: 'transparent'
    },
    label: {
      width: `${scale(2)}rem`,
      height: `${scale(2)}rem`,
      fontSize: `${scale(2)}rem`
    },
    a: {
      fontSize: `${scale(1)}rem`,
      paddingBottom: `${scale(1)}rem`,
      textAlign: 'left',
      color: colors.white,
      active: {
        color: colors.yellow
      }
    },
    ul: {
      marginTop: `${scale(3)}rem`,
      marginLeft: `${scale(4)}rem`
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
