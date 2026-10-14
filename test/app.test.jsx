import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within, fireEvent, act } from '@testing-library/react';
import App from '../src/App.jsx';
import { STORAGE_KEY, serializeState, initialState } from '../src/wheels/storage.js';

function segment(container, slice, level) {
  return container.querySelector(`path.segment[data-slice="${slice}"][data-level="${level}"]`);
}

function rowValue(name) {
  const row = screen.getByText(name, { selector: '.score-name' }).closest('li');
  return within(row).getByText(/%$/, { selector: 'output' }).textContent;
}

// jsdom lays nothing out, so every element is 0px wide. Give the wheel's
// column a width to see what each screen size gets.
function withColumnWidth(px) {
  return vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(px);
}

afterEach(() => vi.restoreAllMocks());

describe('the wheel page', () => {
  it('scores an area when a ring is tapped, and clears it when tapped again', () => {
    const { container } = render(<App />);
    fireEvent.click(segment(container, 0, 3));
    expect(rowValue('Family')).toBe('60%');
    expect(segment(container, 0, 3).getAttribute('fill')).toBe('#B2E5DD');
    expect(segment(container, 0, 4).getAttribute('fill')).toBe('#ffffff');
    expect(container.querySelector('.score-arcs path[data-slice="0"]')).not.toBe(null);

    fireEvent.click(segment(container, 0, 3));
    expect(rowValue('Family')).toBe('0%');
    expect(container.querySelector('.score-arcs path[data-slice="0"]')).toBe(null);
  });

  it('lowers the score when a lower ring is tapped', () => {
    const { container } = render(<App />);
    fireEvent.click(segment(container, 1, 5));
    fireEvent.click(segment(container, 1, 2));
    expect(rowValue('Relationship')).toBe('40%');
  });

  it('changes scores with the + and − buttons', () => {
    render(<App />);
    const raise = screen.getByRole('button', { name: 'Raise Career' });
    fireEvent.click(raise);
    fireEvent.click(raise);
    expect(rowValue('Career')).toBe('40%');
    fireEvent.click(screen.getByRole('button', { name: 'Lower Career' }));
    expect(rowValue('Career')).toBe('20%');
    expect(screen.getByRole('button', { name: 'Lower Finance' }).disabled).toBe(true);
  });

  it('tells screen readers what changed, once', () => {
    const { container } = render(<App />);
    fireEvent.click(segment(container, 0, 3));
    const status = container.querySelector('.scores [role="status"]');
    expect(status.textContent).toBe('Family 60%');
    fireEvent.click(screen.getByRole('button', { name: 'Raise Purpose' }));
    expect(status.textContent).toBe('Purpose 20%');
    expect(container.querySelectorAll('output[aria-live]')).toHaveLength(0);
  });

  it('keeps each wheel’s scores separate', () => {
    const { container } = render(<App />);
    fireEvent.click(segment(container, 0, 4));
    fireEvent.click(screen.getByRole('button', { name: 'Business' }));
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Wheel of Business');
    expect(rowValue('Profit Margin')).toBe('0%');
    expect(window.location.hash).toBe('#business');
    fireEvent.click(screen.getByRole('button', { name: 'Life' }));
    expect(rowValue('Family')).toBe('80%');
  });

  it('remembers scores and the open wheel across a reload', () => {
    const first = render(<App />);
    fireEvent.click(segment(first.container, 2, 5));
    fireEvent.click(screen.getByRole('button', { name: 'Business' }));
    first.unmount();
    window.history.replaceState(null, '', '/');

    render(<App />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Wheel of Business');
    fireEvent.click(screen.getByRole('button', { name: 'Life' }));
    expect(rowValue('Purpose')).toBe('100%');
  });

  it('opens the wheel named in the address', () => {
    window.history.replaceState(null, '', '/#relationships');
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Wheel of Relationships');
    expect(screen.getByRole('button', { name: 'Relationships' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('follows the address when it changes', () => {
    render(<App />);
    act(() => {
      window.history.replaceState(null, '', '/#business');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Wheel of Business');
  });

  it('takes scores saved by another open tab, keeps its own wheel, and does not wipe them on its next change', () => {
    const { container } = render(<App />);
    fireEvent.click(segment(container, 0, 5)); // this tab: Life / Family 100%
    fireEvent.click(screen.getByRole('button', { name: 'Business' })); // then opens Business

    // The other tab, on Life, scores Relationship 40% (it saw Family too).
    const theirs = initialState();
    theirs.scores.life[0] = 5;
    theirs.scores.life[1] = 2;
    const value = serializeState(theirs);
    window.localStorage.setItem(STORAGE_KEY, value);
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: value }));
    });
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Wheel of Business');

    fireEvent.click(segment(container, 0, 3)); // this tab scores Profit Margin 60%
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    expect(saved.scores.business[0]).toBe(3);
    expect(saved.scores.life.slice(0, 2)).toEqual([5, 2]);
  });

  it('resets one wheel only after confirming, leaving the others', () => {
    const { container } = render(<App />);
    fireEvent.click(segment(container, 0, 2));
    fireEvent.click(screen.getByRole('button', { name: 'Business' }));
    fireEvent.click(segment(container, 0, 5));

    vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    fireEvent.click(screen.getByRole('button', { name: 'Reset this wheel' }));
    expect(rowValue('Profit Margin')).toBe('100%');
    fireEvent.click(screen.getByRole('button', { name: 'Reset this wheel' }));
    expect(rowValue('Profit Margin')).toBe('0%');

    fireEvent.click(screen.getByRole('button', { name: 'Life' }));
    expect(rowValue('Family')).toBe('40%');
  });

  it('resets every wheel with Reset all wheels', () => {
    const { container } = render(<App />);
    fireEvent.click(segment(container, 0, 2));
    fireEvent.click(screen.getByRole('button', { name: 'Business' }));
    fireEvent.click(segment(container, 0, 5));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Reset all wheels' }));
    expect(rowValue('Profit Margin')).toBe('0%');
    fireEvent.click(screen.getByRole('button', { name: 'Life' }));
    expect(rowValue('Family')).toBe('0%');
  });

  it('puts the wheel’s name and the wheel picker in the header, and shows no average', () => {
    render(<App />);
    const header = screen.getByRole('banner');
    expect(within(header).getByRole('heading', { level: 1 }).textContent).toBe('Wheel of Life');
    expect(within(header).getByRole('group', { name: 'Choose a wheel' })).toBeTruthy();
    fireEvent.click(within(header).getByRole('button', { name: 'Relationships' }));
    expect(within(header).getByRole('heading', { level: 1 }).textContent).toBe('Wheel of Relationships');
    expect(document.body.textContent).not.toMatch(/average/i);
  });

  it('opens an area’s description when its name is tapped, one at a time', () => {
    render(<App />);
    const family = screen.getByRole('button', { name: 'Family' });
    const purpose = screen.getByRole('button', { name: 'Purpose' });
    const about = (button) => document.getElementById(button.getAttribute('aria-controls'));
    expect(family.getAttribute('aria-expanded')).toBe('false');
    expect(about(family).hidden).toBe(true);

    fireEvent.click(family);
    expect(family.getAttribute('aria-expanded')).toBe('true');
    expect(about(family).hidden).toBe(false);
    expect(about(family).textContent).toMatch(/^The people you call family/);

    fireEvent.click(purpose);
    expect(about(purpose).hidden).toBe(false);
    expect(about(family).hidden).toBe(true);

    fireEvent.click(purpose);
    expect(about(purpose).hidden).toBe(true);
  });

  it('opens the same description when the area’s label on the wheel is tapped, without scoring it', () => {
    const { container } = render(<App />);
    fireEvent.click(container.querySelector('.labels g[data-slice="5"]'));
    const finance = screen.getByRole('button', { name: 'Finance' });
    expect(finance.getAttribute('aria-expanded')).toBe('true');
    expect(rowValue('Finance')).toBe('0%');
  });

  it('closes the description when another wheel is opened', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Family' }));
    fireEvent.click(screen.getByRole('button', { name: 'Business' }));
    expect([...document.querySelectorAll('.about')].every((p) => p.hidden)).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Life' }));
    expect([...document.querySelectorAll('.about')].every((p) => p.hidden)).toBe(true);
  });

  it('shows a description card while a mouse points at an area, and not for a finger', () => {
    vi.useFakeTimers();
    const { container } = render(<App />);
    const label = container.querySelector('.labels g[data-slice="2"]');
    fireEvent.pointerEnter(label, { pointerType: 'touch' });
    act(() => vi.advanceTimersByTime(1000));
    expect(container.querySelector('.area-card')).toBe(null);

    fireEvent.pointerEnter(label, { pointerType: 'mouse' });
    expect(container.querySelector('.area-card')).toBe(null); // not straight away
    act(() => vi.advanceTimersByTime(250));
    expect(container.querySelector('.area-card').textContent).toMatch(/^Purpose.*meaning and direction/);

    fireEvent.pointerLeave(label, { pointerType: 'mouse' });
    act(() => vi.advanceTimersByTime(10));
    expect(container.querySelector('.area-card')).toBe(null);

    // The list's names and percentages show it too.
    fireEvent.pointerEnter(screen.getByRole('button', { name: 'Career' }), { pointerType: 'mouse' });
    act(() => vi.advanceTimersByTime(250));
    expect(container.querySelector('.area-card').textContent).toMatch(/^Career/);
    vi.useRealTimers();
  });

  it('cleans the image name as it is typed', () => {
    render(<App />);
    const input = screen.getByLabelText(/Name your image/);
    fireEvent.change(input, { target: { value: 'Week/5?' } });
    expect(input.value).toBe('Week 5 ');
  });

  it('describes the wheel for screen readers', () => {
    const { container } = render(<App />);
    fireEvent.click(segment(container, 7, 1));
    expect(container.querySelector('svg[role="img"] title').textContent).toContain('Health & Fitness 20%');
  });
});

describe('names around the wheel', () => {
  it('shows names around the wheel on a wide screen', () => {
    withColumnWidth(1000);
    const { container } = render(<App />);
    const svg = container.querySelector('.chart svg');
    expect(svg.dataset.mode).toBe('full');
    const names = [...container.querySelectorAll('.label-name')].map((t) => t.textContent);
    expect(names).toContain('Family');
    expect(names).toContain('& Fitness');
    // Right-hand slices read outwards from the left, left-hand ones from the right.
    expect(container.querySelector('.labels g[data-slice="0"]').dataset.anchor).toBe('start');
    expect(container.querySelector('.labels g[data-slice="7"]').dataset.anchor).toBe('end');
  });

  it('shows icons and percentages only on a phone', () => {
    withColumnWidth(390);
    const { container } = render(<App />);
    expect(container.querySelector('.chart svg').dataset.mode).toBe('compact');
    expect(container.querySelectorAll('.label-name')).toHaveLength(0);
    expect(container.querySelectorAll('.label-value')).toHaveLength(8);
  });

  it('shows icons alone on a wheel too small for readable percentages', () => {
    withColumnWidth(250);
    const { container } = render(<App />);
    expect(container.querySelector('.chart svg').dataset.mode).toBe('icons');
    expect(container.querySelectorAll('.label-value')).toHaveLength(0);
    expect(container.querySelectorAll('.labels .label path')).toHaveLength(8);
  });

  it('does not move or resize the wheel when a score changes', () => {
    withColumnWidth(1000);
    const { container } = render(<App />);
    const svg = container.querySelector('.chart svg');
    const before = svg.getAttribute('viewBox');
    for (let i = 0; i < 8; i++) fireEvent.click(segment(container, i, 5));
    expect(svg.getAttribute('viewBox')).toBe(before);
  });
});
