import { stylesheet } from 'typestyle'

export const BlockStyles = stylesheet({
  Block: {
    background: 'white',
    borderRadius: '.3rem',
    overflow: 'hidden',
    $nest: {
      '& > .ActionBtn': {
        opacity: 0,
        transition: '0.1s opacity ease-in-out, 0.1s fill ease-in-out',
        fill: 'silver',
        cursor: 'pointer',
        borderRadius: '.3rem',
        $nest: {
          '&:hover': {
            background: '#eee',
          },
        },
      },
      '&:hover > .ActionBtn': {
        opacity: 1,
      },
      '& > .ActionBtn--Red:hover': {
        fill: 'lightcoral',
      },
      '& > .ActionBtn--Green:hover': {
        fill: 'mediumaquamarine',
      },
    },
  },
  'Block--Selected': {
    boxShadow: '0px 0px 0px 2px blueviolet',
  },
})
