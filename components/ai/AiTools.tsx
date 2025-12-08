
import React, { useState } from 'react';
import { Mic, PenTool, Calculator, Activity, Play, Square, Volume2, GraduationCap, MapPin, Wallet, Sparkles, Loader2, Landmark } from 'lucide-react';
import { generateSop, analyzeVisaRisk, getInterviewQuestion, recommendUniversities, UniRecommendation } from '../../services/geminiService';
import { PRPointsCriteria, Country } from '../../types';

export const AiTools: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'sop' | 'interview' | 'pr' | 'risk' | 'uni-matcher'>('uni-matcher');

  return (
    <div className="h-full flex flex-col">
      <div className="flex space-x-4 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'uni-matcher', label: 'Uni Matcher', icon: GraduationCap },
          { id: 'sop', label: 'SOP Generator', icon: PenTool },
          { id: 'interview', label: 'Voice Interview', icon: Mic },
          { id: 'pr', label: 'PR Calculator', icon: Calculator },
          { id: 'risk', label: 'Risk Analyzer', icon: Activity },
        ].map(tool => {
            const Icon = tool.icon;
            return (
                <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id as any)}
                className={`flex items-center space-x-2 px-6 py-4 rounded-xl border transition-all whitespace-nowrap ${
                    activeTool === tool.id
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                }`}
                >
                <Icon size={20} />
                <span className="font-semibold">{tool.label}</span>
                </button>
            )
        })}
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-y-auto">
        {activeTool === 'sop' && <SopGenerator />}
        {activeTool === 'interview' && <VoiceInterview />}
        {activeTool === 'pr' && <PrCalculator />}
        {activeTool === 'risk' && <RiskAnalyzer />}
        {activeTool === 'uni-matcher' && <UniMatcher />}
      </div>
    </div>
  );
};

