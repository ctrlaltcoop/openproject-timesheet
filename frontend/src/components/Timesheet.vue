<template lang="pug">
  .timesheet
    .timesheet-table
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
            .timesheet-cell-time-entry(:class="{ 'cell-time-entry-active': selected === timeEntry.id }", @click="select(timeEntry.id)" v-if="editing !== timeEntry.id") {{ timeEntry.hours | ptToNumber }}
          Icon.add-time-entry(
            icon="plus"
            v-show="newEntry !== `${ticket.id}_${day.unix()}`"
            @click="openNewEntry(ticket.id, day)"
          )
          input.timesheet-cell-time-entry-input(
            @keyup.enter="createEntry($event, ticket, day)"
            :disabled="creating ===  ticket.id + '_' + day.unix()"
            v-if="newEntry === ticket.id + '_' + day.unix()"
            :ref="'inputNew' + ticket.id + '_' + day.unix()"
            @blur="createEntry($event, ticket, day)"
            type="number")
      .timesheet-row
        .timesheet-cell.ticket-cell
          VueAutosuggest(
            :suggestions="workPackageSuggestions"
            ref="newWorkPackageInput"
            :input-props="{id:'autosuggest__input', onInputChange: autocomplete, placeholder:'Arbeitspaket suchen'}"
            @selected="addNewWorkPackage"
            mode="select"
            :filter-by-query="true"
            :render-suggestion="suggestionDisplay"
            :get-suggestion-value="getSuggestionValue"
          )
    TimesheetSidebar(:time-entry="selectedTimeEntry" v-if="selectedTimeEntry", @saved="selected = null")
</template>

<script lang='ts'>
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import TimesheetSidebar from '@/components/TimesheetSidebar.vue';
import { STORE_TYPES, WorkPackageStub, TimeEntry, opClient } from '@/store';
import { Moment } from 'moment';
import { Getter } from 'vuex-class';
import { DateRange } from 'moment-range';
import { moment } from '@/moment';
// @ts-ignore
import { VueAutosuggest } from 'vue-autosuggest';
import {
  getTicketId,
  uniqueByPropertyValue,
  ptStringToNumber,
  numberToPtString,
} from '@/utils';


@Component({
  components: {
    VueAutosuggest,
    TimesheetSidebar,
  }
})
export default class Timesheet extends Vue {
  @Getter(STORE_TYPES.GET_WPS_IN_TIME_RANGE)

  private getTickets!: (range: DateRange) => WorkPackageStub[];
  public selected: number | null = null;
  public editing: number | null = null;
  public updating: number | null = null;
  public newEntry: string | null = null;
  public newEntryFocused: string | null = null;
  public creating: string | null = null;

  public newWorkPackages: WorkPackageStub[] = [];
  public workPackageSuggestions: any[] = [];
  public autocompleteDebounce: any;

  get date() {
    return moment(this.$route.query.date).toDate();
  }

  get selectedWeek() {
    const startDay = moment(this.date).startOf('week');
    const endDay = moment(startDay).add(7, 'd');
    return moment.range(startDay, endDay);
  }

