// Minimal RN surface used by our lib code in Node tests.
export const Platform = {
  OS: 'android' as 'android' | 'ios' | 'web',
  select<T>(opts: { android?: T; ios?: T; web?: T; default?: T }): T | undefined {
    return opts[this.OS] ?? opts.default;
  },
};
