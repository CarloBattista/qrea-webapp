import { createRouter, createWebHistory } from 'vue-router';

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

const routes = [
  // OnBoard
  {
    path: '/signup',
    name: 'signup',
    component: Signup,
    props: true,
    meta: { title: 'QRGenerator' },
  },
  {
    path: '/signin',
    name: 'signin',
    component: Signin,
    props: true,
    meta: { title: 'QRGenerator' },
  },
  {
    path: '/pricing',
    name: 'pricing',
    component: Pricing,
    props: true,
    meta: { title: 'QRGenerator' },
  },
  {
    path: '/success',
    name: 'success',
    component: Success,
    props: true,
    meta: { title: 'QRGenerator' },
  },
  {
    path: '/cancel',
    name: 'cancel',
    component: Cancel,
    props: true,
    meta: { title: 'QRGenerator' },
  },

  // Profile
  {
    path: '/profile',
    name: 'profile',
    component: Profile,
    props: true,
    meta: { title: 'QRGenerator' },
  },

  // General
  {
    path: '/',
    name: 'home',
    component: Home,
    props: true,
    meta: { title: 'QRGenerator' },
  },
  {
    path: '/new-qr',
    name: 'new-qr',
    component: NewQr,
    props: true,
    meta: { title: 'QRGenerator' },
  },
  {
    path: '/edit-qr/:id',
    name: 'edit-qr',
    component: EditQr,
    props: true,
    meta: { title: 'QRGenerator' },
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
  next();
});

export default router;
