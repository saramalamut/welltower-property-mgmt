import express from 'express';
import path from 'path';
import { loadRentRoll } from './loadRentRoll';

const PORT = Number(process.env.PORT ?? 3001);

async function main(): Promise<void> {
  const csvPath = path.resolve(__dirname, '../../data/rent_roll.csv');
  const rows = await loadRentRoll(csvPath);
  console.log(`Loaded ${rows.length} rent roll rows from ${csvPath}`);

  const app = express();

  app.get('/api/rent-roll', (_req, res) => {
    res.json(rows);
  });

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
