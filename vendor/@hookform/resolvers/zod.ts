import type { FieldErrors } from "react-hook-form";

type Issue = {
  message: string;
  path: Array<string | number>;
};

type ZodLikeSchema = {
  safeParse: (value: unknown) =>
    | {
        success: true;
        data: unknown;
      }
    | {
        success: false;
        error: {
          issues: Issue[];
        };
      };
};

function issuesToFieldErrors<TValues extends Record<string, any>>(issues: Issue[]): FieldErrors<TValues> {
  const errors: FieldErrors<TValues> = {};

  for (const issue of issues) {
    const name = issue.path.length > 0 ? issue.path.join(".") : "root";
    if (!errors[name]) {
      errors[name] = {
        message: issue.message,
      };
    }
  }

  return errors;
}

export function zodResolver<TValues extends Record<string, any>>(schema: ZodLikeSchema) {
  return async (values: TValues) => {
    const result = schema.safeParse(values);

    if (result.success) {
      return {
        values: result.data as TValues,
        errors: {} as FieldErrors<TValues>,
      };
    }

    return {
      values: {} as TValues,
      errors: issuesToFieldErrors<TValues>(result.error.issues),
    };
  };
}
