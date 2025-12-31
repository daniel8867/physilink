
import React from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip 
} from 'recharts';
import { PhysicsConcept } from '../types';

interface ConceptChartProps {
  concepts: PhysicsConcept[];
}

const ConceptChart: React.FC<ConceptChartProps> = ({ concepts }) => {
  // Aggregate importance by field
  const fieldMap: Record<string, number> = {};
  concepts.forEach(c => {
    fieldMap[c.field] = (fieldMap[c.field] || 0) + c.importance;
  });

  const data = Object.entries(fieldMap).map(([name, value]) => ({
    subject: name,
    A: value,
    fullMark: 10,
  }));

  if (data.length < 3) {
    // Fill with empty data to make the radar chart look better
    const placeholders = ['Mechanics', 'Thermodynamics', 'Quantum', 'Electromagnetism'];
    placeholders.forEach(p => {
      if (!fieldMap[p]) data.push({ subject: p, A: 0, fullMark: 10 });
    });
  }

  return (
    <div className="w-full h-64 md:h-80 glass-panel rounded-2xl p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">Concept Distribution</h3>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#475569" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} />
          <Radar
            name="Weight"
            dataKey="A"
            stroke="#38bdf8"
            fill="#0ea5e9"
            fillOpacity={0.6}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' }}
            itemStyle={{ color: '#38bdf8' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ConceptChart;
