import axios, { AxiosResponse, AxiosError } from 'axios';
import Vue from 'vue';
import Vuex, { StoreOptions, GetterTree, MutationTree, ActionTree } from 'vuex';
import { Moment } from 'moment';
import { moment } from './moment';
import { DateRange } from 'moment-range';
import { getTicketId } from './utils';

Vue.use(Vuex);
export const opClient = axios.create({
  baseURL: process.env.VUE_APP_OPENPROJECT_URL + '/api/v3',
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
});

if (process.env.VUE_APP_DEVELOPMENT_API_KEY) {
  opClient.defaults.auth = {
    username: 'apikey',
    password: process.env.VUE_APP_DEVELOPMENT_API_KEY as string,
  };
}

export interface HATEOASLink {
  href: string;
  title: string;
}

export interface TimeEntryLinks {
  activity: HATEOASLink;
  project: HATEOASLink;
  self: HATEOASLink;
  user: HATEOASLink;
  workPackage: HATEOASLink;
}

export interface TimeEntry {
  id: number;
  createdAt: string;
  hours: string;
  comment?: string;
  spentOn: string;
  _links: TimeEntryLinks;
}


export interface User {
  id: number;
}

export interface WorkPackageStub {
  link: string;
  id: number;
  title: string;
}

export interface RootState {
  timeEntries: TimeEntry[];
  activeUser: User | null;
}

export const STORE_TYPES = {
  GET_SELECTED_WEEK_DATE: 'GET_SELECTED_WEEK_DATE',
  SET_SELECTED_WEEK_DATE: 'SET_SELECTED_WEEK_DATE',
  SET_TIME_ENTRIES: 'SET_TIME_ENTRIES',
  UPDATE_TIME_ENTRIES: 'UPDATE_TIME_ENTRIES',
  SET_CURRENT_USER: 'SET_CURRENT_USER',
  FETCH_CURRENT_USER: 'FETCH_CURRENT_USER',
  FETCH_TIME_ENTRY_DETAIL: 'FETCH_TIME_ENTRY_DETAIL',
  FETCH_WORK_PACKAGE_DETAIL: 'FETCH_WORK_PACKAGE_DETAIL',
  MERGE_TIME_ENTRIES: 'MERGE_TIME_ENTRIES',
  GET_ENTRIES_BY_TICKET: 'GET_ENTRIES_BY_TICKET',
  GET_ENTRIES_IN_TIME_RANGE: 'GET_ENTRIES_IN_TIME_RANGE',
  GET_WPS_IN_TIME_RANGE: 'GET_WPS_IN_TIME_RANGE',
  GET_ENTRIES_BY_TICKET_AND_DATE: 'GET_ENTRIES_BY_TICKET_AND_DATE',
  PATCH_TIME_ENTRY: 'PATCH_TIME_ENTRY',
  CREATE_TIME_ENTRY: 'CREATE_TIME_ENTRY',
  DELETE_TIME_ENTRY: 'DELETE_TIME_ENTRY',
  REMOVE_TIME_ENTRIES: 'REMOVE_TIME_ENTRIES',
  ADD_OR_UPDATE_TIME_ENTRY: 'ADD_OR_UPDATE_TIME_ENTRY',
};

const storeState: RootState = {
  timeEntries: [],
  activeUser: null,
};


export const getters: GetterTree<RootState, RootState> = {
  [STORE_TYPES.GET_ENTRIES_IN_TIME_RANGE](state): (range: DateRange) => TimeEntry[] {
    return (range: DateRange) => {
      return state.timeEntries.filter((item) => {
        return moment(item.spentOn).within(range);
      });
    };
  },
  [STORE_TYPES.GET_WPS_IN_TIME_RANGE](state): (range: DateRange) => WorkPackageStub[] {
    return (range: DateRange) => {
      return state.timeEntries.filter((item) => {
        return moment(item.createdAt).within(range);
      }).map((item) => {
        return {
          id: getTicketId(item),
          link: item._links.workPackage.href,
          title: item._links.workPackage.title,
        };
      });
    };
  },
  [STORE_TYPES.GET_ENTRIES_BY_TICKET](state) {
    return (ticketId: number) => {
      state.timeEntries.filter((item) => {
        return getTicketId(item) === ticketId;
      });
    };
  },
  [STORE_TYPES.GET_ENTRIES_BY_TICKET_AND_DATE](state) {
    return (ticketId: number, date: Moment) => {
      state.timeEntries.filter((item) => {
        return getTicketId(item) === ticketId && date.isSame(moment(item.spentOn), 'day');
      });
    };
  },
};

