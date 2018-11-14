<template lang="pug">
  .timesheet
    .timesheet-row.head
      .timesheet-cell
      .timesheet-cell(v-for="day in days") {{ day.format('dddd') }}
    .timesheet-row.head
      .timesheet-cell.ticket-cell Ticket \ Datum
      .timesheet-cell(v-for="day in days") {{ day.format('DD.MM.') }}
    .timesheet-row(v-for="ticket in workPackages")
      .timesheet-cell.ticket-cell  {{ ticket.title }}
      .timesheet-cell.ticket-cell(v-for="day in days")
        template(v-for="timeEntry in getEntriesFor(ticket.id, day)")
          .timesheet-cell-time-entry(@click="editing = timeEntry.id" v-if="editing !== timeEntry.id") {{ timeEntry.hours | ptToNumber }}
          input.timesheet-cell-time-entry-input(v-if="editing === timeEntry.id" @blur="updateEntry($event, timeEntry)" type="number" :value="ptToNumber(timeEntry.hours)")
          
    .timesheet-row
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { STORE_TYPES, WorkPackageStub, TimeEntry } from '@/store';
import { Moment } from 'moment';
import { Getter } from 'vuex-class';
import { DateRange } from 'moment-range';
import { moment } from '@/moment';
import { getTicketId, uniqueByPropertyValue, ptStringToNumber } from '@/utils';

@Component
export default class Timesheet extends Vue {
  @Getter(STORE_TYPES.GET_WPS_IN_TIME_RANGE) private getTickets!: (range: DateRange) => WorkPackageStub[];

  editing: number | null = null;

  get date() {
    return moment(this.$route.query.date).toDate();
  }

  get selectedWeek() {
    const startDay = moment(this.date).startOf('week');
    const endDay = moment(startDay).add(7, 'd');
    return moment.range(startDay, endDay);
  }

  get days(): Moment[] {
    let current = this.selectedWeek.start;
    const days = []
    while (current < this.selectedWeek.end) {
      days.push(current)
      current = moment(current).add(1, 'd')
    }
    return days;
  }
  
  get entries(): TimeEntry[] {
    return this.$store.getters[STORE_TYPES.GET_ENTRIES_IN_TIME_RANGE](this.selectedWeek)
  }

  get workPackages(): WorkPackageStub[] {
    return uniqueByPropertyValue(this.entries
      .map((item) => {
        return {
          id: getTicketId(item),
          title: item._links.workPackage.title,
        }
      }), 'id');
  }

  ptToNumber(str: string) {
    return ptStringToNumber(str)
  }

  getEntriesFor(ticketId: number, date: Moment): TimeEntry[] {
    return this.entries.filter((item) => {
      return moment(item.spentOn).isSame(date, 'day') && getTicketId(item) === ticketId
    })
  }

  updateEntry($event: any, timeEntry: TimeEntry) {
    const newValue = $event.target.value


  }

}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
  .timesheet {
    width: 100%;
    display: table;
  }
  .timesheet-row {
    display: table-row;
    width: 100%;
    &.head {
      .timesheet-cell {
        font-weight: bold;
      }
    }
  }

  .timesheet-cell {
    padding: 1em;
    display: table-cell;
    .timesheet-cell-time-entry {
      cursor: pointer;
      background: gray;
      border: 1px solid black;
    }
    &.ticket-cell {
    }
  }
</style>
