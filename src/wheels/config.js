// The wheels. Everything the page shows comes from this list: add a wheel by
// adding an entry, rename an area by editing its `name`. `icon` is a Phosphor
// icon name (https://phosphoricons.com) — after adding a NEW icon name, run
// `npm run icons` so its drawing is copied into icons.generated.js.
//
// Colours: `fill` paints a scored segment, `stroke` outlines the wheel, `ink`
// is used for text (it must stay readable on white, at least 4.5:1).

export const LEVELS = 5;

export const WHEELS = [
  {
    id: 'life',
    title: 'Wheel of Life',
    tab: 'Life',
    fill: '#B2E5DD',
    stroke: '#177082',
    ink: '#177082',
    slices: [
      { name: 'Family', icon: 'house-line' },
      { name: 'Relationship', icon: 'heart' },
      { name: 'Purpose', icon: 'compass' },
      { name: 'Personal Growth', icon: 'plant' },
      { name: 'Career', icon: 'briefcase' },
      { name: 'Finance', icon: 'piggy-bank' },
      { name: 'Social Life & Fun', icon: 'confetti' },
      { name: 'Health & Fitness', icon: 'heartbeat' },
    ],
  },
  {
    id: 'relationships',
    title: 'Wheel of Relationships',
    tab: 'Relationships',
    fill: '#FA9E9E',
    stroke: '#B95946',
    ink: '#A44E3D',
    slices: [
      { name: 'Trust', icon: 'handshake' },
      { name: 'Vulnerability', icon: 'shield-slash' },
      { name: 'Shared Responsibilities', icon: 'scales' },
      { name: 'Respect & Kindness', icon: 'hand-heart' },
      { name: 'Love', icon: 'heart' },
      { name: 'Fun', icon: 'smiley' },
      { name: 'Physical Intimacy', icon: 'users' },
      { name: 'Sex', icon: 'intersect' },
    ],
  },
  {
    id: 'business',
    title: 'Wheel of Business',
    tab: 'Business',
    fill: '#CEDCFF',
    stroke: '#7087C2',
    ink: '#4065BF',
    slices: [
      { name: 'Profit Margin', icon: 'chart-line-up' },
      { name: 'Sales', icon: 'tag' },
      { name: 'Marketing', icon: 'megaphone' },
      { name: 'Client Satisfaction', icon: 'thumbs-up' },
      { name: 'Employee Satisfaction', icon: 'users-three' },
      { name: 'Integrity', icon: 'shield-check' },
      { name: 'Impact', icon: 'globe-hemisphere-east' },
      { name: 'Innovation', icon: 'lightbulb' },
    ],
  },
];

// Icons the page itself uses (buttons), drawn from the same icon set.
export const UI_ICONS = ['minus', 'plus', 'download-simple', 'arrow-counter-clockwise'];

export const DEFAULT_WHEEL_ID = WHEELS[0].id;

export function findWheel(id) {
  return WHEELS.find((w) => w.id === id) || null;
}
