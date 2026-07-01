export const landingSlides = [
  {
    id: 'intro',
    eyebrow: 'Moises Nevett',
    title: 'Private portfolio access for brand worlds, motion, and digital storytelling.',
    description:
      'A restrained front door that opens into the full slideshow archive, case studies, and the studio link.',
    assets: [
      {
        id: 'intro-cover',
        defaultSrc: '/covers/menu-cover.jpg',
        hoverSrc: '/slides/D_1.mp4',
        desktop: { left: '8%', top: '12%', width: '25vw', height: '62vh' },
        mobileOrder: 1,
        className: 'border border-white/10 bg-white/5',
      },
      {
        id: 'intro-motion',
        defaultSrc: '/slides/D_6.mp4',
        hoverSrc: '/slides/D_7.mp4',
        desktop: { right: '10%', top: '14%', width: '34vw', height: '46vh' },
        mobileOrder: 2,
        className: 'border border-white/10',
      },
      {
        id: 'intro-detail',
        defaultSrc: '/slides/D_40.mp4',
        hoverSrc: '/slides/D_41.mp4',
        desktop: { right: '22%', bottom: '10%', width: '22vw', height: '22vh' },
        mobileOrder: 3,
        className: 'border border-white/10',
      },
    ],
  },
  {
    id: 'portfolio',
    eyebrow: 'Portfolio',
    title: 'Fullscreen slideshow preserved from the original deck.',
    description:
      'Keyboard navigation, click zones, showreel launch, hash-linked slides, and custom cursors all remain in place.',
    assets: [
      {
        id: 'portfolio-left',
        defaultSrc: '/slides/D_23.mp4',
        hoverSrc: '/slides/D_24.mp4',
        desktop: { left: '9%', top: '16%', width: '28vw', height: '36vh' },
        mobileOrder: 1,
        className: 'border border-white/10',
      },
      {
        id: 'portfolio-center',
        defaultSrc: '/slides/D_37.mp4',
        hoverSrc: '/slides/D_38.mp4',
        desktop: { left: '39%', top: '10%', width: '24vw', height: '70vh' },
        mobileOrder: 2,
        className: 'border border-white/10',
      },
      {
        id: 'portfolio-right',
        defaultSrc: '/slides/D_42.mp4',
        hoverSrc: '/slides/D_43.mp4',
        desktop: { right: '8%', bottom: '12%', width: '24vw', height: '28vh' },
        mobileOrder: 3,
        className: 'border border-white/10',
      },
    ],
  },
  {
    id: 'case-studies',
    eyebrow: 'Case Studies',
    title: 'Three protected writeups for deeper context behind selected work.',
    description:
      'A lightweight password step keeps the landing page open while reserving more detailed process notes for invited viewers.',
    assets: [
      {
        id: 'case-primary',
        defaultSrc: '/slides/D_49.mp4',
        hoverSrc: '/slides/D_50.mp4',
        desktop: { left: '10%', top: '18%', width: '32vw', height: '50vh' },
        mobileOrder: 1,
        className: 'border border-white/10',
      },
      {
        id: 'case-secondary',
        defaultSrc: '/slides/D_52.mp4',
        hoverSrc: '/slides/D_53.mp4',
        desktop: { right: '11%', top: '13%', width: '28vw', height: '34vh' },
        mobileOrder: 2,
        className: 'border border-white/10',
      },
      {
        id: 'case-cover',
        defaultSrc: '/covers/menu-cover.jpg',
        hoverSrc: '/slides/D_54.mp4',
        desktop: { right: '19%', bottom: '12%', width: '20vw', height: '26vh' },
        mobileOrder: 3,
        className: 'border border-white/10 bg-white/5',
      },
    ],
  },
]
