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
          .timesheet-cell-time-entry(@click="startEdit(timeEntry.id)" v-if="editing !== timeEntry.id") {{ timeEntry.hours | ptToNumber }}
          input.timesheet-cell-time-entry-input(
            @keyup.enter="updateEntry($event, timeEntry)"
            :disabled="updating === timeEntry.id"
            v-if="editing === timeEntry.id"
            :ref="'input' + timeEntry.id"
            @blur="updateEntry($event, timeEntry)"
            type="number"
            :value="ptToNumber(timeEntry.hours)"
          )
        Icon.add-time-entry(
          type="md-add-circle"
          size="20"
          v-show="newEntry !== `${ticket.id}_${day.unix()}`"
          @click="openNewEntry(ticket.id, day)"
        )
        input.timesheet-cell-time-entry-input(
          @keyup.enter="createEntry($event, ticket, day)"
          :disabled="creating ===  ticket.id + '_' + day.unix()"
          v-if="newEntry === ticket.id + '_' + day.unix()"
          :ref="'inputNew' + ticket.id + '_' + day.unix()"
          @blur="createEntry($event, ticket, day)"
          type="number"
        )
    .timesheet-row
      .timesheet-cell.ticket-cell
        Icon.add-time-entry(
          type="md-add-circle"
          size="20"
          v-show="!newWorkPackageEditing"
          @click="newWorkPackageEditing = true"
        )
        AutoComplete(
          :disabled="newWorkPackageCreating"
          v-if="newWorkPackageEditing"
          ref="newWorkPackageInput"
          @on-search="autocomplete"
          @on-select="addNewWorkPackage"
        )
         <Option v-for="item in workPackageSuggestions" :value="item.id" :key="item.id">{{ item.id }} - {{ item.subject }}</Option>
          
</template>

<script lang='ts'>
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { STORE_TYPES, WorkPackageStub, TimeEntry, opClient } from '@/store';
import { Moment } from 'moment';
import { Getter } from 'vuex-class';
import { DateRange } from 'moment-range';
import { moment } from '@/moment';
import {
  getTicketId,
  uniqueByPropertyValue,
  ptStringToNumber,
  numberToPtString,
} from '@/utils';

@Component
export default class Timesheet extends Vue {
  @Getter(STORE_TYPES.GET_WPS_IN_TIME_RANGE)

  private getTickets!: (range: DateRange) => WorkPackageStub[];

  public editing: number | null = null;
  public updating: number | null = null;
  public newEntry: string | null = null;
  public creating: string | null = null;

  public newWorkPackageEditing: boolean = false;
  public newWorkPackageCreating: boolean = false;
  public newWorkPackages: WorkPackageStub[] = [];
  public workPackageSuggestions: any[] = [];

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
    const days = [];
    while (current < this.selectedWeek.end) {
      days.push(current);
      current = moment(current).add(1, 'd');
    }
    return days;
  }

  get entries(): TimeEntry[] {
    return this.$store.getters[STORE_TYPES.GET_ENTRIES_IN_TIME_RANGE](
      this.selectedWeek,
    );
  }

  get workPackages(): WorkPackageStub[] {
    return uniqueByPropertyValue(
      this.entries.map((item) => {
        return {
          id: getTicketId(item),
          title: item._links.workPackage.title,
          link: item._links.workPackage.href,
        };
      }).concat(this.newWorkPackages),
      'id',
    )
  }

  public getTicketCellId(ticketId: number, day: Moment) {
    return `${ticketId}_${day.unix()}`;
  }

  public openNewEntry(ticketId: number, day: Moment) {
    const cellId = this.getTicketCellId(ticketId, day);
    this.newEntry = cellId;
    setTimeout(() => {
      const newInput = this.$refs[`inputNew${cellId}`];
      (newInput as HTMLElement[])[0].focus();
    });
  }

  public async createEntry($event: any, ticket: WorkPackageStub, day: Moment) {
    const newValue = $event.target.value;
    if (newValue) {
      try {
        this.creating = this.getTicketCellId(ticket.id, day);
        await this.$store.dispatch(STORE_TYPES.CREATE_TIME_ENTRY, {
          data: {
            spentOn: day.format('YYYY-MM-DD'),
            hours: numberToPtString(newValue),
            comment: '',
            _links: {
              // TODO: find out how to properly set this
              project: {
                href: '/api/v3/projects/2',
              },
              workPackage: {
                href: ticket.link,
              },
              activity: {
                // TODO: find mechanism to set proper activity
                href: '/api/v3/time_entries/activities/1',
              },
            },
          },
        });
      } catch (e) {
        this.$Message.error('Fehler beim eintragen der Zeit');
      } finally {
        this.creating = null;
      }
    }
    this.newEntry = null;
  }

  public startEdit(id: number) {
    this.editing = id;
    setTimeout(() => {
      (this.$refs[`input${id}`] as HTMLElement[])[0].focus();
    });
  }

  public ptToNumber(str: string) {
    return ptStringToNumber(str);
  }

  public getEntriesFor(ticketId: number, date: Moment): TimeEntry[] {
    return this.entries.filter((item) => {
      return (
        moment(item.spentOn).isSame(date, 'day') &&
        getTicketId(item) === ticketId
      );
    });
  }

  public async updateEntry($event: any, timeEntry: TimeEntry) {
    this.updating = timeEntry.id;
    const newValue = $event.target.value;
    try {
      await this.$store.dispatch(
        STORE_TYPES.PATCH_TIME_ENTRY,
        Object.assign(timeEntry, {
          id: timeEntry.id,
          update: { hours: numberToPtString(newValue) },
        }),
      );
    } catch (e) {
      this.$Message.error('Fehler beim eintragen der Zeit');
    } finally {
      this.updating = null;
    }
    this.editing = null;
  }

  public addNewWorkPackage(workPackageId: any) {
    const workPackage = this.workPackageSuggestions.find((item) => item.id === workPackageId)
    if (!workPackage) return;
    this.newWorkPackages.push({
      title: workPackage.subject,
      id: workPackage.id,
      link: workPackage._links.self.href
    });
    this.newWorkPackageEditing = false;
  }

  private async autocomplete(val: string) {
    this.workPackageSuggestions = (await opClient.get('work_packages', {
      params: {
        filters: JSON.stringify([
        {
          subject: {
            operator: "~",
            values: [val]
          },
           id: {
            operator: "=",
            values: [val]
          }
        }])
      }
    })).data._embedded.elements
  }
}
</script>

<!-- Add 'scoped' attribute to limit CSS to this component only -->
<style scoped lang='scss'>
.timesheet {
  width: 100%;
  display: table;
}
.timesheet-row {
  width: 100%;
  display: table-row;
  &.head {
    .timesheet-cell {
      font-weight: bold;
    }
  }
}

.timesheet-cell {
  padding: 0.7%;
  display: inline-block;
  width: 12.5%;
  display: table-cell;
  .timesheet-cell-time-entry {
    cursor: pointer;
    background: gray;
    border: 1px solid black;
    height: 100%;
    display: inline-block;
    padding: 4px 8px;
  }
  .add-time-entry {
    cursor: pointer;
    margin-left: 5px;
  }
  .timesheet-cell-time-entry-input {
    display: inline-block;
    width: 25%;
  }
  &.ticket-cell {
  }
}
</style>
