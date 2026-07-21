"use client";

import { useState } from "react";

import { updateVenueAudienceSettingsAction } from "@/src/app/venue/actions";

type AudienceSettingsFormProps = {
  venueId: string;
  allowExplicitContent: boolean;
  forceKidsMode: boolean;
};

export function AudienceSettingsForm({
  venueId,
  allowExplicitContent,
  forceKidsMode,
}: AudienceSettingsFormProps) {
  const [kidsMode, setKidsMode] = useState(forceKidsMode);
  const [nsfw, setNsfw] = useState(allowExplicitContent && !forceKidsMode);

  return (
    <form action={updateVenueAudienceSettingsAction} className="mt-3 space-y-4">
      <input type="hidden" name="venueId" value={venueId} />
      {kidsMode ? <input type="hidden" name="allowExplicitContent" value="false" /> : null}

      <label className="flex items-start justify-between gap-4 rounded-[1.2rem] border border-white/10 bg-white/7 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-[color:var(--color-foreground)]">
            Forced kids mode
          </p>
          <p className="mt-1 text-xs text-[color:var(--color-muted-foreground)]">
            Forces clean, family-friendly lyrics and hides the NSFW option.
          </p>
        </div>
        <input
          type="checkbox"
          name="allowKidsMode"
          checked={kidsMode}
          onChange={(event) => {
            const nextKidsMode = event.target.checked;
            setKidsMode(nextKidsMode);
            if (nextKidsMode) {
              setNsfw(false);
            }
          }}
          className="mt-1 h-5 w-5 rounded border-[color:var(--color-line)]"
        />
      </label>

      {!kidsMode ? (
        <label className="flex items-start justify-between gap-4 rounded-[1.2rem] border border-white/10 bg-white/7 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-[color:var(--color-foreground)]">
              Allow NSFW songs
            </p>
            <p className="mt-1 text-xs text-[color:var(--color-muted-foreground)]">
              Allows guests to choose the dirty late-night route.
            </p>
          </div>
          <input
            type="checkbox"
            name="allowExplicitContent"
            checked={nsfw}
            onChange={(event) => setNsfw(event.target.checked)}
            className="mt-1 h-5 w-5 rounded border-[color:var(--color-line)]"
          />
        </label>
      ) : null}

      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-full border border-[color:var(--color-line)] px-4 py-2 text-sm font-semibold"
      >
        Save audience settings
      </button>
    </form>
  );
}
