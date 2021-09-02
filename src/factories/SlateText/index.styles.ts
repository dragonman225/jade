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
    margin: 'auto',
    width: '100%',
  },
})
