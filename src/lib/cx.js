// Concatène des classes conditionnelles.
export function cx(...args) {
  return args.filter(Boolean).join(' ');
}
