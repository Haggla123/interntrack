import { render, screen } from '@testing-library/react';
import { act } from 'react';
import ToastProvider from './components/common/ToastProvider';
<<<<<<< HEAD
import NotFound from './pages/NotFound';
import { notifyError } from './utils/toast';

jest.mock('react-router-dom', () => ({
  Link: ({ to, children }) => <a href={to}>{children}</a>,
}), { virtual: true });

=======
import { notifyError } from './utils/toast';

>>>>>>> 47bb090b73335bdc567c89044beaee7541368292
test('test runner is wired', () => {
  expect(true).toBe(true);
});

test('toast notifications render when emitted', async () => {
  render(
    <ToastProvider>
      <div>App content</div>
    </ToastProvider>
  );

  act(() => {
    notifyError('Login failed. Check credentials.');
  });

  expect(await screen.findByText('Login failed. Check credentials.')).toBeTruthy();
});
<<<<<<< HEAD

test('not found route gives a recovery link', () => {
  render(<NotFound />);

  expect(screen.getByText('Page not found')).toBeTruthy();
  expect(screen.getByRole('link', { name: /go to login/i }).getAttribute('href')).toBe('/login');
});
=======
>>>>>>> 47bb090b73335bdc567c89044beaee7541368292
