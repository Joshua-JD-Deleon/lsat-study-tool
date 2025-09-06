import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from './App';

// Mock service worker registration
const mockServiceWorkerRegistration = {
  addEventListener: jest.fn(),
  installing: null,
  waiting: null,
  active: null,
  scope: 'http://localhost/',
  update: jest.fn(),
  unregister: jest.fn(),
};

// Mock navigator APIs
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: jest.fn().mockResolvedValue(mockServiceWorkerRegistration),
    ready: jest.fn().mockResolvedValue(mockServiceWorkerRegistration),
    controller: null,
  },
  configurable: true,
});

Object.defineProperty(navigator, 'onLine', {
  value: true,
  configurable: true,
});

Object.defineProperty(navigator, 'share', {
  value: jest.fn().mockResolvedValue(undefined),
  configurable: true,
});

Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
  configurable: true,
});

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  value: jest.fn().mockReturnValue(true),
  configurable: true,
});

// Mock window.alert
Object.defineProperty(window, 'alert', {
  value: jest.fn(),
  configurable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('LSAT Study Tool PWA', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset online status
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      configurable: true,
    });
  });

  describe('Core App Functionality', () => {
    test('renders the main application header', () => {
      render(<App />);
      
      expect(screen.getByText('LSAT Study Tool')).toBeInTheDocument();
      expect(screen.getByText('Master the LSAT with targeted practice')).toBeInTheDocument();
    });

    test('displays initial question and options', () => {
      render(<App />);
      
      expect(screen.getByText('Question 1')).toBeInTheDocument();
      expect(screen.getByText(/If all roses are flowers/)).toBeInTheDocument();
      expect(screen.getByText('All roses fade quickly')).toBeInTheDocument();
      expect(screen.getByText('Some roses are flowers')).toBeInTheDocument();
    });

    test('shows question navigation sidebar', () => {
      render(<App />);
      
      expect(screen.getByText('Questions')).toBeInTheDocument();
      expect(screen.getByText('Q1')).toBeInTheDocument();
      expect(screen.getByText('Q2')).toBeInTheDocument();
      expect(screen.getByText('Q3')).toBeInTheDocument();
      expect(screen.getByText('Progress:')).toBeInTheDocument();
      expect(screen.getByText('0/3')).toBeInTheDocument();
    });

    test('displays question type and difficulty badges', () => {
      render(<App />);
      
      expect(screen.getByText('Logical reasoning')).toBeInTheDocument();
      expect(screen.getByText('easy')).toBeInTheDocument();
    });
  });

  describe('Timer Functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('timer starts automatically and increments', () => {
      render(<App />);
      
      // Initial timer should be 0:00
      expect(screen.getByText('0:00')).toBeInTheDocument();
      
      // Advance time by 5 seconds
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      expect(screen.getByText('0:05')).toBeInTheDocument();
      
      // Advance time by 1 minute
      act(() => {
        jest.advanceTimersByTime(60000);
      });
      
      expect(screen.getByText('1:05')).toBeInTheDocument();
    });

    test('timer resets when reset button is clicked', () => {
      render(<App />);
      
      // Let timer run for a bit
      act(() => {
        jest.advanceTimersByTime(30000);
      });
      
      expect(screen.getByText('0:30')).toBeInTheDocument();
      
      // Click reset button
      const resetButton = screen.getByTitle('Reset Quiz');
      fireEvent.click(resetButton);
      
      expect(screen.getByText('0:00')).toBeInTheDocument();
    });
  });

  describe('Question Navigation', () => {
    test('can navigate to next question', () => {
      render(<App />);
      
      // Answer first question
      const optionB = screen.getByText('Some roses are flowers');
      fireEvent.click(optionB);
      
      // Navigate to next question
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      expect(screen.getByText('Question 2')).toBeInTheDocument();
      expect(screen.getByText(/concept of artificial intelligence/)).toBeInTheDocument();
    });

    test('can navigate to previous question', () => {
      render(<App />);
      
      // Navigate to next question first
      const optionB = screen.getByText('Some roses are flowers');
      fireEvent.click(optionB);
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      expect(screen.getByText('Question 2')).toBeInTheDocument();
      
      // Navigate back to previous question
      const prevButton = screen.getByText('Previous');
      fireEvent.click(prevButton);
      
      expect(screen.getByText('Question 1')).toBeInTheDocument();
    });

    test('navigation buttons are disabled at boundaries', () => {
      render(<App />);
      
      // Previous button should be disabled on first question
      const prevButton = screen.getByText('Previous');
      expect(prevButton).toBeDisabled();
      
      // Navigate to last question
      const sidebarQ3 = screen.getByText('Q3');
      fireEvent.click(sidebarQ3);
      
      // Next button should be disabled on last question
      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });

    test('can jump to questions using sidebar', () => {
      render(<App />);
      
      expect(screen.getByText('Question 1')).toBeInTheDocument();
      
      // Click on Q3 in sidebar
      const sidebarQ3 = screen.getByText('Q3');
      fireEvent.click(sidebarQ3);
      
      expect(screen.getByText('Question 3')).toBeInTheDocument();
      expect(screen.getByText(/Five students - Alice, Bob, Carol/)).toBeInTheDocument();
    });
  });

  describe('Answer Selection and Scoring', () => {
    test('allows answer selection and shows explanation', () => {
      render(<App />);
      
      const optionB = screen.getByText('Some roses are flowers');
      fireEvent.click(optionB);
      
      // Should show explanation
      expect(screen.getByText('Explanation:')).toBeInTheDocument();
      expect(screen.getByText(/Since all roses are flowers/)).toBeInTheDocument();
      
      // Score should update
      expect(screen.getByText('1/1')).toBeInTheDocument();
    });

    test('highlights correct and incorrect answers', () => {
      render(<App />);
      
      // Select wrong answer
      const wrongOption = screen.getByText('All roses fade quickly');
      fireEvent.click(wrongOption);
      
      // Should show correct answer highlighted
      const correctOption = screen.getByText('Some roses are flowers');
      const correctButton = correctOption.closest('button');
      expect(correctButton).toHaveClass('border-green-500', 'bg-green-50');
      
      // Wrong answer should be highlighted differently
      const wrongButton = wrongOption.closest('button');
      expect(wrongButton).toHaveClass('border-red-500', 'bg-red-50');
    });

    test('tracks progress correctly', () => {
      render(<App />);
      
      // Answer first question
      const option1 = screen.getByText('Some roses are flowers');
      fireEvent.click(option1);
      
      expect(screen.getByText('1/3')).toBeInTheDocument();
      
      // Navigate to next question and answer
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      const option2 = screen.getByText('From pre-programmed instructions to learning from data');
      fireEvent.click(option2);
      
      expect(screen.getByText('2/3')).toBeInTheDocument();
    });

    test('prevents re-answering already answered questions', () => {
      render(<App />);
      
      // Answer first question
      const correctOption = screen.getByText('Some roses are flowers');
      fireEvent.click(correctOption);
      
      expect(screen.getByText('1/1')).toBeInTheDocument();
      
      // Try to click another option - score shouldn't change
      const wrongOption = screen.getByText('All roses fade quickly');
      fireEvent.click(wrongOption);
      
      // Score should remain the same
      expect(screen.getByText('1/1')).toBeInTheDocument();
    });
  });

  describe('Reset Functionality', () => {
    test('resets all quiz state', () => {
      render(<App />);
      
      // Answer a question
      const option = screen.getByText('Some roses are flowers');
      fireEvent.click(option);
      
      expect(screen.getByText('1/1')).toBeInTheDocument();
      
      // Navigate to next question
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      expect(screen.getByText('Question 2')).toBeInTheDocument();
      
      // Reset quiz
      const resetButton = screen.getByTitle('Reset Quiz');
      fireEvent.click(resetButton);
      
      // Should be back to initial state
      expect(screen.getByText('Question 1')).toBeInTheDocument();
      expect(screen.getByText('0/0')).toBeInTheDocument();
      expect(screen.queryByText('Explanation:')).not.toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    test('exports progress data', () => {
      // Mock createElement and click
      const mockLink = {
        setAttribute: jest.fn(),
        click: jest.fn(),
      };
      const createElementSpy = jest.spyOn(document, 'createElement')
        .mockReturnValue(mockLink as any);
      
      render(<App />);
      
      // Answer a question to have some data
      const option = screen.getByText('Some roses are flowers');
      fireEvent.click(option);
      
      // Click export button
      const exportButton = screen.getByTitle('Export Progress');
      fireEvent.click(exportButton);
      
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', expect.stringMatching(/lsat-progress-/));
      expect(mockLink.setAttribute).toHaveBeenCalledWith('href', expect.stringMatching(/^data:application\/json/));
      expect(mockLink.click).toHaveBeenCalled();
      
      createElementSpy.mockRestore();
    });
  });

  describe('PWA Features', () => {
    test('registers service worker on load', () => {
      render(<App />);
      
      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
    });

    test('shows online/offline status', () => {
      render(<App />);
      
      expect(screen.getByText('Online')).toBeInTheDocument();
      
      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      });
      
      // Trigger offline event
      act(() => {
        fireEvent(window, new Event('offline'));
      });
      
      expect(screen.getByText('Offline')).toBeInTheDocument();
      expect(screen.getByText('You\'re offline')).toBeInTheDocument();
      expect(screen.getByText('The app is running in offline mode. Some features may be limited.')).toBeInTheDocument();
    });

    test('shows install prompt when beforeinstallprompt fires', () => {
      render(<App />);
      
      // Mock beforeinstallprompt event
      const mockPrompt = jest.fn().mockResolvedValue({ outcome: 'accepted' });
      const installPromptEvent = {
        preventDefault: jest.fn(),
        prompt: mockPrompt,
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      };
      
      // Trigger beforeinstallprompt event
      act(() => {
        fireEvent(window, Object.assign(new Event('beforeinstallprompt'), installPromptEvent));
      });
      
      expect(screen.getByText('Install LSAT Study Tool')).toBeInTheDocument();
      expect(screen.getByText('Add to home screen for offline access')).toBeInTheDocument();
    });

    test('can dismiss install prompt', () => {
      render(<App />);
      
      const installPromptEvent = {
        preventDefault: jest.fn(),
        prompt: jest.fn(),
        userChoice: Promise.resolve({ outcome: 'dismissed' }),
      };
      
      act(() => {
        fireEvent(window, Object.assign(new Event('beforeinstallprompt'), installPromptEvent));
      });
      
      const dismissButton = screen.getByText('×');
      fireEvent.click(dismissButton);
      
      expect(screen.queryByText('Install LSAT Study Tool')).not.toBeInTheDocument();
    });
  });

  describe('Question Types and Content', () => {
    test('displays reading comprehension question with passage', () => {
      render(<App />);
      
      // Navigate to Q2 (reading comprehension)
      const q2Button = screen.getByText('Q2');
      fireEvent.click(q2Button);
      
      expect(screen.getByText('Reading comprehension')).toBeInTheDocument();
      expect(screen.getByText('medium')).toBeInTheDocument();
      expect(screen.getByText('Passage:')).toBeInTheDocument();
      expect(screen.getByText(/The concept of artificial intelligence/)).toBeInTheDocument();
    });

    test('displays analytical reasoning question', () => {
      render(<App />);
      
      // Navigate to Q3 (analytical reasoning)
      const q3Button = screen.getByText('Q3');
      fireEvent.click(q3Button);
      
      expect(screen.getByText('Analytical reasoning')).toBeInTheDocument();
      expect(screen.getByText('hard')).toBeInTheDocument();
      expect(screen.getByText(/Five students - Alice, Bob, Carol/)).toBeInTheDocument();
    });
  });

  describe('Responsive Design Elements', () => {
    test('shows abbreviated online status on small screens', () => {
      render(<App />);
      
      const onlineText = screen.getByText('Online');
      expect(onlineText).toHaveClass('hidden', 'sm:inline');
    });

    test('shows abbreviated reset button text on small screens', () => {
      render(<App />);
      
      const resetText = screen.getByText('Reset');
      expect(resetText).toHaveClass('hidden', 'sm:inline');
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels and semantic structure', () => {
      render(<App />);
      
      // Check for proper headings
      expect(screen.getByRole('heading', { name: 'LSAT Study Tool' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Questions' })).toBeInTheDocument();
      
      // Check for buttons with proper labels
      expect(screen.getByRole('button', { name: /Previous/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Next/ })).toBeInTheDocument();
      expect(screen.getByTitle('Reset Quiz')).toBeInTheDocument();
      expect(screen.getByTitle('Export Progress')).toBeInTheDocument();
      expect(screen.getByTitle('Share Progress')).toBeInTheDocument();
    });
  });
});