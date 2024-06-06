export const QuadrantLevels = {
  1: [1],
  2: [1, 2],
  3: [1, 2, 3],
  4: [1, 2, 3, 4],
  5: [1, 2, 3, 4, 5],
};

export const UpperQuadrantLevels = {
  1: [2, 3, 4, 5],
  2: [3, 4, 5],
  3: [4, 5],
  4: [5],
};

export const WheelStructure = {
  Slices: [1, 2, 3, 4, 5, 6, 7, 8],
  Levels: [1, 2, 3, 4, 5],
};

export const Percentages = {
  0: 0,
  1: 20,
  2: 40,
  3: 60,
  4: 80,
  5: 100,
};

export const QuadrantPaths = {
  8: {
    5: "M147.787 147C241.555 53.2319 368.732 0.553461 501.34 0.553467V100.553C395.254 100.553 293.512 142.696 218.498 217.711L147.787 147Z",
    4: "M218.496 218.119C293.511 143.105 395.252 100.962 501.339 100.962V200.963C421.774 200.963 345.468 232.57 289.208 288.831L218.496 218.119Z",
    3: "M289.207 289.24C345.468 232.979 421.774 201.372 501.339 201.372V301.372C448.296 301.372 397.425 322.443 359.918 359.951L289.207 289.24Z",
    2: "M359.916 360.356C397.423 322.849 448.294 301.778 501.337 301.778V401.784C474.817 401.784 449.384 412.319 430.631 431.072L359.916 360.356Z",
    1: "M430.629 431.48C449.383 412.726 474.818 402.19 501.34 402.19V502.19L430.629 431.48Z",
  },
  7: {
    5: "M0.000919743 501.554C0.000923959 368.946 52.6793 241.769 146.448 148.001L217.158 218.711C142.144 293.726 100.001 395.468 100.001 501.554L0.000919743 501.554Z",
    4: "M100.289 501.843C100.289 395.757 142.432 294.015 217.447 219.001L288.158 289.712C231.898 345.973 200.291 422.279 200.291 501.843L100.289 501.843Z",
    3: "M200.579 502.133C200.579 422.568 232.186 346.262 288.447 290.001L359.158 360.712C321.651 398.219 300.58 449.09 300.58 502.133L200.579 502.133Z",
    2: "M300.864 502.422C300.864 449.379 321.936 398.508 359.443 361.001L430.158 431.716C411.406 450.468 400.871 475.902 400.871 502.422L300.864 502.422Z",
    1: "M401.158 502.711C401.158 476.19 411.694 450.754 430.448 432.001L501.158 502.711L401.158 502.711Z",
  },
  6: {
    5: "M0.000919743 504.157C0.000923959 636.766 52.6793 763.943 146.448 857.711L217.158 787C142.144 711.985 100.001 610.244 100.001 504.157L0.000919743 504.157Z",
    4: "M100.289 503.868C100.289 609.955 142.432 711.696 217.447 786.711L288.158 715.999C231.898 659.738 200.291 583.433 200.291 503.868L100.289 503.868Z",
    3: "M200.579 503.579C200.579 583.144 232.186 659.45 288.447 715.711L359.158 645C321.651 607.493 300.58 556.622 300.58 503.579L200.579 503.579Z",
    2: "M300.864 503.289C300.864 556.333 321.936 607.203 359.443 644.711L430.158 573.996C411.406 555.243 400.871 529.809 400.871 503.289L300.864 503.289Z",
    1: "M401.158 503C401.158 529.522 411.694 554.957 430.448 573.711L501.158 503L401.158 503Z",
  },
  5: {
    5: "M147.787 858.711C241.555 952.48 368.732 1005.16 501.34 1005.16V905.158C395.254 905.158 293.512 863.015 218.498 788.001L147.787 858.711Z",
    4: "M218.496 787.592C293.511 862.607 395.252 904.75 501.339 904.75V804.748C421.774 804.748 345.468 773.141 289.208 716.881L218.496 787.592Z",
    3: "M289.207 716.472C345.468 772.733 421.774 804.34 501.339 804.34V704.34C448.296 704.34 397.425 683.268 359.918 645.761L289.207 716.472Z",
    2: "M359.916 645.355C397.423 682.862 448.294 703.934 501.337 703.934V603.927C474.817 603.927 449.384 593.392 430.631 574.64L359.916 645.355Z",
    1: "M430.629 574.232C449.383 592.986 474.818 603.521 501.34 603.521V503.521L430.629 574.232Z",
  },
  4: {
    5: "M855.372 858.711C761.604 952.48 634.427 1005.16 501.818 1005.16V905.158C607.905 905.158 709.646 863.015 784.661 788.001L855.372 858.711Z",
    4: "M784.661 787.592C709.646 862.607 607.905 904.75 501.818 904.75V804.748C581.383 804.748 657.689 773.141 713.949 716.881L784.661 787.592Z",
    3: "M713.95 716.472C657.689 772.733 581.383 804.34 501.818 804.34V704.34C554.862 704.34 605.732 683.268 643.24 645.761L713.95 716.472Z",
    2: "M643.244 645.355C605.736 682.862 554.866 703.934 501.822 703.934V603.927C528.342 603.927 553.776 593.392 572.529 574.64L643.244 645.355Z",
    1: "M572.529 574.232C553.775 592.986 528.34 603.521 501.818 603.521V503.521L572.529 574.232Z",
  },
  3: {
    5: "M1003.16 504.157C1003.16 636.765 950.479 763.942 856.711 857.711L786 787C861.015 711.985 903.157 610.244 903.157 504.157L1003.16 504.157Z",
    4: "M902.869 503.868C902.869 609.955 860.726 711.696 785.712 786.711L715 715.999C771.261 659.738 802.868 583.432 802.868 503.868L902.869 503.868Z",
    3: "M802.579 503.579C802.579 583.144 770.972 659.45 714.711 715.711L644 645C681.507 607.493 702.579 556.622 702.579 503.579L802.579 503.579Z",
    2: "M702.294 503.289C702.294 556.332 681.222 607.203 643.715 644.71L573 573.995C591.752 555.243 602.287 529.809 602.287 503.289L702.294 503.289Z",
    1: "M602 503C602 529.521 591.464 554.957 572.711 573.71L502 503L602 503Z",
  },
  2: {
    5: "M1003.16 501.554C1003.16 368.946 950.479 241.769 856.711 148L786 218.711C861.015 293.726 903.157 395.467 903.157 501.554H1003.16Z",
    4: "M902.869 501.843C902.869 395.757 860.726 294.015 785.712 219L715 289.712C771.261 345.973 802.868 422.279 802.868 501.843L902.869 501.843Z",
    3: "M802.579 502.133C802.579 422.568 770.972 346.261 714.711 290L644 360.711C681.507 398.219 702.579 449.089 702.579 502.133L802.579 502.133Z",
    2: "M702.294 502.422C702.294 449.379 681.222 398.508 643.715 361L573 431.716C591.752 450.468 602.287 475.902 602.287 502.422L702.294 502.422Z",
    1: "M602 502.711C602 476.19 591.464 450.754 572.711 432L502 502.711L602 502.711Z",
  },
  1: {
    5: "M855.372 147C761.604 53.2316 634.427 0.553217 501.818 0.553223V100.553C607.905 100.553 709.646 142.696 784.661 217.71L855.372 147Z",
    4: "M784.661 218.119C709.646 143.104 607.905 100.962 501.818 100.962V200.963C581.383 200.963 657.689 232.57 713.949 288.831L784.661 218.119Z",
    3: "M713.95 289.24C657.689 232.979 581.383 201.372 501.818 201.372V301.372C554.862 301.372 605.732 322.443 643.24 359.95L713.95 289.24Z",
    2: "M643.244 360.356C605.736 322.849 554.866 301.778 501.822 301.778V401.784C528.342 401.784 553.776 412.319 572.529 431.071L643.244 360.356Z",
    1: "M572.529 431.479C553.775 412.726 528.34 402.19 501.818 402.19V502.19L572.529 431.479Z",
  },
};
