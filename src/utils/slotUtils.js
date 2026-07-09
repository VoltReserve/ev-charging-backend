const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const isValidDate = (date) => DATE_REGEX.test(date);

export const isValidTime = (time) => TIME_REGEX.test(time);

export const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

export const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export const generateDaySlots = (slotDuration) => {
  const slots = [];
  const dayMinutes = 24 * 60;
  let start = 0;

  while (start + slotDuration <= dayMinutes) {
    const end = start + slotDuration;
    slots.push({
      startTime: minutesToTime(start),
      endTime: minutesToTime(end),
    });
    start = end;
  }

  return slots;
};

export const combineDateAndTime = (dateStr, timeStr) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
};

export const getDayRange = (dateStr) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day, 23, 59, 59, 999);
  return { start, end };
};

export const hasOverlap = (newStart, newEnd, existingStart, existingEnd) => {
  return newStart < existingEnd && newEnd > existingStart;
};

export const filterAvailableSlots = (allSlots, bookedBookings, dateStr) => {
  const now = new Date();
  const isToday =
    dateStr ===
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return allSlots.filter((slot) => {
    const slotStart = combineDateAndTime(dateStr, slot.startTime);
    const slotEnd = combineDateAndTime(dateStr, slot.endTime);

    if (isToday && slotStart <= now) {
      return false;
    }

    const isBooked = bookedBookings.some((booking) =>
      hasOverlap(slotStart, slotEnd, booking.startTime, booking.endTime)
    );

    return !isBooked;
  });
};
