# Ариун Библи 2004 integration status

Requested edition: Ариун Библи, 2004 (АБ2004). Preferred internal ID: `mn-ab2004`.

Publisher: Ариун Бичээс Нийгэмлэг / Mongolian Union Bible Society.

- Edition listing: https://www.bible.com/versions/369-2004-ariun-bibli-2004
- Publisher contact: https://mongol.bible/ab2004/contact-us/
- The listing identifies a copyrighted 2004 translation. Public reading access does not establish a license to distribute its full text in HINENI. YouVersion edition number `369` is not an API.Bible identifier.

No AB2004 Scripture has been scraped, copied, fabricated or imported. Selecting the edition name alone does not confirm a distribution grant. Existing licensing gates remain unchanged. Mongolian fallback notices now include explicitly external reading access on Bible.com.

## Required to enable in-app Scripture

### YouVersion Platform access (preferred route to verify)

Official YouVersion REST API exists: https://developers.youversion.com/api-usage

1. Register HINENI at https://platform.youversion.com/ and obtain an App Key. Accept the applicable Bible license agreements in the portal.
2. Store the key locally as server-only `YVP_APP_KEY`. Do not paste it into chat or commit it. No production environment has been modified by the agent.
3. Run `npm exec -- dotenv -e .env -- node scripts/check-youversion-access.mjs`. It lists Mongolian edition metadata permitted for the key, checks that 369 appears, then requests its metadata and John 1. It does not log the key or Scripture text.
4. Endpoint examples: `GET https://api.youversion.com/v1/bibles?language_ranges[]=mn`, `GET /v1/bibles/369`, `GET /v1/bibles/369/passages/JHN.1`, with `X-YVP-App-Key` header. Edition availability depends on the application's accepted licenses; 369 is verified as the public Bible.com AB2004 identifier but live API access remains untested without a key.
5. After successful authorized access, implement a YouVersion provider using its actual response schema and required copyright/display attribution. Review permitted caching/offline/audio behavior. The access checker is not a completed reader integration; the current in-app fallback remains until that provider is enabled and tested.

This route may supply the needed display permission through YouVersion's agreements, instead of requiring a separate direct-publisher arrangement. A web reading page or a successful metadata lookup alone is not proof of passage access.

1. Obtain the publisher’s permission for HINENI web/mobile display, together with a text dataset or authorized API access. Confirm attribution, storage/cache, offline download and separate audio/narration permissions.
2. For an approved API: obtain its actual Bible ID from the approved account; configure the existing server provider with internal ID `mn-ab2004`, language `mn`, actual provider ID and display name `Ариун Библи 2004`. Do not use `369` as an API.Bible ID. Confirm product rights before changing any rights-confirmation setting.
3. For publisher-supplied text: use the normalized JSON license/content format documented in `docs/BIBLE_IMPORT.md`, retain the supplied copyright/attribution and set only expressly permitted download/audio flags. Validate the dataset first; import additively with internal ID `mn-ab2004`.
4. Test full reader/daily passages against the supplied edition, navigation, cache behavior and unavailable passages. The registered `mn-ab2004` edition will be preferred for Mongolian; it is not registered until real licensed access exists.

## Draft permission request (not sent)

Сайн байна уу,

Бид HINENI нэртэй Библи унших цахим платформ хөгжүүлж байна. Ариун Библи 2004 орчуулгыг вэб болон ирээдүйн гар утасны апп дээр, Библи уншигч болон өдрийн эшлэлийн хэсэгт ашиглах зөвшөөрөл хүсэж байна.

Орчуулгын цахим эх файл эсвэл зөвшөөрөгдсөн API авах боломж, зохиогчийн эрхийн тайлбар, ашиглалтын нөхцөл, хадгалалт/кэш, офлайн таталт болон аудио/чангаар унших тусдаа зөвшөөрлийн талаар мэдээлэл өгнө үү. Бид эх бичвэрийг өөрчлөхгүй бөгөөд шаардлагатай зохиогчийн эрхийн мэдээллийг харуулна.

Баярлалаа.

Add the real operator/contact details and proposed business model before sending. No publisher has been contacted by the agent.
