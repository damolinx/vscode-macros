import * as assert from 'assert';
import { basename } from 'path';
import { parseOptions } from '../../macroOptions';

suite(`Suite: ${basename(__filename, '.test.js')}`, () => {
  test('should return default options when file is empty', () => {
    const code = '';
    const options = parseOptions(code);
    assert.deepStrictEqual(options, {});
  });

  test('should return default options when no macro options are present', () => {
    const code = 'const a = 1;';
    const options = parseOptions(code);
    assert.deepStrictEqual(options, {});
  });

  test('should set persistent to true when @macro:persistent is present', () => {
    const code = ' // @macro:persistent\nconst a = 1;';
    const options = parseOptions(code);
    assert.deepStrictEqual(options, { persistent: true });
  });

  test('should set singleton to true when @macro:singleton is present', () => {
    const code = '// @macro:singleton\nconst a = 1;';
    const options = parseOptions(code);
    assert.deepStrictEqual(options, { singleton: true });
  });

  test('should set both persistent and singleton to true when both options are present', () => {
    const code = '// @macro:persistent\n// @macro:singleton\nconst a = 1;';
    const options = parseOptions(code);
    assert.deepStrictEqual(options, { persistent: true, singleton: true });
  });

  test('should ignore unknown macro options', () => {
    const code = ' // @macro:invalid\nconst a = 1;';
    const options = parseOptions(code);
    assert.deepStrictEqual(options, {});
  });
});