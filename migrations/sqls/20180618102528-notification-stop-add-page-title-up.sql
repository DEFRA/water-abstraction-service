-- Stop reduce notification
UPDATE "water"."task_config"
SET modified = NOW(),
  config = '{
    "subject" : "Notice of restriction on abstraction",
    "title" : "Send a hands off flow restriction notice",
    "prefix" : "HOF-",
    "content" : {
      "email": "# {{ taskConfig.config.subject }}\nWater Resources Act 1991  \nOur reference: {{ ref }}\n\nDear licence holder,\n\n# We need to enforce the hands off flow condition of your licence{{ ''s'' if pluralLicence }} because river levels are very low.\n\n\n # Why you are receiving this notification\n\nYou have a ‘hands off flow’ condition in your water abstraction licence{{ ''s'' if pluralLicence }}. That condition authorises and restricts how much water you can abstract when the flow in the relevant watercourse has fallen below a certain level.\n\nThe effect that the condition has on your abstraction is explained in your licence{{ ''s'' if pluralLicence }}. You must comply with this condition and you should contact us if you are not sure how your abstraction will be affected.\n\n# What happens next\n\nWe will write to you again when the watercourse level is high enough for you to abstract without the hands off flow restriction, if the other conditions of your licence{{ ''s'' if pluralLicence }} allow this.   \n\n# How to contact us\n\nIf you have any questions about this notification, please contact {{ params.contact_name }} on {{ params.contact_details }}.\n\n\nYours faithfully\n\n{{ params.sender_name }}  \n{{ params.sender_role }}  \n{{ params.sender_address }}\n\n\n# Your hands off flow details\n\nWatercourse: {{ params.watercourse }}  \nGauging station: {{ params.gauging_station }}  \nFlow restriction threshold: {{ params.hof_threshold }}\n\nEffect of restriction:\n{% for licence in licences %}\nLicence number: {{ licence.licenceNumber }}\n{% for condition in licence.conditions %}\n  {% if (condition.code == ''CES'') and (condition.subCode == ''FLOW'' or condition.subCode == ''LEV'') %}\n    {% for point in condition.points %}\n      {% for pointCondition in point.conditions %}\n{{ condition.displayTitle }}\n{{ condition.parameter1Label }}: {{ pointCondition.parameter1 }}\n{{ condition.parameter2Label }}: {{ pointCondition.parameter2 }}\n      {% endfor %}\n    {% endfor %}\n  {% endif %}\n{% endfor %}\n{% endfor %}\n",
      "letter": "Water Resources Act 1991  \nOur reference: {{ ref }}\n\nDear licence holder,\n\n# We need to enforce the hands off flow condition of your licence{{ ''s'' if pluralLicence }} because river levels are very low.\n\n\n # Why you are receiving this notification\n\nYou have a ‘hands off flow’ condition in your water abstraction licence{{ ''s'' if pluralLicence }}. That condition authorises and restricts how much water you can abstract when the flow in the relevant watercourse has fallen below a certain level.\n\nThe effect that the condition has on your abstraction is explained in your licence{{ ''s'' if pluralLicence }}. You must comply with this condition and you should contact us if you are not sure how your abstraction will be affected.\n\n# What happens next\n\nWe will write to you again when the watercourse level is high enough for you to abstract without the hands off flow restriction, if the other conditions of your licence{{ ''s'' if pluralLicence }} allow this.   \n\n# How to contact us\n\nIf you have any questions about this notification, please contact {{ params.contact_name }} on {{ params.contact_details }}.\n\n\nYours faithfully\n\n{{ params.sender_name }}  \n{{ params.sender_role }}  \n{{ params.sender_address }}\n\n\n# Your hands off flow details\n\nWatercourse: {{ params.watercourse }}  \nGauging station: {{ params.gauging_station }}  \nFlow restriction threshold: {{ params.hof_threshold }}\n\nEffect of restriction:\n{% for licence in licences %}\nLicence number: {{ licence.licenceNumber }}\n{% for condition in licence.conditions %}\n  {% if (condition.code == ''CES'') and (condition.subCode == ''FLOW'' or condition.subCode == ''LEV'') %}\n    {% for point in condition.points %}\n      {% for pointCondition in point.conditions %}\n{{ condition.displayTitle }}\n{{ condition.parameter1Label }}: {{ pointCondition.parameter1 }}\n{{ condition.parameter2Label }}: {{ pointCondition.parameter2 }}\n      {% endfor %}\n    {% endfor %}\n  {% endif %}\n{% endfor %}\n{% endfor %}\n",
      "default" : ""
    },
    "steps" : [
      {
        "widgets" : [
          {
            "mapper" : "licenceNumbers",
            "widget" : "textarea",
            "operator" : "$in",
            "error_label" : "licence number(s)",
            "hint" : "You can separate licence numbers using spaces, commas, or by entering them on different lines.",
            "label" : "Enter the licence number(s) you want to send a notification about",
            "validation" : [
              "array",
              "min:1"
            ],
            "name" : "system_external_id"
          }
        ]
      }
    ],
    "variables" : [
      {
        "label" : "Watercourse",
        "default" : "",
        "validation" : [
          "string",
          "required"
        ],
        "name" : "watercourse",
        "widget" : "text"
      },
      {
        "label" : "Gauging station",
        "default" : "",
        "helptext" : "The EA gauging station name",
        "name" : "gauging_station",
        "validation" : [
          "string",
          "required"
        ],
        "widget" : "text"
      },
      {
        "label" : "Flow restriction threshold",
        "default" : "",
        "validation" : [
          "string",
          "required"
        ],
        "name" : "hof_threshold",
        "widget" : "text"
      },
      {
        "label" : "Contact name for questions",
        "default" : "",
        "validation" : [
          "string",
          "required"
        ],
        "name" : "contact_name",
        "widget" : "text"
      },
      {
        "label" : "Contact number or email for questions",
        "default" : "",
        "validation" : [
          "string",
          "required"
        ],
        "name" : "contact_details",
        "widget" : "text"
      },
      {
        "label" : "Name of sender",
        "default" : "",
        "validation" : [
          "string",
          "required"
        ],
        "name" : "sender_name",
        "widget" : "text"
      },
      {
        "label" : "Job title of sender",
        "default" : "",
        "validation" : [
          "string",
          "required"
        ],
        "name" : "sender_role",
        "widget" : "text"
      },
      {
        "label" : "Address of sender",
        "mapper": "address",
        "default" : "",
        "validation" : [
          "string",
          "required"
        ],
        "name" : "sender_address",
        "widget" : "textarea"
      }
    ],
    "formats" : [
      "email",
      "letter"
    ],
    "permissions" : [
      "admin:defra"
    ],
    "name" : "Hands off flow: stop or reduce abstraction"
  }'
WHERE task_config_id = 3;
