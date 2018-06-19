/* Replace with your SQL commands */


/* HOF resume */
UPDATE "water"."task_config" SET config='{
  "name": "Hands off flow: resume abstraction",
  "title": "Send a hands off flow resume notice",
  "subject": "Notice of the end of restriction on abstraction",
  "prefix": "HOF-",
  "content": {
    "default": "Our reference: {{ ref }}\n\nDate: {{ date }}\n\nWater Resources Act 1991\n\nDear licence holder,\n\nYou can now start or increase your water abstraction, if the terms of your licence(s) allow this.\n\nWe notified you on {{ params.date_of_stop }} that we needed to enforce the hands off flow condition in your licence(s).\n\nWatercourse levels have now risen again, so you can start or increase your water abstraction if the conditions of your licence(s) allow it.\n\n# What happens next\n\nWe will notify you if river levels drop and we need to enforce your hands-off flow condition(s) again.\n\n# How to contact us\n\nIf you have any questions about this notification, please contact {{ params.contact_name }} on {{ params.contact_details }}.\n\n\nYours faithfully\n{{ params.sender_name }}\n{{ params.sender_role }}\n{{ params.sender_address }}\n\n\n# Your hands off flow details\n\nLicence number: {% for licence in licences %} {{ licence.licenceNumber }} {% endfor %}\nGauging station: {{ params.gauging_station }}\nHands off flow threshold: {{ params.hof_threshold }}\n"
  },
  "permissions": [
    "admin:defra"
  ],
  "formats": [
    "email",
    "letter"
  ],
  "variables": [
    {
      "name": "date_of_stop",
      "label": "Date of stop notice",
      "default": "",
      "widget": "date",
      "validation": [
        "string",
        "required"
      ],
      "mapper": "date"
    },
    {
      "name": "gauging_station",
      "label": "Gauging station",
      "helptext": "The EA gauging station name",
      "default": "",
      "widget": "text",
      "validation": [
        "string",
        "required"
      ]
    },
    {
      "name": "hof_threshold",
      "label": "Flow restriction threshold",
      "default": "",
      "widget": "text",
      "validation": [
        "string",
        "required"
      ]
    },
    {
      "name": "contact_name",
      "label": "Contact name for questions",
      "default": "",
      "widget": "text",
      "validation": [
        "string",
        "required"
      ]
    },
    {
      "name": "contact_details",
      "label": "Contact number or email for questions",
      "default": "",
      "widget": "text",
      "validation": [
        "string",
        "required"
      ]
    },
    {
      "name": "sender_name",
      "label": "Name of sender",
      "default": "",
      "widget": "text",
      "validation": [
        "string",
        "required"
      ]
    },
    {
      "name": "sender_role",
      "label": "Job title of sender",
      "default": "",
      "widget": "text",
      "validation": [
        "string",
        "required"
      ]
    },
    {
      "name": "sender_address",
      "label": "Address of sender",
      "default": "",
      "widget": "textarea",
      "validation": [
        "string",
        "required"
      ]
    }
  ],
  "steps": [
    {
      "widgets": [
        {
          "name": "system_external_id",
          "widget": "textarea",
          "label": "Enter the licence number(s) you want to send a notification about",
          "error_label": "licence number(s)",
          "hint": "You can separate licence numbers using spaces, commas, or by entering them on different lines.",
          "operator": "$in",
          "mapper": "licenceNumbers",
          "validation": [
            "array",
            "min:1"
          ]
        }
      ]
    }
  ]
}
' WHERE type='notification' AND subtype='hof-resume';


