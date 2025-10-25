import { rest } from 'msw';

// helper responder used for both absolute and relative URL handlers
const kycResponder = (req: any, res: any, ctx: any) => {
  const { address } = req.params;
  const last = String(address).slice(-1).toLowerCase();
  if (last === 'a') {
    return res(ctx.status(200), ctx.json({ address, isAuthorized: true, isWhitelisted: true, isBlacklisted: false, kycStatus: 'approved' }));
  }
  if (last === 'b') {
    return res(ctx.status(200), ctx.json({ address, isAuthorized: false, isWhitelisted: false, isBlacklisted: true, kycStatus: 'rejected' }));
  }
  return res(ctx.status(200), ctx.json({ address, isAuthorized: false, isWhitelisted: false, isBlacklisted: false, kycStatus: 'pending' }));
};

export const handlers = [
  // Match relative path (useful in browser-like setups)
  rest.get('/api/admin/whitelist/:address', kycResponder),
  // Match absolute URL used by axios with baseURL (node tests)
  rest.get('http://localhost:3001/api/admin/whitelist/:address', kycResponder),
];
