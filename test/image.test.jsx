import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../src/App.jsx';
import { WHEELS } from '../src/wheels/config.js';
import { downloadImage, renderWheelImage } from '../src/wheels/exportImage.js';
import { fakeCanvas as drawOn, InstantImage } from './fake-canvas.js';

const blob = new Blob(['png'], { type: 'image/png' });
const fakeCanvas = () => drawOn(blob);

let click;
beforeEach(() => {
  vi.stubGlobal('Image', InstantImage);
  URL.createObjectURL = vi.fn(() => 'blob:fake');
  URL.revokeObjectURL = vi.fn();
  click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('saving the image', () => {
  it('downloads it under the given name', () => {
    downloadImage(blob, 'NeuroDapt - Wheel of Life.png');
    expect(click).toHaveBeenCalledTimes(1);
    const anchor = click.mock.contexts[0];
    expect(anchor.download).toBe('NeuroDapt - Wheel of Life.png');
    expect(anchor.href).toBe('blob:fake');
    expect(anchor.isConnected).toBe(false);
  });

  it('keeps the download link alive long enough for the browser to save it', () => {
    vi.useFakeTimers();
    downloadImage(blob, 'a.png');
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(60_000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake');
  });
});

describe('drawing the image', () => {
  it('draws the title, label, date and every score, and no average', async () => {
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
    expect(count('53%')).toBe(0); // what the average of 80,40,100,60,20,80,40,0 would be
    expect(calls.text.some((t) => /average/i.test(t))).toBe(false);
    for (const s of wheel.slices) expect(calls.text).toContain(s.name);
  });
});

describe('the Download button', () => {
  it('downloads the open wheel under the name typed, and says so', async () => {
    fakeCanvas();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Business' }));
    fireEvent.change(screen.getByLabelText(/Name your image/), { target: { value: 'week 6' } });
    const button = screen.getByRole('button', { name: /Download image/ });
    fireEvent.click(button);
    await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
    expect(click.mock.contexts[0].download).toBe('NeuroDapt - Wheel of Business - Week 6.png');
    expect(screen.getByText('Downloading “NeuroDapt - Wheel of Business - Week 6.png”.')).toBeTruthy();
    expect(button.disabled).toBe(false);
  });

  it('says so, and becomes usable again, when this device cannot make the image', async () => {
    render(<App />);
    const button = screen.getByRole('button', { name: /Download image/ });
    fireEvent.click(button);
    await waitFor(() => expect(screen.getByText(/could not be made/)).toBeTruthy());
    expect(button.disabled).toBe(false);
    expect(click).not.toHaveBeenCalled();
  });
});
