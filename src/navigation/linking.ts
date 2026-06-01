import type { LinkingOptions } from '@react-navigation/native'

export const linking: LinkingOptions<object> = {
  prefixes: ['wizardevent://'],
  config: {
    screens: {
      Tabs: {
        screens: {
          PlayerSnapshot: 'player/:userId',
        },
      },
    },
  },
}
