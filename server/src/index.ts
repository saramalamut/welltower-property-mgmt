import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { loadRentRoll } from './loadRentRoll';

const PORT = Number(process.env.PORT ?? 3001);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isIsoDate(s: unknown): s is string {
  return typeof s === 'string' && ISO_DATE.test(s);
}

async function main(): Promise<void> {
  const csvPath = path.resolve(__dirname, '../../data/rent_roll.csv');
  const rows = await loadRentRoll(csvPath);
  console.log(`Loaded ${rows.length} rent roll rows from ${csvPath}`);

  const app = express();

  app.get('/api/rent-roll', (_req, res) => {
    res.json(rows);
  });

  app.get('/api/rent-roll/range', (req: Request, res: Response) => {
    const { from, to } = req.query;
    if (!isIsoDate(from) || !isIsoDate(to)) {
      res.status(400).json({
        error: 'from and to are required and must be YYYY-MM-DD',
      });
      return;
    }
    if (from > to) {
      res.status(400).json({ error: 'from must be <= to' });
      return;
    }
    const filtered = rows.filter((r) => r.date >= from && r.date <= to);
    res.json(filtered);
  });

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
