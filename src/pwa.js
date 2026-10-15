import { useSyncExternalStore } from 'react';

// The site as an app on a phone's home screen: the offline helper (sw.js,
// written by scripts/build-sw.mjs) and the "Get the app" steps.

// Keeps the site's own files on the device so the app opens without the
// internet. Only in the built site: `npm run dev` has no sw.js.
export function registerOfflineHelper() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// Chrome, Edge and Samsung Internet on Android say when the site can be
// installed (beforeinstallprompt), often before the page has drawn, so this
// listens from the start (main.jsx). Holding on to the event keeps the
// browser's own pop-up away; the "Get the app" button shows it instead.
let offer = null;
let installedNow = false;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

export function listenForInstall(win = window) {
  win.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    offer = e;
    notify();
  });
  win.addEventListener('appinstalled', () => {
    offer = null;
    installedNow = true;
    notify();
  });
}

// Shows the browser's install question. Each offer can be shown once; if it
// is turned down, the browser may make a new one later.
export async function install() {
  const e = offer;
  if (!e) return 'unavailable';
  offer = null;
  notify();
  await e.prompt();
  const { outcome } = await e.userChoice;
  if (outcome === 'accepted') installedNow = true;
  notify();
  return outcome;
}

let snapshot = { canInstall: false, installedNow: false };
function read() {
  if (snapshot.canInstall !== Boolean(offer) || snapshot.installedNow !== installedNow) {
    snapshot = { canInstall: Boolean(offer), installedNow };
  }
  return snapshot;
}
const SERVER = { canInstall: false, installedNow: false };

export function useInstallOffer() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    read,
    () => SERVER,
  );
}

// Already open as the installed app (from the home screen)?
export function isStandalone(win = typeof window === 'undefined' ? null : window) {
  if (!win) return false;
  return Boolean(win.matchMedia?.('(display-mode: standalone)').matches || win.navigator?.standalone === true);
}

// iPhone and iPad (iPadOS calls itself a Mac, but a Mac has no touch screen).
export function isAppleMobile({ userAgent = '', platform = '', maxTouchPoints = 0 } = {}) {
  return /iPhone|iPad|iPod/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1);
}

// How this visitor can add the app: 'installed' (done, or open as the app),
// 'button' (the browser offered to install it), 'apple' (Share, then Add to
// Home Screen) or 'menu' (the browser's own menu).
export function installWay({ standalone, canInstall, installedNow, appleMobile }) {
  if (standalone || installedNow) return 'installed';
  if (canInstall) return 'button';
  return appleMobile ? 'apple' : 'menu';
}

// Test-only: forget any offer between tests.
export function _resetInstallForTests() {
  offer = null;
  installedNow = false;
  notify();
}
