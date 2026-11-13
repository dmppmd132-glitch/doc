import { isR2Configured, getR2Config } from '../../server/r2.ts';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const { bucketName } = getR2Config();
  return res.status(200).json({
    configured: isR2Configured(),
    bucket: isR2Configured() ? bucketName : null,
  });
}
