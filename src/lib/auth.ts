import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "rider";
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export async function signIn(email: string, password: string) {
  try {
    console.log('Attempting to sign in with email:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Sign in error:', error);
      if (error.message.includes('Email not confirmed')) {
        return { 
          data: null, 
          error: new Error('Email belum diverifikasi. Silakan cek email Anda atau kirim ulang email verifikasi.'),
          needsVerification: true
        };
      } else if (error.message.includes('Invalid login credentials')) {
        return { 
          data: null, 
          error: new Error('Email atau password tidak valid. Silakan cek kembali.') 
        };
      }
      return { data: null, error };
    }

    if (!data.user || !data.session) {
      console.error('No user or session data returned');
      return { data: null, error: new Error('Gagal mendapatkan data user') };
    }

    // Get user profile after successful login
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    } else {
      console.log('Profile fetched:', profile);
    }

    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error during sign in:', err);
    return { 
      data: null, 
      error: err instanceof Error ? err : new Error('Terjadi kesalahan saat login') 
    };
  }
}

export async function signUp(email: string, password: string, fullName: string) {
  // Sign up the user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${window.location.origin}/`,
    },
  });

  if (error) return { data, error };

  if (data.user) {
    // Create or update profile with role
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: data.user.id,
        full_name: fullName,
        role: 'rider', // Set default role to rider
        email: email,
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      return { data, error: profileError };
    }
  }

  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getUserProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  
  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
  
  return data as Profile;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth`,
  });
  return { error };
}

export async function resendVerificationEmail(email: string) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email,
  });
  return { error };
}
