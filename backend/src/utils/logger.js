const config = require("../config");

class Logger {
  static info(message, meta = {}) {
    console.log(
      JSON.stringify({
        level: "info",
        message,
        timestamp: new Date().toISOString(),
        ...meta,
      })
    );
  }

  static error(message, error = null, meta = {}) {
    console.error(
      JSON.stringify({
        level: "error",
        message,
        error: error
          ? {
              message: error.message,
              stack: error.stack,
              ...error,
            }
          : null,
        timestamp: new Date().toISOString(),
        ...meta,
      })
    );
  }

  static warn(message, meta = {}) {
    console.warn(
      JSON.stringify({
        level: "warn",
        message,
        timestamp: new Date().toISOString(),
        ...meta,
      })
    );
  }

  static debug(message, meta = {}) {
    if (config.nodeEnv === "development") {
      console.log(
        JSON.stringify({
          level: "debug",
          message,
          timestamp: new Date().toISOString(),
          ...meta,
        })
      );
    }
  }
}

module.exports = Logger;
