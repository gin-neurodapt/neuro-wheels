import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../src/App.jsx';
import { WHEELS } from '../src/wheels/config.js';
import { deliverImage, renderWheelImage } from '../src/wheels/exportImage.js';

const blob = new Blob(['png'], { type: 'image/png' });

function setTouch(isTouch) {
  window.matchMedia = vi.fn((q) => ({ matches: isTouch && q.includes('coarse'), media: q }));
}

function setShare({ canShare = true, share } = {}) {
  navigator.canShare = vi.fn(() => canShare);
  navigator.share = share;
}

let click;
beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:fake');
  URL.revokeObjectURL = vi.fn();
  click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  delete window.matchMedia;
  delete navigator.canShare;
  delete navigator.share;
});

describe('getting the image to the person', () => {
  it('opens the share sheet on a phone', async () => {
    setTouch(true);
    const share = vi.fn(() => Promise.resolve());
    setShare({ share });
    await expect(deliverImage(blob, 'a.png')).resolves.toBe('shared');
    expect(share).toHaveBeenCalledTimes(1);
    expect(share.mock.calls[0][0].files[0].name).toBe('a.png');
    expect(click).not.toHaveBeenCalled();
  });

  it('does nothing more when the person cancels the share sheet', async () => {
    setTouch(true);
    setShare({ share: vi.fn(() => Promise.reject(new DOMException('cancel', 'AbortError'))) });
    await expect(deliverImage(blob, 'a.png')).resolves.toBe('cancelled');
    expect(click).not.toHaveBeenCalled();
  });

  it('downloads instead when the phone refuses to share', async () => {
    setTouch(true);
    setShare({ share: vi.fn(() => Promise.reject(new DOMException('no', 'NotAllowedError'))) });
    await expect(deliverImage(blob, 'a.png')).resolves.toBe('downloaded');
    expect(click).toHaveBeenCalledTimes(1);
  });

  it('downloads on a computer, without offering to share', async () => {
    setTouch(false);
    const share = vi.fn();
    setShare({ share });
    await expect(deliverImage(blob, 'NeuroDapt - Wheel of Life.png')).resolves.toBe('downloaded');
    expect(share).not.toHaveBeenCalled();
    const anchor = click.mock.contexts[0];
    expect(anchor.download).toBe('NeuroDapt - Wheel of Life.png');
  });

  it('keeps the download link alive long enough for the browser to save it', async () => {
    vi.useFakeTimers();
    setTouch(false);
    await deliverImage(blob, 'a.png');
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(60_000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake');
  });
});

describe('drawing the image', () => {
  function fakeCanvas() {
    const calls = { text: [], strokes: 0 };
    const ctx = new Proxy(
      {
        fillText: (t) => calls.text.push(String(t)),
        measureText: (t) => ({ width: String(t).length * 10 }),
        stroke: () => calls.strokes++,
      },
      { get: (target, key) => (key in target ? target[key] : () => {}), set: () => true },
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) => cb(blob));
    globalThis.Path2D = class {};
    return calls;
  }

  it('draws the title, label, date, every score and the average', async () => {
    const calls = fakeCanvas();
    const wheel = WHEELS[0];
    const levels = [4, 2, 5, 3, 1, 4, 2, 0];
    const out = await renderWheelImage({ wheel, levels, label: 'week 5', date: new Date(2026, 9, 14) });
    expect(out).toBe(blob);
    expect(calls.text).toContain('Wheel of Life');
    expect(calls.text.some((t) => t.includes('Week 5') && t.includes('14 October 2026'))).toBe(true);
    // Each score is drawn twice: beside the wheel and in the list below it.
    const count = (t) => calls.text.filter((x) => x === t).length;
    expect({ 80: count('80%'), 40: count('40%'), 100: count('100%'), 60: count('60%'), 20: count('20%'), 0: count('0%') }).toEqual({
      80: 4,
      40: 4,
      100: 2,
      60: 2,
      20: 2,
      0: 2,
    });
    expect(count('53%')).toBe(1); // the average of 80,40,100,60,20,80,40,0
    for (const s of wheel.slices) expect(calls.text).toContain(s.name);
  });
});

describe('the Download button', () => {
  it('says so, and becomes usable again, when this device cannot make the image', async () => {
    setTouch(false);
    render(<App />);
    const button = screen.getByRole('button', { name: /Download image/ });
    fireEvent.click(button);
    await waitFor(() => expect(screen.getByText(/could not be made/)).toBeTruthy());
    expect(button.disabled).toBe(false);
  });
});
