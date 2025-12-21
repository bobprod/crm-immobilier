import { useForm, UseFormProps, UseFormReturn, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

/**
 * Hook personnalisé pour utiliser react-hook-form avec validation Zod
 *
 * Usage:
 * ```tsx
 * import { propertySchema } from '@/shared/validation/schemas';
 *
 * function MyForm() {
 *   const { register, handleSubmit, formState: { errors } } = useZodForm({
 *     schema: propertySchema,
 *     defaultValues: { ... }
 *   });
 *
 *   const onSubmit = (data) => {
 *     // data is fully typed and validated!
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit(onSubmit)}>
 *       <input {...register('title')} />
 *       {errors.title && <span>{errors.title.message}</span>}
 *     </form>
 *   );
 * }
 * ```
 */
export function useZodForm<TSchema extends z.ZodType<any, any, any>>(
  props: Omit<UseFormProps<z.infer<TSchema>>, 'resolver'> & {
    schema: TSchema;
  }
): UseFormReturn<z.infer<TSchema>> {
  const { schema, ...formProps } = props;

  return useForm<z.infer<TSchema>>({
    ...formProps,
    resolver: zodResolver(schema),
  });
}

/**
 * Type helper pour extraire le type de données d'un schéma Zod
 */
export type InferSchema<T extends z.ZodType<any, any, any>> = z.infer<T>;
