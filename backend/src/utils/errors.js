export const fail = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};
export const positiveId = (value) => {
  if (
    !/^\d+$/.test(String(value)) ||
    !Number.isSafeInteger(Number(value)) ||
    Number(value) < 1
  )
    fail(400, "Identificador inválido.");
  return Number(value);
};
export const handle = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res)).catch(next);
