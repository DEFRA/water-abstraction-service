# {{ taskConfig.config.subject }}
Water Resources Act 1991  
Our reference: {{ ref }}

Dear licence holder,

# You can now start or increase your water abstraction, if the terms of your licence{{ 's' if pluralLicence }} allow this.

We notified you on {{ params.date_of_stop }} that we needed to enforce the hands off flow conditions in your licence{{ 's' if pluralLicence }}.

Watercourse levels have now risen again, so you can start or increase your water abstraction if the conditions of your licence{{ 's' if pluralLicence }} allow it.

# What happens next

We will notify you if river levels drop and we need to enforce your hands-off flow condition again.

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
