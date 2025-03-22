// FormSubmission.tsx
import React, { useState } from 'react';
import Meet from './Meet'; // Adjust the import path as needed
import { supabase } from '../lib/supabase';import { PassThrough } from 'stream';
; // Adjust the import path to your Supabase client

const FormSubmission: React.FC = () => {
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Generate a unique ID for the record
    const id = crypto.randomUUID();

    // Retrieve the authenticated user (Google Auth)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User not authenticated', userError);
      setError('User not authenticated. Please sign in.');
      return;
    }
    const user_id = user.id;

    // Insert the record into the "availability" table
    const { error: insertError } = await supabase
      .from('availability')
      .insert([{ id, name, user_id, available: true }]);
    
    if (insertError) {
      console.error('Error inserting data:', insertError);
      setError('Failed to submit data. Please try again.');
      
    }

    // On successful insertion, update the state to render the Meet component
    setSubmitted(true);
  };

  // Once the form has been submitted successfully, render the Meet component
  if (submitted) {
    return <Meet />;
  }

  // Render the form
  return (
    <div>
      <h2>Enter Your Name</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <label htmlFor="name">Name:</label>
        <input 
          id="name" 
          type="text" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
        />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default FormSubmission;
