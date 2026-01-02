import { MessageCircle, Users, Shield, Heart } from 'lucide-react';

interface WelcomeProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export function Welcome({ onGetStarted, onSignIn }: WelcomeProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 dark:opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-200 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 dark:opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-200 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 dark:opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="max-w-4xl w-full relative z-10">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-800 dark:bg-slate-700 rounded-3xl mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-300">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            SupportCircle
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Find support from people in your exact situation. Anonymous, compassionate, and always available.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="group bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 bg-slate-700 dark:bg-slate-600 rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform duration-300">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              Find Your Community
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              AI-powered search connects you with rooms where others share your specific situation.
            </p>
          </div>

          <div className="group bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 bg-slate-700 dark:bg-slate-600 rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform duration-300">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              Your Privacy First
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              Choose how you appear in each room. From fully anonymous to verified professional.
            </p>
          </div>

          <div className="group bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 bg-slate-700 dark:bg-slate-600 rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform duration-300">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              Peer Support
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              Get advice and understanding from people who've been there, not just theory.
            </p>
          </div>
        </div>

        <div className="text-center space-y-4">
          <button
            onClick={onGetStarted}
            className="w-full max-w-md mx-auto block px-6 py-3 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-base rounded-xl hover:shadow-lg transition-all duration-300 font-semibold shadow-md"
          >
            Get Started
          </button>
          <button
            onClick={onSignIn}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 font-medium hover:underline transition-all duration-200 text-sm"
          >
            Already have an account? Sign in
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          Free to use. No credit card required. Your conversations stay private.
        </p>
      </div>
    </div>
  );
}
