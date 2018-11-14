import * as Moment from 'moment';
import { extendMoment } from 'moment-range';

Moment.locale('de');


export const moment = extendMoment(Moment);
