import pino, { Logger as PinoLogger, LoggerOptions } from 'pino';
import * as fs from 'fs';
import * as path from 'path';

type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';

const LOG_LEVELS: { [K in LogLevel]: LogLevel } = {
  fatal: 'fatal',
  error: 'error',
  warn: 'warn',
  info: 'info',
  debug: 'debug',
  trace: 'trace',
  silent: 'silent',
};

function validatePackageJsonName(packageJson: unknown): packageJson is { name: string } {
  if (packageJson && typeof packageJson === 'object') {
    if ('name' in packageJson) {
      if (typeof packageJson.name === 'string') return true;
    }
  }
  return false;
}

function getPackageJsonName(): string {
  const packageJsonPath: string = path.resolve(process.cwd(), 'package.json');
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const appPackageJson: unknown = require(packageJsonPath);
  if (validatePackageJsonName(appPackageJson)) {
    return appPackageJson.name;
  }
  return 'default';
}

function getLogDestination() {
  let { LOG_DESTINATION: logDestination = 'stdout' } = process.env;
  if (!logDestination) {
    const appName: string = getPackageJsonName();
    logDestination = path.resolve(`/var/log/greenion/${appName}.log`);
  }
  return logDestination;
}

function isLogLevel(str: unknown): str is LogLevel {
  if (str && typeof str === 'string' && str in LOG_LEVELS) return true;
  return false;
}

function getLogLevel(fallback?: LogLevel): LogLevel {
  if (isLogLevel(process.env.LOG_LEVEL)) {
    return process.env.LOG_LEVEL;
  }
  return fallback || LOG_LEVELS.info;
}

interface Logger extends PinoLogger {
  _: { [label: string]: PinoLogger };
}

function createLogFileIfNeeded() {
  const filePath = getLogDestination();
  // Check file exist or create file
  if (!fs.existsSync(filePath) && filePath !== 'stdout') {
    fs.writeFileSync(filePath, '');
  }
}

function logMethod(this: PinoLogger, args: Parameters<pino.LogFn>, method: pino.LogFn) {
  /**
   * We kinda miss-use pino here:
   * theoretical usage of pino would be: ([mergingObject], [message], [...interpolationValues]).
   * but we use it like that: ([message: string], [...interpolationValues: any[]]).
   * this hook tries to stringify all interpolationValues into the final message to print
   *
   * + by doing that, we have a one-line pretty-print option guaranteed, which can be useful for log exploration,
   *   but since we use json format to log to files, it's not really useful anymore
   * - but by doing that, we loose the possibility to add custom fields to json-printed logs,
   *   which could be a really powerful logging feature
   *
   */
  const identifier = ' %j'.repeat(args.length - 1);
  // eslint-disable-next-line no-param-reassign
  args[0] += identifier;
  method.apply(this, args);
}

function getConfig(): LoggerOptions {
  const logLevel: LogLevel = getLogLevel();
  const destinationFile: string = getLogDestination();

  if (destinationFile === 'stdout') {
    return {
      hooks: { logMethod },
      level: logLevel,
      transport: {
        target: 'pino-pretty', // that require pino-pretty to be in deps
        options: {
          colorize: true,
          messageFormat: '[35m{labelPrefix}[36m{msg}',
          translateTime: 'yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname,label,labelPrefix',
        },
      },
    };
  }
  return {
    hooks: { logMethod },
    level: logLevel,
  };
}

function getDestinationStream() {
  const logDestination: string = getLogDestination();
  if (logDestination === 'stdout' || process.env.FORCE_STDOUT) return undefined;

  console.log('Reloading access log:', logDestination);
  return pino.destination(logDestination);
}

function getLogger(): Logger {
  createLogFileIfNeeded();
  const config = getConfig();
  const destinationStream = getDestinationStream();
  let pinoLogger: PinoLogger;

  if (destinationStream) {
    pinoLogger = pino(config, destinationStream);
    process.on('SIGHUP', () => destinationStream.reopen());
  } else {
    pinoLogger = pino(config);
  }

  const logger: Logger = Object.assign(pinoLogger, {
    _: new Proxy(
      {},
      {
        get: (obj, prop: string) => pinoLogger.child({ label: prop, labelPrefix: `[${prop}] ` }),
      }
    ),
  });
  return logger;
}

const logger = getLogger();

process.on('unhandledRejection', (error: any) => {
  logger.fatal(
    'unhandledRejection',
    error.message || error.status || error.statusCode || 'Unknown error'
  );
});

export { logger };

export type { Logger, LogLevel };
