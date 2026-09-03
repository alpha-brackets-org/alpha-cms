import { useState, KeyboardEvent } from 'react';
import {
  FieldValues,
  Path,
  PathValue,
  UseFormGetValues,
  UseFormReset,
} from 'react-hook-form';

/**
 * Shared add/remove logic for a plain `string[]` form field (e.g. CaseStudy's
 * `services`, Project's `techStack`) — an Enter-to-add tag input backed by
 * `reset()` rather than `useFieldArray`, since `useFieldArray` requires an
 * array of objects and these fields are `z.array(z.string())` in the schema.
 */
export function useStringArrayField<T extends FieldValues>(
  fieldName: Path<T>,
  getValues: UseFormGetValues<T>,
  reset: UseFormReset<T>
) {
  const [input, setInput] = useState('');

  const items = (getValues(fieldName) as string[] | undefined) || [];

  const addItem = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const current = (getValues(fieldName) as string[] | undefined) || [];
    if (!current.includes(trimmed)) {
      reset({
        ...getValues(),
        [fieldName]: [...current, trimmed] as PathValue<T, Path<T>>,
      });
    }
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addItem();
    }
  };

  const removeItem = (value: string) => {
    const current = (getValues(fieldName) as string[] | undefined) || [];
    reset({
      ...getValues(),
      [fieldName]: current.filter((s) => s !== value) as PathValue<T, Path<T>>,
    });
  };

  return { input, setInput, items, handleKeyDown, removeItem };
}
