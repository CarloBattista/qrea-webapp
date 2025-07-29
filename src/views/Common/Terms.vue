<template>
  <navLp />
  <section class="relative w-full lg:px-8 px-4 lg:py-[100px] md:py-12 py-9">
    <div class="relative max-w-[1280px] mx-auto">
      <div class="mark-text prose prose-lg max-w-none" v-html="markdownContent"></div>
    </div>
  </section>
  <footerLp />
</template>

<script>
import { marked } from 'marked';

import '../../style/markdown.css';

import navLp from '../../components/navigation/nav-lp.vue';
import footerLp from '../../components/navigation/footer-lp.vue';

export default {
  name: 'Terms',
  components: {
    navLp,
    footerLp,
  },
  data() {
    return {
      markdownContent: '',
      loading: true,
      error: null,
    };
  },
  methods: {
    async loadContent() {
      try {
        this.loading = true;
        this.error = null;

        const response = await fetch('/markdown/terms-and-conditions.md');

        if (!response.ok) {
          throw new Error(`Errore HTTP: ${response.status}`);
        }

        const markdownText = await response.text();

        // Converti il markdown in HTML
        this.markdownContent = marked(markdownText);
      } catch (err) {
        console.error('Errore nel caricamento della privacy policy:', err);
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
  },
  async mounted() {
    window.scrollTo(0, 0);

    await this.loadContent();
  },
};
</script>

<style scoped></style>
