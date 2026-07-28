import { render, screen } from '@testing-library/react-native';

import MainMenuScreen from '../index';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
}));

// RNTL 14-də `render` async-dir və sorğular `screen` üzərindən aparılır.
describe('Main Menu', () => {
  it('crash olmadan render olunur', async () => {
    await render(<MainMenuScreen />);
    expect(screen.getByText('Pack & Relax')).toBeTruthy();
  });

  it('bütün əsas menyu keçidlərini göstərir', async () => {
    await render(<MainMenuScreen />);
    for (const label of ['Orders', 'Zen Mode', 'Workshop', 'Settings']) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it('menyu düymələri accessibility rolu ilə açıqlanır', async () => {
    await render(<MainMenuScreen />);
    expect(screen.getAllByRole('button')).toHaveLength(4);
  });
});
