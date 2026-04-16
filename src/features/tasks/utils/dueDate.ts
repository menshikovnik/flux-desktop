export function toLocalDateInputValue(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;
}

export function toLocalTimeInputValue(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  return `${`${date.getHours()}`.padStart(2, "0")}:${`${date.getMinutes()}`.padStart(2, "0")}`;
}

export function serializeDueDate(
  dateValue: string,
  timeValue?: string | null,
  options?: { dateOnlyWhenTimeMissing?: boolean },
) {
  if (!dateValue) return null;

  if (!timeValue && options?.dateOnlyWhenTimeMissing) {
    return dateValue;
  }

  const [year, month, day] = dateValue.split("-").map(Number);
  const [hours, minutes] = (timeValue || "23:59").split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0).toISOString();
}