export const mutations: MutationTree<RootState> = {
  [STORE_TYPES.SET_CURRENT_USER](state, user) {
    state.activeUser = user;
  },
  [STORE_TYPES.SET_TIME_ENTRIES](state, entries) {
    state.timeEntries = entries;
  },
  [STORE_TYPES.MERGE_TIME_ENTRIES](state, entries: TimeEntry[]) {
    state.timeEntries = entries.concat(
      state.timeEntries.filter((item: TimeEntry) => !entries.find(({ id }) => item.id === id)),
    );
  },
  [STORE_TYPES.ADD_OR_UPDATE_TIME_ENTRY](state, entry: TimeEntry) {
    let noMatch = true;
    state.timeEntries.forEach((item, i) => {
      if (item.id === entry.id) {
        state.timeEntries.splice(i, 1, entry);
        noMatch = false;
      }
    });
    if (noMatch) {
      state.timeEntries.push(entry);
    }
  },
  [STORE_TYPES.REMOVE_TIME_ENTRIES](state, ids: number[]) {
    state.timeEntries = state.timeEntries.filter((item: TimeEntry) => ids.indexOf(item.id) === -1);
  },
};


export const actions: ActionTree<RootState, RootState> = {
  async [STORE_TYPES.FETCH_WORK_PACKAGE_DETAIL]({}, id) {
    return (await opClient.get(`work_packages/${id}`)).data;
  },
  async [STORE_TYPES.FETCH_CURRENT_USER]({ commit }): Promise<User> {
    const user = (await opClient.get('users/me', { withCredentials: true })).data;
    commit(STORE_TYPES.SET_CURRENT_USER, user);
    return user;
  },
  async [STORE_TYPES.UPDATE_TIME_ENTRIES]({ state, commit }): Promise<TimeEntry[]> {
    let total = Infinity;
    let offset = 1;
    const pageSize = 50;
    while (state.timeEntries.length < total) {
      const chunk = await opClient.get('time_entries', {
        params: {
          offset,
          pageSize,
          filters: JSON.stringify([
            {
              user: {
                operator: '=',
                values: [state.activeUser!.id],
              },
            },
          ]),
        },
      });
      offset++;
      total = chunk.data.total;
      commit(STORE_TYPES.MERGE_TIME_ENTRIES, chunk.data._embedded.elements);
    }
    return state.timeEntries;
  },
  async [STORE_TYPES.PATCH_TIME_ENTRY]({ state, commit }, { id, update }): Promise<TimeEntry> {
    const updatedEntry = (await opClient.patch(`time_entries/${id}`, update)).data;
    commit(STORE_TYPES.ADD_OR_UPDATE_TIME_ENTRY, updatedEntry);
    return updatedEntry;
  },
  async [STORE_TYPES.CREATE_TIME_ENTRY]({ state, commit }, { data }): Promise<TimeEntry> {
    const newEntry = (await opClient.post(`time_entries`, data)).data;
    commit(STORE_TYPES.ADD_OR_UPDATE_TIME_ENTRY, newEntry);
    return newEntry;
  },
  async [STORE_TYPES.DELETE_TIME_ENTRY]({ state, commit }, id) {
    const response = (await opClient.delete(`time_entries/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {},
    }));
    if (response.status === 204) {
      commit(STORE_TYPES.REMOVE_TIME_ENTRIES, [id]);
    } else {
      throw new Error('Deletion unsuccessful');
    }
  },
  async [STORE_TYPES.FETCH_TIME_ENTRY_DETAIL]({}, id): Promise<TimeEntry> {
    return (await opClient.get(`time_entries/${id}`)).data;
  },
};

const store: StoreOptions<RootState> = {
  state: storeState,
  getters,
  mutations,
  actions,
};

export default new Vuex.Store(store);
