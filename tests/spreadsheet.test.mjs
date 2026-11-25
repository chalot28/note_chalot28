import assert from 'node:assert/strict';
import test from 'node:test';
import {
  columnIndexToLabel,
  coordKey,
  coordToA1,
  formatCellValue,
} from '../src/features/spreadsheets/services/cell.formatter.ts';
import { SpreadsheetEngine } from '../src/features/spreadsheets/services/hyperformula.engine.ts';

test('columnIndexToLabel, coordToA1, and coordKey convert coordinates accurately', () => {
  assert.equal(columnIndexToLabel(0), 'A');
  assert.equal(columnIndexToLabel(25), 'Z');
  assert.equal(columnIndexToLabel(26), 'AA');
  assert.equal(columnIndexToLabel(27), 'AB');
  assert.equal(columnIndexToLabel(51), 'AZ');
  assert.equal(columnIndexToLabel(52), 'BA');
  assert.equal(columnIndexToLabel(701), 'ZZ');
  assert.equal(columnIndexToLabel(702), 'AAA');
  assert.equal(coordToA1(0, 0), 'A1');
  assert.equal(coordToA1(9, 26), 'AA10');
  assert.equal(coordKey(4, 3), '4:3');
});

test('formatCellValue formats all cell format variants safely', () => {
  assert.equal(formatCellValue(null, 'general'), '');
  assert.equal(formatCellValue(undefined, 'checkbox'), '☐');
  assert.equal(formatCellValue('#DIV/0!', 'vnd'), '#DIV/0!');
  assert.equal(formatCellValue(true, 'checkbox'), '☑');
  assert.equal(formatCellValue('yes', 'checkbox'), '☑');
  assert.equal(formatCellValue('false', 'checkbox'), '☐');
  assert.equal(formatCellValue(0.255, 'percent'), '25.5%');
  assert.equal(formatCellValue(0.5, 'percent'), '50%');
  assert.equal(formatCellValue(12.34567, 'general'), '12.3457');
  assert.match(formatCellValue(100000, 'vnd'), /₫$/);
  assert.equal(formatCellValue(1234.5, 'usd'), '$1,234.50');
});

test('SpreadsheetEngine evaluates formulas, recalculates on update, and handles errors', () => {
  const engine = new SpreadsheetEngine(
    [
      ['10', '20', '=SUM(A1:B1)'],
      ['=AVERAGE(A1:B1)', '=IF(C1>25,"OK","LOW")', '=A1/0'],
      ['TRUE', 'FALSE', '=UNKNOWNFUNC(1)'],
    ],
    3,
    3,
  );

  try {
    assert.equal(engine.getComputedValue(0, 2), 30);
    assert.equal(engine.getComputedValue(1, 0), 15);
    assert.equal(engine.getComputedValue(1, 1), 'OK');
    assert.equal(engine.getComputedValue(1, 2), '#DIV/0!');
    assert.equal(engine.getComputedValue(2, 0), true);
    assert.equal(engine.getComputedValue(2, 1), false);
    assert.equal(engine.getComputedValue(2, 2), '#NAME?');

    engine.setCell(0, 1, '5');
    assert.equal(engine.getComputedValue(0, 2), 15);
    assert.equal(engine.getComputedValue(1, 1), 'LOW');

    // Circular reference check
    engine.setCell(0, 0, '=A1');
    assert.equal(engine.getComputedValue(0, 0), '#CYCLE!');

    // Dynamic row/column expansion
    const newRows = engine.addRow();
    const newCols = engine.addColumn();
    assert.equal(newRows, 4);
    assert.equal(newCols, 4);
    engine.setCell(3, 3, '=100+23');
    assert.equal(engine.getComputedValue(3, 3), 123);

    const matrix = engine.getComputedMatrix();
    assert.equal(matrix.length, 4);
    assert.equal(matrix[0]?.length, 4);
  } finally {
    engine.destroy();
  }
});
