import {
  defaultDesktopRoutePath,
  defaultMobileRoutePath,
  sectionIdByPath,
  sectionPathById,
} from "../features/game/config/constants";

export const sectionRouteEntries = Object.freeze([
  { id: "battle", path: sectionPathById.battle },
  { id: "events", path: sectionPathById.events },
  { id: "farmers", path: sectionPathById.farmers },
  { id: "leaderboards", path: sectionPathById.leaderboards },
  { id: "settings", path: sectionPathById.settings },
  { id: "tools", path: sectionPathById.tools },
]);

function normalizePathname(pathname) {
  if (typeof pathname !== "string" || pathname.trim() === "") {
    return "/";
  }

  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (withLeadingSlash === "/") {
    return "/";
  }

  return withLeadingSlash.replace(/\/+$/, "") || "/";
}

export function getSectionIdFromPath(pathname) {
  const normalizedPathname = normalizePathname(pathname);
  return sectionIdByPath[normalizedPathname] ?? null;
}

export function getPathFromSectionId(sectionId) {
  return sectionPathById[sectionId] ?? defaultMobileRoutePath;
}

export function getDefaultProtectedPath(isDesktopLayout) {
  return isDesktopLayout ? defaultDesktopRoutePath : defaultMobileRoutePath;
}

export function resolveSafeProtectedPath(pathname, isDesktopLayout) {
  const sectionId = getSectionIdFromPath(pathname);

  if (!sectionId) {
    return getDefaultProtectedPath(isDesktopLayout);
  }

  if (isDesktopLayout && sectionId === "battle") {
    return defaultDesktopRoutePath;
  }

  return getPathFromSectionId(sectionId);
}

export function getPostLoginRedirectPath(locationState, isDesktopLayout) {
  const intendedPath =
    locationState?.from?.pathname ?? locationState?.fromPath ?? null;

  return resolveSafeProtectedPath(intendedPath, isDesktopLayout);
}
