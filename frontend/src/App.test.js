import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { AuthContext } from './context/AuthContext';

jest.mock('./pages/Auth/Login', () => () => <div>Login Page</div>);
jest.mock('./pages/Admin/AdminDashboard', () => () => <div>Admin Dashboard</div>);
jest.mock('./pages/Doctor/DoctorDashboard', () => () => <div>Doctor Dashboard</div>);
jest.mock('./pages/Auth/SetupAdmin', () => () => <div>Setup Admin</div>);

describe('App routing', () => {
  test('shows the login page when no user is signed in', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthContext.Provider value={{ user: null, token: null, loading: false, adminExists: true }}>
          <AppRoutes />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  test('redirects an authenticated admin to the admin dashboard', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthContext.Provider value={{ user: { role: 'Admin', isFirstLogin: false }, token: 'abc', loading: false, adminExists: true }}>
          <AppRoutes />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });
});
