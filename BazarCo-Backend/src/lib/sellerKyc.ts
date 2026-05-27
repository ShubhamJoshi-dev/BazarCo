import * as userRepo from "../repositories/user.repository";

/** Whether admin has marked this seller's KYC as verified. */
export async function isSellerKycVerified(userId: string): Promise<boolean> {
  const user = await userRepo.findById(userId);
  return Boolean((user as { kycVerified?: boolean } | null)?.kycVerified);
}
