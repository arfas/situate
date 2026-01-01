import { MessageCircle, Users, Shield, Heart } from 'lucide-react';

interface WelcomeProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export function Welcome({ onGetStarted, onSignIn }: WelcomeProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-3xl mb-6">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            SupportCircle
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find support from people in your exact situation. Anonymous, compassionate, and always available.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Find Your Community
            </h3>
            <p className="text-gray-600 text-sm">
              AI-powered search connects you with rooms where others share your specific situation.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Your Privacy First
            </h3>
            <p className="text-gray-600 text-sm">
              Choose how you appear in each room. From fully anonymous to verified professional.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Peer Support
            </h3>
            <p className="text-gray-600 text-sm">
              Get advice and understanding from people who've been there, not just theory.
            </p>
          </div>
        </div>

        <div className="text-center space-y-4">
          <button
            onClick={onGetStarted}
            className="w-full max-w-md mx-auto block px-8 py-4 bg-blue-600 text-white text-lg rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-lg hover:shadow-xl"
          >
            Get Started
          </button>
          <button
            onClick={onSignIn}
            className="text-blue-600 hover:text-blue-700 font-medium"
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
