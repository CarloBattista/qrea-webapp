import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  // OnBoard
  {
    path: '/signup',
    name: 'signup',
    component: () => import('../views/onBoard/Signup.vue'),
    props: true,
    meta: { title: 'Qrea • Registrati', requiresGuest: true },
  },
  {
    path: '/signin',
    name: 'signin',
    component: () => import('../views/onBoard/Signin.vue'),
    props: true,
    meta: { title: 'Qrea • Accedi', requiresGuest: true },
  },
  {
    path: '/pricing',
    name: 'pricing',
    component: () => import('../views/onBoard/Pricing.vue'),
    props: true,
    meta: { title: 'Qrea • Prezzi' },
  },
  {
    path: '/success',
    name: 'success',
    component: () => import('../views/onBoard/Success.vue'),
    props: true,
    meta: { title: 'Qrea', requiresAuth: true },
  },
  {
    path: '/cancel',
    name: 'cancel',
    component: () => import('../views/onBoard/Cancel.vue'),
    props: true,
    meta: { title: 'Qrea', requiresAuth: true },
  },

  // Forgot
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('../views/Forgot/Forgot-password.vue'),
    props: true,
    meta: { title: 'Qrea', requiresGuest: true },
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('../views/Forgot/Reset-password.vue'),
    props: true,
    meta: { title: 'Qrea', requiresGuest: true },
  },

  // Profile
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/Profile.vue'),
    props: true,
    meta: { title: 'Qrea • Profile', requiresAuth: true },
  },

  // General
  {
    path: '/',
    name: 'landing-page',
    component: () => import('../views/Landing-page.vue'),
    props: true,
    meta: { title: 'Qrea' },
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('../views/Home.vue'),
    props: true,
    meta: { title: 'Qrea', requiresAuth: true },
  },
  {
    path: '/new-qr',
    name: 'new-qr',
    component: () => import('../views/New-qr.vue'),
    props: true,
    meta: { title: 'Qrea • Crea un nuovo QR', requiresAuth: true },
  },
  {
    path: '/edit-qr/:id',
    name: 'edit-qr',
    component: () => import('../views/Edit-qr.vue'),
    props: true,
    meta: { title: 'Qrea • Modifica QR', requiresAuth: true },
  },

  // Help
  {
    path: '/contact',
    name: 'contact',
    component: () => import('../views/Help/Contact.vue'),
    props: true,
    meta: { title: 'Qrea • Contact' },
  },

  // Common
  {
    path: '/privacy-policy',
    name: 'privacy-policy',
    component: () => import('../views/Common/Privacy.vue'),
    props: true,
    meta: { title: 'Qrea • Privacy Policy' },
  },
  {
    path: '/terms-and-conditions',
    name: 'terms-and-conditions',
    component: () => import('../views/Common/Terms.vue'),
    props: true,
    meta: { title: 'Qrea • Privacy Policy' },
  },

  // Error
  {
    path: '/not-found',
    name: 'not-found',
    component: () => import('../views/Error/Not-found.vue'),
    props: true,
    meta: { title: 'Qrea' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/not-found',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const pageTitle = to.meta.title;
  if (pageTitle) {
    document.title = pageTitle;
  } else {
    document.title = 'Qrea';
  }

  const isAuthenticated = localStorage.getItem('isAuthenticated');
  const authIsParsed = JSON.parse(isAuthenticated);

  if (to.meta.requiresGuest && authIsParsed) {
    next({ name: 'home' });
    return;
  }

  // Se la rotta richiede autenticazione e l'utente non è autenticato
  if (to.meta.requiresAuth && !authIsParsed) {
    next({ name: 'signin' });
    return;
  }

  next();
});

export default router;
