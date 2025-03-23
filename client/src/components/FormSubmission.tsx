import React, { useState, useEffect } from 'react';
import { UserCircle } from 'lucide-react';
import Meet from './Meet';
import { supabase } from '../lib/supabase';

const FormSubmission: React.FC = () => {
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingCheck, setLoadingCheck] = useState(true);

  // Check if the form has been submitted previously by looking for an existing record.
  useEffect(() => {
    const checkSubmission = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('User not authenticated', userError);
        setLoadingCheck(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('availability')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error checking submission:', fetchError);
      }

      if (data) {
        setSubmitted(true);
      }
      setLoadingCheck(false);
    };

    checkSubmission();
  }, []);

  if (loadingCheck) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (submitted) {
    return <Meet />;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const id = crypto.randomUUID();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      setError('User not authenticated. Please sign in.');
      return;
    }
    
    const { error: insertError } = await supabase
      .from('availability')
      .insert([{ id, name, user_id: user.id, available: true }]);
    
    if (insertError) {
      setError('Failed to submit data. Please try again.');
      return;
    }

    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <UserCircle className="w-16 h-16 mx-auto text-blue-600 mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Video Chat</h2>
          <p className="text-gray-600">Enter your name to get started</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg">
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input 
              id="name" 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter your name"
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Join Video Chat
          </button>
        </form>
      </div>
    </div>
  );
};

export default FormSubmission;
