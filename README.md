# OpenProject Timesheet Plugin

This plugin adds a vue app for managing your personal time trackig on a handy weekly schedule.
The motivation is that while reporting and managing time expenses with openproject the personal tracking interface lacks usability.
For a employee to pick sometimes dozens of work packages a day to track her time expenses it requires a lot of clicking and page reloads.
This plugin adds a SPA time schedule for productive entering

## Structure

The ruby part of this app is just a wrapper putting in the vue assets into openproject context.
All the intresting stuff happens in `frontend/`

## Build

For easier deployment the built assets are stored here in this repository (although it's not the most elegant solution).
After changes to the frontend it has to be rebuilt with `npm run build` from the `frontend/` folder.

## Like it, but couldn't we add X / fix Y?

Well this piece of software is a product of the control.alt.coop eG. While you can use, alter and redistribute it free of charge (MIT License) we do not consider it to be under "active development / maintenance" as it mainly fits a company-internal use case. In any case we are available for contract work to adjust and maintain this or any other piece of software. Contact us at [https://ctrl.alt.coop/en/contact](https://ctrl.alt.coop/en/contact)

Nevertheless PRs are welcomed and handled - of course.


## Known issues

* Any created item will have activity with `id = 1`, that's because there is no way to get these via API: https://community.openproject.com/projects/openproject/work_packages/29296