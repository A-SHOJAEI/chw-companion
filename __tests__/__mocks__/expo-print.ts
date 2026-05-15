export async function printToFileAsync(opts: { html: string }): Promise<{ uri: string }> {
  return { uri: `file:///tmp/mock-${opts.html.length}.pdf` };
}
