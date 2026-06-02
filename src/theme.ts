const colors = {
  white: '#fff',
  black: '#000',
  gray: 'rgba(0, 0, 0, .5)',
  lightWhite: 'rgba(255, 255, 255, .5)',
  blueTintColor: '#0281ff',
  lightPink: '#F7B5CD',
  neonCyan: '#00f0ff',
  neonMagenta: '#ff00ff',
  cyberpunkDark: '#0d0221',
  matrixGreen: '#00ff41',
  matrixDarkGreen: '#003b00',
  matrixBlack: '#0d0d0d',
  pinkPrimary: '#e91e8c',
  pinkBackground: '#fff0f6',
  pinkMuted: 'rgba(233, 30, 140, .4)',
  wizardsRed: '#E31837',
  wizardsDarkRed: '#B1142C',
  wizardsSurface: '#F5F6F8',
  wizardsBorder: '#E4E7EC',
  wizardsText: '#1B1B1F',
  wizardsMutedText: '#6C7280',
  wizardsGreen: '#8FD3FF',
  wizardsDarkBg: '#000000',
  wizardsCardDark: '#141418',
  wizardsBorderDark: '#3f3f46',
  wizardsMutedDark: '#A1A1AA'
}

const fonts = {
  ultraLightFont: 'Geist-Ultralight',
  thinFont: 'Geist-Thin',
  regularFont: 'Geist-Regular',
  lightFont: 'Geist-Light',
  mediumFont: 'Geist-Medium',
  semiBoldFont: 'Geist-SemiBold',
  boldFont: 'Geist-Bold',
  blackFont: 'Geist-Black',
  ultraBlackFont: 'Geist-Ultrablack',
}

const lightTheme = {
  ...fonts,
  name: 'Light',
  label: 'light',
  textColor: colors.black,
  secondaryTextColor: colors.white,
  mutedForegroundColor: colors.gray,
  backgroundColor: colors.white,
  placeholderTextColor: colors.gray,
  secondaryBackgroundColor: colors.black,
  borderColor: 'rgba(0, 0, 0, .15)',
  tintColor: '#0281ff',
  tintTextColor: colors.white,
  tabBarActiveTintColor: colors.black,
  tabBarInactiveTintColor: colors.gray,
  cardBackground: colors.white,
  buttonBackground: '#F3F4F6',
  heroBackground: '#F8FAFC',
  dangerColor: '#DC2626',
  successBackground: 'rgba(34, 197, 94, .16)',
  successTextColor: '#15803D',
  infoBackground: 'rgba(14, 165, 233, .14)',
  infoTextColor: '#0369A1',
  surfaceMuted: '#F4F4F5',
  dividerColor: 'rgba(0, 0, 0, 0.09)',
  footerCaptionColor: 'rgba(0, 0, 0, 0.5)',
}

const darkTheme = {
  ...fonts,
  name: 'Dark',
  label: 'dark',
  textColor: colors.white,
  secondaryTextColor: colors.black,
  mutedForegroundColor: colors.lightWhite,
  backgroundColor: colors.black,
  placeholderTextColor: colors.lightWhite,
  secondaryBackgroundColor: colors.white,
  borderColor: 'rgba(255, 255, 255, .2)',
  tintColor: '#0281ff',
  tintTextColor: colors.white,
  tabBarActiveTintColor: colors.blueTintColor,
  tabBarInactiveTintColor: colors.lightWhite,
  cardBackground: '#111111',
  buttonBackground: '#1D1D1D',
  heroBackground: '#161616',
  dangerColor: '#EF4444',
  successBackground: 'rgba(34, 197, 94, .22)',
  successTextColor: '#22C55E',
  infoBackground: 'rgba(14, 165, 233, .22)',
  infoTextColor: '#38BDF8',
  surfaceMuted: '#151515',
  dividerColor: 'rgba(255, 255, 255, 0.1)',
  footerCaptionColor: 'rgba(255, 255, 255, 0.76)',
}

const hackerNews = {
  ...lightTheme,
  name: 'Hacker News',
  label: 'hackerNews',
  backgroundColor: '#e4e4e4',
  tintColor: '#ed702d',
}

const miami = {
  ...darkTheme,
  name: 'Miami',
  label: 'miami',
  backgroundColor: '#231F20',
  tintColor: colors.lightPink,
  tintTextColor: '#231F20',
  tabBarActiveTintColor: colors.lightPink
}

const vercel = {
  ...darkTheme,
  name: 'Vercel',
  label: 'vercel',
  backgroundColor: colors.black,
  tintColor: '#171717',
  tintTextColor: colors.white,
  tabBarActiveTintColor: colors.white,
  secondaryTextColor: colors.white,
}

const cyberpunk = {
  ...darkTheme,
  name: 'Cyberpunk',
  label: 'cyberpunk',
  backgroundColor: colors.cyberpunkDark,
  tintColor: colors.neonCyan,
  tintTextColor: colors.cyberpunkDark,
  tabBarActiveTintColor: colors.neonCyan,
  tabBarInactiveTintColor: colors.neonMagenta,
  borderColor: 'rgba(0, 240, 255, .3)',
}

const matrix = {
  ...darkTheme,
  name: 'Matrix',
  label: 'matrix',
  backgroundColor: colors.matrixBlack,
  tintColor: colors.matrixGreen,
  tintTextColor: colors.matrixBlack,
  tabBarActiveTintColor: colors.matrixGreen,
  tabBarInactiveTintColor: colors.matrixDarkGreen,
  borderColor: 'rgba(0, 255, 65, .3)',
}

const pink = {
  ...lightTheme,
  name: 'Pink',
  label: 'pink',
  backgroundColor: colors.pinkBackground,
  tintColor: colors.pinkPrimary,
  tintTextColor: colors.white,
  tabBarActiveTintColor: colors.pinkPrimary,
  tabBarInactiveTintColor: colors.pinkMuted,
  borderColor: 'rgba(233, 30, 140, .2)',
}

const wizards = {
  ...lightTheme,
  name: 'Wizards',
  label: 'wizards',
  textColor: colors.white,
  mutedForegroundColor: colors.wizardsMutedDark,
  backgroundColor: colors.wizardsDarkBg,
  placeholderTextColor: colors.wizardsMutedDark,
  borderColor: colors.wizardsBorderDark,
  tintColor: colors.wizardsGreen,
  tintTextColor: colors.white,
  tabBarActiveTintColor: colors.wizardsGreen,
  tabBarInactiveTintColor: colors.wizardsMutedDark,
  cardBackground: colors.wizardsCardDark,
  buttonBackground: colors.wizardsCardDark,
  heroBackground: colors.wizardsGreen,
  dangerColor: colors.wizardsGreen,
  successBackground: 'rgba(143, 211, 255, .18)',
  successTextColor: colors.white,
  infoBackground: 'rgba(143, 211, 255, .22)',
  infoTextColor: colors.white,
  surfaceMuted: colors.wizardsCardDark,
  dividerColor: 'rgba(255, 255, 255, 0.1)',
  footerCaptionColor: 'rgba(255, 255, 255, 0.82)',
}

export {
  lightTheme, darkTheme, hackerNews, miami, vercel, cyberpunk, matrix, pink, wizards
}
