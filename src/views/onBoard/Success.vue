<template>
  <div></div>
</template>

<script>
import { auth } from '../../data/auth';
import { store } from '../../data/store';

export default {
  name: 'Success',
  data() {
    return {
      auth,
      store,
    };
  },
};
</script>

<style scoped></style>
