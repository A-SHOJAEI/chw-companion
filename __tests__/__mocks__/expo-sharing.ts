export async function isAvailableAsync(): Promise<boolean> {
  return false; // never actually open the system sharesheet in tests
}
export async function shareAsync(_uri: string, _opts?: unknown): Promise<void> {}
