import { stylesheet } from 'typestyle'

import theme from '../../theme'

export const styles = stylesheet({
  NavItem: {
    fontSize: '.8rem',
    padding: theme.paddings.navComfort,
    maxHeight: '100%',
  },
  Block: {
    padding: theme.paddings.blockComfort,
  },
  CardTitle: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    padding: '.5rem',
    overflow: 'auto',
    width: '100%',
  },
})