  get selectedTimeEntryActivity() {
    return this.hrefToId(this.selectedTimeEntry.acitvity.href);
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

  get selectedTimeEntry() {
    return this.$store.state.timeEntries.find((item: any) => item.id === this.selected);
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
    Vue.nextTick(() => {
      const newInput = this.$refs[`inputNew${cellId}`];
      (newInput as HTMLElement[])[0].focus();
      this.newEntryFocused = cellId;
    });
  }

  public async createEntry($event: any, ticket: WorkPackageStub, day: Moment) {
    const newValue = $event.target.value;
    if (this.newEntryFocused !== this.getTicketCellId(ticket.id, day)) {
      return
    }
    if (newValue) {
      try {
        this.creating = this.getTicketCellId(ticket.id, day);
        const detailedWorkPackage = await this.$store.dispatch(STORE_TYPES.FETCH_WORK_PACKAGE_DETAIL, this.hrefToId(ticket.link))
        debugger
        await this.$store.dispatch(STORE_TYPES.CREATE_TIME_ENTRY, {
          data: {
            spentOn: day.format('YYYY-MM-DD'),
            hours: numberToPtString(newValue),
            comment: '',
            _links: {
              project: {
                href: `/api/v3/projects/${detailedWorkPackage._embedded.project.id}`,
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
        this.flashError('Fehler beim eintragen der Zeit');
      } finally {
        this.creating = null;
      }
    }
    this.newEntryFocused = null;
    this.newEntry = null;
  }

  public select(id: number) {
    this.selected = id;
  }

  public startEdit(id: number) {
    this.editing = id;
    setTimeout(() => {
      (this.$refs[`input${id}`] as HTMLElement[])[0].focus();
    }, 0);
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
      //@types: ignore
      this.flashError('Fehler beim eintragen der Zeit');
    } finally {
      this.updating = null;
    }
    this.editing = null;
  }

  public addNewWorkPackage(suggestion: any) {
    const workPackageId = suggestion.item.id;
    const workPackage = this.workPackageSuggestions[0].data.find((item: any) => item.id === workPackageId)
    if (!workPackage) return;
    this.newWorkPackages.push({
      title: workPackage.subject,
      id: workPackage.id,
      link: workPackage._links.self.href
    });
  }

  private suggestionDisplay(suggestion: any) {
    return `#${suggestion.item.id} ${suggestion.item.subject}`;
  }

  private getSuggestionValue(suggestion: any) {
    return null;
  }

  private autocomplete(val: string) {
    clearTimeout(this.autocompleteDebounce);
    this.autocompleteDebounce = setTimeout(async () => {
      this.workPackageSuggestions = [{ data: (await opClient.get('work_packages', {
        params: {
          pageSize: 5,
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
      })).data._embedded.elements}]
    }, 500);
  }
}
</script>

<!-- Add 'scoped' attribute to limit CSS to this component only -->
<style lang='scss'>
.timesheet {
  display: flex;
  .timesheet-table {
    text-align: center;
    display: table;
    flex: 1;
  }
  .timesheet-sidebar {
    width: 250px;
  }
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
    border-radius: 3px;
    margin-left: 5px; 
    border: 2px solid lightblue;
    height: 100%;
    display: inline-block;
    padding: 4px 8px;

    &.cell-time-entry-active {
      border: 2px red dashed;
    }
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

#autosuggest__input {
  outline: none;
  position: relative;
  display: block;
  border: 1px solid #616161;
  border-bottom-left-radius: 3px;
  border-bottom-right-radius: 3px;
  padding: 10px;
  width: 100%;
  box-sizing: border-box;
  -webkit-box-sizing: border-box;
  -moz-box-sizing: border-box;
}

#autosuggest__input.autosuggest__input-open {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.autosuggest__results-container {
  position: relative;
  width: 100%;
}

.autosuggest__results {
  font-weight: 300;
  margin: 0;
  position: absolute;
  z-index: 10000001;
  width: 100%;
  border: 1px solid #e0e0e0;
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
  background: white;
  padding: 0px;
}

.autosuggest__results ul {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.autosuggest__results .autosuggest__results_item {
  cursor: pointer;
  padding: 5px;
  font-size:80%;
}

#autosuggest ul:nth-child(1) > .autosuggest__results_title {
  border-top: none;
}

.autosuggest__results .autosuggest__results_title {
  color: gray;
  font-size: 11px;
  margin-left: 0;
  padding: 15px 13px 5px;
  border-top: 1px solid lightgray;
}

.autosuggest__results .autosuggest__results_item:active,
.autosuggest__results .autosuggest__results_item:hover,
.autosuggest__results .autosuggest__results_item:focus,
.autosuggest__results .autosuggest__results_item.autosuggest__results_item-highlighted {
  background-color: #ddd;
}
</style>
