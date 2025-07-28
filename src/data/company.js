import { reactive } from 'vue';

export const company = reactive({
  app_name: 'Qrea',
  founded_in: 2025,
  founded_by: 'Carlo Battista',
  company_email: 'team.qrea@gmail.com',

  currentYear: new Date().getFullYear(),
});
