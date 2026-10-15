import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import App from '../src/App.jsx';
import { WHEELS, findWheel } from '../src/wheels/config.js';
import { STORAGE_KEY, ACTIVE_KEY, serializeState } from '../src/wheels/storage.js';
import {
  hasResults,
  otherResults,
  pictureShare,
  shareSupport,
  shareTitle,
  snapshotKey,
  wordsShare,
} from '../src/wheels/share.js';
import { fakeCanvas, InstantImage } from './fake-canvas.js';

const EMPTY = [0, 0, 0, 0, 0, 0, 0, 0];
const LIFE = [4, 2, 5, 3, 1, 4, 2, 0];
const BUSINESS = [1, 1, 2, 2, 3, 3, 4, 4];

function scored({ life = EMPTY, relationships = EMPTY, business = EMPTY, label = '', active = 'life' } = {}) {
  window.localStorage.setItem(STORAGE_KEY, serializeState({ scores: { life, relationships, business }, label }));
  window.localStorage.setItem(ACTIVE_KEY, active);
}

// A browser's share sheet. `outcome` is what the person does with it.
function shareSheet({ files = true, outcome } = {}) {
  const share = vi.fn(() => (outcome ? Promise.reject(Object.assign(new Error(outcome), { name: outcome })) : Promise.resolve()));
  const canShare = vi.fn((data) => files && Array.isArray(data.files));
  Object.defineProperty(navigator, 'share', { value: share, configurable: true, writable: true });
  Object.defineProperty(navigator, 'canShare', { value: canShare, configurable: true, writable: true });
  return share;
}

const shareButton = () => screen.getByRole('button', { name: /Share results|Preparing/ });
const status = () => document.querySelector('.actions > .status').textContent;
// The pictures are drawn a moment after the scores settle.
const picturesDrawn = (calls, n) =>
  waitFor(async () => {
    expect(calls.blobs).toBe(n);
    await Promise.resolve();
  });
const tick = () => new Promise((r) => setTimeout(r, 0));

let calls;
beforeEach(() => {
  vi.stubGlobal('Image', InstantImage);
  calls = fakeCanvas();
});

