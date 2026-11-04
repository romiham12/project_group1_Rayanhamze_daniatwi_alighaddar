class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function parseId(value) {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new HttpError(400, 'ID must be a positive integer');
  }

  const id = Number(value);
  if (!Number.isSafeInteger(id)) {
    throw new HttpError(400, 'ID is outside the supported range');
  }

  return id;
}

function validateInput(body, allowedFields, requiredFields = []) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Request body must be a JSON object');
  }

  const unknownFields = Object.keys(body).filter(
    (field) => !allowedFields.includes(field)
  );
  if (unknownFields.length > 0) {
    throw new HttpError(400, `Unknown field(s): ${unknownFields.join(', ')}`);
  }

  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      throw new HttpError(400, `${field} is required`);
    }
  }

  if (Object.keys(body).length === 0) {
    throw new HttpError(400, 'Request body must contain at least one field');
  }

  return body;
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'Request body contains invalid JSON' });
  }

  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: error.message });
  }

  const databaseErrors = {
    '22P02': [400, 'Invalid value for a database field'],
    '23502': [400, 'A required database field is missing'],
    '23503': [400, 'A referenced record does not exist or is still in use'],
    '23505': [409, 'A record with the supplied unique value already exists'],
    '23514': [400, 'A value does not meet a database constraint']
  };

  if (databaseErrors[error.code]) {
    const [status, message] = databaseErrors[error.code];
    return res.status(status).json({ error: message });
  }

  console.error('Unhandled API error:', error);
  return res.status(500).json({ error: 'Internal server error' });
}

module.exports = { HttpError, asyncHandler, errorHandler, parseId, validateInput };
