import { reactive } from 'vue';

export const auth = reactive({
  user: null,
  session: null,
  profile: null,
  subscription: null,
  isAuthenticated: false,
});
