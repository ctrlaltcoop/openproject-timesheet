import Vue from 'vue';
import Router from 'vue-router';
import App from '@/App.vue';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'timesheet',
      component: App,
      props: (route) => ({ date: route.query.date }),
    },
  ],
});
