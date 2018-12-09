<template lang="pug">
  .week-picker
    DatePicker(v-model="selectedDate")
    Icon(type="md-arrow-round-back")
    span.week-title KW {{ weekNumber }}
    Icon(type="md-arrow-round-forward")
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { DatePicker } from 'iview';
import { Getter, Mutation } from 'vuex-class';
import { STORE_TYPES } from '@/store';
import moment from 'moment';

@Component({})
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
</style>
