// Import Third-party dependencies
import Validator from "ajv";
import JSXray from "@nodesecure/js-x-ray";

export class IgnorePatterns {
  public warnings: IgnoreWarningsPatterns;

  constructor(warnings: IgnoreWarningsPatterns = new IgnoreWarningsPatterns()) {
    this.warnings = warnings;
  }

  static default(): IgnorePatterns {
    return new IgnorePatterns();
  }
}

export class IgnoreWarningsPatterns {
  public entries: Record<JSXray.WarningName, string[]>;

  constructor(entries: Record<string, string[]> = {}) {
    this.entries = entries;
  }

  has(warning: JSXray.WarningName, pkg: string): boolean {
    return this.entries[warning]?.includes(pkg);
  }
}

const kIgnoreFileSchema = {
  type: "object",
  properties: {
    warnings: {
      type: "object",
      patternProperties: {
        "^[0-9]{2,6}$": {
          type: "array",
          items: {
            type: "string"
          }
        }
      }
    }
  },
  additionalProperties: false
} as const;

export const kIgnoreFileName = ".nsci-ignore";

export function validateIgnoreFile(ignoreFile: string): {
  isValid: boolean;
  error?: string;
} {
  const validator = new Validator();
  const validate = validator.compile(kIgnoreFileSchema);
  const isValid = validate(ignoreFile);

  return {
    isValid,
    error: validate.errors ? validate?.errors[0]?.message : undefined
  };
}
