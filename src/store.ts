import axios, { AxiosResponse, AxiosError } from 'axios';
import Vue from 'vue';
import Vuex, { StoreOptions, GetterTree, MutationTree, ActionTree } from 'vuex';
import { Moment } from 'moment';
import { moment } from './moment';
import { DateRange } from 'moment-range';
import { getTicketId } from './utils';

Vue.use(Vuex);
const opClient = axios.create({
  baseURL: process.env.VUE_APP_OPENPROJECT_URL + '/api/v3',
});

if (process.env.NODE_ENV === 'development') {
  opClient.defaults.auth = {
    username: 'apikey',
    password: process.env.VUE_APP_DEVELOPMENT_API_KEY as string,
  };
}

opClient.interceptors.response.use((response: AxiosResponse) => {
  return response;
}, (error: AxiosError) => {
  if (error.response!.status === 401) {
    window.location.href = `${process.env.VUE_APP_OPENPROJECT_LOGIN_URL}?back_url=${encodeURI(window.location.href)}`;
  }
  return Promise.reject(error);
});

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

export class TimeEntry {
  constructor(
    public id: number,
    public createdAt: string,
    public spentOn: string,
    public _links: TimeEntryLinks
  ) {}

  get ticketId() {
    return 
  }
}


export interface User {
  id: number;
}

export interface WorkPackageStub {
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
  MERGE_TIME_ENTRIES: 'MERGE_TIME_ENTRIES',
  GET_ENTRIES_BY_TICKET: 'GET_ENTRIES_BY_TICKET',
  GET_ENTRIES_IN_TIME_RANGE: 'GET_ENTRIES_IN_TIME_RANGE',
  GET_WPS_IN_TIME_RANGE: 'GET_WPS_IN_TIME_RANGE',
  GET_ENTRIES_BY_TICKET_AND_DATE: 'GET_ENTRIES_BY_TICKET_AND_DATE',
};

const storeState: RootState = {
  timeEntries: [],
  activeUser: null,
};


export const getters: GetterTree<RootState, RootState> = {
  [STORE_TYPES.GET_ENTRIES_IN_TIME_RANGE](state): (range: DateRange) => TimeEntry[] {
    return (range: DateRange) => {
      return state.timeEntries.filter((item) => {
        return moment(item.createdAt).within(range);
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
          title: item._links.workPackage.title,
        }
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
};


export const actions: ActionTree<RootState, RootState> = {
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
};

const store: StoreOptions<RootState> = {
  state: storeState,
  getters,
  mutations,
  actions,
};

export default new Vuex.Store(store);
