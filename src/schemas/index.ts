import { z } from 'zod';

export const addressSchema = z.object({
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  county: z.string().optional(),
  postcode: z.string().min(1, 'Postcode is required').regex(/^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i, 'Invalid UK postcode format'),
  country: z.enum(['England', 'Wales']),
});

export const claimantSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  address: addressSchema,
  phone: z.string().min(1, 'Phone number is required').regex(/^[\d\s+()-]{11,}$/, 'Invalid phone number'),
  email: z.string().email('Invalid email address'),
});

export const defendantSchema = z.object({
  type: z.enum(['individual', 'company']),
  fullName: z.string().min(1, 'Name is required'),
  companyName: z.string().optional(),
  address: addressSchema,
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
});

export const userProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  address: addressSchema,
  phone: z.string().min(1, 'Phone number is required').regex(/^[\d\s+()-]{11,}$/, 'Invalid phone number'),
  email: z.string().email('Invalid email address'),
  lastUpdated: z.string(),
});

export type UserProfileSchema = z.infer<typeof userProfileSchema>;

export function emptyUserProfile(): UserProfileSchema {
  return {
    fullName: '',
    address: { line1: '', city: '', postcode: '', country: 'England' },
    phone: '',
    email: '',
    lastUpdated: '',
  };
}
