import { describe, expect, it, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import App from '../src/App.jsx';
import { STORAGE_KEY } from '../src/wheels/storage.js';

function segment(container, slice, level) {
  return container.querySelector(`path.segment[data-slice="${slice}"][data-level="${level}"]`);
}

function rowValue(name) {
  const row = screen.getByText(name, { selector: '.score-name' }).closest('li');
  return within(row).getByText(/%$/, { selector: 'output' }).textContent;
}

describe('the wheel page', () => {
  it('scores an area when a ring is tapped, and clears it when tapped again', () => {
    const { container } = render(<App />);
    fireEvent.click(segment(container, 0, 3));
    expect(rowValue('Family')).toBe('60%');
    expect(segment(container, 0, 3).getAttribute('fill')).toBe('#B2E5DD');
    expect(segment(container, 0, 4).getAttribute('fill')).toBe('#ffffff');

    fireEvent.click(segment(container, 0, 3));
    expect(rowValue('Family')).toBe('0%');
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

  it('keeps each wheel’s scores separate', () => {
    const { container } = render(<App />);
    fireEvent.click(segment(container, 0, 4));
    fireEvent.click(screen.getByRole('button', { name: 'Business' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveProperty('textContent', 'Wheel of Business');
    expect(rowValue('Profit Margin')).toBe('0%');
    expect(window.location.hash).toBe('#business');
    fireEvent.click(screen.getByRole('button', { name: 'Life' }));
    expect(rowValue('Family')).toBe('80%');
  });

  it('remembers scores on this device across a reload', () => {
    const first = render(<App />);
    fireEvent.click(segment(first.container, 2, 5));
    first.unmount();
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)).scores.life[2]).toBe(5);

    render(<App />);
    expect(rowValue('Purpose')).toBe('100%');
  });

  it('opens the wheel named in the address', () => {
    window.history.replaceState(null, '', '/#relationships');
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveProperty('textContent', 'Wheel of Relationships');
    expect(screen.getByRole('button', { name: 'Relationships' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('resets one wheel only after confirming, leaving the others', () => {
    const { container } = render(<App />);
    fireEvent.click(segment(container, 0, 2));
    fireEvent.click(screen.getByRole('button', { name: 'Business' }));
    fireEvent.click(segment(container, 0, 5));

    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    fireEvent.click(screen.getByRole('button', { name: /Reset wheel/ }));
    expect(rowValue('Profit Margin')).toBe('100%');
    fireEvent.click(screen.getByRole('button', { name: /Reset wheel/ }));
    expect(rowValue('Profit Margin')).toBe('0%');
    confirm.mockRestore();

    fireEvent.click(screen.getByRole('button', { name: 'Life' }));
    expect(rowValue('Family')).toBe('40%');
  });

  it('resets every wheel with Reset all', () => {
    const { container } = render(<App />);
    fireEvent.click(segment(container, 0, 2));
    fireEvent.click(screen.getByRole('button', { name: 'Business' }));
    fireEvent.click(segment(container, 0, 5));
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Reset all' }));
    confirm.mockRestore();
    expect(rowValue('Profit Margin')).toBe('0%');
    fireEvent.click(screen.getByRole('button', { name: 'Life' }));
    expect(rowValue('Family')).toBe('0%');
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
