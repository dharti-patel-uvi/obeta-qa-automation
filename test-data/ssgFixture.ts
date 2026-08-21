import { SsgLookupData } from "./types";

/**
 * Data for the SSG (Sandals Select Rewards) "Look It Up" lookup modal.
 *
 * The valid / unlinked emails come from `.env` because they depend on real
 * accounts in the target environment — set SSG_LOOKUP_EMAIL and
 * SSG_LOOKUP_EMAIL_UNLINKED there. The invalid / special / numeric variants are
 * synthetic and safe to hardcode.
 */
const ssgLookupData: SsgLookupData = {
  validLastName: process.env.SSG_LOOKUP_LAST_NAME_1 || "",
  validEmail: process.env.SSG_LOOKUP_EMAIL_1 || "",
  unlinkedEmail:
    process.env.SSG_LOOKUP_EMAIL_UNLINKED || "not-a-member@example.com",
  invalidEmail: "not-an-email",
  specialCharsEmail: "#$%#$%@!!!#",
  numbersEmail: "1234567890",
};

export default ssgLookupData;
