import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { DEMO_USER } from '/imports/api/demo-user';
import './observability';
import './methods';
import './publications';

Meteor.startup(async () => {
  if (!(await Accounts.findUserByUsername(DEMO_USER.username))) {
    await Accounts.createUserAsync(DEMO_USER);
  }

  // The legitimate caller of db.reindex: the server itself.
  await Meteor.callAsync('db.reindex');
});
