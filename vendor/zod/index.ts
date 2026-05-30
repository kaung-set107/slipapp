type Issue = {
  code: string;
  message: string;
  path: Array<string | number>;
};

type ParseResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      issues: Issue[];
    };

export class ZodError extends Error {
  issues: Issue[];

  constructor(issues: Issue[]) {
    super("Validation failed");
    this.name = "ZodError";
    this.issues = issues;
  }
}

type SafeParseResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: ZodError;
    };

type Schema<TInput, TOutput> = {
  safeParse: (input: TInput) => SafeParseResult<TOutput>;
  parse: (input: TInput) => TOutput;
  refine: (check: (value: TOutput) => boolean, message: string) => Schema<TInput, TOutput>;
  transform: <TNewOutput>(mapper: (value: TOutput) => TNewOutput) => Schema<TInput, TNewOutput>;
};

function ok<T>(data: T): ParseResult<T> {
  return {
    success: true,
    data,
  };
}

function fail(message: string, path: Array<string | number> = []): ParseResult<never> {
  return {
    success: false,
    issues: [
      {
        code: "custom",
        message,
        path,
      },
    ],
  };
}

function prefixIssues(issues: Issue[], prefix: string | number) {
  return issues.map((issue) => ({
    ...issue,
    path: [prefix, ...issue.path],
  }));
}

function createSchema<TInput, TOutput>(parser: (input: TInput) => ParseResult<TOutput>): Schema<TInput, TOutput> {
  const schema: Schema<TInput, TOutput> = {
    safeParse(input) {
      const result = parser(input);

      if (result.success) {
        return {
          success: true,
          data: result.data,
        };
      }

      return {
        success: false,
        error: new ZodError(result.issues),
      };
    },
    parse(input) {
      const result = schema.safeParse(input);

      if (result.success) {
        return result.data;
      }

      throw result.error;
    },
    refine(check, message) {
      return createSchema((input: TInput) => {
        const result = parser(input);
        if (!result.success) {
          return result;
        }

        if (!check(result.data)) {
          return fail(message);
        }

        return ok(result.data);
      });
    },
    transform<TNewOutput>(mapper: (value: TOutput) => TNewOutput) {
      return createSchema((input: TInput) => {
        const result = parser(input);
        if (!result.success) {
          return result;
        }

        try {
          return ok(mapper(result.data));
        } catch (error) {
          return fail(error instanceof Error ? error.message : "Invalid value");
        }
      });
    },
  };

  return schema;
}

function createStringSchema(parser: (input: unknown) => ParseResult<string>) {
  const schema = createSchema(parser);

  return Object.assign(schema, {
    trim() {
      return createStringSchema((input: unknown) => {
        const result = parser(input);
        if (!result.success) {
          return result;
        }

        return ok(result.data.trim());
      });
    },
    min(length: number, message?: string) {
      return createStringSchema((input: unknown) => {
        const result = parser(input);
        if (!result.success) {
          return result;
        }

        if (result.data.length < length) {
          return fail(message ?? `Must contain at least ${length} character(s)`);
        }

        return ok(result.data);
      });
    },
    max(length: number, message?: string) {
      return createStringSchema((input: unknown) => {
        const result = parser(input);
        if (!result.success) {
          return result;
        }

        if (result.data.length > length) {
          return fail(message ?? `Must contain at most ${length} character(s)`);
        }

        return ok(result.data);
      });
    },
  });
}

function createNumberSchema(parser: (input: unknown) => ParseResult<number>) {
  const schema = createSchema(parser);

  return Object.assign(schema, {
    int(message?: string) {
      return createNumberSchema((input: unknown) => {
        const result = parser(input);
        if (!result.success) {
          return result;
        }

        if (!Number.isInteger(result.data)) {
          return fail(message ?? "Must be a whole number");
        }

        return ok(result.data);
      });
    },
    positive(message?: string) {
      return createNumberSchema((input: unknown) => {
        const result = parser(input);
        if (!result.success) {
          return result;
        }

        if (result.data <= 0) {
          return fail(message ?? "Must be greater than 0");
        }

        return ok(result.data);
      });
    },
    min(minimum: number, message?: string) {
      return createNumberSchema((input: unknown) => {
        const result = parser(input);
        if (!result.success) {
          return result;
        }

        if (result.data < minimum) {
          return fail(message ?? `Must be at least ${minimum}`);
        }

        return ok(result.data);
      });
    },
    max(maximum: number, message?: string) {
      return createNumberSchema((input: unknown) => {
        const result = parser(input);
        if (!result.success) {
          return result;
        }

        if (result.data > maximum) {
          return fail(message ?? `Must be at most ${maximum}`);
        }

        return ok(result.data);
      });
    },
  });
}

function createArraySchema<TItem>(itemSchema: Schema<any, TItem>) {
  const base = createSchema((input: unknown) => {
    if (!Array.isArray(input)) {
      return fail("Expected an array");
    }

    const output: TItem[] = [];
    const issues: Issue[] = [];

    input.forEach((item, index) => {
      const result = itemSchema.safeParse(item);
      if (result.success) {
        output.push(result.data);
        return;
      }

      issues.push(...prefixIssues(result.error.issues, index));
    });

    if (issues.length > 0) {
      return {
        success: false,
        issues,
      };
    }

    return ok(output);
  });

  return Object.assign(base, {
    min(minimum: number, message?: string) {
      return createArraySchema(itemSchema).refine(
        (value) => value.length >= minimum,
        message ?? `Must contain at least ${minimum} item(s)`,
      );
    },
    max(maximum: number, message?: string) {
      return createArraySchema(itemSchema).refine(
        (value) => value.length <= maximum,
        message ?? `Must contain at most ${maximum} item(s)`,
      );
    },
    nonempty(message?: string) {
      return createArraySchema(itemSchema).refine(
        (value) => value.length > 0,
        message ?? "Must contain at least one item",
      );
    },
  });
}

function createObjectSchema<TShape extends Record<string, Schema<any, any>>>(shape: TShape) {
  return createSchema((input: unknown) => {
    if (typeof input !== "object" || input === null) {
      return fail("Expected an object");
    }

    const value = input as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    const issues: Issue[] = [];

    for (const key of Object.keys(shape)) {
      const result = shape[key].safeParse(value[key]);
      if (result.success) {
        output[key] = result.data;
        continue;
      }

      issues.push(...prefixIssues(result.error.issues, key));
    }

    if (issues.length > 0) {
      return {
        success: false,
        issues,
      };
    }

    return ok(output);
  });
}

function coerceNumberSchema() {
  return createNumberSchema((input: unknown) => {
    const raw = typeof input === "string" ? input.trim() : input;
    const value = typeof raw === "number" ? raw : Number(raw);

    if (raw === "" || raw === null || raw === undefined || Number.isNaN(value)) {
      return fail("Must be a valid number");
    }

    return ok(value);
  });
}

export const z = {
  string() {
    return createStringSchema((input: unknown) => {
      if (typeof input !== "string") {
        return fail("Expected a string");
      }

      return ok(input);
    });
  },
  array<TItem>(itemSchema: Schema<any, TItem>) {
    return createArraySchema(itemSchema);
  },
  coerce: {
    number: coerceNumberSchema,
  },
  object: createObjectSchema,
  ZodIssueCode: {
    custom: "custom",
  },
};
