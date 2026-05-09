const PREFIX = '[CrisisConnect]';

function detail(err) {
  if (err == null) return '';
  if (typeof err === 'string') return err;
  if (err.response?.data?.error) return err.response.data.error;
  if (err.message) return err.message;
  return String(err);
}

export const log = {
  debug: (...args) => {
    if (import.meta.env.DEV) console.debug(PREFIX, ...args);
  },
  info: (...args) => {
    if (import.meta.env.DEV) console.info(PREFIX, ...args);
  },
  warn: (...args) => console.warn(PREFIX, ...args),
  error: (message, err) => {
    const extra = err !== undefined ? detail(err) : '';
    console.error(PREFIX, message, extra || '');
  }
};
