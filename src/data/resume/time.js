exports.range = (from, to) => {
  var list = [];
  for (var i = from; i <= to; i += 1) {
    list = [i].concat(list);
  }
  return list;
};

exports.thisYear = (new Date()).getFullYear();
