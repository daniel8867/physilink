
import React, { useState, useRef, useEffect } from 'react';
import { analyzePhysicsQuery, verifyTheory, generatePhysicsImage } from './services/geminiService';
import { AnalysisResult, TheoryVerification, KnowledgeFile, RealLifeObservation, PhysicsConcept } from './types';
import ConceptCard from './components/ConceptCard';
import ConceptChart from './components/ConceptChart';
import MathRenderer from './components/MathRenderer';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'map' | 'verify'>('map');
  const [query, setQuery] = useState('');
  const [userWork, setUserWork] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeFile[]>([]);
  const [strictMode, setStrictMode] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [verification, setVerification] = useState<TheoryVerification | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showCamera && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch(() => {
          setError("Camera access failed. Check permissions.");
          setShowCamera(false);
        });
    } else if (!showCamera && videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  }, [showCamera]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      setImageData(canvas.toDataURL('image/jpeg'));
      setShowCamera(false);
    }
  };

  const handleLibraryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setKnowledgeBase(prev => [...prev, {
          name: file.name,
          type: file.type.split('/')[1].toUpperCase(),
          data: base64,
          mimeType: file.type
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAnalyze = async () => {
    if (!query && !imageData) return;
    setLoading(true);
    setError(null);
    try {
      const res = await analyzePhysicsQuery(query, imageData || undefined, knowledgeBase, strictMode);
      setResult(res);
      
      const conceptsWithImages = [...(res.concepts || [])];
      const conceptPromises = conceptsWithImages.slice(0, 3).map(async (concept, idx) => {
        try {
          const imageUrl = await generatePhysicsImage(`Diagram explaining ${concept.name}.`);
          if (imageUrl) conceptsWithImages[idx] = { ...concept, imageUrl };
        } catch (e) {}
      });

      const observationsWithImages = [...(res.realLifeObservations || [])];
      const obsPromise = (async () => {
        for (let i = 0; i < observationsWithImages.length; i++) {
          try {
            const imageUrl = await generatePhysicsImage(`Real world: ${observationsWithImages[i].conceptName}.`);
            if (imageUrl) {
              observationsWithImages[i] = { ...observationsWithImages[i], imageUrl };
              setResult(prev => prev ? { ...prev, realLifeObservations: [...observationsWithImages] } : null);
            }
          } catch (e) {}
        }
      })();

      await Promise.all([...conceptPromises]);
      setResult(prev => prev ? { ...prev, concepts: [...conceptsWithImages] } : null);
    } catch (err: any) {
      setError(err.message || 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!userWork) return;
    setLoading(true);
    setError(null);
    try {
      const context = result?.summary || query || "General physics context";
      const res = await verifyTheory(context, userWork, knowledgeBase, strictMode);
      setVerification(res);
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const EvidenceSection = ({ evidence }: { evidence: any[] }) => (
    <div className="mt-8">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Supporting Evidence</h3>
      <div className="grid gap-4">
        {evidence.map((q, i) => (
          <div key={i} className="glass-panel p-5 rounded-2xl border-l-4 border-l-sky-400 bg-sky-900/5">
            <p className="text-slate-300 italic mb-2 text-sm">"{q.text}"</p>
            <div className="flex justify-end">
              <span className="text-[10px] font-bold text-sky-400 uppercase">— {q.source}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-20 bg-[#0f172a] text-slate-200">
      <header className="sticky top-0 z-50 glass-panel border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => {setResult(null); setVerification(null);}}>
            <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg">Φ</div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">PhysiLink</h1>
          </div>
          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {(['map', 'verify'] as const).map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === tab ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-400 hover:text-white'}`}
              >
                {tab === 'map' ? 'Mapper' : 'Validator'}
              </button>
            ))}
          </div>
          <button onClick={() => setIsLibraryOpen(true)} className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-sky-400 relative">
            Textbook
            {knowledgeBase.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-sky-500 text-white text-[10px] rounded-full flex items-center justify-center">{knowledgeBase.length}</span>}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-12">
        {error && <div className="mb-8 glass-panel border-red-500/50 bg-red-900/10 p-4 rounded-xl text-red-300 text-sm">{error}</div>}

        {activeTab === 'map' && !loading && (
          <div className="max-w-4xl mx-auto space-y-8">
            {!result ? (
              <div className="glass-panel p-8 rounded-3xl space-y-6">
                <h2 className="text-3xl font-bold text-center">Deconstruct the World</h2>
                <textarea
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl p-6 text-white text-lg h-40 resize-none focus:ring-2 focus:ring-sky-500 outline-none"
                  placeholder="Describe a physics problem, phenomenon, or scan paper..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <div className="flex justify-between items-center">
                  <button onClick={() => setShowCamera(true)} className="px-4 py-2 bg-slate-800 rounded-xl text-sm font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" strokeWidth="2"/><circle cx="12" cy="13" r="3" strokeWidth="2"/></svg>
                    Scan Paper
                  </button>
                  <button onClick={handleAnalyze} disabled={!query && !imageData} className="px-10 py-3 bg-sky-500 hover:bg-sky-400 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg disabled:opacity-50">Analyze</button>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 glass-panel p-8 rounded-3xl">
                    <h2 className="text-2xl font-bold mb-4">Summary</h2>
                    <MathRenderer text={result.summary} className="text-slate-300 leading-relaxed" />
                  </div>
                  <ConceptChart concepts={result.concepts} />
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {result.concepts.map((c, i) => <ConceptCard key={i} concept={c} />)}
                </div>
                {result.realLifeObservations.length > 0 && (
                  <div className="glass-panel p-8 rounded-3xl">
                    <h3 className="text-xl font-bold mb-6">Real-Life Observations</h3>
                    <div className="grid gap-6">
                      {result.realLifeObservations.map((obs, i) => (
                        <div key={i} className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-6">
                          <div className="flex-1">
                            <span className="text-xs font-bold text-sky-400 uppercase mb-2 block">{obs.conceptName}</span>
                            <p className="text-slate-200 font-semibold mb-2">{obs.description}</p>
                            <p className="text-sm text-slate-400">Example: {obs.example}</p>
                          </div>
                          {obs.imageUrl && <img src={obs.imageUrl} className="md:w-48 aspect-video object-cover rounded-xl" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {result.sourceEvidence.length > 0 && <EvidenceSection evidence={result.sourceEvidence} />}
                <div className="flex justify-center"><button onClick={() => setResult(null)} className="px-8 py-3 bg-slate-800 rounded-xl font-bold">New Analysis</button></div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'verify' && !loading && (
          <div className="max-w-4xl mx-auto space-y-8">
            {!verification ? (
              <div className="glass-panel p-8 rounded-3xl space-y-6">
                <h2 className="text-3xl font-bold text-center">Validator</h2>
                <textarea
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl p-6 text-white text-lg h-64 font-mono resize-none focus:ring-2 focus:ring-sky-500 outline-none"
                  placeholder="Paste your reasoning, steps, or hypothesis here..."
                  value={userWork}
                  onChange={(e) => setUserWork(e.target.value)}
                />
                <div className="flex justify-end">
                  <button onClick={handleVerify} disabled={!userWork} className="px-10 py-3 bg-sky-500 hover:bg-sky-400 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg disabled:opacity-50">Audit Reasoning</button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="glass-panel p-8 rounded-3xl border-l-8 border-l-sky-500">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold">{verification.verdict}</h2>
                      <p className="text-slate-400 mt-1">{verification.feedback}</p>
                    </div>
                    <div className="text-4xl font-black text-sky-400">{verification.overallCorrectness}%</div>
                  </div>
                  <div className="space-y-4">
                    {verification.inaccuracies.map((err, i) => (
                      <div key={i} className="p-5 bg-slate-800/20 rounded-xl border border-slate-700">
                        <h4 className="font-bold text-amber-400 mb-1">{err.point}</h4>
                        <p className="text-sm text-slate-400 mb-3">{err.reason}</p>
                        <div className="bg-sky-900/20 p-3 rounded-lg"><MathRenderer text={err.correction} /></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-center"><button onClick={() => setVerification(null)} className="px-8 py-3 bg-slate-800 rounded-xl font-bold">New Audit</button></div>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
            <div className="w-16 h-16 border-4 border-sky-500/10 border-t-sky-500 rounded-full animate-spin"></div>
            <p className="text-slate-500 animate-pulse font-bold tracking-widest uppercase text-xs">Simulating Physics Models...</p>
          </div>
        )}
      </main>

      {showCamera && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col p-6">
          <video ref={videoRef} autoPlay playsInline className="flex-1 object-contain rounded-3xl border-2 border-sky-500" />
          <div className="flex justify-center gap-6 py-8">
            <button onClick={() => setShowCamera(false)} className="px-6 py-3 bg-slate-800 rounded-xl font-bold uppercase text-xs">Cancel</button>
            <button onClick={capturePhoto} className="w-16 h-16 bg-white rounded-full border-4 border-slate-300 flex items-center justify-center">
              <div className="w-12 h-12 bg-sky-500 rounded-full"></div>
            </button>
          </div>
        </div>
      )}

      {isLibraryOpen && (
        <div className="fixed inset-y-0 right-0 w-80 glass-panel border-l border-slate-700 z-[60] p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">Textbook Store</h2>
            <button onClick={() => setIsLibraryOpen(false)}>✕</button>
          </div>
          <button onClick={() => libraryInputRef.current?.click()} className="w-full py-3 mb-6 bg-slate-800 border border-slate-700 border-dashed rounded-xl text-xs font-bold uppercase text-slate-400">Add Materials</button>
          <input type="file" ref={libraryInputRef} multiple onChange={handleLibraryUpload} className="hidden" />
          <div className="space-y-3">
            {knowledgeBase.map((f, i) => (
              <div key={i} className="bg-slate-900 p-3 rounded-xl text-xs flex justify-between items-center">
                <span className="truncate flex-1">{f.name}</span>
                <button onClick={() => setKnowledgeBase(k => k.filter((_, idx) => idx !== i))} className="text-red-400 ml-2">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default App;
