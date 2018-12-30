<template lang="pug">
  .week-picker
    Datepicker.week-picker-input(v-model="selectedDate" :monday-first="true")
    span.week-picker-title KW {{ weekNumber }}
</template>

<script lang="ts">

import { Component, Prop, Vue } from 'vue-property-decorator';
import { Getter, Mutation } from 'vuex-class';
import { STORE_TYPES } from '@/store';
import moment from 'moment';
// @ts-ignore
import Datepicker from 'vuejs-datepicker';

@Component({
  components: {
    Datepicker
  }
})
export default class WeekPicker extends Vue {
  get weekNumber() {
    return moment(this.selectedDate).week();
  }

  get selectedDate() {
    return moment(this.$route.query.date).toDate();
  }

  set selectedDate(date) {
    this.$router.push({
      name: 'timesheet',
      query: {
        date: moment(date).format('YYYY-MM-DD'),
      },
    });
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
  .week-picker {
    display: flex;
    justify-content: center;
    .week-picker-title {
      margin-left: 10px;
      display: flex;
      align-items: center;
    }
  }

</style>
