/**
 * lib/validations.ts
 *
 * Client-side mirrors of the on-chain `require!()` checks in
 * create_campaign/contribute (../solana-rust/02-crowdfunding-spl) - failing
 * fast in the form gives instant feedback instead of a failed transaction
 * and a wasted signature prompt. The program still re-checks everything
 * itself; these are a UX convenience, not the source of truth.
 */

import { z } from 'zod'

export const createCampaignSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(64, 'Title must be at most 64 characters'),
  description: z.string().max(200, 'Description must be at most 200 characters'),
  imageUrl: z
    .string()
    .max(200, 'Image URL must be at most 200 characters')
    .refine((v) => v === '' || /^https?:\/\//.test(v), { message: 'Must be a valid http(s) URL, or left blank' }),
  goal: z
    .string()
    .min(1, 'Goal is required')
    .refine((v) => !isNaN(parseFloat(v)), { message: 'Enter a valid number' })
    .refine((v) => parseFloat(v) > 0, { message: 'Goal must be greater than zero' }),
  durationDays: z
    .number()
    .min(1, 'Duration must be at least 1 day')
    .max(365, 'Duration must be at most 365 days'),
})

export type CreateCampaignFormData = z.infer<typeof createCampaignSchema>

export const contributeSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((v) => !isNaN(parseFloat(v)), { message: 'Enter a valid number' })
    .refine((v) => parseFloat(v) > 0, { message: 'Amount must be greater than zero' }),
})

export type ContributeFormData = z.infer<typeof contributeSchema>
