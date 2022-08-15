# {{ taskConfig.config.subject }}
Water Resources Act 1991  
Our reference: {{ ref }}

Dear licence holder,

# We need to enforce the hands off flow condition of your licence{{ 's' if pluralLicence }} because river levels are very low.


 # Why you are receiving this notification

You have a ‘hands off flow’ condition in your water abstraction licence{{ 's' if pluralLicence }}. That condition authorises and restricts how much water you can abstract when the flow in the relevant watercourse has fallen below a certain level.

The effect that the condition has on your abstraction is explained in your licence{{ 's' if pluralLicence }}. You must comply with this condition and you should contact us if you are not sure how your abstraction will be affected.

# What happens next

We will write to you again when the watercourse level is high enough for you to abstract without the hands off flow restriction, if the other conditions of your licence{{ 's' if pluralLicence }} allow this.   

# How to contact us

If you have any questions about this notification, please contact {{ params.contact_name }} on {{ params.contact_details }}.


Yours faithfully

{{ params.sender_name }}  
{{ params.sender_role }}  
{{ params.sender_address }}


# Your hands off flow details

Watercourse: {{ params.watercourse }}  
Gauging station: {{ params.gauging_station }}  
Flow restriction threshold: {{ params.hof_threshold }}

Effect of restriction:
{% for licence in licences %}
Licence number: {{ licence.licenceNumber }}
{% for condition in licence.conditions %}
  {% if (condition.code == 'CES') and (condition.subCode == 'FLOW' or condition.subCode == 'LEV') %}
    {% for point in condition.points %}
      {% for pointCondition in point.conditions %}
{{ condition.displayTitle }}
{{ condition.parameter1Label }}: {{ pointCondition.parameter1 }}
{{ condition.parameter2Label }}: {{ pointCondition.parameter2 }}
      {% endfor %}
    {% endfor %}
  {% endif %}
{% endfor %}
{% endfor %}
