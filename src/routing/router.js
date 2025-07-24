import { createRouter, createWebHistory } from 'vue-router';

// OnBoard
import Signin from '../views/onBoard/Signin.vue';

// General
import Home from '../views/Home.vue';

const routes = [
  // OnBoard
  {
    path: '/signin',
    name: 'signin',
    component: Signin,
    props: true,
    meta: { title: 'QRGenerator • Sign in' },
  },

  // General
  {
    path: '/',
    name: 'home',
    component: Home,
    props: true,
    meta: { title: 'QRGenerator • Home' },
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
