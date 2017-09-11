exports.range = (from, to) => {
  var list = [];
  for (var i = from; i <= to; i += 1) {
    list.push(i);
  }
  return list;
};

exports.thisYear = (new Date()).getFullYear();
