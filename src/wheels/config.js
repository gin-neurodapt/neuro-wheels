// The wheels. Everything the page shows comes from this list: add a wheel by
// adding an entry, rename an area by editing its `name`, and change what
// people read when they tap an area by editing its `about`.
// `icon` is a Phosphor icon name (https://phosphoricons.com) — after adding a
// NEW icon name, run `npm run icons` so its drawing is copied into
// icons.generated.js.
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
      {
        name: 'Family',
        icon: 'house-line',
        about: 'The people you call family, and how things are between you: time together, closeness, and support that goes both ways.',
      },
      {
        name: 'Relationship',
        icon: 'heart',
        about: 'Your partner, or your love life if you are single: closeness, communication, and how fulfilled you feel.',
      },
      {
        name: 'Purpose',
        icon: 'compass',
        about: 'A sense of meaning and direction: knowing what matters to you, and living by it.',
      },
      {
        name: 'Personal Growth',
        icon: 'plant',
        about: 'Learning, reflecting and growing: becoming more of the person you want to be.',
      },
      {
        name: 'Career',
        icon: 'briefcase',
        about: 'Your work, paid or unpaid: how satisfying it is, and whether it is heading where you want it to.',
      },
      {
        name: 'Finance',
        icon: 'piggy-bank',
        about: 'How settled you feel about money: what comes in and goes out, savings, debt, and plans for the future.',
      },
      {
        name: 'Social Life & Fun',
        icon: 'confetti',
        about: 'Friends, community, play and rest: the time you spend simply enjoying life.',
      },
      {
        name: 'Health & Fitness',
        icon: 'heartbeat',
        about: 'Your body and mind: sleep, food, movement, energy, and how well you feel day to day.',
      },
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
      {
        name: 'Trust',
        icon: 'handshake',
        about: 'Feeling safe with each other: you can rely on what your partner says and does, and they can rely on you.',
      },
      {
        name: 'Vulnerability',
        icon: 'shield-slash',
        about: 'Being able to show your real feelings, needs and fears, and being met with care when you do.',
      },
      {
        name: 'Shared Responsibilities',
        icon: 'scales',
        about: 'How fairly the load is shared: the home, money, children, planning, and the mental load.',
      },
      {
        name: 'Respect & Kindness',
        icon: 'hand-heart',
        about: 'How you treat each other day to day, especially when you disagree.',
      },
      {
        name: 'Love',
        icon: 'heart',
        about: 'Feeling loved, and showing love, in the ways that matter to each of you.',
      },
      {
        name: 'Fun',
        icon: 'smiley',
        about: 'Laughing, playing and enjoying time together, beyond the daily routine.',
      },
      {
        name: 'Physical Intimacy',
        icon: 'users',
        about: 'Affection and closeness outside of sex: touch, hugs, holding hands.',
      },
      {
        name: 'Sex',
        icon: 'intersect',
        about: 'How satisfied you both are with your sex life, and how openly you can talk about it.',
      },
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
      {
        name: 'Profit Margin',
        icon: 'chart-line-up',
        about: 'What the business keeps after its costs: whether its prices and spending leave a healthy profit.',
      },
      {
        name: 'Sales',
        icon: 'tag',
        about: 'Turning interest into paying clients, steadily and predictably.',
      },
      {
        name: 'Marketing',
        icon: 'megaphone',
        about: 'How well the right people find you, understand what you offer, and want it.',
      },
      {
        name: 'Client Satisfaction',
        icon: 'thumbs-up',
        about: 'How happy clients are with what they get and how they are treated, and whether they come back and refer others.',
      },
      {
        name: 'Employee Satisfaction',
        icon: 'users-three',
        about: 'How the people who work in the business feel about it (you included, if you work alone): valued, supported and motivated.',
      },
      {
        name: 'Integrity',
        icon: 'shield-check',
        about: 'Doing what you say you will do, and running the business in line with your values.',
      },
      {
        name: 'Impact',
        icon: 'globe-hemisphere-east',
        about: 'The difference the business makes to clients, the community and the world, beyond the money.',
      },
      {
        name: 'Innovation',
        icon: 'lightbulb',
        about: 'Finding better ways to work and fresh things to offer, and keeping up as things change.',
      },
    ],
  },
];

// Icons the page itself uses (buttons), drawn from the same icon set.
export const UI_ICONS = ['minus', 'plus', 'download-simple', 'arrow-counter-clockwise', 'arrows-counter-clockwise', 'caret-down'];

export const DEFAULT_WHEEL_ID = WHEELS[0].id;

export function findWheel(id) {
  return WHEELS.find((w) => w.id === id) || null;
}
