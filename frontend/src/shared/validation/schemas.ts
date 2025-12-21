import { z } from 'zod';

/**
 * Schémas de validation Zod pour tous les formulaires de l'application
 */

// ============================================================================
// PROPERTY SCHEMAS
// ============================================================================

export const propertyTypeEnum = z.enum([
  'apartment',
  'house',
  'villa',
  'studio',
  'land',
  'commercial',
  'office',
]);

export const propertyStatusEnum = z.enum([
  'available',
  'reserved',
  'sold',
  'rented',
  'pending',
]);

export const propertyPriorityEnum = z.enum(['low', 'medium', 'high']);

export const propertyCategoryEnum = z.enum(['sale', 'rent']);

export const propertySchema = z.object({
  title: z
    .string()
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères'),

  description: z
    .string()
    .min(10, 'La description doit contenir au moins 10 caractères')
    .max(5000, 'La description ne peut pas dépasser 5000 caractères')
    .optional()
    .or(z.literal('')),

  type: propertyTypeEnum,

  category: propertyCategoryEnum,

  price: z
    .number()
    .positive('Le prix doit être positif')
    .min(1, 'Le prix doit être supérieur à 0'),

  area: z
    .number()
    .positive('La surface doit être positive')
    .min(1, 'La surface doit être supérieure à 0'),

  bedrooms: z
    .number()
    .int('Le nombre de chambres doit être un entier')
    .min(0, 'Le nombre de chambres ne peut pas être négatif')
    .max(50, 'Le nombre de chambres semble incorrect')
    .optional(),

  bathrooms: z
    .number()
    .int('Le nombre de salles de bain doit être un entier')
    .min(0, 'Le nombre de salles de bain ne peut pas être négatif')
    .max(20, 'Le nombre de salles de bain semble incorrect')
    .optional(),

  address: z
    .string()
    .min(5, 'L\'adresse doit contenir au moins 5 caractères')
    .max(500, 'L\'adresse ne peut pas dépasser 500 caractères'),

  city: z
    .string()
    .min(2, 'La ville doit contenir au moins 2 caractères')
    .max(100, 'La ville ne peut pas dépasser 100 caractères'),

  zipCode: z
    .string()
    .regex(/^\d{5}$/, 'Le code postal doit contenir 5 chiffres')
    .optional()
    .or(z.literal('')),

  country: z
    .string()
    .min(2, 'Le pays doit contenir au moins 2 caractères')
    .max(100, 'Le pays ne peut pas dépasser 100 caractères')
    .default('France'),

  status: propertyStatusEnum.default('available'),

  priority: propertyPriorityEnum.default('medium'),

  userId: z.string().optional(),

  latitude: z.number().min(-90).max(90).optional(),

  longitude: z.number().min(-180).max(180).optional(),

  images: z.array(z.string().url('URL d\'image invalide')).optional(),

  features: z.array(z.string()).optional(),

  virtualTourUrl: z.string().url('URL invalide').optional().or(z.literal('')),

  videoUrl: z.string().url('URL invalide').optional().or(z.literal('')),
});

export type PropertyFormData = z.infer<typeof propertySchema>;

// ============================================================================
// CONTACT SCHEMAS
// ============================================================================

export const contactTypeEnum = z.enum(['buyer', 'seller', 'tenant', 'landlord', 'other']);

export const contactSchema = z.object({
  firstName: z
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(100, 'Le prénom ne peut pas dépasser 100 caractères'),

  lastName: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),

  email: z
    .string()
    .email('Email invalide')
    .max(255, 'L\'email ne peut pas dépasser 255 caractères'),

  phone: z
    .string()
    .regex(
      /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
      'Numéro de téléphone français invalide'
    )
    .optional()
    .or(z.literal('')),

  address: z
    .string()
    .max(500, 'L\'adresse ne peut pas dépasser 500 caractères')
    .optional()
    .or(z.literal('')),

  city: z
    .string()
    .max(100, 'La ville ne peut pas dépasser 100 caractères')
    .optional()
    .or(z.literal('')),

  zipCode: z
    .string()
    .regex(/^\d{5}$/, 'Le code postal doit contenir 5 chiffres')
    .optional()
    .or(z.literal('')),

  type: contactTypeEnum.default('other'),

  notes: z
    .string()
    .max(2000, 'Les notes ne peuvent pas dépasser 2000 caractères')
    .optional()
    .or(z.literal('')),

  company: z
    .string()
    .max(200, 'Le nom de l\'entreprise ne peut pas dépasser 200 caractères')
    .optional()
    .or(z.literal('')),

  userId: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;

// ============================================================================
// TASK SCHEMAS
// ============================================================================

export const taskPriorityEnum = z.enum(['low', 'medium', 'high']);

export const taskStatusEnum = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);

