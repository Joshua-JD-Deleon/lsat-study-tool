import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Target, BookOpen, TrendingUp, Award, CheckCircle, AlertCircle, Play, Pause, RotateCcw, Plus, Minus, Edit3, Save, X, Download, Smartphone } from 'lucide-react';

const LSATStudyTool = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [studyData, setStudyData] = useState({
    baselineScore: 0,
    targetScore: 0,
    testDate: '',
    studyHours: 0,
    totalStudyHours: 200,
    currentStreak: 0,
    practiceTests: [],
    studyPlan: [],
    vocabulary: [],
    weakAreas: []
  });

  // PWA Installation
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const [timer, setTimer] = useState({
    minutes: 35,
    seconds: 0,
    isRunning: false,
    section: 'Logical Reasoning'
  });

  const [practiceSession, setPracticeSession] = useState({
    sectionType: 'LR',
    currentQuestion: 1,
    totalQuestions: 25,
    answers: {} as Record<number, string>,
    timeSpent: 0
  });

  // Timer functionality
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timer.isRunning) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev.seconds > 0) {
            return { ...prev, seconds: prev.seconds - 1 };
          } else if (prev.minutes > 0) {
            return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
          } else {
            return { ...prev, isRunning: false };
          }
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer.isRunning, timer.minutes, timer.seconds]);

  // PWA Installation & Service Worker
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }

    // PWA Install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already installed
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Data persistence
  useEffect(() => {
    const savedData = localStorage.getItem('lsatStudyData');
    if (savedData) {
      try {
        setStudyData(JSON.parse(savedData));
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('lsatStudyData', JSON.stringify(studyData));
  }, [studyData]);

  // PWA Install handler
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstallable(false);
      }
    }
  };

  // Export data functionality
  const exportStudyData = () => {
    const dataToExport = {
      ...studyData,
      exportDate: new Date().toISOString(),
      appVersion: '1.0.0'
    };
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lsat-study-progress-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const sectionTypes = {
    'LR': { name: 'Logical Reasoning', time: 35, questions: 25 },
    'RC': { name: 'Reading Comprehension', time: 35, questions: 27 },
    'LG': { name: 'Logic Games', time: 35, questions: 23 }
  };

  const studyScheduleTemplate = [
    { week: 1, focus: 'Diagnostic & Fundamentals', hours: 15, tasks: ['Take diagnostic test', 'Review basic logic concepts', 'Learn question types'] },
    { week: 2, focus: 'Logical Reasoning Deep Dive', hours: 18, tasks: ['Master assumption questions', 'Practice strengthen/weaken', 'Review logical fallacies'] },
    { week: 3, focus: 'Reading Comprehension', hours: 18, tasks: ['Active reading strategies', 'Main point identification', 'Inference practice'] },
    { week: 4, focus: 'Logic Games Introduction', hours: 20, tasks: ['Game types overview', 'Diagramming practice', 'Basic sequencing games'] },
    { week: 5, focus: 'Advanced Logic Games', hours: 20, tasks: ['Grouping games', 'Hybrid games', 'Time management'] },
    { week: 6, focus: 'Integration & Practice Tests', hours: 22, tasks: ['Full practice tests', 'Blind review', 'Weakness targeting'] },
    { week: 7, focus: 'Advanced Strategies', hours: 20, tasks: ['Difficult question types', 'Time-saving techniques', 'Error pattern analysis'] },
    { week: 8, focus: 'Final Preparation', hours: 25, tasks: ['Final practice tests', 'Review sessions', 'Test day simulation'] }
  ];

  const Dashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Target Score</p>
              <p className="text-2xl font-bold text-blue-900">{studyData.targetScore || 'Not Set'}</p>
            </div>
            <Target className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Study Hours</p>
              <p className="text-2xl font-bold text-green-900">{studyData.studyHours}/{studyData.totalStudyHours}</p>
            </div>
            <Clock className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600">Current Streak</p>
              <p className="text-2xl font-bold text-purple-900">{studyData.currentStreak} days</p>
            </div>
            <Award className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600">Practice Tests</p>
              <p className="text-2xl font-bold text-orange-900">{studyData.practiceTests.length}</p>
            </div>
            <BookOpen className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Study Progress</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Overall Progress</span>
                <span>{Math.round((studyData.studyHours / studyData.totalStudyHours) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(studyData.studyHours / studyData.totalStudyHours) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Logical Reasoning</span>
                <span className="text-sm">75%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Reading Comprehension</span>
                <span className="text-sm">60%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Logic Games</span>
                <span className="text-sm">45%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-600 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Today's Study Plan</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm">Complete 25 LR questions (35 min)</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-5 w-5 border-2 border-gray-300 rounded-full"></div>
              <span className="text-sm">Review yesterday's mistakes</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-5 w-5 border-2 border-gray-300 rounded-full"></div>
              <span className="text-sm">Practice 15 vocabulary words</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-5 w-5 border-2 border-gray-300 rounded-full"></div>
              <span className="text-sm">Blind review RC passage</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const StudySchedule = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">8-Week Study Schedule</h3>
        <div className="space-y-4">
          {studyScheduleTemplate.map((week, index) => (
            <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">Week {week.week}: {week.focus}</h4>
                  <p className="text-sm text-gray-600">{week.hours} hours total</p>
                  <ul className="mt-2 space-y-1">
                    {week.tasks.map((task, taskIndex) => (
                      <li key={taskIndex} className="text-sm text-gray-700">• {task}</li>
                    ))}
                  </ul>
                </div>
                <div className="text-right">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {Math.round(week.hours / 7)} hrs/day
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Daily Schedule Template</h3>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
            <div key={day} className="border rounded-lg p-3">
              <h4 className="font-medium text-sm mb-2">{day}</h4>
              <div className="space-y-1 text-xs">
                <div className="p-1 bg-blue-50 rounded">LR: 1 hour</div>
                <div className="p-1 bg-green-50 rounded">RC: 45 min</div>
                <div className="p-1 bg-purple-50 rounded">Review: 30 min</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const PracticeTest = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Practice Test Timer</h3>
          <select 
            className="border rounded-lg px-3 py-2"
            value={timer.section}
            onChange={(e) => {
              const section = e.target.value;
              const foundKey = Object.keys(sectionTypes).find(key => sectionTypes[key as keyof typeof sectionTypes].name === section);
              const sectionInfo = foundKey ? sectionTypes[foundKey as keyof typeof sectionTypes] : null;
              setTimer(prev => ({ 
                ...prev, 
                section,
                minutes: sectionInfo?.time || 35,
                seconds: 0,
                isRunning: false
              }));
            }}
          >
            {Object.values(sectionTypes).map(type => (
              <option key={type.name} value={type.name}>{type.name}</option>
            ))}
          </select>
        </div>
        
        <div className="text-center mb-6">
          <div className="text-6xl font-mono font-bold text-gray-800 mb-4">
            {String(timer.minutes).padStart(2, '0')}:{String(timer.seconds).padStart(2, '0')}
          </div>
          <div className="space-x-4">
            <button
              onClick={() => setTimer(prev => ({ ...prev, isRunning: !prev.isRunning }))}
              className={`px-6 py-2 rounded-lg ${timer.isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
            >
              {timer.isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <button
              onClick={() => {
                const foundKey = Object.keys(sectionTypes).find(key => sectionTypes[key as keyof typeof sectionTypes].name === timer.section);
                const sectionInfo = foundKey ? sectionTypes[foundKey as keyof typeof sectionTypes] : null;
                setTimer(prev => ({ 
                  ...prev, 
                  minutes: sectionInfo?.time || 35, 
                  seconds: 0, 
                  isRunning: false 
                }));
              }}
              className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <h4 className="font-semibold mb-3">Question Navigator</h4>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: (() => {
              const foundKey = Object.keys(sectionTypes).find(key => sectionTypes[key as keyof typeof sectionTypes].name === timer.section);
              return foundKey ? sectionTypes[foundKey as keyof typeof sectionTypes].questions : 25;
            })() }, (_, i) => (
              <button
                key={i}
                className={`w-8 h-8 rounded text-sm ${
                  practiceSession.currentQuestion === i + 1 
                    ? 'bg-blue-500 text-white' 
                    : practiceSession.answers[i + 1] 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 hover:bg-gray-200'
                }`}
                onClick={() => setPracticeSession(prev => ({ ...prev, currentQuestion: i + 1 }))}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h4 className="font-semibold mb-3">Section Statistics</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Questions Answered:</span>
              <span className="text-sm font-medium">{Object.keys(practiceSession.answers).length}/{(() => {
                const foundKey = Object.keys(sectionTypes).find(key => sectionTypes[key as keyof typeof sectionTypes].name === timer.section);
                return foundKey ? sectionTypes[foundKey as keyof typeof sectionTypes].questions : 25;
              })()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Time Remaining:</span>
              <span className="text-sm font-medium">{timer.minutes}:{String(timer.seconds).padStart(2, '0')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Avg. Time/Question:</span>
              <span className="text-sm font-medium">1:24</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h4 className="font-semibold mb-3">Quick Actions</h4>
          <div className="space-y-2">
            <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              Mark for Review
            </button>
            <button className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
              Skip Question
            </button>
            <button className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
              Submit Section
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const Progress = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Score Progress</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span>Diagnostic Test</span>
              <span className="font-bold">148</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span>Practice Test 1</span>
              <span className="font-bold text-green-600">152 (+4)</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span>Practice Test 2</span>
              <span className="font-bold text-green-600">156 (+4)</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span>Practice Test 3</span>
              <span className="font-bold text-green-600">159 (+3)</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span>Latest Practice Test</span>
              <span className="font-bold text-green-600">162 (+3)</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Section Breakdown</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Logical Reasoning</span>
                <span className="text-sm">18/25 (72%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '72%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Reading Comprehension</span>
                <span className="text-sm">20/27 (74%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '74%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Logic Games</span>
                <span className="text-sm">15/23 (65%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Weakness Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-red-600 mb-2">Critical Areas</h4>
            <ul className="space-y-1 text-sm">
              <li>• Parallel Reasoning (45% accuracy)</li>
              <li>• Assumption Questions (52% accuracy)</li>
              <li>• Complex Logic Games (38% accuracy)</li>
            </ul>
          </div>
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-yellow-600 mb-2">Needs Improvement</h4>
            <ul className="space-y-1 text-sm">
              <li>• Reading Comp - Science (65% accuracy)</li>
              <li>• Strengthen/Weaken (68% accuracy)</li>
              <li>• Timing Management</li>
            </ul>
          </div>
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-green-600 mb-2">Strengths</h4>
            <ul className="space-y-1 text-sm">
              <li>• Main Point (85% accuracy)</li>
              <li>• Basic Sequencing Games (82% accuracy)</li>
              <li>• Reading Comp - Humanities (78% accuracy)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const Vocabulary = () => {
    const [newWord, setNewWord] = useState({ word: '', definition: '', example: '' });
    const [editingId, setEditingId] = useState<number | null>(null);
    
    const vocabularyWords = [
      { id: 1, word: 'Anomalous', definition: 'Deviating from what is standard, normal, or expected', example: 'The anomalous test results required further investigation.' },
      { id: 2, word: 'Credulous', definition: 'Having or showing too great a readiness to believe things', example: 'The credulous investor fell for the obvious scam.' },
      { id: 3, word: 'Egregious', definition: 'Outstandingly bad; shocking', example: 'The company made an egregious error in their financial reporting.' },
      { id: 4, word: 'Perfunctory', definition: 'Carried out with a minimum of effort or reflection', example: 'His perfunctory apology lacked sincerity.' },
      { id: 5, word: 'Spurious', definition: 'Not being what it purports to be; false or fake', example: 'The spurious correlation misled many researchers.' }
    ];

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">LSAT Vocabulary Builder</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Add New Word</h4>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Word"
                  className="w-full border rounded-lg px-3 py-2"
                  value={newWord.word}
                  onChange={(e) => setNewWord(prev => ({ ...prev, word: e.target.value }))}
                />
                <textarea
                  placeholder="Definition"
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                  value={newWord.definition}
                  onChange={(e) => setNewWord(prev => ({ ...prev, definition: e.target.value }))}
                />
                <textarea
                  placeholder="Example sentence"
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                  value={newWord.example}
                  onChange={(e) => setNewWord(prev => ({ ...prev, example: e.target.value }))}
                />
                <button className="w-full bg-blue-500 text-white rounded-lg py-2 hover:bg-blue-600">
                  Add Word
                </button>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Quick Stats</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Words Learned:</span>
                  <span className="font-bold">47</span>
                </div>
                <div className="flex justify-between">
                  <span>Words Reviewed Today:</span>
                  <span className="font-bold">12</span>
                </div>
                <div className="flex justify-between">
                  <span>Mastery Rate:</span>
                  <span className="font-bold">74%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Vocabulary List</h3>
          <div className="space-y-4">
            {vocabularyWords.map(word => (
              <div key={word.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-bold text-blue-600 text-lg">{word.word}</h4>
                    <p className="text-gray-700 mt-1">{word.definition}</p>
                    <p className="text-sm text-gray-500 mt-2 italic">"{word.example}"</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-1 text-gray-500 hover:text-blue-500">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-500 hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const Resources = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Official Resources</h3>
          <ul className="space-y-3">
            <li className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <a href="#" className="text-blue-600 hover:underline">LawHub Official Prep Tests</a>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <a href="#" className="text-blue-600 hover:underline">LSAC Practice Tests</a>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <a href="#" className="text-blue-600 hover:underline">Official LSAT PrepTest Series</a>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <a href="#" className="text-blue-600 hover:underline">Khan Academy LSAT Prep</a>
            </li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Study Materials</h3>
          <ul className="space-y-3">
            <li className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <span>PowerScore LSAT Logic Games Bible</span>
            </li>
            <li className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <span>Manhattan Prep 5 lb. Book of Drills</span>
            </li>
            <li className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <span>Kaplan LSAT Premier</span>
            </li>
            <li className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <span>7Sage Online Course</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Study Strategies</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium mb-2">Logical Reasoning</h4>
            <ul className="text-sm space-y-1">
              <li>• Identify question type first</li>
              <li>• Find the conclusion</li>
              <li>• Look for assumption gaps</li>
              <li>• Eliminate wrong answers</li>
              <li>• Practice timed sections</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Reading Comprehension</h4>
            <ul className="text-sm space-y-1">
              <li>• Read actively for structure</li>
              <li>• Note author's tone</li>
              <li>• Identify main point</li>
              <li>• Map paragraph functions</li>
              <li>• Pre-phrase answers</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Logic Games</h4>
            <ul className="text-sm space-y-1">
              <li>• Diagram the setup carefully</li>
              <li>• Note all constraints</li>
              <li>• Look for deductions</li>
              <li>• Use process of elimination</li>
              <li>• Practice game types</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'schedule', label: 'Study Schedule', icon: Calendar },
    { id: 'practice', label: 'Practice Test', icon: Clock },
    { id: 'progress', label: 'Progress', icon: Target },
    { id: 'vocabulary', label: 'Vocabulary', icon: BookOpen },
    { id: 'resources', label: 'Resources', icon: Award }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">LSAT Study Tool</h1>
              {isInstalled && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  📱 Installed
                </span>
              )}
              {!navigator.onLine && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                  🔒 Offline Mode
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Target: {studyData.targetScore || 'Set Goal'}</span>
              <span className="text-sm text-gray-600">Days Left: 45</span>
              
              {/* Export Button */}
              <button
                onClick={exportStudyData}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>

              {/* PWA Install Button */}
              {isInstallable && (
                <button
                  onClick={handleInstallClick}
                  className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                >
                  <Smartphone className="h-4 w-4" />
                  <span>Install App</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'schedule' && <StudySchedule />}
        {activeTab === 'practice' && <PracticeTest />}
        {activeTab === 'progress' && <Progress />}
        {activeTab === 'vocabulary' && <Vocabulary />}
        {activeTab === 'resources' && <Resources />}
      </div>
    </div>
  );
};

export default LSATStudyTool;