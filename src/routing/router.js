import { createRouter, createWebHistory } from 'vue-router';
import i18n from '../lib/i18n';

// OnBoard
import Signup from '../views/onBoard/Signup.vue';
import Signin from '../views/onBoard/Signin.vue';
import Pricing from '../views/onBoard/Pricing.vue';
import Success from '../views/onBoard/Success.vue';
import Cancel from '../views/onBoard/Cancel.vue';

// Profile
import Profile from '../views/Profile.vue';

// General
import Home from '../views/Home.vue';
import NewQr from '../views/New-qr.vue';
import EditQr from '../views/Edit-qr.vue';

// Error
import NotFound from '../views/Error/Not-found.vue';

const routes = [
  // OnBoard
  {
    path: '/signup',
    name: 'signup',
    component: Signup,
    props: true,
    meta: { title: 'QRGenerator • Registrati', requiresGuest: true },
  },
  {
    path: '/signin',
    name: 'signin',
    component: Signin,
    props: true,
    meta: { title: 'QRGenerator • Accedi', requiresGuest: true },
  },
  {
    path: '/pricing',
    name: 'pricing',
    component: Pricing,
    props: true,
    meta: { title: 'QRGenerator • Prezzi' },
  },
  {
    path: '/success',
    name: 'success',
    component: Success,
    props: true,
    meta: { title: 'QRGenerator', requiresAuth: true },
  },
  {
    path: '/cancel',
    name: 'cancel',
    component: Cancel,
    props: true,
    meta: { title: 'QRGenerator', requiresAuth: true },
  },

  // Profile
  {
    path: '/profile',
    name: 'profile',
    component: Profile,
    props: true,
    meta: { title: 'QRGenerator • Profile', requiresAuth: true },
  },

  // General
  {
    path: '/',
    name: 'home',
    component: Home,
    props: true,
    meta: { title: 'QRGenerator', requiresAuth: true },
  },
  {
    path: '/new-qr',
    name: 'new-qr',
    component: NewQr,
    props: true,
    meta: { title: 'QRGenerator • Crea un nuovo QR', requiresAuth: true },
  },
  {
    path: '/edit-qr/:id',
    name: 'edit-qr',
    component: EditQr,
    props: true,
    meta: { title: 'QRGenerator • Modifica QR', requiresAuth: true },
  },

  // Error
  {
    path: '/not-found',
    name: 'not-found',
    component: NotFound,
    props: true,
    meta: { title: 'QRGenerator' },
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
    document.title = 'QRGenerator';
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
