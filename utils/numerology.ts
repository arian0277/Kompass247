
import { MatrixData, RasterData, HealthRow } from '../types';

export const sumDigits = (n: number | string): number => {
  return String(n).replace(/[^0-9]/g, '').split('').reduce((acc, digit) => acc + Number(digit), 0);
};

export const reduce22 = (n: number): number => {
  if (n === 0) return 22;
  let res = n;
  while (res > 22) {
    res = sumDigits(res);
  }
  return res;
};

export const calculateMatrix = (birthdate: string): MatrixData => {
  const parts = birthdate.split('.');
  const d = parseInt(parts[0]);
  const m = parseInt(parts[1]);
  const y = parseInt(parts[2]);

  const pLeft = reduce22(sumDigits(d));
  const pTop = reduce22(sumDigits(m));
  const pRight = reduce22(sumDigits(y));
  const pBottom = reduce22(reduce22(pLeft + pTop + pRight));

  const pCenter = reduce22(pLeft + pTop + pRight + pBottom);

  const pTL = reduce22(pLeft + pTop);
  const pTR = reduce22(pTop + pRight);
  const pBR = reduce22(pRight + pBottom);
  const pBL = reduce22(pBottom + pLeft);

  // Vertical Axis
  const v15 = reduce22(pCenter + pTop);
  const v20 = reduce22(pTop + v15);
  const v7 = reduce22(pCenter + v15);
  const v15b = reduce22(pCenter + pBottom);
  const v20b = reduce22(pBottom + v15b);

  // Horizontal Axis
  const h19 = reduce22(pLeft + pCenter);
  const h11 = reduce22(pLeft + h19);

  // Extra Right
  const r10_orange = reduce22(pTR + pBR);
  const r10_black = reduce22(pRight + r10_orange);

  // Lineage
  const poleA = [pTL, pBR, reduce22(pTL + pBR)];
  const poleB = [pTR, pBL, reduce22(pTR + pBL)];

  // Socialization
  const socA = poleA[2];
  const socB = poleB[2];

  // Health Card Rows (Simplified standard logic)
  const chakras = ["Sahasrara", "Ajna", "Vishuddha", "Anahata", "Manipura", "Svadhisthana", "Muladhara"];
  const colors = ["#FFFFFF", "#4B0082", "#0000FF", "#00FF00", "#FFFF00", "#FFA500", "#FF0000"];
  
  const healthRows: HealthRow[] = chakras.map((name, i) => {
    // Example logic mapping matrix points to chakras
    const pVal = reduce22(pTop + i); // Placeholder mapping
    const eVal = reduce22(pCenter + i);
    return {
      chakra: name,
      color: colors[i],
      physics: pVal,
      energy: eVal,
      emotions: reduce22(pVal + eVal)
    };
  });

  return {
    meta: {
      version: "1.0.4",
      date: new Date().toLocaleDateString('de-DE'),
      reduce_rule: "Max 22 (Standard)"
    },
    base: { top: pTop, left: pLeft, right: pRight, bottom: pBottom },
    corners: { topLeft: pTL, topRight: pTR, bottomLeft: pBL, bottomRight: pBR },
    center: pCenter,
    inner: {
      vertical: { v20, v15, v7, v15b, v20b },
      horizontal: { h19, h11 },
      extra: { right_10_orange: r10_orange, right_10_black: r10_black }
    },
    lineage: { poleA, poleB },
    socialization: {
      poleA: socA,
      poleB: socB,
      total: reduce22(socA + socB)
    },
    healthCard: {
      rows: healthRows,
      totals: {
        physics: reduce22(healthRows.reduce((a, b) => a + b.physics, 0)),
        energy: reduce22(healthRows.reduce((a, b) => a + b.energy, 0)),
        emotions: reduce22(healthRows.reduce((a, b) => a + b.emotions, 0))
      }
    }
  };
};

export const calculateRaster = (birthdate: string): RasterData => {
  const digits = birthdate.replace(/[^0-9]/g, '').split('').map(Number);
  const counts: Record<number, number> = {};
  for (let i = 0; i <= 9; i++) counts[i] = 0;
  digits.forEach(d => counts[d] = (counts[d] || 0) + 1);

  const missing: number[] = [];
  for (let i = 1; i <= 9; i++) if (counts[i] === 0) missing.push(i);

  const topDigit = Object.entries(counts).reduce((a, b) => b[1] > a[1] ? b : a)[0];

  return {
    counts,
    grid: { ...counts },
    stats: {
      totalDigits: digits.length,
      presentDigits: Object.values(counts).filter(c => c > 0).length,
      missingDigits: missing,
      topDigit: Number(topDigit)
    },
    layers: {
      mind: counts[3] + counts[5] + counts[9],
      soul: counts[2] + counts[6] + counts[7],
      body: counts[1] + counts[4] + counts[8]
    }
  };
};
