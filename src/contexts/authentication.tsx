import { jwtDecode } from "jwt-decode";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AuthenticationState =
  | {
      isAuthenticated: true;
      token: string;
      userId: string;
    }
  | {
      isAuthenticated: false;
    };

export type Authentication = {
  state: AuthenticationState;
  authenticate: (token: string) => void;
  signout: () => void;
};

export const AuthenticationContext = createContext<Authentication | undefined>(
  undefined
);

function isTokenExpired(token: string): boolean {
  const { exp } = jwtDecode<{ exp: number }>(token);
  return Date.now() >= exp * 1000;
}

export const AuthenticationProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [state, setState] = useState<AuthenticationState>({
    isAuthenticated: false,
  });

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        if (isTokenExpired(token)) {
          localStorage.removeItem("authToken");
          return;
        }
        const userId = jwtDecode<{ id: string }>(token).id;
        setState({
          isAuthenticated: true,
          token,
          userId,
        });
      } catch {
        localStorage.removeItem("authToken");
      }
    }
  }, []);

  const authenticate = useCallback(
    (token: string) => {
      localStorage.setItem("authToken", token);
      setState({
        isAuthenticated: true,
        token,
        userId: jwtDecode<{ id: string }>(token).id,
      });
    },
    [setState]
  );

  const signout = useCallback(() => {
    localStorage.removeItem("authToken");
    setState({ isAuthenticated: false });
  }, [setState]);

  const contextValue = useMemo(
    () => ({ state, authenticate, signout }),
    [state, authenticate, signout]
  );

  return (
    <AuthenticationContext.Provider value={contextValue}>
      {children}
    </AuthenticationContext.Provider>
  );
};

export function useAuthentication() {
  const context = useContext(AuthenticationContext);
  if (!context) {
    throw new Error(
      "useAuthentication must be used within an AuthenticationProvider"
    );
  }
  return context;
}

export function useAuthToken() {
  const { state, signout } = useAuthentication();
  if (!state.isAuthenticated) {
    throw new Error("User is not authenticated");
  }
  if (isTokenExpired(state.token)) {
    signout();
    window.location.href = "/login";
    throw new Error("Token has expired");
  }
  return state.token;
}
