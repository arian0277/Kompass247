
import React from 'react';
import { MatrixData, ARCANA_NAMES } from '../types';

interface MatrixViewProps {
  data: MatrixData;
}

const MatrixView: React.FC<MatrixViewProps> = ({ data }) => {
  const points = [
    { id: 'CENTER', label: 'Zentrum', value: data.center, icon: '🌟' },
    { id: 'TOP', label: 'Spiritualität', value: data.base.top, icon: '☁️' },
    { id: 'LEFT', label: 'Persönlichkeit', value: data.base.left, icon: '👤' },
    { id: 'RIGHT', label: 'Talent', value: data.base.right, icon: '🎨' },
    { id: 'BOTTOM', label: 'Karma', value: data.base.bottom, icon: '⚖️' },
  ];

  return (
    <div className="space-y-4">
      {points.map((p) => (
        <div key={p.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
          <div className="w-10 h-10 flex items-center justify-center text-xl bg-violet-900/40 rounded-lg">
            {p.icon}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-baseline">
               <span className="text-xs text-white/40 uppercase font-bold tracking-tighter">{p.label}</span>
               <span className="text-xs text-violet-400">Arkan {p.value}</span>
            </div>
            <div className="text-sm font-semibold text-white/90">
              {ARCANA_NAMES[p.value] || "Unbekannt"}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MatrixView;
