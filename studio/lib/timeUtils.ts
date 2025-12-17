/**
 * Generates time options for Sanity select fields
 * @param intervalMinutes - Interval between time options (default: 15)
 * @param startHour - Starting hour (default: 0)
 * @param endHour - Ending hour (default: 23)
 * @returns Array of time options with title and value
 */
export function generateTimeOptions(
  intervalMinutes: number = 15,
  startHour: number = 0,
  endHour: number = 23
) {
  const options: Array<{ title: string; value: string }> = [];

  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minutes = 0; minutes < 60; minutes += intervalMinutes) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      options.push({
        title: timeString,
        value: timeString,
      });
    }
  }

  return options;
}

/**
 * Standard time options for events (06:00 - 23:45 in 15-minute intervals)
 */
export const eventTimeOptions = generateTimeOptions(15, 6, 23);
