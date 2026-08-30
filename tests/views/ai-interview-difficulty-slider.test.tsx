import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import part2 from '@/messages/zh/edit/part2';
import DifficultySlider from '@/views/edit/components/aiInterview/DifficultySlider';

const messages = { Edit: { aiInterview: part2.aiInterview } };

function renderSlider(
  value: 'easy' | 'medium' | 'hard',
  onChange: (v: 'easy' | 'medium' | 'hard') => void = () => {},
) {
  return render(
    <NextIntlClientProvider locale='zh' messages={messages}>
      <DifficultySlider value={value} onChange={onChange} />
    </NextIntlClientProvider>,
  );
}

describe('DifficultySlider', () => {
  it('renders three difficulty labels', () => {
    renderSlider('medium');
    expect(screen.getByText('简单')).toBeInTheDocument();
    expect(screen.getByText('中等')).toBeInTheDocument();
    expect(screen.getByText('困难')).toBeInTheDocument();
    expect(screen.getByText(/平衡深挖/)).toBeInTheDocument();
  });

  it('clicking label changes difficulty', () => {
    const onChange = vi.fn();
    renderSlider('medium', onChange);
    fireEvent.click(screen.getByText('困难'));
    expect(onChange).toHaveBeenCalledWith('hard');
    fireEvent.click(screen.getByText('简单'));
    expect(onChange).toHaveBeenCalledWith('easy');
  });

  it('supports keyboard arrows on slider', () => {
    const onChange = vi.fn();
    renderSlider('medium', onChange);
    const slider = screen.getByRole('slider');
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('hard');
    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenCalledWith('easy');
  });

  it('pointer drag on track snaps to nearest level', () => {
    const onChange = vi.fn();
    renderSlider('medium', onChange);
    const slider = screen.getByRole('slider');
    Object.defineProperty(slider, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        left: 0,
        width: 300,
        top: 0,
        height: 44,
        right: 300,
        bottom: 44,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    });
    const down = createEvent.pointerDown(slider, { pointerId: 1 });
    Object.defineProperty(down, 'clientX', { value: 10 });
    fireEvent(slider, down);
    expect(onChange).toHaveBeenCalledWith('easy');
    const move = createEvent.pointerMove(slider, { pointerId: 1 });
    Object.defineProperty(move, 'clientX', { value: 290 });
    fireEvent(slider, move);
    expect(onChange).toHaveBeenCalledWith('hard');
  });
});
