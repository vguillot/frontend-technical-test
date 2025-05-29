import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ListenerFn, RouterEvents } from '@tanstack/react-router';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { mockToken } from '../../../tests/mocks/token';
import { AuthenticationContext, AuthenticationState } from '../../contexts/authentication';
import { LoginPage } from '../../routes/login';
import { renderWithRouter } from '../utils';

type RenderLoginPageParams = {
  authenticate?: (token: string) => void;
  authState?: AuthenticationState;
  onNavigate?: ListenerFn<RouterEvents["onBeforeNavigate"]>;
  currentPath?: string;
};

describe("routes/login", () => {
  describe("LoginPage", () => {
    function renderLoginPage({
      authenticate = () => {},
      authState = { isAuthenticated: false },
      onNavigate = () => {},
      currentPath = "/login",
    }: RenderLoginPageParams = {}) {
      return renderWithRouter({
        onNavigate,
        currentUrl: currentPath,
        component: LoginPage,
        Wrapper: ({ children }) => (
          <ChakraProvider>
            <QueryClientProvider client={new QueryClient()}>
              <AuthenticationContext.Provider
                value={{
                  state: authState,
                  authenticate,
                  signout: () => {},
                }}
              >
                {children}
              </AuthenticationContext.Provider>
            </QueryClientProvider>
          </ChakraProvider>
        ),
      });
    }

    it("should update the token and redirect to the home page when the login is successful", async () => {
      const authenticateMock = vi.fn();
      renderLoginPage({ authenticate: authenticateMock });

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /login/i });

      act(() => {
        fireEvent.change(usernameInput, { target: { value: "valid_user" } });
        fireEvent.change(passwordInput, { target: { value: "password" } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(authenticateMock).toHaveBeenCalledWith(mockToken);
      });
    });

    it("should show an error message when the login is unsuccessful", async () => {
      renderLoginPage();

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /login/i });

      act(() => {
        fireEvent.change(usernameInput, { target: { value: "invalid_user" } });
        fireEvent.change(passwordInput, { target: { value: "password" } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/wrong credentials/i)).toBeInTheDocument();
      });
    });

    it("should show an generic error message when an unknown error happens", async () => {
      renderLoginPage();

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /login/i });

      act(() => {
        fireEvent.change(usernameInput, { target: { value: "error_user" } });
        fireEvent.change(passwordInput, { target: { value: "password" } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(
          screen.getByText(/an unknown error occured, please try again later/i),
        ).toBeInTheDocument();
      });
    });

    it("should automatically redirect to the home page if the user is already authenticated if no redirect URL specified", async () => {
      const onBeforeNavigateMock = vi.fn();
      renderLoginPage({
        authState: {
          isAuthenticated: true,
          token: mockToken,
          userId: "dummy_user_id",
        },
        onNavigate: onBeforeNavigateMock,
      });

      await waitFor(() => {
        expect(onBeforeNavigateMock).toHaveBeenCalledWith(
          expect.objectContaining({
            toLocation: expect.objectContaining({ pathname: "/" }),
          }),
        );
      });
    });

    it("should automatically redirect to the specified redirect URL if the user is already authenticated", async () => {
      const onBeforeNavigateMock = vi.fn();
      renderLoginPage({
        authState: {
          isAuthenticated: true,
          token: mockToken,
          userId: "dummy_user_id",
        },
        onNavigate: onBeforeNavigateMock,
        currentPath: "/login?redirect=/profile",
      });

      await waitFor(() => {
        expect(onBeforeNavigateMock).toHaveBeenCalledWith(
          expect.objectContaining({
            toLocation: expect.objectContaining({ pathname: "/profile" }),
          }),
        );
      });
    });
  });
});
