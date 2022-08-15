Water Resources Act 1991  
Our reference: {{ ref }}

Dear licence holder,

# This is an advance warning that you may be asked to stop or reduce your water abstraction soon.

# Why you are receiving this notification

You have a ‘hands off flow’ condition in your water abstraction licence{{ 's' if pluralLicence }}. That condition authorises and restricts how much water you can abstract when the flow in the relevant watercourse has fallen below a certain level.

# What you need to do

You can continue to abstract water until further notice, if the conditions of your licence{{ 's' if pluralLicence }} allow it.

We will send you a notification if river levels fall further and restrictions on abstraction are applied. You must follow any instructions given in that notification.

# How to contact us

If you have any questions about this notification, please contact {{ params.contact_name }} on {{ params.contact_details }}.


Yours faithfully

{{ params.sender_name }}  
{{ params.sender_role }}  
{{ params.sender_address }}

# Your hands off flow details

Licence number{{ 's' if pluralLicence }}: {% for licence in licences %} {{ licence.licenceNumber }} {% endfor %}  
Gauging station: {{ params.gauging_station }}  
Hands off flow threshold: {{ params.hof_threshold }}
