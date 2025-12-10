/*
  https://eaflood.atlassian.net/browse/WATER-5410

  As part of our work on dynamic due dates we've had to make some changes to the notifications table.

  We used this opportunity to simplify the `messaged_refs` used, removing the duplication and because `contact_type`
  now has its own column, removing this info.

  When we did this we opted to use `return invitation failed` for the new notifications we're automatically sending when
  a returns invitation to a primary user fails.

  However, having gone back to that logic in
  [https://github.com/DEFRA/water-abstraction-system](water-abstraction-system) the term we use there is 'alternate'.

  So, to keep things consistent we're updating the message ref we used to `return invitation alternate`.

*/

UPDATE water.scheduled_notification sn SET message_ref = 'returns invitation alternate' WHERE sn.message_ref = 'returns invitation failed';
