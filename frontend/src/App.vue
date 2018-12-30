<template>
  <div id="app">
    <flash-message></flash-message>
    <WeekPicker></WeekPicker>
    <Timesheet></Timesheet>
  </div>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Timesheet from '@/components/Timesheet.vue';
import WeekPicker from '@/components/WeekPicker.vue';
import store, { STORE_TYPES } from '@/store';
import { Route } from 'vue-router';

@Component({
  components: {
    Timesheet,
    WeekPicker,
  },
})
export default class App extends Vue {
  public async beforeRouteEnter(from: Route, to: Route, next: any) {

    await store.dispatch(STORE_TYPES.FETCH_CURRENT_USER);
    await store.dispatch(STORE_TYPES.UPDATE_TIME_ENTRIES);
    next();
  }
}
</script>


<style lang="scss">
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
#nav {
  padding: 30px;
  a {
    font-weight: bold;
    color: #2c3e50;
    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
