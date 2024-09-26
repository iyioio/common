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
] as const;

export type AutoLayoutType=typeof allAutoLayoutTypes[number];
