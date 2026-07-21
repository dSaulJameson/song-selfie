import type { SongRequestInput } from "@/lib/schema";

export type VenueAudiencePolicy = {
  allowExplicitContent: boolean;
  allowKidsMode: boolean;
};

export function applyVenueAudienceRules(
  input: SongRequestInput,
  policy: VenueAudiencePolicy,
): SongRequestInput {
  const kidsMode = policy.allowKidsMode ? true : input.kidsMode;
  const makeDirty = policy.allowExplicitContent && !kidsMode ? input.makeDirty : false;
  const songType =
    (kidsMode || !policy.allowExplicitContent) && input.songType === "sexy-vibe"
      ? "love-song"
      : input.songType;

  return {
    ...input,
    songType,
    kidsMode,
    makeDirty,
  };
}