export const taskSchema = z.object({
  title: z
    .string()
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères'),

  description: z
    .string()
    .max(2000, 'La description ne peut pas dépasser 2000 caractères')
    .optional()
    .or(z.literal('')),

  priority: taskPriorityEnum.default('medium'),

  status: taskStatusEnum.default('pending'),

  dueDate: z
    .date()
    .min(new Date(), 'La date d\'échéance ne peut pas être dans le passé')
    .optional(),

  assignedTo: z.string().optional(),

  propertyId: z.string().optional(),

  contactId: z.string().optional(),

  userId: z.string().optional(),

  tags: z.array(z.string()).optional(),
});

export type TaskFormData = z.infer<typeof taskSchema>;

// ============================================================================
// APPOINTMENT SCHEMAS
// ============================================================================

export const appointmentTypeEnum = z.enum([
  'viewing',
  'meeting',
  'signing',
  'phone_call',
  'other',
]);

export const appointmentStatusEnum = z.enum([
  'scheduled',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
]);

export const appointmentSchema = z
  .object({
    title: z
      .string()
      .min(3, 'Le titre doit contenir au moins 3 caractères')
      .max(200, 'Le titre ne peut pas dépasser 200 caractères'),

    description: z
      .string()
      .max(2000, 'La description ne peut pas dépasser 2000 caractères')
      .optional()
      .or(z.literal('')),

    type: appointmentTypeEnum.default('meeting'),

    status: appointmentStatusEnum.default('scheduled'),

    startDate: z.date(),

    endDate: z.date(),

    location: z
      .string()
      .max(500, 'L\'adresse ne peut pas dépasser 500 caractères')
      .optional()
      .or(z.literal('')),

    propertyId: z.string().optional(),

    contactId: z.string().optional(),

    userId: z.string().optional(),

    notes: z
      .string()
      .max(2000, 'Les notes ne peuvent pas dépasser 2000 caractères')
      .optional()
      .or(z.literal('')),

    reminderMinutes: z.number().int().min(0).optional(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'La date de fin doit être après la date de début',
    path: ['endDate'],
  });

export type AppointmentFormData = z.infer<typeof appointmentSchema>;

// ============================================================================
// CLIENT SCHEMAS
// ============================================================================

export const clientSchema = z.object({
  firstName: z
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(100, 'Le prénom ne peut pas dépasser 100 caractères'),

  lastName: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),

  email: z
    .string()
    .email('Email invalide')
    .max(255, 'L\'email ne peut pas dépasser 255 caractères'),

  phone: z
    .string()
    .regex(
      /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
      'Numéro de téléphone français invalide'
    )
    .optional()
    .or(z.literal('')),

  address: z
    .string()
    .max(500, 'L\'adresse ne peut pas dépasser 500 caractères')
    .optional()
    .or(z.literal('')),

  city: z
    .string()
    .max(100, 'La ville ne peut pas dépasser 100 caractères')
    .optional()
    .or(z.literal('')),

  zipCode: z
    .string()
    .regex(/^\d{5}$/, 'Le code postal doit contenir 5 chiffres')
    .optional()
    .or(z.literal('')),

  budget: z
    .number()
    .positive('Le budget doit être positif')
    .optional(),

  preferences: z
    .string()
    .max(2000, 'Les préférences ne peuvent pas dépasser 2000 caractères')
    .optional()
    .or(z.literal('')),

  userId: z.string().optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z.string().email('Email invalide'),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    confirmPassword: z.string(),
    firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
    lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// ============================================================================
// CAMPAIGN SCHEMAS
// ============================================================================

export const campaignTypeEnum = z.enum(['email', 'sms', 'social_media', 'newsletter']);

export const campaignStatusEnum = z.enum(['draft', 'scheduled', 'active', 'completed', 'cancelled']);

export const campaignSchema = z.object({
  name: z
    .string()
    .min(3, 'Le nom doit contenir au moins 3 caractères')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères'),

  description: z
    .string()
    .max(2000, 'La description ne peut pas dépasser 2000 caractères')
    .optional()
    .or(z.literal('')),

  type: campaignTypeEnum,

  status: campaignStatusEnum.default('draft'),

  startDate: z.date().optional(),

  endDate: z.date().optional(),

  budget: z.number().positive('Le budget doit être positif').optional(),

  targetAudience: z
    .string()
    .max(500, 'L\'audience cible ne peut pas dépasser 500 caractères')
    .optional()
    .or(z.literal('')),

  userId: z.string().optional(),
});

export type CampaignFormData = z.infer<typeof campaignSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Valide des données avec un schéma Zod
 * @param schema Le schéma Zod
 * @param data Les données à valider
 * @returns { success: boolean, data?: T, errors?: ZodError }
 */
export function validateWithSchema<T>(schema: z.ZodSchema<T>, data: unknown) {
  const result = schema.safeParse(data);
  return result;
}

/**
 * Formate les erreurs Zod pour un affichage user-friendly
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};

  error.errors.forEach((err) => {
    const path = err.path.join('.');
    formatted[path] = err.message;
  });

  return formatted;
}
