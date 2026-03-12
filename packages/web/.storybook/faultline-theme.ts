import { create } from 'storybook/theming'

const faultlineTheme = create({
  base: 'dark',

  // Brand
  brandTitle: 'Faultline',

  // Typography
  fontBase: '"Geist Variable", system-ui, sans-serif',
  fontCode: '"Geist Mono Variable", "SF Mono", monospace',

  // Colors
  colorPrimary: '#3b82f6',
  colorSecondary: '#3b82f6',

  // UI
  appBg: '#0c0c0c',
  appContentBg: '#0c0c0c',
  appPreviewBg: '#0c0c0c',
  appBorderColor: '#1c1c1c',
  appBorderRadius: 8,

  // Text
  textColor: '#e8e8e8',
  textInverseColor: '#0c0c0c',

  // Toolbar
  barTextColor: '#7e7e7e',
  barSelectedColor: '#e8e8e8',
  barHoverColor: '#e8e8e8',
  barBg: '#141414',

  // Form
  inputBg: '#141414',
  inputBorder: '#282828',
  inputTextColor: '#e8e8e8',
  inputBorderRadius: 6,
})

export { faultlineTheme }
