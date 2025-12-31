
import React from 'react';
import { PhysicsConcept } from '../types';
import MathRenderer from './MathRenderer';

interface ConceptCardProps {
  concept: PhysicsConcept;
}

const ConceptCard: React.FC<ConceptCardProps> = ({ concept }) => {
  const getShareText = () => `Physics Concept: ${concept.name}\nField: ${concept.field}\nDescription: ${concept.description}\nEquations: ${concept.equations.join(', ')}`;

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareText = getShareText();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `PhysiLink - ${concept.name}`,
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        console.debug('Error sharing:', err);
      }
    } else {
      handleCopy(e);
    }
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(getShareText());
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="glass-panel rounded-3xl border border-slate-700/50 hover:border-sky-500/50 transition-all duration-500 group overflow-hidden flex flex-col h-full shadow-lg hover:shadow-sky-500/20">
      {/* Concept Visualization */}
      <div className="relative w-full aspect-[16/10] bg-slate-900 overflow-hidden">
        {concept.imageUrl ? (
          <img 
            src={concept.imageUrl} 
            alt={concept.name} 
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000" 
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center space-y-3">
             <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
             <span className="text-[9px] uppercase font-black tracking-[0.3em] text-sky-400/50">Computing Visualization</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent"></div>
        <div className="absolute top-4 left-4">
           <span className="px-3 py-1 rounded-full bg-sky-500/10 backdrop-blur-md border border-sky-500/20 text-[9px] font-black text-sky-400 uppercase tracking-widest shadow-xl">
            {concept.field}
          </span>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-white group-hover:text-sky-400 transition-colors duration-300">{concept.name}</h3>
          <div className="bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-700 text-[10px] font-black text-sky-400">
            W={concept.importance}
          </div>
        </div>
        
        <div className="text-slate-400 text-sm mb-6 leading-relaxed">
          <MathRenderer text={concept.description} />
        </div>
        
        {concept.equations.length > 0 && (
          <div className="mt-auto space-y-3">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Fundamental Model</span>
            <div className="relative group/plate">
              {/* Scientific Equation Plate */}
              <div className="bg-gradient-to-br from-slate-900 to-black rounded-2xl border border-slate-800 p-6 flex items-center justify-center min-h-[100px] shadow-inner relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sky-500/20 to-transparent"></div>
                <MathRenderer 
                  text={concept.equations[0]} 
                  displayMode={true} 
                  className="text-2xl text-sky-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.4)] transition-transform group-hover/plate:scale-105 duration-500" 
                />
                
                {/* Decorative corner accents */}
                <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-slate-700"></div>
                <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-slate-700"></div>
                <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-slate-700"></div>
                <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-slate-700"></div>
              </div>
              
              {/* Copy button overlay */}
              <button 
                onClick={handleCopy}
                className="absolute top-2 right-2 p-2 bg-slate-800/80 hover:bg-sky-500 text-slate-400 hover:text-white rounded-lg opacity-0 group-hover/plate:opacity-100 transition-all duration-300 transform scale-90 group-hover/plate:scale-100"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
              </button>
            </div>
            
            {concept.equations.length > 1 && (
              <div className="grid grid-cols-2 gap-2">
                {concept.equations.slice(1, 3).map((eq, i) => (
                  <div key={i} className="bg-slate-900/50 rounded-xl border border-slate-800 p-3 flex items-center justify-center">
                    <MathRenderer text={eq} displayMode={true} className="text-sm text-sky-400/80" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConceptCard;
