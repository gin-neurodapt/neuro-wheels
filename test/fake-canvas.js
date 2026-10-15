import { vi } from 'vitest';

// jsdom cannot draw. This canvas records the words drawn and hands back a
// stand-in PNG, so the drawing code runs as it would in a browser.
export function fakeCanvas(blob = new Blob(['png'], { type: 'image/png' })) {
  const calls = { text: [], strokes: 0, blobs: 0 };
  const ctx = new Proxy(
    {
      fillText: (t) => calls.text.push(String(t)),
      measureText: (t) => ({ width: String(t).length * 10 }),
      stroke: () => calls.strokes++,
    },
    { get: (target, key) => (key in target ? target[key] : () => {}), set: () => true },
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) => {
    calls.blobs++;
    cb(blob);
  });
  globalThis.Path2D = class {};
  return calls;
}

// jsdom never loads images; the logo "loads" at once.
export class InstantImage {
  naturalWidth = 115;
  naturalHeight = 79;
  set src(_) {
    queueMicrotask(() => this.onload());
  }
}
