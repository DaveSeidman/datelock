export const MONTHS = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
];

export const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const BOARD_ROWS = [
  ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', null],
  ['JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', null],
  ['1', '2', '3', '4', '5', '6', '7'],
  ['8', '9', '10', '11', '12', '13', '14'],
  ['15', '16', '17', '18', '19', '20', '21'],
  ['22', '23', '24', '25', '26', '27', '28'],
  ['29', '30', '31', 'SUN', 'MON', 'TUE', 'WED'],
  [null, null, null, null, 'THU', 'FRI', 'SAT'],
];

const shapeToCells = (shape) =>
  shape.flatMap((row, rowIndex) =>
    row.flatMap((value, colIndex) => (value ? [[colIndex, rowIndex]] : [])),
  );

export const PIECES = [
  {
    id: 'piece-a',
    name: 'Piece 1',
    pivot: [1, 0],
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
  },
  {
    id: 'piece-b',
    name: 'Piece 2',
    pivot: [1, 0],
    shape: [
      [1, 1, 1, 1],
      [1, 0, 0, 0],
    ],
  },
  {
    id: 'piece-c',
    name: 'Piece 3',
    pivot: [1, 0],
    shape: [[1, 1, 1, 1]],
  },
  {
    id: 'piece-d',
    name: 'Piece 4',
    pivot: [0, 1],
    shape: [
      [1, 1],
      [1, 1],
      [1, 0],
    ],
  },
  {
    id: 'piece-e',
    name: 'Piece 5',
    pivot: [1, 1],
    shape: [
      [1, 1, 0],
      [0, 1, 0],
      [0, 1, 1],
    ],
  },
  {
    id: 'piece-f',
    name: 'Piece 6',
    pivot: [0, 1],
    shape: [
      [1, 0, 0],
      [1, 0, 0],
      [1, 1, 1],
    ],
  },
  {
    id: 'piece-g',
    name: 'Piece 7',
    pivot: [1, 1],
    shape: [
      [1, 0, 1],
      [1, 1, 1],
    ],
  },
  {
    id: 'piece-h',
    name: 'Piece 8',
    pivot: [1, 1],
    shape: [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 1],
    ],
  },
  {
    id: 'piece-i',
    name: 'Piece 9',
    pivot: [1, 1],
    shape: [
      [1, 1],
      [0, 1],
      [0, 1],
    ],
  },
  {
    id: 'piece-j',
    name: 'Piece 10',
    pivot: [1, 1],
    shape: [
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 1],
    ],
  },
].map((piece) => ({
  ...piece,
  cells: shapeToCells(piece.shape),
}));

export const TRAY_SLOTS = [
  { col: 0, row: 0 },
  { col: 0, row: 1 },
  { col: 0, row: 2 },
  { col: 2, row: 0 },
  { col: 2, row: 1 },
  { col: 3, row: 0 },
  { col: 3, row: 1 },
  { col: 2, row: 2 },
  { col: 3, row: 2 },
  { col: 1, row: 1 },
];
