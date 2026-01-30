
import React from 'react';
import { RasterData } from '../types';

interface RasterGridProps {
  data: RasterData;
}

const RasterGrid: React.FC<RasterGridProps> = ({ data }) => {
  const cells = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {cells.map((row) => (
        row.map((digit) => (
          <div 
            key={digit} 
            className={`aspect-square flex flex-col items-center justify-center rounded-xl transition-all ${
              data.counts[digit] > 0 
                ? 'bg-violet-600/20 border border-violet-500/40' 
                : 'bg-white/5 border border-white/5'
            }`}
          >
            <span className="text-2xl font-bold">{digit}</span>
            <span className="text-xs text-violet-400/60 font-medium">
              {data.counts[digit] > 0 ? Array(data.counts[digit]).fill(digit).join('') : ''}
            </span>
          </div>
        ))
      ))}
      <div className="col-span-3 mt-4 flex justify-center">
        <div className={`px-4 py-2 rounded-lg bg-white/5 border border-white/10 ${data.counts[0] > 0 ? 'border-violet-500/40' : ''}`}>
           <span className="text-xl font-bold">0</span>
           <span className="ml-2 text-violet-400/60">{data.counts[0] > 0 ? 'x' + data.counts[0] : 'Fehlt'}</span>
        </div>
      </div>
    </div>
  );
};

export default RasterGrid;
