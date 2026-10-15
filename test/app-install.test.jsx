import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { render, screen, within, fireEvent, act } from '@testing-library/react';
import App from '../src/App.jsx';
import { GetApp } from '../src/components/GetApp.jsx';
import {
  installWay,
  isAppleMobile,
  isStandalone,
  listenForInstall,
  _resetInstallForTests,
} from '../src/pwa.js';

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';
const ANDROID =
  'Mozilla/5.0 (Linux; Android 15; Pixel 9 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36';

// The browser's install offer, as Chrome on Android sends it.
function offerInstall(outcome = 'accepted') {
  const e = new Event('beforeinstallprompt', { cancelable: true });
  e.prompt = vi.fn(async () => {});
  e.userChoice = Promise.resolve({ outcome });
  act(() => {
    window.dispatchEvent(e);
  });
  return e;
}

beforeAll(() => listenForInstall(window));

afterEach(() => {
  act(() => _resetInstallForTests());
  vi.restoreAllMocks();
});

describe('how a visitor gets the app', () => {
  it('picks the way that works on this device', () => {
    const base = { standalone: false, canInstall: false, installedNow: false, appleMobile: false };
    expect(installWay(base)).toBe('menu');
    expect(installWay({ ...base, appleMobile: true })).toBe('apple');
    expect(installWay({ ...base, canInstall: true })).toBe('button');
    expect(installWay({ ...base, canInstall: true, appleMobile: true })).toBe('button');
    expect(installWay({ ...base, installedNow: true, canInstall: true })).toBe('installed');
    expect(installWay({ ...base, standalone: true })).toBe('installed');
  });

  it('knows an iPhone and an iPad (which calls itself a Mac) from a Mac or an Android phone', () => {
    expect(isAppleMobile({ userAgent: IPHONE })).toBe(true);
    expect(isAppleMobile({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', platform: 'MacIntel', maxTouchPoints: 5 })).toBe(true);
    expect(isAppleMobile({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', platform: 'MacIntel', maxTouchPoints: 0 })).toBe(false);
    expect(isAppleMobile({ userAgent: ANDROID, platform: 'Linux armv81', maxTouchPoints: 5 })).toBe(false);
  });

  it('knows when it is already open as the app', () => {
    const win = (matches, standalone) => ({ matchMedia: () => ({ matches }), navigator: { standalone } });
    expect(isStandalone(win(true))).toBe(true);
    expect(isStandalone(win(false, true))).toBe(true);
    expect(isStandalone(win(false, false))).toBe(false);
    expect(isStandalone({ navigator: {} })).toBe(false);
    expect(isStandalone(null)).toBe(false);
  });

  it('gives an Android phone one button that asks the browser to install it', async () => {
    render(<GetApp />);
    expect(screen.queryByRole('button', { name: 'Install the app' })).toBe(null);
    expect(screen.getByText(/Open your browser’s menu/)).toBeTruthy();

    const offer = offerInstall('accepted');
    // The browser's own pop-up is held back; the button shows it instead.
    expect(offer.defaultPrevented).toBe(true);
    const button = screen.getByRole('button', { name: 'Install the app' });
    await act(async () => fireEvent.click(button));
    expect(offer.prompt).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/It’s on your home screen now/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Install the app' })).toBe(null);
  });

  it('falls back to the menu steps when the install is turned down', async () => {
    render(<GetApp />);
    const offer = offerInstall('dismissed');
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Install the app' })));
    expect(offer.prompt).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Install the app' })).toBe(null);
    expect(screen.getByText(/Open your browser’s menu/)).toBeTruthy();
  });

  it('says it is installed when the browser reports it', () => {
    render(<GetApp />);
    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });
    expect(screen.getByText(/It’s on your home screen now/)).toBeTruthy();
  });

  it('walks an iPhone through Share, then Add to Home Screen', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(IPHONE);
    render(<GetApp />);
    const steps = screen.getByRole('list');
    expect(within(steps).getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'Tap Share In Safari it may be under ••• first.',
      'Choose Add to Home Screen If you can’t see it, scroll down the list.',
      'Tap Add.',
    ]);
    expect(screen.queryByRole('button', { name: 'Install the app' })).toBe(null);
  });

  it('leaves out "Get the app" once it is open as the app', () => {
    window.matchMedia = vi.fn((q) => ({ matches: q === '(display-mode: standalone)' }));
    try {
      render(<App />);
      const about = screen.getByRole('region', { name: 'More about the Wheel of Life' });
      expect(within(about).queryByRole('button', { name: 'Get the app' })).toBe(null);
      expect(within(about).getByRole('button', { name: 'FAQ' })).toBeTruthy();
      expect(about.querySelector('.about-panel-app')).toBe(null);
    } finally {
      delete window.matchMedia;
    }
  });

  it('opens "Get the app" from the row under the wheel', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Get the app' }));
    const panel = document.getElementById(screen.getByRole('button', { name: 'Get the app' }).getAttribute('aria-controls'));
    expect(panel.hidden).toBe(false);
    expect(within(panel).getByRole('heading', { level: 2, name: 'Get the app' })).toBeTruthy();
    expect(panel.textContent).toContain('work without the internet');
  });
});
