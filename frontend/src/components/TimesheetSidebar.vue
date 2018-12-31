<template lang="pug">
  .timesheet-sidebar
    .loading(v-if="loading")
      Icon(icon="spinner" spin='')
    .timesheet-sidebar-timeentry(v-if="timeEntry && !loading")
      h3 Zeiteintrag bearbeiten
      p \#{{ timeEntry._links.workPackage.href.split('/').slice(-1).pop() }} {{ timeEntry._links.workPackage.title }}
      p
        textarea(v-model="detailedTimeEntry.comment" ref="noteElement" placeholder="Notiz eingeben")
      label(for="#timesheet-sidebar-spenttime") Aufgewendete Zeit (Stunden)
      input#timesheet-sidebar-spenttime.time-entry-input(
          :disabled="updating === timeEntry.id"
          type="number"
          :value="ptToNumber(detailedTimeEntry.hours)"
          @input = "detailedTimeEntry.hours = numberToPt($event.target.value)"
      )
      .timesheet-sidebar-controls
        button.button.-alt-highlight.timesheet-sidebar-save-button(@click="saveTimeEntry") Speichern
        button.button.-alt-danger.timesheet-sidebar-delete-button(@click="deleteTimeEntry") Löschen
</template>

<script lang='ts'>
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { STORE_TYPES, WorkPackageStub, TimeEntry, opClient } from "@/store";
import { Moment } from "moment";
import { Getter, Action } from "vuex-class";
import { DateRange } from "moment-range";
import { moment } from "@/moment";
// @ts-ignore
import { VueAutosuggest } from "vue-autosuggest";
import {
  getTicketId,
  uniqueByPropertyValue,
  ptStringToNumber,
  numberToPtString
} from "@/utils";
import { setTimeout } from 'timers';

@Component({
  components: {
    VueAutosuggest
  }
})
export default class TimesheetSidebar extends Vue {
  @Prop() timeEntry!: TimeEntry;
  @Action(STORE_TYPES.FETCH_TIME_ENTRY_DETAIL) fetchTimeEntry!: (id: number) => TimeEntry;
  private loading: boolean = true;
  private updating: boolean = false;
  private detailedTimeEntry: TimeEntry | null = null;
  
  async created() {
    this.refresh();
  }

  async updated() {
    if (this.timeEntry.id !== this.detailedTimeEntry!.id) {
      this.refresh();
    }
  }

  async refresh() {
    this.loading = true;
    this.detailedTimeEntry = await this.fetchTimeEntry(this.timeEntry.id)
    this.loading = false;
  }

  async deleteTimeEntry() {
    try {
    await this.$store.dispatch(STORE_TYPES.DELETE_TIME_ENTRY, this.detailedTimeEntry!.id);
    this.flash('Zeiteintrag gelöscht', 'success')
    this.$emit('deleted', this.detailedTimeEntry);
    } catch (e) {
      this.flashError('Zeiteintrag konnte nicht gelöscht werden')
    }
  }

  async saveTimeEntry() {
    try {
      await this.$store.dispatch(STORE_TYPES.PATCH_TIME_ENTRY, { id: this.detailedTimeEntry!.id, update: {
        hours: this.detailedTimeEntry!.hours,
        comment: this.detailedTimeEntry!.comment,
      } });
      this.$emit('saved', this.detailedTimeEntry);
      this.flash('Zeiteintrag gespeichert', 'success');
    } catch (e) {
      this.flashError('Fehler beim Eintragen der Zeit');
    }
  }
}
</script>

<!-- Add 'scoped' attribute to limit CSS to this component only -->
<style lang='scss'>

  .timesheet-sidebar-no-comment {
    font-style: italic;
  }
  .timesheet-sidebar-controls {
    margin: 15px 0 0;
    display: flex;
  }
  .timesheet-sidebar-delete-button {
    margin: 0 0 0 auto; 
  }
  .timesheet-sidebar-save-button {
    margin: 0;
  }
</style>
