// backend/src/utils/emailValidator.ts

import { validate } from 'deep-email-validator';

/**
 * Performs a deep validation check on an email address, skipping the final SMTP check
 * due to common local port blocking issues.
 * @param email The email address to verify
 * @returns true if the email is considered valid and deliverable, false otherwise.
 */
export async function isEmailDeliverable(email: string): Promise<boolean> {
  try {
    const { valid, reason, validators } = await validate({
      email: email,
      validateSMTP: false, // NEW: Skip the problematic SMTP handshake
      // validatePahole: true, // Performs core checks
    });

    if (!valid) {
      console.warn(`Email validation failed for ${email}. Reason: ${reason}. Validators:`, validators);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error during deep email validation:', error);
    // Fail safe if the external check itself throws an error (e.g., network issue)
    return false;
  }
}
