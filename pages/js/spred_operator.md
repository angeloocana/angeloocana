# Javascript Spread Operator Examples

```javascript
    const a = [1, 2, 3];
    const b = [a, 4, 5, 6];
    const c = [...a, 4, 5, 6];

    console.log(b); // [ [ 1, 2, 3 ], 4, 5, 6 ]
    console.log(c); // [ 1, 2, 3, 4, 5, 6 ]

    function teste(...args) {
        console.log('', ...args); // 1 2 3 4 5 6
        console.log(args); // [ 1, 2, 3, 4, 5, 6 ]
    }

    teste(1, 2, 3, 4, 5, 6);
```
