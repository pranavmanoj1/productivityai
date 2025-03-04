import React from 'react';
import { supabase } from '../lib/supabase';
import { Brain, Focus, Clock, MessageSquare } from 'lucide-react';


const Auth = () => {
  const handleGoogleSignIn = async () => {
    try {
  
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
        },
      });
      
      if (error) throw error;
      
      console.log('Sign in with Google clicked');
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Hero section */}
      <div className="flex-1 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 p-8 flex flex-col justify-center text-white">
        <div className="max-w-xl mx-auto">
          <div className="mb-8 flex items-center">
            <Brain className="h-10 w-10 mr-3" />
            <h1 className="text-3xl font-bold">Chum AI</h1>
          </div>
          
          <h2 className="text-4xl font-bold mb-6">Your AI-powered productivity companion</h2>
          
          <p className="text-xl mb-8 opacity-90">
            Navigate daily challenges with personalized, proactive support that evolves with you.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <FeatureCard 
              icon={<Brain className="h-6 w-6" />}
              title="Personalized Context"
              description="Builds understanding over time to deliver tailored support"
            />
            <FeatureCard 
              icon={<Focus className="h-6 w-6" />}
              title="Enhanced Focus"
              description="Proven to help users with ADHD improve productivity"
            />
            <FeatureCard 
              icon={<MessageSquare className="h-6 w-6" />}
              title="Natural Conversations"
              description="Advanced voice AI for fluid, human-like interactions"
            />
            <FeatureCard 
              icon={<Clock className="h-6 w-6" />}
              title="Timely Support"
              description="Proactive assistance when you need it most"
            />
          </div>
          
          <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
            <p className="italic text-white/90">
              "Chum AI cuts through the clutter of fragmented productivity apps to offer a more intuitive, 
              empathetic, and effective solution for your daily routine."
            </p>
          </div>
        </div>
      </div>
      
      {/* Right side - Sign in */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-10">
          <div className="text-center mb-8">
            <Brain className="h-12 w-12 mx-auto text-indigo-600 mb-4" />
            <h2 className="text-3xl font-bold text-gray-800">
              Welcome to Chum AI
            </h2>
            <p className="mt-3 text-gray-600">
              Sign in to access your personalized AI companion
            </p>
          </div>
          
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg px-6 py-4 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </button>
          
          <div className="text-center text-sm text-gray-500">
            <p>By signing in, you agree to our</p>
            <div className="mt-1">
              <a href="#" className="text-indigo-600 hover:text-indigo-800">Terms of Service</a>
              {' '}&amp;{' '}
              <a href="#" className="text-indigo-600 hover:text-indigo-800">Privacy Policy</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
    <div className="flex items-start">
      <div className="mr-3 bg-white/20 p-2 rounded-lg">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm opacity-90">{description}</p>
      </div>
    </div>
  </div>
);

export default Auth;