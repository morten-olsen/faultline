import { addons } from 'storybook/manager-api';

import { faultlineTheme } from './faultline-theme.ts';

addons.setConfig({
  theme: faultlineTheme,
});
