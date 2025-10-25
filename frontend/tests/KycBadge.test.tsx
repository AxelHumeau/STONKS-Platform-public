import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import KycBadge from '../components/KycBadge';

describe('KycBadge', () => {
  it('shows approved badge for addresses ending with a', async () => {
    render(<KycBadge address={'0x1234567890abcdef1234567890abcdef12345a'} />);
    // tooltip should eventually show approved message
    await waitFor(() => expect(screen.getByLabelText(/kyc-status-approved/)).toBeInTheDocument());
  });

  it('refreshes on click and shows spinner', async () => {
    render(<KycBadge address={'0x1234567890abcdef1234567890abcdef12345c'} />);
    const button = await screen.findByRole('button');
    fireEvent.click(button);
    // spinner present while loading
    expect(button.querySelector('.animate-spin')).toBeTruthy();
    await waitFor(() => expect(screen.getByLabelText(/kyc-status-pending/)).toBeInTheDocument());
  });
});
