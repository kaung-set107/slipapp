import React, { useCallback, useEffect, useRef, useState } from "react";

export type FieldError = {
  message?: string;
};

export type FieldErrors<TValues extends Record<string, any>> = Record<string, FieldError | undefined>;

type ResolverResult<TValues extends Record<string, any>> = {
  values: TValues;
  errors: FieldErrors<TValues>;
};

type Resolver<TValues extends Record<string, any>> = (
  values: TValues,
) => Promise<ResolverResult<TValues>> | ResolverResult<TValues>;

export type Control<TValues extends Record<string, any>> = {
  values: TValues;
  errors: FieldErrors<TValues>;
  setValue: <TName extends string>(name: TName, value: any) => void;
};

type UseFormProps<TValues extends Record<string, any>> = {
  defaultValues: TValues;
  resolver?: Resolver<TValues>;
};

type HandleSubmit<TValues extends Record<string, any>> = {
  (
    onValid: (values: TValues) => void | Promise<void>,
    onInvalid?: (errors: FieldErrors<TValues>) => void | Promise<void>,
  ): (event?: { preventDefault?: () => void }) => Promise<void>;
};

type ControllerProps<TValues extends Record<string, any>> = {
  control: Control<TValues>;
  name: string;
  render: (props: {
    field: {
      value: any;
      onChange: (value: any) => void;
      onBlur: () => void;
      name: string;
      ref: null;
    };
    fieldState: {
      error?: FieldError;
    };
  }) => React.ReactElement;
};

type UseFieldArrayProps<TValues extends Record<string, any>> = {
  control: Control<TValues>;
  name: string;
};

type UseFieldArrayReturn<TItem> = {
  fields: Array<TItem & { id: string }>;
  append: (value: TItem) => void;
  remove: (index: number) => void;
  replace: (values: TItem[]) => void;
  update: (index: number, value: TItem) => void;
};

function parsePath(path: string) {
  return path
    .split(".")
    .filter((segment) => segment.length > 0)
    .map((segment) => (/^\d+$/.test(segment) ? Number(segment) : segment));
}

function getIn(value: unknown, path: string) {
  if (!path) {
    return value;
  }

  return parsePath(path).reduce<unknown>((current, segment) => {
    if (current === null || current === undefined) {
      return undefined;
    }

    return (current as Record<string, unknown>)[String(segment)];
  }, value);
}

function setIn(value: unknown, path: string, nextValue: unknown) {
  const segments = parsePath(path);
  if (segments.length === 0) {
    return nextValue;
  }

  const [head, ...tail] = segments;
  const isIndex = typeof head === "number";
  const clone: Record<string, unknown> | unknown[] = Array.isArray(value)
    ? [...(value as unknown[])]
    : value && typeof value === "object"
      ? { ...(value as Record<string, unknown>) }
      : isIndex
        ? []
        : {};

  const key = String(head);
  const currentChild = Array.isArray(clone)
    ? (clone as unknown[])[Number(head)]
    : (clone as Record<string, unknown>)[key];

  const updatedChild = tail.length > 0 ? setIn(currentChild, tail.join("."), nextValue) : nextValue;

  if (Array.isArray(clone)) {
    (clone as unknown[])[Number(head)] = updatedChild;
    return clone;
  }

  (clone as Record<string, unknown>)[key] = updatedChild;
  return clone;
}

function createId() {
  return Math.random().toString(36).slice(2, 10);
}

export function useForm<TValues extends Record<string, any>>({
  defaultValues,
  resolver,
}: UseFormProps<TValues>) {
  const [values, setValues] = useState<TValues>(defaultValues);
  const [errors, setErrors] = useState<FieldErrors<TValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback(<TName extends string>(name: TName, value: any) => {
    setValues((current) => setIn(current, name, value) as TValues);

    setErrors((current) => {
      if (!current[name]) {
        return current;
      }

      const next = { ...current };
      delete next[name];
      return next;
    });
  }, []);

  const reset = useCallback(
    (nextValues?: Partial<TValues>) => {
      setValues((nextValues ? { ...defaultValues, ...nextValues } : defaultValues) as TValues);
      setErrors({});
    },
    [defaultValues],
  );

  const getValues = useCallback(() => values, [values]);

  const validate = useCallback(async () => {
    if (!resolver) {
      return {
        values,
        errors: {},
      } as ResolverResult<TValues>;
    }

    return resolver(values);
  }, [resolver, values]);

  const handleSubmit: HandleSubmit<TValues> = useCallback(
    (onValid, onInvalid) => {
      return async (event) => {
        event?.preventDefault?.();
        setIsSubmitting(true);

        try {
          const result = await validate();
          setErrors(result.errors);

          if (Object.keys(result.errors).length > 0) {
            await onInvalid?.(result.errors);
            return;
          }

          await onValid(result.values);
        } finally {
          setIsSubmitting(false);
        }
      };
    },
    [validate],
  );

  function watch(): TValues;
  function watch<TName extends string>(name: TName): any;
  function watch<TName extends string>(name?: TName) {
    if (name) {
      return getIn(values, name);
    }

    return values;
  }

  return {
    control: {
      values,
      errors,
      setValue,
    } as Control<TValues>,
    formState: {
      errors,
      isSubmitting,
    },
    handleSubmit,
    watch,
    getValues,
    reset,
    setValue,
  };
}

export function Controller<TValues extends Record<string, any>>({
  control,
  name,
  render,
}: ControllerProps<TValues>) {
  return render({
    field: {
      value: getIn(control.values, name),
      onChange: (value) => control.setValue(name, value),
      onBlur: () => undefined,
      name,
      ref: null,
    },
    fieldState: {
      error: control.errors[name],
    },
  });
}

export function useFieldArray<TValues extends Record<string, any>, TItem = any>({
  control,
  name,
}: UseFieldArrayProps<TValues>): UseFieldArrayReturn<TItem> {
  const items = (getIn(control.values, name) as TItem[]) ?? [];
  const idsRef = useRef<string[]>(items.map(() => createId()));

  useEffect(() => {
    if (idsRef.current.length === items.length) {
      return;
    }

    if (idsRef.current.length > items.length) {
      idsRef.current = idsRef.current.slice(0, items.length);
      return;
    }

    while (idsRef.current.length < items.length) {
      idsRef.current.push(createId());
    }
  }, [items.length]);

  const replace = useCallback(
    (nextValues: TItem[]) => {
      idsRef.current = nextValues.map(() => createId());
      control.setValue(name, nextValues);
    },
    [control, name],
  );

  const append = useCallback(
    (value: TItem) => {
      idsRef.current.push(createId());
      control.setValue(name, [...items, value]);
    },
    [control, items, name],
  );

  const remove = useCallback(
    (index: number) => {
      idsRef.current.splice(index, 1);
      control.setValue(
        name,
        items.filter((_, itemIndex) => itemIndex !== index),
      );
    },
    [control, items, name],
  );

  const update = useCallback(
    (index: number, value: TItem) => {
      const next = [...items];
      next[index] = value;
      control.setValue(name, next);
    },
    [control, items, name],
  );

  const fields = items.map((item, index) => {
    const base = item && typeof item === "object" ? (item as Record<string, unknown>) : { value: item };
    return {
      id: idsRef.current[index] ?? createId(),
      ...(base as TItem),
    } as TItem & { id: string };
  });

  return {
    fields,
    append,
    remove,
    replace,
    update,
  };
}
