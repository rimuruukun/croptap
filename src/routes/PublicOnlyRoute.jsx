import { Navigate, Outlet } from "react-router-dom";

function PublicOnlyRoute({
  isLoggedIn,
  isSessionReady,
  redirectTo,
  loadingFallback = null,
}) {
  if (!isSessionReady) {
    return loadingFallback;
  }

  if (isLoggedIn) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}

export default PublicOnlyRoute;
