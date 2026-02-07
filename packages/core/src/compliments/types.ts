export type ComplimentId = string;

export type Compliment = {
  /** Stable identifier; must be unique within a dataset. */
  id: ComplimentId;

  /** The compliment text shown to the user. */
  text: string;

  /** Optional categorization / filtering. */
  tags?: string[];

  /** Optional weight for future weighted picking. Defaults to 1. */
  weight?: number;
};

export type ComplimentsDataV1 = {
  schemaVersion: 1;

  /** BCP-47-ish locale string (we validate loosely). Example: "en", "en-GB" */
  locale: string;

  /** Dataset-wide list. */
  compliments: Compliment[];
};

export type ComplimentsData = ComplimentsDataV1;
