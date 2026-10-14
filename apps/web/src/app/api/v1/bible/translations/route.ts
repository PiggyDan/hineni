import { handler } from "@/lib/api";
import { listTranslations } from "@/lib/bible";
import { scriptureDirection } from "@cp/shared";

export const GET = handler({}, async () =>
  (await listTranslations()).map(({ id, name, abbreviation, language, license, publisher, copyrightStatus, attribution, downloadAllowed, audioAvailable, metadata, providerId }) => ({ id, name, abbreviation, language, license, publisher, copyrightStatus, attribution, source: providerId, direction: scriptureDirection(language), metadata: metadata ?? null, coverageVerified: !!metadata, downloadAllowed: downloadAllowed ?? false, audioAvailable: audioAvailable ?? false })),
);
