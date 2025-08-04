import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { auth } from '../data/auth'
import { store } from '../data/store'
import { setLocale } from '../lib/i18n'
import { push } from 'notivue'
import { useAuth } from './useAuth'
import {
  PAYMENT_STATUS_MAP,
  PLAN_TYPES,
  SUBSCRIPTION_LABELS,
  DATE_FORMAT_CONFIG,
  CONFIRMATION_MESSAGES,
  SUCCESS_MESSAGES,
} from '../constants/profileConstants'

export function useProfile() {
  const { getProfile, getSubscription } = useAuth()
  
  // Stato reattivo
  const selectedLanguage = ref('it-IT')
  const subscriptionDetails = ref({
    data: null,
    error: null,
    loading: false,
  })
  const nextPayment = ref({
    data: null,
    error: null,
    loading: false,
  })
  const billingHistory = ref({
    data: null,
    error: null,
    loading: false,
  })
  const dataLoaded = ref(false)

  // Computed properties
  const typeSubscription = computed(() => {
    if (!auth && !auth.subscription) {
      return SUBSCRIPTION_LABELS.FREE
    }

    const plan = auth.subscription?.plan

    if (hasDraftPayments.value && plan === PLAN_TYPES.PRO) {
      return SUBSCRIPTION_LABELS.SUSPENDED
    }

    if (plan === PLAN_TYPES.FREE) {
      return SUBSCRIPTION_LABELS.FREE
    } else if (plan === PLAN_TYPES.PRO) {
      return SUBSCRIPTION_LABELS.PRO
    }

    return SUBSCRIPTION_LABELS.FREE
  })

  const isSubscriptionCancelled = computed(() => {
    return subscriptionDetails.value?.data?.cancel_at_period_end === true
  })

  const selectedLanguageLabel = computed(() => {
    const selectedLang = store.languages.find((language) => language.value === selectedLanguage.value)
    return selectedLang ? selectedLang.name : ''
  })

  const hasDraftPayments = computed(() => {
    if (!billingHistory.value.data || billingHistory.value.data.length === 0) {
      return false
    }
    return billingHistory.value.data.some((payment) => payment.status === 'draft')
  })

  // Utility functions
  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleDateString(DATE_FORMAT_CONFIG.locale, DATE_FORMAT_CONFIG.options)
  }

  const formatPaymentStatus = (status) => {
    return PAYMENT_STATUS_MAP[status] || status
  }

  // API functions
  const updateLanguage = async (lang) => {
    if (!auth.user?.id) {
      return
    }

    selectedLanguage.value = lang

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ lang: selectedLanguage.value })
        .eq('uid', auth.user.id)

      if (!error) {
        auth.profile.lang = selectedLanguage.value
        setLocale(selectedLanguage.value)
        await getProfile()

        push.success({
          title: null,
          message: SUCCESS_MESSAGES.LANGUAGE_UPDATED,
        })
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleCancelSubscription = async () => {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
    const UID = auth.user.id
    const stripeId = auth.subscription?.stripe_id
    const customerId = auth.subscription?.customer_id

    if (!stripeId && !UID) {
      return
    }

    const confirmed = confirm(CONFIRMATION_MESSAGES.CANCEL_SUBSCRIPTION)

    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/subscriptions/${stripeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stripeId: stripeId,
          customerId: customerId,
        }),
      })

      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`)
      }

      const res = await response.json()
      alert(SUCCESS_MESSAGES.SUBSCRIPTION_CANCELLED)

      await fetchSubscriptionDetails()
    } catch (e) {
      console.error(e)
    }
  }

  const fetchSubscriptionDetails = async () => {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
    const stripeId = auth.subscription?.stripe_id

    if (!stripeId || stripeId === 'undefined' || stripeId === 'null') {
      console.warn('stripe_id non disponibile per fetchSubscriptionDetails')
      subscriptionDetails.value.loading = false
      return
    }

    subscriptionDetails.value.loading = true

    try {
      const response = await fetch(`${BACKEND_URL}/api/subscriptions/${stripeId}`)

      if (response.ok) {
        subscriptionDetails.value.data = await response.json()
        await getSubscription()
      }
    } catch (e) {
      console.error(e)
    } finally {
      subscriptionDetails.value.loading = false
    }
  }

  const fetchBillingHistory = async () => {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
    const customerId = auth.subscription?.customer_id

    billingHistory.value.loading = true

    if (!customerId) {
      billingHistory.value.loading = false
      return
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/payments/billing-history/${customerId}`)

      if (response.ok) {
        billingHistory.value.data = await response.json()
      }
    } catch (e) {
      console.error(e)
    } finally {
      billingHistory.value.loading = false
    }
  }

  const fetchNextPayment = async () => {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

    nextPayment.value.loading = true

    if (!subscriptionDetails.value.data?.customer?.id) {
      nextPayment.value.loading = false
      return
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/payments/upcoming-invoice/${subscriptionDetails.value.data.customer.id}`)

      if (response.ok) {
        nextPayment.value.data = await response.json()
      }
    } catch (e) {
      console.error(e)
    } finally {
      nextPayment.value.loading = false
    }
  }

  const loadProfileData = async () => {
    dataLoaded.value = false

    try {
      await fetchSubscriptionDetails()
      await fetchBillingHistory()

      if (subscriptionDetails.value.data) {
        await fetchNextPayment()
      }
    } catch (e) {
      console.error(e)
    } finally {
      dataLoaded.value = true
    }
  }

  const completePayment = async (invoiceId) => {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

    const payment = billingHistory.value.data.find((p) => p.id === invoiceId)

    if (payment) {
      payment.completing = true
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/payments/complete-invoice/${invoiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userStripeId: auth.profile.stripe_id,
        }),
      })

      const result = await response.json()

      if (result.success) {
        await fetchBillingHistory()

        push.success({
          title: null,
          message: SUCCESS_MESSAGES.PAYMENT_COMPLETED,
        })
      }
    } catch (e) {
      console.error(e)
    } finally {
      if (payment) {
        payment.completing = false
      }
    }
  }

  return {
    // State
    selectedLanguage,
    subscriptionDetails,
    nextPayment,
    billingHistory,
    dataLoaded,
    
    // Computed
    typeSubscription,
    isSubscriptionCancelled,
    selectedLanguageLabel,
    hasDraftPayments,
    
    // Methods
    formatDate,
    formatPaymentStatus,
    updateLanguage,
    handleCancelSubscription,
    fetchSubscriptionDetails,
    fetchBillingHistory,
    fetchNextPayment,
    loadProfileData,
    completePayment,
  }
}