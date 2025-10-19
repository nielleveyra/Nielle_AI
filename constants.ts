
import { LookType } from './types';

export const STYLE_OPTIONS: { [key in LookType]: string[] } = {
  [LookType.HIJAB]: ['Street Style', 'Korean Minimalist', 'Elegant Casual', 'Bohemian Chic'],
  [LookType.NON_HIJAB]: ['Elegant Minimalist', 'Soft Preppy', 'Vintage Academia', 'Chic Business Casual'],
};

export const CLOTHING_OPTIONS: { [key in LookType]: string[] } = {
  [LookType.HIJAB]: [
    'Flowy pastel peach dress and a loose cream cardigan',
    'A soft mint green oversized blazer with matching wide-leg trousers',
    'A lilac knit sweater tucked into a long white pleated skirt',
    'A layered look with a cream tunic over a pastel blue long-sleeved shirt and jeans',
  ],
  [LookType.NON_HIJAB]: [
    'A long-sleeved satin-look slip dress in soft lilac',
    'A cream-colored cashmere turtleneck and a plaid mint green mini skirt',
    'A crisp white button-down shirt with high-waisted beige trousers',
    'A soft pink oversized sweater with light-wash straight-leg jeans',
  ],
};

export const HIJAB_STYLE_OPTIONS: string[] = [
  'Simple matte pastel beige, neatly wrapped',
  'A flowy, draped soft lilac chiffon hijab',
  'A turban style in a muted sage green silk',
  'A casual wrap using a cream-colored cotton scarf with subtle texture',
];

export const HAIR_STYLE_OPTIONS: string[] = [
  'High-volume Butterfly Cut with soft waves, glossy dark chocolate color',
  'Sleek, straight glass hair in a jet black color, cut into a sharp bob',
  'A messy high bun with face-framing curtain bangs, in a warm auburn color',
  'Long, soft beachy waves with sun-kissed honey blonde highlights',
];
