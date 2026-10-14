/** Run with dotenv-cli; never print the App Key or Scripture content. */
const key = process.env.YVP_APP_KEY?.trim();
if (!key) {
  console.error('YVP_APP_KEY is missing. Register HINENI at https://platform.youversion.com/ and configure the key locally.');
  process.exitCode = 1;
} else {
  const headers = { 'X-YVP-App-Key': key, Accept: 'application/json' };
  const base = 'https://api.youversion.com/v1';
  async function request(path) {
    const response = await fetch(`${base}${path}`, { headers, signal: AbortSignal.timeout(15000) });
    if (response.status === 204) return { data: [] };
    if (!response.ok) {
      // Provider errors may contain sensitive request details; report status only.
      throw new Error(`YouVersion HTTP ${response.status}. Check the App Key and accepted licenses in the portal.`);
    }
    return response.json();
  }
  try {
    const ids = new Set();
    const seenTokens = new Set();
    let token;
    do {
      const query = new URLSearchParams({ 'language_ranges[]': 'mn' });
      if (token) query.set('page_token', token);
      const body = await request(`/bibles?${query}`);
      if (!Array.isArray(body.data)) throw new Error('Unexpected Bible collection response.');
      for (const bible of body.data) {
        ids.add(Number(bible.id));
        console.log(JSON.stringify({ id: bible.id, title: bible.localized_title ?? bible.title, language: bible.language_tag }));
      }
      token = body.next_page_token;
      if (token && seenTokens.has(token)) throw new Error('Repeated pagination token; stopped.');
      if (token) seenTokens.add(token);
    } while (token);
    if (!ids.has(369)) throw new Error('AB2004 (369) is not available in this App Key’s Mongolian collection. Request edition access in the portal.');
    // Verify metadata and actual chapter permission separately. Discard chapter text.
    await request('/bibles/369');
    await request('/bibles/369/passages/JHN.1');
    console.log('AB2004 metadata and John 1 passage requests succeeded. Review returned attribution/display requirements before enabling the provider.');
  } catch (error) {
    const safePrefixes = ['YouVersion HTTP', 'AB2004 (369)', 'Unexpected Bible collection', 'Repeated pagination'];
    console.error(error instanceof Error && safePrefixes.some((prefix) => error.message.startsWith(prefix)) ? error.message : 'Access verification failed. Check edition access, network connectivity, and the current API response format.');
    process.exitCode = 1;
  }
}
