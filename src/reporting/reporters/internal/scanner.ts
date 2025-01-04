// Import Third-party Dependencies
import { Logger, type Payload, ScannerLoggerEvents } from "@nodesecure/scanner";
import Spinner from "@topcli/spinner";
import pluralize from "pluralize";
import ms from "pretty-ms";

// Import Internal Dependencies
import { consolePrinter } from "../../../../lib/console-printer/index.js";
import { Nsci } from "../../../configuration/standard/index.js";
import type { Reporter } from "../reporter.js";

/**
 * This report has nothing to do with console or html reporters. This function
 * is used to print out @nodesecure/scanner's events on project analysis.
 * Consequently, this process is before and independent of the process of
 * reporting either in console or in a .html file.
 * @param logger
 */
export function reportScannerLoggerEvents(logger: Logger): void {
  const startMessage = consolePrinter.util.concatOutputs([
    consolePrinter.font.highlight("@nodesecure/scanner").bold().underline()
      .message,
    consolePrinter.font.standard("Analysis started").bold().message
  ]);
  /**
   * The Spinner internally requires a TTY terminal (i.e. when Node.js
   * detects that it is being run with a text terminal ("TTY") attached, the
   * process.stdout.isTTY is "true").
   * In the context of CI pipelines, this program could be run without a TTY.
   * see: https://nodejs.org/api/tty.html
   */
  let spinner: Spinner;
  if (process.stdout.isTTY) {
    spinner = new Spinner({
      text: startMessage.message
    });
  }

  logger.once("start", () => {
    consolePrinter.util.emptyLine();
    if (!spinner) {
      startMessage.printWithEmptyLine();

      return;
    }
    spinner.start();
  });

  logger.once(ScannerLoggerEvents.done, () => {
    const endMessage = consolePrinter.util.concatOutputs([
      consolePrinter.font.highlight("@nodesecure/scanner").bold().underline()
        .message,
      consolePrinter.font.standard("Analysis ended").bold().message
    ]);

    if (!spinner) {
      endMessage.printWithEmptyLine();

      return;
    }

    const { elapsedTime } = spinner;
    const endMessageWithElapsedTime = consolePrinter.util.concatOutputs([
      endMessage.message,
      consolePrinter.font
        .info(`${ms(elapsedTime)}`)
        .italic()
        .bold().message
    ]).message;

    spinner.succeed(endMessageWithElapsedTime);
  });
}

function reportScannerDependencies(payload: Payload): void {
  const { dependencies } = payload;
  const numberOfDeps = Object.keys(dependencies).length;
  consolePrinter.util
    .concatOutputs([
      consolePrinter.font
        .highlight(`${numberOfDeps} ${pluralize("dependencies", numberOfDeps)}`)
        .bold().message,
      consolePrinter.font.standard(`analyzed from`).message,
      consolePrinter.font.info(payload.rootDependencyName ?? "unknown").message
    ])
    .printWithEmptyLine();
}

function reportScannerAnalysis(_payload: unknown): (log: Logger) => Generator {
  return function* report(
    logger: Logger
  ): Generator<undefined, never, Payload> {
    while (true) {
      reportScannerLoggerEvents(logger);
      reportScannerDependencies((yield) as Payload);
    }
  };
}

export const scannerReporter: Reporter<
  undefined,
  (logger: Logger) => Generator
> = {
  type: Nsci.reporterTarget.CONSOLE,
  report: reportScannerAnalysis
};
