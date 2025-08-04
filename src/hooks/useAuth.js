import { ref } from 'vue';
import { supabase } from '../lib/supabase';
import { auth } from '../data/auth';
import { useI18n } from 'vue-i18n';
import { syncLocaleWithProfile } from '../lib/i18n';
import { useRouter } from 'vue-router';

export function useAuth() {
  const loading = ref(false);
  const router = useRouter();
  const { t } = useI18n();

  // Ottiene l'utente corrente da Supabase
  const getUser = async () => {
    try {
      loading.value = true;
      const { data, error } = await supabase.auth.getUser();

      if (!error && data.user) {
        auth.user = data.user;
        auth.isAuthenticated = true;
        localStorage.setItem('isAuthenticated', true);

        await getSession();
        await getProfile();

        return { success: true, user: data.user };
      } else {
        return { success: false, error: error?.message || 'Utente non trovato' };
      }
    } catch (e) {
      console.error('Errore in getUser:', e);
      return { success: false, error: e.message };
    } finally {
      loading.value = false;
    }
  };

  // Ottiene la sessione corrente
  const getSession = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (!error) {
        auth.session = data.session;
        return { success: true, session: data.session };
      } else {
        return { success: false, error: error.message };
      }
    } catch (e) {
      console.error('Errore in getSession:', e);
      return { success: false, error: e.message };
    }
  };

  // Ottiene il profilo dell'utente
  const getProfile = async () => {
    if (!auth.user?.id) {
      return { success: false, error: 'Utente non autenticato' };
    }

    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('uid', auth.user.id).maybeSingle();

      if (!error) {
        auth.profile = data;
        await getSubscription();
        syncLocaleWithProfile();
        return { success: true, profile: data };
      } else {
        return { success: false, error: error.message };
      }
    } catch (e) {
      console.error('Errore in getProfile:', e);
      return { success: false, error: e.message };
    }
  };

  // Ottiene la sottoscrizione dell'utente
  const getSubscription = async () => {
    if (!auth.profile?.id) {
      return { success: false, error: 'Profilo non disponibile' };
    }

    try {
      const { data, error } = await supabase.from('subscriptions').select('*').eq('pid', auth.profile.id).maybeSingle();

      if (!error) {
        auth.subscription = data;
        return { success: true, subscription: data };
      } else {
        return { success: false, error: error.message };
      }
    } catch (e) {
      console.error('Errore in getSubscription:', e);
      return { success: false, error: e.message };
    }
  };

  // Effettua il login
  const signIn = async (email, password) => {
    try {
      loading.value = true;
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data.user) {
        auth.user = data.user;
        auth.session = data.session;
        auth.isAuthenticated = true;
        localStorage.setItem('isAuthenticated', true);

        await getProfile();

        return { success: true, user: data.user };
      } else {
        return { success: false, error: error?.message || 'Errore durante il login' };
      }
    } catch (e) {
      console.error('Errore in signIn:', e);
      return { success: false, error: e.message };
    } finally {
      loading.value = false;
    }
  };

  // Effettua il logout
  const signOut = async () => {
    if (confirm(t('navigation.signOutConfirm'))) {
      try {
        loading.value = true;
        const { error } = await supabase.auth.signOut();

        if (!error) {
          // Reset dello stato auth
          auth.user = null;
          auth.session = null;
          auth.profile = null;
          auth.subscription = null;
          auth.isAuthenticated = false;
          localStorage.removeItem('isAuthenticated');

          // Redirect alla pagina di login
          router.push({ name: 'signin' });

          return { success: true };
        } else {
          return { success: false, error: error.message };
        }
      } catch (e) {
        console.error('Errore in signOut:', e);
        return { success: false, error: e.message };
      } finally {
        loading.value = false;
      }
    }
  };

  // Inizializza l'autenticazione (da chiamare al mount dell'app)
  const initAuth = async () => {
    try {
      loading.value = true;

      // Controlla se c'è un utente autenticato
      const userResult = await getUser();

      if (userResult.success) {
        // console.log('Utente autenticato:', userResult.user.email);
      } else {
        // console.log('Nessun utente autenticato');
      }

      return userResult;
    } catch (e) {
      console.error('Errore in initAuth:', e);
      return { success: false, error: e.message };
    } finally {
      loading.value = false;
    }
  };

  // Ricarica tutti i dati dell'utente
  const refreshUserData = async () => {
    if (!auth.isAuthenticated) {
      return { success: false, error: 'Utente non autenticato' };
    }

    try {
      loading.value = true;

      await getSession();
      await getProfile();

      return { success: true };
    } catch (e) {
      console.error('Errore in refreshUserData:', e);
      return { success: false, error: e.message };
    } finally {
      loading.value = false;
    }
  };

  return {
    // State
    auth,
    loading,

    // Methods
    getUser,
    getSession,
    getProfile,
    getSubscription,
    signIn,
    signOut,
    initAuth,
    refreshUserData,
  };
}
