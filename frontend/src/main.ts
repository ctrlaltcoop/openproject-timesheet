import Vue from 'vue';
import './class-component-hooks';
import router from './router';
import store from './store';

import { ptStringToNumber, numberToPtString } from './utils';
// @ts-ignore
import VueFlashMessage from 'vue-flash-message';
import 'vue-flash-message/dist/vue-flash-message.min.css';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons/faArrowLeft';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons/faArrowRight';
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { faSpinner } from '@fortawesome/free-solid-svg-icons/faSpinner';
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons/faPencilAlt';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';


library.add(faArrowLeft);
library.add(faArrowRight);
library.add(faPlus);
library.add(faSpinner);
library.add(faPencilAlt);

Vue.component('Icon', FontAwesomeIcon);

Vue.use(VueFlashMessage, {
  messageOptions: {
    timeout: 1000,
    important: true,
  }
});

Vue.config.productionTip = false;

Vue.mixin({
  methods: {
    ptToNumber(str: string): number {
      return ptStringToNumber(str);
    },
    numberToPt(hours: number): string {
      return numberToPtString(hours);
    },
    hrefToId(href: string): number {
      return parseInt(href.split('/').slice(-1)[0], 10);
    },
  },
});


Vue.filter('ptToNumber', ptStringToNumber);
Vue.filter('numberToPt', numberToPtString);

new Vue({
  router,
  store,
  render: (h) => h('router-view'),
}).$mount('#timesheet-app');