const UniMatcher = () => {
    const [formData, setFormData] = useState({
        name: '',
        country: 'Australia',
        gpa: '',
        testType: 'IELTS',
        testScore: '',
        financialCap: 'Medium',
        courseInterest: ''
    });
    const [recommendations, setRecommendations] = useState<UniRecommendation[]>([]);
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        if (!formData.courseInterest || !formData.country) {
            alert("Please enter a target country and course interest.");
            return;
        }
        setLoading(true);
        const recs = await recommendUniversities({
            name: formData.name || 'Student',
            country: formData.country,
            gpa: formData.gpa || 'N/A',
            testType: formData.testType,
            testScore: formData.testScore || 'N/A',
            financialCap: formData.financialCap,
            courseInterest: formData.courseInterest
        });
        setRecommendations(recs);
        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold mb-4 text-slate-800">AI University Matcher</h2>
            <p className="text-sm text-slate-500 mb-6">Enter academic details to get personalized university recommendations based on acceptance probability and budget.</p>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Country</label>
                        <select 
                            className="w-full p-3 border rounded-lg bg-white" 
                            value={formData.country} 
                            onChange={e => setFormData({...formData, country: e.target.value})}
                        >
                            {Object.values(Country).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Course Interest</label>
                        <input 
                            className="w-full p-3 border rounded-lg" 
                            placeholder="e.g. Master of IT" 
                            value={formData.courseInterest} 
                            onChange={e => setFormData({...formData, courseInterest: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Financial Budget</label>
                        <select 
                            className="w-full p-3 border rounded-lg bg-white" 
                            value={formData.financialCap} 
                            onChange={e => setFormData({...formData, financialCap: e.target.value})}
                        >
                            <option value="Low">Low (Budget Friendly)</option>
                            <option value="Medium">Medium (Standard)</option>
                            <option value="Satisfactory">High (Premium)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">GPA / Percentage</label>
                        <input 
                            className="w-full p-3 border rounded-lg" 
                            placeholder="e.g. 3.6 or 80%" 
                            value={formData.gpa} 
                            onChange={e => setFormData({...formData, gpa: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">English Test Type</label>
                        <select 
                            className="w-full p-3 border rounded-lg bg-white" 
                            value={formData.testType} 
                            onChange={e => setFormData({...formData, testType: e.target.value})}
                        >
                            <option value="IELTS">IELTS</option>
                            <option value="PTE">PTE</option>
                            <option value="TOEFL">TOEFL</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Test Score</label>
                        <input 
                            className="w-full p-3 border rounded-lg" 
                            placeholder="e.g. 7.0 or 79" 
                            value={formData.testScore} 
                            onChange={e => setFormData({...formData, testScore: e.target.value})} 
                        />
                    </div>
                </div>
                
                <button 
                    onClick={handleAnalyze} 
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center"
                >
                    {loading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" size={18} />}
                    {loading ? 'Finding Best Matches...' : 'Generate Recommendations'}
                </button>
            </div>

            {recommendations.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
                    {recommendations.map((rec, idx) => (
                        <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Landmark size={80} className="text-indigo-600"/>
                            </div>
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600"><Landmark size={24}/></div>
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                    rec.acceptanceChance === 'High' ? 'bg-green-100 text-green-700' : 
                                    rec.acceptanceChance === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {rec.acceptanceChance} Chance
                                </span>
                            </div>
                            <h4 className="font-bold text-slate-800 text-lg mb-1 relative z-10">{rec.name}</h4>
                            <p className="text-sm text-slate-500 mb-4 flex items-center relative z-10"><MapPin size={12} className="mr-1"/> {rec.location}</p>
                            <div className="bg-slate-50 rounded-lg p-3 mb-4 relative z-10">
                                <p className="text-xs text-slate-600 leading-relaxed">{rec.reason}</p>
                            </div>
                            <div className="flex items-center text-xs font-bold text-slate-600 bg-slate-100 w-fit px-2 py-1 rounded relative z-10">
                                <Wallet size={12} className="mr-1"/> Tuition: {rec.tuition}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const SopGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [formData, setFormData] = useState({
    name: '', course: '', uni: '', country: '', background: ''
  });

  const handleGenerate = async () => {
    setLoading(true);
    const text = await generateSop(formData.name, formData.course, formData.uni, formData.country, formData.background);
    setResult(text);
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-slate-800">AI SOP Writer</h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <input placeholder="Student Name" className="p-3 border rounded-lg" onChange={e => setFormData({...formData, name: e.target.value})} />
        <input placeholder="Target Country" className="p-3 border rounded-lg" onChange={e => setFormData({...formData, country: e.target.value})} />
        <input placeholder="Course Name" className="p-3 border rounded-lg" onChange={e => setFormData({...formData, course: e.target.value})} />
        <input placeholder="University" className="p-3 border rounded-lg" onChange={e => setFormData({...formData, uni: e.target.value})} />
      </div>
      <textarea 
        placeholder="Brief background (e.g., Completed Bachelors in CS with 3.5 GPA, 2 years experience as Web Dev)" 
        className="w-full p-3 border rounded-lg mb-4 h-32"
        onChange={e => setFormData({...formData, background: e.target.value})}
      />
      <button 
        onClick={handleGenerate} 
        disabled={loading}
        className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 rounded-lg font-bold hover:shadow-lg transition-all"
      >
        {loading ? 'Generating...' : 'Generate SOP'}
      </button>

      {result && (
        <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
          <h3 className="font-bold mb-2">Generated SOP:</h3>
          <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">{result}</p>
        </div>
      )}
    </div>
  );
};

const VoiceInterview = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiQuestion, setAiQuestion] = useState('Press Start to begin the mock interview.');
  const [targetCountry, setTargetCountry] = useState('USA');

  const startInterview = async () => {
    setAiQuestion('Connecting to AI interviewer...');
    const q = await getInterviewQuestion(targetCountry);
    setAiQuestion(q);
    speak(q);
  };

  const speak = (text: string) => {
    const utter = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utter);
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Stop logic (simulated for web compatibility without backend stream)
      setIsRecording(false);
    } else {
      // Start logic
      setIsRecording(true);
      // Initialize speech recognition if supported
      if ('webkitSpeechRecognition' in window) {
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.onresult = (event: any) => {
            setTranscript(event.results[0][0].transcript);
            setIsRecording(false);
        };
        recognition.start();
      } else {
          alert("Speech recognition not supported in this browser. Please type your answer.");
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-xl mx-auto text-center">
      <div className="mb-8">
        <label className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Select Country Context</label>
        <select 
            value={targetCountry} 
            onChange={e => setTargetCountry(e.target.value)}
            className="block w-full mt-2 p-2 border border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
            <option value="USA">USA (F1 Visa)</option>
            <option value="Australia">Australia (GTE)</option>
            <option value="UK">UK (Credibility Interview)</option>
        </select>
      </div>

      <div className="w-full bg-indigo-900 text-white p-6 rounded-2xl shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <Volume2 size={64} />
        </div>
        <p className="text-lg font-medium opacity-80 mb-2">Visa Officer asks:</p>
        <p className="text-2xl font-bold leading-snug">"{aiQuestion}"</p>
      </div>

      <div className="flex items-center space-x-6 mb-8">
        <button 
            onClick={startInterview}
            className="px-6 py-3 bg-white border-2 border-slate-200 rounded-full font-semibold text-slate-700 hover:border-indigo-500 transition-colors"
        >
            Get New Question
        </button>
        <button 
            onClick={toggleRecording}
            className={`h-16 w-16 rounded-full flex items-center justify-center shadow-lg transition-all ${isRecording ? 'bg-red-500 animate-pulse text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
        >
            {isRecording ? <Square size={24} fill="currentColor" /> : <Mic size={28} />}
        </button>
      </div>

      <div className="w-full text-left bg-slate-50 p-4 rounded-xl border border-slate-200 min-h-[100px]">
        <span className="text-xs font-bold text-slate-400 uppercase">Your Answer Transcript:</span>
        <p className="mt-2 text-slate-700">{transcript || "Start recording to speak..."}</p>
      </div>
    </div>
  );
};

const PrCalculator = () => {
    const [points, setPoints] = useState(0);
    const [criteria, setCriteria] = useState<PRPointsCriteria>({
        age: 25,
        englishLevel: 'Competent',
        education: 'Master/Bachelor',
        experienceYears: 0,
        australianStudy: false,
        regionalStudy: false,
        partnerSkills: false
    });

    const calculate = () => {
        let p = 0;
        // Age
        if (criteria.age >= 18 && criteria.age < 25) p += 25;
        else if (criteria.age >= 25 && criteria.age < 33) p += 30;
        else if (criteria.age >= 33 && criteria.age < 40) p += 25;
        else if (criteria.age >= 40 && criteria.age < 45) p += 15;

        // English
        if (criteria.englishLevel === 'Proficient') p += 10;
        if (criteria.englishLevel === 'Superior') p += 20;

        // Education
        if (criteria.education === 'Doctorate') p += 20;
        if (criteria.education === 'Master/Bachelor') p += 15;
        if (criteria.education === 'Diploma' || criteria.education === 'Trade') p += 10;

        // Exp
        if (criteria.experienceYears >= 3 && criteria.experienceYears < 5) p += 5;
        if (criteria.experienceYears >= 5 && criteria.experienceYears < 8) p += 10;
        if (criteria.experienceYears >= 8) p += 15;

        // Others
        if (criteria.australianStudy) p += 5;
        if (criteria.regionalStudy) p += 5;
        if (criteria.partnerSkills) p += 5; // Simplified

        setPoints(p);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-4">Australia PR Points Calculator (Subclass 189/190)</h2>
            <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
                <div>
                    <label className="block text-sm font-medium mb-1">Age</label>
                    <input type="number" value={criteria.age} onChange={e => setCriteria({...criteria, age: parseInt(e.target.value)})} className="w-full p-2 border rounded" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">English Level</label>
                    <select value={criteria.englishLevel} onChange={e => setCriteria({...criteria, englishLevel: e.target.value as any})} className="w-full p-2 border rounded">
                        <option value="Competent">Competent (IELTS 6)</option>
                        <option value="Proficient">Proficient (IELTS 7)</option>
                        <option value="Superior">Superior (IELTS 8)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Education</label>
                    <select value={criteria.education} onChange={e => setCriteria({...criteria, education: e.target.value as any})} className="w-full p-2 border rounded">
                        <option value="Doctorate">Doctorate</option>
                        <option value="Master/Bachelor">Master/Bachelor</option>
                        <option value="Diploma">Diploma/Trade</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Experience (Years)</label>
                    <input type="number" value={criteria.experienceYears} onChange={e => setCriteria({...criteria, experienceYears: parseInt(e.target.value)})} className="w-full p-2 border rounded" />
                </div>
                <div className="col-span-2 space-y-2">
                    <label className="flex items-center space-x-2">
                        <input type="checkbox" checked={criteria.australianStudy} onChange={e => setCriteria({...criteria, australianStudy: e.target.checked})} className="rounded text-indigo-600"/>
                        <span>2 Years Australian Study (+5)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                        <input type="checkbox" checked={criteria.regionalStudy} onChange={e => setCriteria({...criteria, regionalStudy: e.target.checked})} className="rounded text-indigo-600"/>
                        <span>Regional Study (+5)</span>
                    </label>
                </div>
            </div>
            <div className="mt-6 flex items-center justify-between p-6 bg-indigo-900 text-white rounded-xl">
                <button onClick={calculate} className="bg-white text-indigo-900 px-6 py-2 rounded-lg font-bold hover:bg-indigo-50">Calculate Points</button>
                <div className="text-right">
                    <span className="block text-sm opacity-70">Total Points</span>
                    <span className="text-4xl font-bold">{points}</span>
                </div>
            </div>
        </div>
    );
};

const RiskAnalyzer = () => {
    // Structured inputs for better AI prediction
    const [age, setAge] = useState('');
    const [educationGap, setEducationGap] = useState('');
    const [englishScore, setEnglishScore] = useState('');
    const [country, setCountry] = useState('Australia');
    const [refusals, setRefusals] = useState('No');
    const [workExp, setWorkExp] = useState('');
    
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        setLoading(true);
        // Construct the profile string for the AI service
        const profile = `Age: ${age}, Education Gap: ${educationGap} years, English Score: ${englishScore}, Work Experience: ${workExp} years, Previous Refusals: ${refusals}.`;
        const res = await analyzeVisaRisk(profile, country);
        setResult(res);
        setLoading(false);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-4">Visa Risk Predictor</h2>
            <p className="text-sm text-slate-500 mb-6">Enter detailed applicant information to get a comprehensive risk assessment, probability score, and improvement recommendations.</p>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Country</label>
                    <select className="w-full p-3 border rounded-lg bg-white" value={country} onChange={e => setCountry(e.target.value)}>
                        <option value="Australia">Australia</option>
                        <option value="USA">USA</option>
                        <option value="Canada">Canada</option>
                        <option value="UK">UK</option>
                    </select>
                </div>
                <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Age</label>
                     <input type="number" className="w-full p-3 border rounded-lg" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 24" />
                </div>
                <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Education Gap (Years)</label>
                     <input type="number" className="w-full p-3 border rounded-lg" value={educationGap} onChange={e => setEducationGap(e.target.value)} placeholder="e.g. 2" />
                </div>
                <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">IELTS/PTE Score</label>
                     <input className="w-full p-3 border rounded-lg" value={englishScore} onChange={e => setEnglishScore(e.target.value)} placeholder="e.g. 6.5" />
                </div>
                <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Work Experience</label>
                     <input type="number" className="w-full p-3 border rounded-lg" value={workExp} onChange={e => setWorkExp(e.target.value)} placeholder="e.g. 1" />
                </div>
                <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Previous Refusals?</label>
                     <select className="w-full p-3 border rounded-lg bg-white" value={refusals} onChange={e => setRefusals(e.target.value)}>
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                     </select>
                </div>
            </div>

            <button 
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
            >
                {loading ? 'Analyzing Risks...' : 'Analyze Visa Probability'}
            </button>
            {result && (
                <div className="mt-6 p-6 bg-red-50 border border-red-100 rounded-xl animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="text-red-800 font-bold mb-2 flex items-center"><Activity className="mr-2"/> Risk Assessment Report</h3>
                    <p className="text-slate-800 whitespace-pre-wrap leading-relaxed text-sm">{result}</p>
                </div>
            )}
        </div>
    );
};
