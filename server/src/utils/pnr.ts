const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generatePNR(): string {
  let pnr = '';
  for (let i = 0; i < 6; i++) {
    pnr += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return pnr;
}
