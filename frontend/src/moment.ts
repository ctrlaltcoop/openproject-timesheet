import * as Moment from 'moment';
import { extendMoment } from 'moment-range';
import 'moment/locale/de';

Moment.locale('de');


export const moment = extendMoment(Moment);
