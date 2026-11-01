// Notification service. Constraints come from the approved handoff.json.

// REQ-001: provider maximum batch size is 20 messages.
export const MAX_BATCH_SIZE = 20;

// REQ-006 / REQ-007: neutral message with no clinical content
// (no diagnosis, test name, result value, medication, treatment or other detail).
export const NEUTRAL_MESSAGE = 'An update is available in your secure portal.';

// REQ-005: notify only when the result is both reviewed and released.
export function buildNotification(result) {
  if (!result || result.reviewed !== true || result.released !== true) {
    return { eligible: false, body: '' };
  }
  // REQ-007: the body is fixed and never built from result fields.
  return { eligible: true, body: NEUTRAL_MESSAGE };
}

// REQ-001: split into consecutive batches of at most MAX_BATCH_SIZE,
// filling each batch before starting the next, preserving order,
// without mutating the input.
export function scheduleBatches(items) {
  const batches = [];
  for (let i = 0; i < items.length; i += MAX_BATCH_SIZE) {
    batches.push(items.slice(i, i + MAX_BATCH_SIZE));
  }
  return batches;
}
