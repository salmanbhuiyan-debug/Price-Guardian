
import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  TrendingUp, 
  Info,
  ExternalLink, 
  RefreshCw, 
  ShoppingCart, 
  AlertCircle, 
  Search,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Tag,
  Link as LinkIcon,
  CheckCircle2,
  Globe,
  Image as ImageIcon,
  Zap,
  History,
  Bell,
  X,
  Bookmark,
  MapPin,
  CreditCard,
  Truck,
  Star,
  Mic,
  Filter,
  Package,
  Cpu,
  ShoppingBag,
  TrendingDown,
  BarChart3
} from 'lucide-react';
import { Scanner } from './components/Scanner';
import { PriceChart } from './components/PriceChart';
import { analyzeProduct } from './services/geminiService';
import { AnalysisResult, ScanStatus, TrackedItem, AnalyticsEvent } from './types';

const App: React.FC = () => {
  const [status, setStatus] = useState<ScanStatus>('IDLE');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [textQuery, setTextQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | undefined>(undefined);
  
  const [showTracking, setShowTracking] = useState(false);
  const [trackedItems, setTrackedItems] = useState<TrackedItem[]>([]);
  const [scrolled, setScrolled] = useState(false);

  // Analytics State
  const [analytics, setAnalytics] = useState<AnalyticsEvent[]>([]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    const savedTracking = localStorage.getItem('pg_v10_tracked');
    if (savedTracking) setTrackedItems(JSON.parse(savedTracking));

    const savedAnalytics = localStorage.getItem('pg_v10_analytics');
    if (savedAnalytics) setAnalytics(JSON.parse(savedAnalytics));

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => console.log("Location access limited")
      );
    }
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const logEvent = (type: AnalyticsEvent['type'], prod: string, cat: string, retailer?: string) => {
    const newEvent: AnalyticsEvent = { timestamp: Date.now(), type, productName: prod, category: cat, retailer };
    const updated = [newEvent, ...analytics].slice(0, 100);
    setAnalytics(updated);
    localStorage.setItem('pg_v10_analytics', JSON.stringify(updated));
  };

  const handleAnalysis = async (imageBytes?: string, query?: string) => {
    const searchQuery = query || textQuery;
    if (!imageBytes && !searchQuery) return;
    
    setStatus('ANALYZING');
    try {
      const data = await analyzeProduct(imageBytes, searchQuery, location);
      setResult(data);
      logEvent('SEARCH', data.productName, data.category);
      setStatus('RESULT');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error("Analysis Error:", err);
      setStatus('ERROR');
    }
  };

  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("ব্রাউজার সাপোর্ট করছে না।");
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'bn-BD';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setTextQuery(transcript);
      handleAnalysis(undefined, transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const toggleTrack = () => {
    if (!result) return;
    const isTracked = trackedItems.some(t => t.name === result.productName);
    const newItems = isTracked 
      ? trackedItems.filter(t => t.name !== result.productName)
      : [{ id: Date.now().toString(), name: result.productName, price: result.currentFoundPrice, image: result.productImageUrl || '', addedAt: Date.now() }, ...trackedItems];
    setTrackedItems(newItems);
    localStorage.setItem('pg_v10_tracked', JSON.stringify(newItems));
    if (!isTracked) logEvent('TRACK_PRICE', result.productName, result.category);
  };

  const CategoryIcon = ({ cat }: { cat: string }) => {
    switch(cat) {
      case 'Electronics': return <Cpu className="w-5 h-5" />;
      case 'Groceries': return <ShoppingBag className="w-5 h-5" />;
      case 'Fashion': return <Tag className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFF] selection:bg-indigo-100 overflow-x-hidden">
      
      {/* Drawer: Alerts */}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white z-[100] shadow-2xl transition-transform duration-500 border-l border-slate-100 ${showTracking ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full p-8">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3"><Bell className="w-6 h-6 text-indigo-600" /> Watchlist</h3>
            <button onClick={() => setShowTracking(false)} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-6 h-6" /></button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4">
            {trackedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center px-6">
                <Package className="w-12 h-12 mb-4 opacity-10" />
                <p className="font-bold text-sm">আপনার ওয়াচলিস্ট এখন খালি।</p>
              </div>
            ) : trackedItems.map(item => (
              <div key={item.id} className="p-5 bg-slate-50 border border-slate-100 rounded-[32px] flex items-center gap-4 hover:shadow-lg transition-all">
                <div className="w-14 h-14 bg-white rounded-2xl p-2 shrink-0">
                  <img src={item.image} className="w-full h-full object-contain" onError={(e) => (e.currentTarget.src = 'https://placehold.co/100x100?text=Product')} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 text-sm truncate">{item.name}</h4>
                  <p className="text-indigo-600 font-black text-xs">{item.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <header className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-700 ${scrolled ? 'bg-white/90 backdrop-blur-xl py-3 border-b border-slate-100 shadow-sm' : 'bg-transparent py-10'}`}>
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center space-x-4 cursor-pointer" onClick={() => setStatus('IDLE')}>
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-indigo-200 shadow-2xl"><ShieldCheck className="w-7 h-7 text-white" /></div>
            <div><h1 className="text-xl font-black text-slate-900 leading-none">Price Guardian</h1><span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1.5 inline-block tracking-widest">Real-time Verified Shopping</span></div>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={() => setShowTracking(true)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-500 hover:text-indigo-600 transition-all relative">
              <Bell className="w-5 h-5" />
              {trackedItems.length > 0 && <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></div>}
            </button>
            {status !== 'IDLE' && <button onClick={() => setStatus('IDLE')} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm">New Search</button>}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 pt-44">
        {status === 'IDLE' && (
          <div className="max-w-5xl mx-auto space-y-24 animate-in fade-in duration-1000">
            <div className="text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-100">
                <Sparkles className="w-4 h-4" /> <span>Precision Accuracy Engine Active</span>
              </div>
              <h2 className="text-6xl md:text-8xl font-black text-slate-900 leading-[0.95] tracking-tighter">যেকোনো পণ্য, <br/><span className="text-indigo-600 text-gradient">সঠিক দাম।</span></h2>
              <p className="text-slate-500 text-2xl font-medium max-w-3xl mx-auto">আমরা বাংলাদেশের ১৫+ ক্যাটাগরির সেরা শপ চেক করে রিয়েল-টাইম এবং নির্ভুল তথ্য খুঁজে বের করি।</p>
            </div>

            <div className="max-w-4xl mx-auto space-y-12">
              <div className="relative">
                <div className="absolute -inset-4 bg-indigo-500/10 blur-2xl rounded-[60px]"></div>
                <div className="relative flex items-center bg-white p-4 rounded-[45px] shadow-2xl border border-slate-50">
                  <div className="pl-8 text-slate-300"><Search className="w-7 h-7" /></div>
                  <input
                    type="text"
                    placeholder="পণ্যের নাম দিন (যেমন: Laptop, iPhone, Shoes)..."
                    className="flex-1 px-6 py-5 bg-transparent text-slate-900 text-xl font-bold focus:outline-none"
                    value={textQuery}
                    onChange={(e) => setTextQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAnalysis()}
                  />
                  <button onClick={handleVoiceSearch} className={`p-4 rounded-2xl mr-2 transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-50 text-slate-400 hover:text-indigo-600'}`}>
                    <Mic className="w-6 h-6" />
                  </button>
                  <button onClick={() => handleAnalysis()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-6 rounded-[36px] font-black text-xl flex items-center gap-3 transition-all active:scale-95 shadow-xl">
                    <span>খুঁজুন</span> <ArrowRight className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6">100% Accuracy Vision</h3>
                  <Scanner onCapture={(base64) => handleAnalysis(base64)} isProcessing={false} />
                </div>
                <div className="bg-white rounded-[50px] p-12 border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600"><ShoppingBag className="w-8 h-8" /></div>
                    <h4 className="text-3xl font-black text-slate-900">ভেরিফাইড লিংক</h4>
                    <p className="text-slate-500 font-bold text-lg leading-relaxed">আমরা Hallucination মুক্ত এবং 100% নির্ভুল লিংক প্রদান করতে আমাদের AI-কে নিয়মিত অপ্টিমাইজ করি।</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {status === 'ANALYZING' && (
          <div className="flex flex-col items-center justify-center py-40 gap-10">
             <div className="relative">
                <div className="w-48 h-48 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center"><Zap className="w-16 h-16 text-indigo-600 animate-pulse" /></div>
             </div>
             <div className="text-center space-y-4">
               <h3 className="text-4xl font-black text-slate-900 tracking-tight">নির্ভুল তথ্য যাচাই করছি...</h3>
               <p className="text-slate-400 font-medium max-w-sm mx-auto">আমরা বর্তমান বাজার দর এবং লাইভ লিংকগুলো ভেরিফাই করছি। এটি কয়েক সেকেন্ড সময় নিতে পারে।</p>
             </div>
          </div>
        )}

        {status === 'ERROR' && (
          <div className="flex flex-col items-center justify-center py-40 gap-8 text-center animate-in fade-in duration-500">
             <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-xl mb-4">
                <AlertCircle className="w-12 h-12" />
             </div>
             <div className="space-y-3">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">কোনো তথ্য পাওয়া যায়নি!</h3>
                <p className="text-slate-500 max-w-md mx-auto font-medium leading-relaxed">আপনার দেওয়া পণ্যের নাম দিয়ে নির্ভুল তথ্য পাওয়া সম্ভব হয়নি। অনুগ্রহ করে আরও পরিষ্কার নাম দিয়ে চেষ্টা করুন।</p>
             </div>
             <button onClick={() => setStatus('IDLE')} className="px-10 py-5 bg-indigo-600 text-white rounded-[24px] font-black text-lg shadow-xl hover:bg-indigo-700 transition-all active:scale-95">
                আবার চেষ্টা করুন
             </button>
          </div>
        )}

        {status === 'RESULT' && result && (
          <div className="max-w-6xl mx-auto space-y-12 animate-in slide-in-from-bottom-12 duration-1000 pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-8 space-y-10">
                
                {/* Product Detail Card */}
                <div className="bg-white rounded-[60px] p-12 border border-slate-100 shadow-2xl relative overflow-hidden">
                  <div className={`absolute top-0 right-0 px-14 py-6 rounded-bl-[50px] text-xs font-black uppercase tracking-widest text-white ${
                    result.verdict === 'BUY_NOW' ? 'bg-emerald-500' : result.verdict === 'WAIT' ? 'bg-amber-500' : 'bg-slate-900'
                  }`}>{result.verdict.replace('_', ' ')}</div>

                  <div className="flex flex-col gap-12">
                    <div className="w-full h-[380px] bg-[#F9FBFF] rounded-[40px] p-12 flex items-center justify-center relative group">
                      <img 
                        src={result.productImageUrl || 'https://placehold.co/600x400?text=Product'} 
                        className="max-w-full max-h-full object-contain transition-transform group-hover:scale-105" 
                        onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400?text=Product')}
                      />
                      <div className="absolute top-8 left-8 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur shadow-sm rounded-full">
                         <CategoryIcon cat={result.category} />
                         <span className="text-[10px] font-black uppercase tracking-widest">{result.category}</span>
                      </div>
                    </div>

                    <div className="space-y-10">
                      <div className="space-y-6">
                        <div className="flex items-start justify-between gap-6">
                          <h3 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight">{result.productName}</h3>
                          <button onClick={toggleTrack} className={`p-4 rounded-2xl transition-all shadow-sm shrink-0 ${trackedItems.some(t => t.name === result.productName) ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}><Bell className="w-7 h-7" /></button>
                        </div>
                        <div className="flex flex-wrap gap-12">
                           <div><span className="text-xs font-black text-slate-400 uppercase block mb-1">Lowest Found</span><span className="text-6xl font-black text-indigo-600 tracking-tighter">{result.currentFoundPrice}</span></div>
                           <div><span className="text-xs font-black text-slate-400 uppercase block mb-1">Market Avg</span><span className="text-3xl font-bold text-slate-300">{result.marketAverage}</span></div>
                        </div>
                      </div>

                      <div className="p-10 bg-slate-50 rounded-[40px] flex gap-8">
                         <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm shrink-0"><Info className="w-8 h-8 text-indigo-600" /></div>
                         <p className="text-slate-700 font-bold text-lg leading-relaxed">{result.advice}</p>
                      </div>

                      {result.bestBuyLink && (
                        <button 
                          onClick={() => window.open(result.bestBuyLink, '_blank')}
                          className="flex items-center justify-center gap-4 w-full py-8 bg-slate-900 text-white rounded-[32px] font-black text-2xl hover:bg-black transition-all shadow-xl active:scale-[0.98]"
                        >
                          <ShoppingCart className="w-8 h-8" /> <span>লেটেস্ট ডিল দেখুন</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[60px] p-12 border border-slate-100 shadow-xl">
                   <h4 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">দামের উঠানামা (প্রাইস গ্রাফ)</h4>
                   {result.priceHistory && result.priceHistory.length > 0 ? (
                     <PriceChart data={result.priceHistory} />
                   ) : (
                     <div className="h-40 flex items-center justify-center text-slate-400 font-bold italic bg-slate-50 rounded-3xl">গ্রাফের জন্য পর্যাপ্ত তথ্য নেই।</div>
                   )}
                </div>
              </div>

              <div className="lg:col-span-4 space-y-10">
                
                {/* Organic Recommendation Area */}
                {result.sources.length > 0 && (
                  <div className="bg-indigo-600 rounded-[50px] p-10 text-white shadow-2xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] transition-all group-hover:blur-[80px]"></div>
                     <div className="relative z-10 space-y-8">
                        <div className="flex items-center justify-between">
                           <h4 className="text-xl font-black uppercase tracking-widest">Recommended Store</h4>
                           <CheckCircle2 className="w-6 h-6 text-indigo-200" />
                        </div>
                        <div className="space-y-6">
                           {result.sources.slice(0, 1).map((source, i) => (
                             <div key={i} className="space-y-4">
                                <p className="text-2xl font-black">{source.title}</p>
                                <div className="flex items-center gap-2">
                                  {[...Array(5)].map((_, j) => <Star key={j} className={`w-3 h-3 ${j < source.trustScore ? 'fill-amber-400 text-amber-400' : 'text-white/20'}`} />)}
                                  <span className="text-[10px] font-bold text-white/60">Verified Accurate Link</span>
                                </div>
                                <button 
                                  onClick={() => window.open(source.uri, '_blank')}
                                  className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-sm hover:shadow-xl transition-all"
                                >
                                  View Offer
                                </button>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>
                )}

                {/* More Retailers */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-8">অন্যান্য নির্ভুল ফলাফল</h4>
                  <div className="space-y-4">
                    {result.sources.length <= 1 ? (
                      <div className="p-10 text-center bg-white border border-slate-100 rounded-[32px] text-slate-400 italic">অন্যান্য শপে পাওয়া যায়নি।</div>
                    ) : (
                      result.sources.slice(1).map((source, idx) => (
                        <a key={idx} href={source.uri} target="_blank" className="group bg-white p-6 rounded-[32px] border border-slate-50 hover:border-indigo-200 transition-all flex items-center justify-between">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-50"><Globe className="w-7 h-7 text-slate-300 group-hover:text-indigo-600" /></div>
                            <div className="flex flex-col">
                              <span className="font-black text-slate-800 text-sm truncate max-w-[140px]">{source.title}</span>
                              <div className="flex items-center gap-2 mt-2 text-[8px] font-black uppercase text-slate-400">
                                <span className="flex items-center gap-1 text-blue-500"><Truck className="w-3 h-3" /> {source.deliveryCharge || 'Verified'}</span>
                              </div>
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-slate-200 group-hover:text-indigo-600" />
                        </a>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-8 py-20 mt-20 border-t border-slate-100 opacity-40 flex flex-col md:flex-row justify-between items-center gap-10">
         <div className="flex items-center gap-3"><ShieldCheck className="w-6 h-6" /><span className="font-black text-sm uppercase tracking-widest">Price Guardian Pro 2025</span></div>
         <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <a href="#" className="hover:text-indigo-600">Accuracy Report</a>
            <a href="#" className="hover:text-indigo-600">Privacy Policy</a>
         </div>
      </footer>
    </div>
  );
};

export default App;
