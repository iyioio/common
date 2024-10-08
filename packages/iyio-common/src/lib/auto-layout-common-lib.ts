export const allAutoLayoutTypes=[
    'row',
    'col',
    'rowReverse',
    'colReverse',
    'sideBySide',
    'sideBySideScrollRight',
    'sideBySideScrollLeft',
    'topBottom',
    'triLeft',
    'triRight',
    'triTop',
    'triBottom',
    'quad',
    '2x3',
    '3x2',
    '3x3',
    'autoGrid',
] as const;

export type AutoLayoutType=typeof allAutoLayoutTypes[number];
