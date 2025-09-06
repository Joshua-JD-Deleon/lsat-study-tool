import React, { useState, useEffect } from 'react';
import { BookOpen, Target, Clock, Trophy, RefreshCw, CheckCircle, XCircle, Brain, ArrowRight, Download, Wifi, WifiOff, Share } from 'lucide-react';

interface Question {
  id: number;
  type: 'logical_reasoning' | 'reading_comprehension' | 'analytical_reasoning';
  question: string;
  passage?: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Sample questions data
const sampleQuestions: Question[] = [
  {
    id: 1,
    type: 'logical_reasoning',
    question: "If all roses are flowers, and some flowers fade quickly, which of the following must be true?",
    options: [
      "All roses fade quickly",
      "Some roses are flowers",
      "No roses fade quickly", 
      "All flowers are roses"
    ],
    correct_answer: 1,
    explanation: "Since all roses are flowers, it necessarily follows that some roses are flowers (in fact, all roses are flowers). The other options are not necessarily true based on the given premises.",
    difficulty: 'easy'
  },
  {
    id: 2,
    type: 'reading_comprehension',
    passage: "The concept of artificial intelligence has evolved significantly since its inception in the 1950s. Initially, researchers focused on creating machines that could perform tasks requiring human intelligence, such as playing chess or solving mathematical problems. However, modern AI has shifted toward machine learning and neural networks, enabling computers to learn from data rather than following pre-programmed instructions.",
    question: "Based on the passage, what represents the primary shift in AI development?",
    options: [
      "From chess playing to mathematical problem solving",
      "From pre-programmed instructions to learning from data",
      "From the 1950s to modern times",
      "From human intelligence to machine intelligence"
    ],
    correct_answer: 1,
    explanation: "The passage explicitly states that modern AI has shifted from machines following pre-programmed instructions to enabling computers to learn from data through machine learning and neural networks.",
    difficulty: 'medium'
  },
  {
    id: 3,
    type: 'analytical_reasoning',
    question: "Five students - Alice, Bob, Carol, David, and Eve - are arranged in a line. Alice is not at either end. Bob is somewhere to the left of Carol. David is immediately to the right of Alice. If Eve is at one end, which student could be in the middle position?",
    options: [
      "Alice",
      "Bob", 
      "Carol",
      "David"
    ],
    correct_answer: 0,
    explanation: "Given the constraints: Alice is not at either end, David is immediately to the right of Alice, and Eve is at one end. This creates a pattern where Alice-David must be consecutive, and since Alice can't be at the ends, Alice could be in position 2, 3, or 4. If Alice is in the middle (position 3), David would be in position 4, satisfying all conditions.",
    difficulty: 'hard'
  }
];

function App() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [timeSpent, setTimeSpent] = useState(0);
  const [isActive, setIsActive] = useState(false);
  
  // PWA States
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  const currentQuestion = sampleQuestions[currentQuestionIndex];

