import { Navigate, Outlet, useLocation } from "react-router-dom";

import { loginRoutePath } from "../features/game/config/constants";

function ProtectedRoute({
  isLoggedIn,
  isSessionReady,
  loadingFallback = null,
}) {
  const location = useLocation();

  if (!isSessionReady) {
    return loadingFallback;
  }

  if (!isLoggedIn) {
    return (
      <Navigate
        to={loginRoutePath}
        replace
        state={{
          from: {
            pathname: location.pathname,
          },
        }}
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;
