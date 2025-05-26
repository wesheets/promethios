import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeContext';
import SignupForm from '../SignupForm';
import WaitlistForm from '../WaitlistForm';
import InviteLogin from '../InviteLogin';
import EmailVerification from '../EmailVerification';
import OnboardingFlow from '../OnboardingFlow';

// Mock components and hooks
jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: true, toggleTheme: jest.fn() }),
  ThemeProvider: ({ children }) => <div data-testid="theme-provider">{children}</div>
}));

// Helper function to render components with providers
const renderWithProviders = (component) => {
  return render(
    <ThemeProvider>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </ThemeProvider>
  );
};

describe('Authentication Components', () => {
  describe('SignupForm', () => {
    test('renders signup form with social login options', () => {
      renderWithProviders(<SignupForm />);
      
      expect(screen.getByText(/Sign up with Google/i)).toBeInTheDocument();
      expect(screen.getByText(/Sign up with Microsoft/i)).toBeInTheDocument();
      expect(screen.getByText(/or/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/your@email.com/i)).toBeInTheDocument();
    });

    test('validates email input', async () => {
      renderWithProviders(<SignupForm />);
      
      const emailInput = screen.getByPlaceholderText(/your@email.com/i);
      const submitButton = screen.getByRole('button', { name: /Sign up with email/i });
      
      // Empty email
      fireEvent.click(submitButton);
      expect(await screen.findByText(/Please enter a valid email/i)).toBeInTheDocument();
      
      // Invalid email
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(submitButton);
      expect(await screen.findByText(/Please enter a valid email/i)).toBeInTheDocument();
      
      // Valid email
      fireEvent.change(emailInput, { target: { value: 'valid@example.com' } });
      fireEvent.click(submitButton);
      await waitFor(() => {
        expect(screen.queryByText(/Please enter a valid email/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('WaitlistForm', () => {
    test('renders waitlist form with required fields', () => {
      renderWithProviders(<WaitlistForm />);
      
      expect(screen.getByText(/Join the waitlist/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/your@email.com/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Your name/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Company \(optional\)/i)).toBeInTheDocument();
    });

    test('submits waitlist form with valid data', async () => {
      renderWithProviders(<WaitlistForm />);
      
      const nameInput = screen.getByPlaceholderText(/Your name/i);
      const emailInput = screen.getByPlaceholderText(/your@email.com/i);
      const companyInput = screen.getByPlaceholderText(/Company \(optional\)/i);
      const submitButton = screen.getByRole('button', { name: /Join waitlist/i });
      
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(companyInput, { target: { value: 'Test Company' } });
      
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Thank you for joining our waitlist/i)).toBeInTheDocument();
      });
    });
  });

  describe('InviteLogin', () => {
    test('renders invite code input form', () => {
      renderWithProviders(<InviteLogin />);
      
      expect(screen.getByText(/Enter your invite code/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Invite code/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Continue/i })).toBeInTheDocument();
    });

    test('validates invite code format', async () => {
      renderWithProviders(<InviteLogin />);
      
      const inviteInput = screen.getByPlaceholderText(/Invite code/i);
      const submitButton = screen.getByRole('button', { name: /Continue/i });
      
      // Empty code
      fireEvent.click(submitButton);
      expect(await screen.findByText(/Please enter a valid invite code/i)).toBeInTheDocument();
      
      // Invalid code format
      fireEvent.change(inviteInput, { target: { value: 'invalid' } });
      fireEvent.click(submitButton);
      expect(await screen.findByText(/Please enter a valid invite code/i)).toBeInTheDocument();
      
      // Valid code format
      fireEvent.change(inviteInput, { target: { value: 'PROM-1234-ABCD' } });
      fireEvent.click(submitButton);
      await waitFor(() => {
        expect(screen.queryByText(/Please enter a valid invite code/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('EmailVerification', () => {
    test('renders email verification form', () => {
      renderWithProviders(<EmailVerification />);
      
      expect(screen.getByText(/Verify your email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Send verification code/i })).toBeInTheDocument();
    });

    test('transitions to verification code input after sending', async () => {
      renderWithProviders(<EmailVerification />);
      
      const emailInput = screen.getByLabelText(/Email address/i);
      const sendButton = screen.getByRole('button', { name: /Send verification code/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Enter the verification code sent to your email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Verification code/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Verify email/i })).toBeInTheDocument();
      });
    });
  });

  describe('OnboardingFlow', () => {
    test('renders first step of onboarding flow', () => {
      renderWithProviders(<OnboardingFlow />);
      
      expect(screen.getByText(/Welcome to Promethios/i)).toBeInTheDocument();
      expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument();
    });

    test('navigates through onboarding steps', async () => {
      renderWithProviders(<OnboardingFlow />);
      
      const nextButton = screen.getByRole('button', { name: /Next/i });
      
      // Step 1 to Step 2
      fireEvent.click(nextButton);
      await waitFor(() => {
        expect(screen.getByText(/Step 2 of 4/i)).toBeInTheDocument();
      });
      
      // Step 2 to Step 3
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));
      await waitFor(() => {
        expect(screen.getByText(/Step 3 of 4/i)).toBeInTheDocument();
      });
      
      // Step 3 to Step 4
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));
      await waitFor(() => {
        expect(screen.getByText(/Step 4 of 4/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Get started/i })).toBeInTheDocument();
      });
    });
  });
});
