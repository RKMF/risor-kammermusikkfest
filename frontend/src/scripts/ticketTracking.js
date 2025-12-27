/**
 * Ticket Click Tracking
 *
 * Tracks which concerts generate ticket link clicks using Vercel Analytics.
 * This is aggregate data only - no individual user tracking.
 *
 * Dashboard: Vercel > Project > Analytics > Events > "TicketClick"
 */

import { track } from '@vercel/analytics';

document.addEventListener('click', (e) => {
  const link = e.target.closest('[data-track-ticket]');
  if (!link) return;

  track('TicketClick', {
    concert: link.dataset.concert || 'Unknown',
  });
});
