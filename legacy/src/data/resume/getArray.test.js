import { getArray } from './getArray';
import * as assert from 'ptz-assert';

describe('getArray', () => {
  it('convert obj to array', () => {
    const obj = {
      'a': { b: 'c' },
      'd': { e: 'f' }
    };

    const actualList = getArray(obj);

    const expectedList = [
      {
        key: 'a',
        name: 'a',
        b: 'c'
      },
      {
        key: 'd',
        name: 'd',
        e: 'f'
      },
    ];

    assert.deepEqual(actualList, expectedList);
  });
});
