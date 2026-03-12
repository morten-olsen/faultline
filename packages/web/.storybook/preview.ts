import type { Preview } from '@storybook/react-vite'
import { faultlineTheme } from './faultline-theme.ts'
import '../src/styles.css'
import './preview-overrides.css'

const preview: Preview = {
  parameters: {
    backgrounds: {
      options: {
        faultline: { name: 'Faultline', value: '#0c0c0c' },
        surface: { name: 'Surface', value: '#141414' },
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      theme: faultlineTheme,
    },
    options: {
      storySort: {
        order: [
          'Design System', [
            'Introduction',
            'Foundations', ['Colors', 'Typography', 'Spacing', 'Motion', 'Tone', 'Issue Lifecycle'],
            'Components',
            'Pages', ['Home', 'Issue Detail', 'Issue Search'],
          ],
        ],
      },
    },
    a11y: {
      test: 'todo',
    },
  },
  initialGlobals: {
    backgrounds: { value: 'faultline' },
  },
}

export default preview
