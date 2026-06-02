// Block-explorer URL builders, per supported coin.
const TX: Record<string, (h: string) => string> = {
  BTC: (h) => `https://mempool.space/tx/${h}`,
  LTC: (h) => `https://blockchair.com/litecoin/transaction/${h}`,
  DOGE: (h) => `https://blockchair.com/dogecoin/transaction/${h}`,
  BCH: (h) => `https://blockchair.com/bitcoin-cash/transaction/${h}`,
  ETH: (h) => `https://etherscan.io/tx/${h}`,
  USDT: (h) => `https://etherscan.io/tx/${h}`,
  SOL: (h) => `https://solscan.io/tx/${h}`,
  XMR: (h) => `https://xmrchain.net/tx/${h}`,
};
const ADDR: Record<string, (a: string) => string> = {
  BTC: (a) => `https://mempool.space/address/${a}`,
  LTC: (a) => `https://blockchair.com/litecoin/address/${a}`,
  DOGE: (a) => `https://blockchair.com/dogecoin/address/${a}`,
  BCH: (a) => `https://blockchair.com/bitcoin-cash/address/${a}`,
  ETH: (a) => `https://etherscan.io/address/${a}`,
  USDT: (a) => `https://etherscan.io/address/${a}`,
  SOL: (a) => `https://solscan.io/account/${a}`,
};

export function txUrl(coin: string, hash: string): string | null {
  const fn = TX[coin?.toUpperCase()];
  return fn ? fn(hash) : null;
}
export function addrUrl(coin: string, addr: string): string | null {
  const fn = ADDR[coin?.toUpperCase()];
  return fn ? fn(addr) : null;
}