  // PWA Installation and Offline Detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Handle PWA install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('SW registered: ', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content available
                  if (window.confirm('New version available! Click OK to refresh.')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        } catch (error) {
          console.log('SW registration failed: ', error);
        }
      });
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive) {
      interval = setInterval(() => {
        setTimeSpent(time => time + 1);
      }, 1000);
    } else if (!isActive && timeSpent !== 0) {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeSpent]);

  // Start timer when component mounts
  useEffect(() => {
    setIsActive(true);
    return () => setIsActive(false);
  }, []);

  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation) return;
    
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
    
    if (!answeredQuestions.has(currentQuestion.id)) {
      setAnsweredQuestions(prev => new Set(prev).add(currentQuestion.id));
      if (answerIndex === currentQuestion.correct_answer) {
        setScore(prev => prev + 1);
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < sampleQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setAnsweredQuestions(new Set());
    setTimeSpent(0);
    setIsActive(true);
  };

  // PWA Functions
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };
  
  const exportProgress = () => {
    const progressData = {
      score,
      answeredQuestions: Array.from(answeredQuestions),
      timeSpent,
      totalQuestions: sampleQuestions.length,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    
    const dataStr = JSON.stringify(progressData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `lsat-progress-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  
  const shareProgress = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My LSAT Study Progress',
          text: `I've answered ${answeredQuestions.size}/${sampleQuestions.length} questions with a score of ${score}/${answeredQuestions.size} in ${formatTime(timeSpent)}!`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback for browsers without Web Share API
      const text = `I've answered ${answeredQuestions.size}/${sampleQuestions.length} LSAT questions with a score of ${score}/${answeredQuestions.size}! Check out this study tool: ${window.location.href}`;
      navigator.clipboard.writeText(text).then(() => {
        alert('Progress copied to clipboard!');
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'logical_reasoning': return <Brain className="w-5 h-5" />;
      case 'reading_comprehension': return <BookOpen className="w-5 h-5" />;
      case 'analytical_reasoning': return <Target className="w-5 h-5" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'logical_reasoning': return 'bg-blue-100 text-blue-800';
      case 'reading_comprehension': return 'bg-green-100 text-green-800';
      case 'analytical_reasoning': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">LSAT Study Tool</h1>
                <p className="text-sm text-gray-600">Master the LSAT with targeted practice</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Online/Offline Indicator */}
              <div className="flex items-center space-x-1">
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span className="text-xs text-gray-600 hidden sm:inline">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{formatTime(timeSpent)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">{score}/{answeredQuestions.size}</span>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={shareProgress}
                  title="Share Progress"
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                  <Share className="w-4 h-4" />
                </button>
                <button
                  onClick={exportProgress}
                  title="Export Progress"
                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={resetQuiz}
                  title="Reset Quiz"
                  className="flex items-center space-x-1 px-3 py-1 text-gray-600 hover:text-red-600 bg-gray-100 hover:bg-red-50 rounded-md transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-sm hidden sm:inline">Reset</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* PWA Install Banner */}
      {showInstallPrompt && (
        <div className="bg-blue-600 text-white px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Download className="w-5 h-5" />
              <div>
                <p className="font-semibold">Install LSAT Study Tool</p>
                <p className="text-sm text-blue-100">Add to home screen for offline access</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleInstallClick}
                className="px-4 py-2 bg-white text-blue-600 rounded-md font-semibold hover:bg-blue-50 transition-colors"
              >
                Install
              </button>
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="px-3 py-2 text-blue-100 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-yellow-600 text-white px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center space-x-3">
            <WifiOff className="w-5 h-5" />
            <div>
              <p className="font-semibold">You're offline</p>
              <p className="text-sm text-yellow-100">The app is running in offline mode. Some features may be limited.</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Questions</h3>
              <div className="space-y-2">
                {sampleQuestions.map((q, index) => (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentQuestionIndex(index);
                      setSelectedAnswer(null);
                      setShowExplanation(false);
                    }}
                    className={`w-full text-left p-2 rounded text-sm transition-colors ${
                      currentQuestionIndex === index
                        ? 'bg-blue-100 text-blue-900 border border-blue-200'
                        : answeredQuestions.has(q.id)
                        ? 'bg-green-50 text-green-800 hover:bg-green-100'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Q{index + 1}</span>
                      {answeredQuestions.has(q.id) && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Progress:</span>
                    <span>{answeredQuestions.size}/{sampleQuestions.length}</span>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${(answeredQuestions.size / sampleQuestions.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm">
              {/* Question Header */}
              <div className="border-b px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-semibold text-gray-900">
                      Question {currentQuestionIndex + 1}
                    </span>
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getTypeColor(currentQuestion.type)}`}>
                      {getTypeIcon(currentQuestion.type)}
                      <span className="capitalize">{currentQuestion.type.replace('_', ' ')}</span>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(currentQuestion.difficulty)}`}>
                      {currentQuestion.difficulty}
                    </div>
                  </div>
                </div>
              </div>

              {/* Question Content */}
              <div className="px-6 py-6">
                {/* Reading Passage (if applicable) */}
                {currentQuestion.passage && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Passage:</h4>
                    <p className="text-sm text-gray-800 leading-relaxed">{currentQuestion.passage}</p>
                  </div>
                )}

                {/* Question Text */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {currentQuestion.question}
                  </h3>
                </div>

                {/* Answer Options */}
                <div className="space-y-3 mb-6">
                  {currentQuestion.options.map((option, index) => {
                    let buttonClass = "w-full text-left p-4 rounded-lg border transition-all ";
                    
                    if (showExplanation) {
                      if (index === currentQuestion.correct_answer) {
                        buttonClass += "border-green-500 bg-green-50 text-green-800";
                      } else if (index === selectedAnswer && selectedAnswer !== currentQuestion.correct_answer) {
                        buttonClass += "border-red-500 bg-red-50 text-red-800";
                      } else {
                        buttonClass += "border-gray-200 bg-gray-50 text-gray-600";
                      }
                    } else if (selectedAnswer === index) {
                      buttonClass += "border-blue-500 bg-blue-50 text-blue-800";
                    } else {
                      buttonClass += "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-800";
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(index)}
                        className={buttonClass}
                        disabled={showExplanation}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full border border-current flex items-center justify-center text-sm font-medium">
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className="text-sm">{option}</span>
                          {showExplanation && index === currentQuestion.correct_answer && (
                            <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                          )}
                          {showExplanation && index === selectedAnswer && selectedAnswer !== currentQuestion.correct_answer && (
                            <XCircle className="w-5 h-5 text-red-500 ml-auto" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation */}
                {showExplanation && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">Explanation:</h4>
                    <p className="text-sm text-blue-800 leading-relaxed">{currentQuestion.explanation}</p>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center">
                  <button
                    onClick={handlePrevQuestion}
                    disabled={currentQuestionIndex === 0}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span>Previous</span>
                  </button>
                  
                  <div className="text-sm text-gray-500">
                    {currentQuestionIndex + 1} of {sampleQuestions.length}
                  </div>
                  
                  <button
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex === sampleQuestions.length - 1}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;