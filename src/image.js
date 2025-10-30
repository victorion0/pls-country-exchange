const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

async function generateSummaryImage(total, top5, timestamp) {
  const outDir = path.resolve(process.cwd(), 'cache');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'summary.png');

  const width = 800;
  const height = 600;
  const bg = await new Jimp(width, height, 0xffffffff);

  const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
  const small = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);

  bg.print(font, 20, 20, `Countries cached: ${total}`);
  bg.print(small, 20, 70, `Last refresh: ${timestamp}`);

  bg.print(font, 20, 120, `Top 5 by Estimated GDP:`);
  let y = 180;
  for (let i = 0; i < top5.length; i++) {
    const c = top5[i];
    const line = `${i + 1}. ${c.name} — ${Number(c.estimated_gdp).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    bg.print(small, 40, y, line);
    y += 36;
  }

  await bg.writeAsync(outPath);
  return outPath;
}

module.exports = { generateSummaryImage };