/* HOF stop */
UPDATE "water"."task_config" SET config='{
  "name": "Hands off flow: stop or reduce abstraction",
  "title": "Send a hands off flow restriction notice",
  "subject": "Notice of restriction on abstraction",
  "prefix": "HOF-",
  "content": {
    "default": "Our reference: {{ ref }}\n\nDate: {{ date }}\n\nWater Resources Act 1991\n\nDear licence holder,\n\nWe need to enforce the hands off flow condition of your licence(s) because river levels are very low.\n\n# Why you are receiving this notification\n\nYou have a ‘hands off flow’ condition in your water abstraction licence(s). That condition authorises and restricts how much water you can abstract when the flow in the relevant watercourse has fallen below a certain level.\n\nThe effect that the condition has on your abstraction is explained in your licence(s). You must comply with this condition and you should contact us if you are not sure how your abstraction will be affected.\n\n# What happens next\n\nWe will write to you again when the watercourse level is high enough for you to abstract without the hands off flow restriction, if the other conditions of your licence(s) allow this.   \n\n# How to contact us\n\nIf you have any questions about this notification, please contact {{ params.contact_name }} on {{ params.contact_details }}.\n\n\nYours faithfully\n{{ params.sender_name }}\n{{ params.sender_role }}\n{{ params.sender_address }}\n\n\n# Your hands off flow details\n\nWatercourse: {{ params.watercourse }}\nGauging station: {{ params.gauging_station }}\nFlow restriction threshold: {{ params.hof_threshold }}\n\nEffect of restriction:\n{% for licence in licences %}\nLicence number: {{ licence.licenceNumber }}\n{% for condition in licence.conditions %}\n  {% if (condition.code == ''CES'') and (condition.subCode == ''FLOW'' or condition.subCode == ''LEV'') %}\n    {% for point in condition.points %}\n      {% for pointCondition in point.conditions %}\n{{ condition.displayTitle }}\n{{ condition.parameter1Label }}: {{ pointCondition.parameter1 }}\n{{ condition.parameter2Label }}: {{ pointCondition.parameter2 }}\n      {% endfor %}\n    {% endfor %}\n  {% endif %}\n{% endfor %}\n{% endfor %}\n"
  },
  "permissions": [
    "admin:defra"
  ],
  "formats": [
    "email",
    "letter"
  ],
  "variables": [
    {
      "name": "watercourse",
      "label": "Watercourse",
      "default": "",
      "widget": "text",
      "validation": [
        "string",
        "required"
      ]
    },
    {
      "name": "gauging_station",
      "label": "Gauging station",
      "helptext": "The EA gauging station name",
      "default": "",
      "widget": "text",
      "validation": [
        "string",
        "required"
      ]
    },
    {
      "name": "hof_threshold",
      "label": "Flow restriction threshold",
      "default": "",
      "widget": "text",
      "validation": [
        "string",
        "required"
      ]
    },
    {
      "name": "contact_name",
      "label": "Contact name for questions",
      "default": "",
      "widget": "text",
      "validation": [
        "string",
        "required"
      ]
    },
    {
      "name": "contact_details",
      "label": "Contact number or email for questions",
      "default": "",
      "widget": "text",
      "validation": [
        "string",
        "required"
      ]
    },
    {
      "name": "sender_name",
      "label": "Name of sender",
      "default": "",
      "widget": "text",
      "validation": [
        "string",
        "required"
      ]
    },
    {
      "name": "sender_role",
      "label": "Job title of sender",
      "default": "",
      "widget": "text",
      "validation": [
        "string",
        "required"
      ]
    },
    {
      "name": "sender_address",
      "label": "Address of sender",
      "default": "",
      "widget": "textarea",
      "validation": [
        "string",
        "required"
      ]
    }
  ],
  "steps": [
    {
      "widgets": [
        {
          "name": "system_external_id",
          "widget": "textarea",
          "label": "Enter the licence number(s) you want to send a notification about",
          "error_label": "licence number(s)",
          "hint": "You can separate licence numbers using spaces, commas, or by entering them on different lines.",
          "operator": "$in",
          "mapper": "licenceNumbers",
          "validation": [
            "array",
            "min:1"
          ]
        }
      ]
    }
  ]
}' WHERE type='notification' AND subtype='hof-stop';


/* HOF warning */
UPDATE "water"."task_config" SET config='{
  "name": "Hands off flow: levels warning",
  "title": "Send a hands off flow warning",
  "subject": "Warning: Abstraction restrictions may happen soon",
  "prefix": "HOF-",
  "content": {
    "default": "Our reference: {{ ref }}\n\nDate: {{ date }}\n\nWater Resources Act 1991\n\nDear licence holder,\n\nThis is an advance warning that you may be asked to stop or reduce your water abstraction soon.\n\n# Why you are receiving this notification\n\nYou have a ‘hands off flow’ condition in your water abstraction licence(s). That condition authorises and restricts how much water you can abstract when the flow in the relevant watercourse has fallen below a certain level.\n\n# What you need to do\n\nYou can continue to abstract water until further notice, if the conditions of your licence(s) allow it.\n\nWe will send you a notification if river levels fall further and restrictions on abstraction are applied. You must follow any instructions given in that notification.\n\n# How to contact us\n\nIf you have any questions about this notification, please contact {{ params.contact_name }} on {{ params.contact_details }}.\n\n\nYours faithfully\n{{ params.sender_name }}\n{{ params.sender_role }}\n{{ params.sender_address }}\n\n# Your hands off flow details\n\nLicence number: {% for licence in licences %} {{ licence.licenceNumber }} {% endfor %}\nGauging station: {{ params.gauging_station }}\nHands off flow threshold: {{ params.hof_threshold }}\n"
  },
  "permissions": [
    "admin:defra"
  ],
  "formats": [
    "email",
    "letter"
  ],
  "variables": [
    {
      "name": "gauging_station",
      "label": "Gauging station",
      "helptext": "The EA gauging station name",
      "default": "",
      "widget": "text",
      "validation": [
        "string",
        "required"
      ]
    },
    {
      "name": "hof_threshold",
      "label": "Hands off flow threshold",
      "default": "",
      "widget": "text",
      "validation": [
        "string",
        "required"
      ]
    },
    {
      "name": "contact_name",
      "label": "Contact name for questions",
      "default": "",
      "widget": "text",
      "validation": [
        "string",
        "required"
      ]
    },
    {
      "name": "contact_details",
      "label": "Contact number or email for questions",
      "default": "",
      "widget": "text",
      "validation": [
        "string",
        "required"
      ]
    },
    {
      "name": "sender_name",
      "label": "Name of sender",
      "default": "",
      "widget": "text",
      "validation": [
        "string",
        "required"
      ]
    },
    {
      "name": "sender_role",
      "label": "Job title of sender",
      "default": "",
      "widget": "text",
      "validation": [
        "string",
        "required"
      ]
    },
    {
      "name": "sender_address",
      "label": "Address of sender",
      "default": "",
      "widget": "textarea",
      "validation": [
        "string",
        "required"
      ]
    }
  ],
  "steps": [
    {
      "widgets": [
        {
          "name": "system_external_id",
          "widget": "textarea",
          "label": "Enter the licence number(s) you want to send a notification about",
          "error_label": "licence number(s)",
          "hint": "You can separate licence numbers using spaces, commas, or by entering them on different lines.",
          "operator": "$in",
          "mapper": "licenceNumbers",
          "validation": [
            "array",
            "min:1"
          ]
        }
      ]
    }
  ]
}' WHERE type='notification' AND subtype='hof-warning';