afterEach(() => {
  delete navigator.share;
  delete navigator.canShare;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('what this browser can share', () => {
  it('pictures, words only, or nothing', () => {
    expect(shareSupport(undefined)).toBe('none');
    expect(shareSupport({})).toBe('none');
    expect(shareSupport({ share() {} })).toBe('text');
    expect(shareSupport({ share() {}, canShare: () => false })).toBe('text');
    expect(
      shareSupport({
        share() {},
        canShare: () => {
          throw new Error('no');
        },
      }),
    ).toBe('text');
    const canShare = vi.fn(() => true);
    expect(shareSupport({ share() {}, canShare })).toBe('files');
    const probe = canShare.mock.calls[0][0].files[0];
    expect(probe.type).toBe('image/png');
    expect(probe.name).toMatch(/\.png$/);
  });
});

describe('sharing, the words that go with it', () => {
  const life = findWheel('life');
  const business = findWheel('business');

  it('knows which other wheels have results, in the picker’s order', () => {
    const scores = { life: LIFE, relationships: EMPTY, business: BUSINESS };
    expect(hasResults(LIFE)).toBe(true);
    expect(hasResults(EMPTY)).toBe(false);
    expect(otherResults('life', scores).map((w) => w.id)).toEqual(['business']);
    expect(otherResults('business', scores).map((w) => w.id)).toEqual(['life']);
    expect(otherResults('life', { ...scores, relationships: [0, 0, 0, 0, 0, 0, 0, 1] }).map((w) => w.id)).toEqual([
      'relationships',
      'business',
    ]);
  });

  it('names the wheels and links to the page', () => {
    expect(shareTitle([life])).toBe('My Wheel of Life');
    expect(shareTitle([life, business])).toBe('My Wheel of Life and Wheel of Business');
    expect(shareTitle(WHEELS)).toBe('My Wheel of Life, Wheel of Relationships and Wheel of Business');
    const one = pictureShare([business], ['f']);
    expect(one).toEqual({
      title: 'My Wheel of Business',
      text: 'My Wheel of Business, made with NeuroDapt Wheels: https://wheels.neurodapt.au/wheel-of-business',
      files: ['f'],
    });
    expect(pictureShare([life, business], []).text).toMatch(/: https:\/\/wheels\.neurodapt\.au\/$/);
  });

  it('in words: every area and its score, and no average', () => {
    const { title, text } = wordsShare([life, business], { life: LIFE, business: BUSINESS });
    expect(title).toBe('My Wheel of Life and Wheel of Business');
    life.slices.forEach((s, i) => expect(text).toContain(`${s.name}: ${LIFE[i] * 20}%`));
    business.slices.forEach((s, i) => expect(text).toContain(`${s.name}: ${BUSINESS[i] * 20}%`));
    expect(text).not.toMatch(/average|overall|total/i);
    expect(text).not.toContain('53%'); // the Wheel of Life's average
    expect(text).toContain('https://wheels.neurodapt.au/');
  });

  it('draws a picture again when the scores, the image name or the day change', () => {
    const day = new Date(2026, 9, 16);
    const key = snapshotKey(life, LIFE, '', day);
    expect(snapshotKey(life, [...LIFE], '', new Date(2026, 9, 16, 23))).toBe(key);
    expect(snapshotKey(life, [5, ...LIFE.slice(1)], '', day)).not.toBe(key);
    expect(snapshotKey(life, LIFE, 'Week 5', day)).not.toBe(key);
    expect(snapshotKey(life, LIFE, '', new Date(2026, 9, 17))).not.toBe(key);
    expect(snapshotKey(business, LIFE, '', day)).not.toBe(key);
  });
});

describe('the Share results button', () => {
  it('opens the share sheet with a picture of this wheel, within the tap', async () => {
    scored({ life: LIFE });
    const share = shareSheet();
    render(<App />);
    await picturesDrawn(calls, 1);
    fireEvent.click(shareButton());
    // Straight away, not after waiting for anything: Safari refuses a share
    // that comes later than the tap.
    expect(share).toHaveBeenCalledTimes(1);
    const data = share.mock.calls[0][0];
    expect(data.title).toBe('My Wheel of Life');
    expect(data.text).toBe('My Wheel of Life, made with NeuroDapt Wheels: https://wheels.neurodapt.au/');
    expect(data.files).toHaveLength(1);
    expect(data.files[0]).toBeInstanceOf(File);
    expect(data.files[0].name).toBe('NeuroDapt - Wheel of Life.png');
    expect(data.files[0].type).toBe('image/png');
    expect(screen.queryByRole('dialog')).toBeNull();
    await tick();
    expect(status()).toBe('');
  });

  it('names the picture as Download would', async () => {
    scored({ business: BUSINESS, label: 'week 6', active: 'business' });
    const share = shareSheet();
    render(<App />);
    await picturesDrawn(calls, 1);
    fireEvent.click(shareButton());
    expect(share.mock.calls[0][0].files[0].name).toBe('NeuroDapt - Wheel of Business - Week 6.png');
    expect(calls.text).toContain('Wheel of Business');
  });

  it('draws the picture first when tapped before it is ready', async () => {
    scored({ life: LIFE });
    const share = shareSheet();
    render(<App />);
    fireEvent.click(shareButton());
    expect(share).not.toHaveBeenCalled();
    expect(shareButton().textContent).toBe('Preparing…');
    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(share.mock.calls[0][0].files[0].name).toBe('NeuroDapt - Wheel of Life.png');
    await waitFor(() => expect(shareButton().textContent).toBe('Share results'));
  });

  it('never sends a picture of older scores', async () => {
    scored({ life: LIFE });
    const share = shareSheet();
    render(<App />);
    await picturesDrawn(calls, 1);
    fireEvent.click(screen.getAllByRole('button', { name: /^Raise/ })[7]);
    fireEvent.click(shareButton());
    expect(share).not.toHaveBeenCalled();
    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(calls.blobs).toBe(2);
    // 20% twice in the first picture (one area), four times in the second.
    expect(calls.text.filter((t) => t === '20%').length).toBe(6);
  });

  it('when the browser will not share that late, says to tap again, and then shares at once', async () => {
    scored({ life: LIFE });
    const share = shareSheet({ outcome: 'NotAllowedError' });
    render(<App />);
    fireEvent.click(shareButton());
    await waitFor(() => expect(status()).toBe('Your picture is ready: tap Share results again to send it.'));
    share.mockImplementation(() => Promise.resolve());
    fireEvent.click(shareButton());
    expect(share).toHaveBeenCalledTimes(2);
  });

  it('says nothing when the person closes the share sheet', async () => {
    scored({ life: LIFE });
    shareSheet({ outcome: 'AbortError' });
    render(<App />);
    await picturesDrawn(calls, 1);
    fireEvent.click(shareButton());
    await tick();
    expect(status()).toBe('');
  });

  it('says so when sharing fails', async () => {
    scored({ life: LIFE });
    shareSheet({ outcome: 'DataError' });
    render(<App />);
    await picturesDrawn(calls, 1);
    fireEvent.click(shareButton());
    await waitFor(() => expect(status()).toBe('Sorry, this device could not share your wheel.'));
  });

  it('says so when the picture cannot be made', async () => {
    scored({ life: LIFE });
    const share = shareSheet();
    HTMLCanvasElement.prototype.getContext.mockReturnValue(null);
    render(<App />);
    fireEvent.click(shareButton());
    await waitFor(() => expect(status()).toBe('Sorry, the picture could not be made on this device.'));
    expect(share).not.toHaveBeenCalled();
    expect(shareButton().disabled).toBe(false);
  });

  it('asks for scores first on an empty wheel, even when other wheels have some', async () => {
    scored({ business: BUSINESS });
    const share = shareSheet();
    render(<App />);
    fireEvent.click(shareButton());
    expect(status()).toBe('Score at least one area first, then share your wheel.');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(share).not.toHaveBeenCalled();
  });

  it('shares the results in words where pictures cannot be shared', () => {
    scored({ life: LIFE });
    const share = shareSheet({ files: false });
    render(<App />);
    fireEvent.click(shareButton());
    expect(share).toHaveBeenCalledTimes(1);
    const data = share.mock.calls[0][0];
    expect(data.files).toBeUndefined();
    expect(data.text).toContain(`${findWheel('life').slices[0].name}: 80%`);
    expect(calls.blobs).toBe(0);
  });

  it('where nothing can be shared: says what to do instead, and computers hide it', () => {
    scored({ life: LIFE });
    render(<App />);
    expect(shareButton().classList.contains('share-none')).toBe(true);
    fireEvent.click(shareButton());
    expect(status()).toMatch(/can’t share.*Chrome or Safari.*screenshot/);
  });

  it('is hidden only on computers whose browser cannot share', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/styles.css'), 'utf8').replace(/\r\n/g, '\n');
    // Two class names each: `.btn` and `.field` come later in the file and
    // would win over one (they did, until a real browser showed it).
    const rule = css.match(/@media not all and \(pointer: coarse\) \{\s*\.image-buttons \.share-none \{\s*display: none;/);
    expect(rule).not.toBeNull();
    const coarse = css.match(
      /@media \(pointer: coarse\) \{\s*\.save-image \.save-name,\s*\.image-buttons \.btn-download \{\s*display: none;/,
    );
    expect(coarse).not.toBeNull();
  });
});

describe('when other wheels have results too', () => {
  it('asks whether to send those as well, with none ticked', async () => {
    scored({ life: LIFE, business: BUSINESS });
    const share = shareSheet();
    render(<App />);
    await picturesDrawn(calls, 2);
    fireEvent.click(shareButton());
    expect(share).not.toHaveBeenCalled();
    const dialog = screen.getByRole('dialog', { name: 'Share your other wheels too?' });
    expect(dialog.textContent).toContain(
      'You also have results on your Wheel of Business. Tick it to send it with your Wheel of Life.',
    );
    const boxes = within(dialog).getAllByRole('checkbox');
    expect(boxes.map((b) => b.closest('label').textContent)).toEqual(['Wheel of Business']);
    expect(boxes.every((b) => !b.checked)).toBe(true);
    expect(within(dialog).getByRole('button', { name: 'Share this wheel' })).toBeTruthy();
  });

  it('sends the ticked ones too, this wheel first, within the tap', async () => {
    scored({ life: LIFE, relationships: [0, 0, 0, 0, 0, 0, 0, 1], business: BUSINESS, active: 'business' });
    const share = shareSheet();
    render(<App />);
    await picturesDrawn(calls, 3);
    fireEvent.click(shareButton());
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getAllByRole('checkbox').map((b) => b.closest('label').textContent)).toEqual([
      'Wheel of Life',
      'Wheel of Relationships',
    ]);
    fireEvent.click(within(dialog).getByLabelText('Wheel of Life'));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Share 2 wheels' }));
    expect(share).toHaveBeenCalledTimes(1);
    const data = share.mock.calls[0][0];
    expect(data.files.map((f) => f.name)).toEqual(['NeuroDapt - Wheel of Business.png', 'NeuroDapt - Wheel of Life.png']);
    expect(data.title).toBe('My Wheel of Business and Wheel of Life');
    expect(data.text).toMatch(/: https:\/\/wheels\.neurodapt\.au\/$/);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('counts what is ticked, and unticking takes it off again', async () => {
    scored({ life: LIFE, relationships: [1, 0, 0, 0, 0, 0, 0, 0], business: BUSINESS });
    const share = shareSheet();
    render(<App />);
    await picturesDrawn(calls, 3);
    fireEvent.click(shareButton());
    const dialog = screen.getByRole('dialog');
    expect(dialog.textContent).toContain(
      'You also have results on these wheels. Tick any you’d like to send with your Wheel of Life.',
    );
    fireEvent.click(within(dialog).getByLabelText('Wheel of Relationships'));
    fireEvent.click(within(dialog).getByLabelText('Wheel of Business'));
    expect(within(dialog).getByRole('button', { name: 'Share 3 wheels' })).toBeTruthy();
    fireEvent.click(within(dialog).getByLabelText('Wheel of Relationships'));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Share 2 wheels' }));
    expect(share.mock.calls[0][0].files.map((f) => f.name)).toEqual([
      'NeuroDapt - Wheel of Life.png',
      'NeuroDapt - Wheel of Business.png',
    ]);
  });

  it('“Share this wheel” sends only the open one', async () => {
    scored({ life: LIFE, business: BUSINESS });
    const share = shareSheet();
    render(<App />);
    await picturesDrawn(calls, 2);
    fireEvent.click(shareButton());
    fireEvent.click(screen.getByRole('button', { name: 'Share this wheel' }));
    expect(share.mock.calls[0][0].files.map((f) => f.name)).toEqual(['NeuroDapt - Wheel of Life.png']);
  });

  it('Cancel, Escape and a tap outside close it without sharing', async () => {
    scored({ life: LIFE, business: BUSINESS });
    const share = shareSheet();
    render(<App />);
    fireEvent.click(shareButton());
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(shareButton());
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(shareButton());
    fireEvent.click(screen.getByLabelText('Wheel of Business'));
    fireEvent.click(screen.getByRole('heading', { name: 'Share your other wheels too?' }));
    expect(screen.getByRole('dialog')).toBeTruthy(); // a tap inside keeps it
    fireEvent.click(screen.getByRole('dialog'));
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(shareButton());
    expect(screen.getByLabelText('Wheel of Business').checked).toBe(false); // asked afresh
    expect(share).not.toHaveBeenCalled();
  });

  it('uses the browser’s own pop-up, and closes it properly', async () => {
    const showModal = vi.fn(function () {
      this.setAttribute('open', '');
    });
    const close = vi.fn(function () {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    });
    HTMLDialogElement.prototype.showModal = showModal;
    HTMLDialogElement.prototype.close = close;
    try {
      scored({ life: LIFE, business: BUSINESS });
      shareSheet();
      render(<App />);
      fireEvent.click(shareButton());
      expect(showModal).toHaveBeenCalledTimes(1);
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(close).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('dialog')).toBeNull();
      // The browser closing it itself (Android's back gesture): it is gone,
      // and the next tap asks again.
      fireEvent.click(shareButton());
      screen.getByRole('dialog').close();
      await waitFor(() => expect(document.querySelector('dialog')).toBeNull());
      fireEvent.click(shareButton());
      expect(screen.getByRole('dialog', { name: 'Share your other wheels too?' })).toBeTruthy();
      expect(showModal).toHaveBeenCalledTimes(3);
    } finally {
      delete HTMLDialogElement.prototype.showModal;
      delete HTMLDialogElement.prototype.close;
    }
  });

  it('waits for the pictures when they are not ready, and says to tap again if the browser then refuses', async () => {
    scored({ life: LIFE, business: BUSINESS });
    const share = shareSheet({ outcome: 'NotAllowedError' });
    render(<App />);
    fireEvent.click(shareButton());
    fireEvent.click(screen.getByLabelText('Wheel of Business'));
    fireEvent.click(screen.getByRole('button', { name: 'Share 2 wheels' }));
    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    const dialog = screen.getByRole('dialog');
    await waitFor(() => expect(dialog.textContent).toContain('Your pictures are ready: tap Share again.'));
    share.mockImplementation(() => Promise.resolve());
    fireEvent.click(within(dialog).getByRole('button', { name: 'Share 2 wheels' }));
    expect(share).toHaveBeenCalledTimes(2);
    expect(share.mock.calls[1][0].files).toHaveLength(2);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shares in words too, where pictures cannot be shared', () => {
    scored({ life: LIFE, business: BUSINESS });
    const share = shareSheet({ files: false });
    render(<App />);
    fireEvent.click(shareButton());
    fireEvent.click(screen.getByLabelText('Wheel of Business'));
    fireEvent.click(screen.getByRole('button', { name: 'Share 2 wheels' }));
    expect(share).toHaveBeenCalledTimes(1);
    const { text } = share.mock.calls[0][0];
    expect(text).toContain('Wheel of Life\n');
    expect(text).toContain('Wheel of Business\n');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
