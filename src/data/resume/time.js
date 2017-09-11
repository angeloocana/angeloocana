const range = (from, to) => {
  var list = [];
  for (var i = from; i <= to; i += 1) {
    list.push(i);
  }
  return list;
};

const thisYear = (new Date()).getFullYear();

export {
  range,
  thisYear
};
