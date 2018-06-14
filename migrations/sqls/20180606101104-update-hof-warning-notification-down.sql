UPDATE "water"."task_config"
SET modified = NOW(),
  config = '{
    "prefix" : "HOF-",
    "content" : {
      "default" : "Our reference: {{ ref }}\n\nDate: {{ date }}\n\nWater Resources Act 1991\n\nDear licence holder,\n\nThis is an advance warning that you may be asked to stop or reduce your water abstraction soon.\n\n# Why you are receiving this notification\n\nYou have a ‘hands off flow’ condition in your water abstraction licence(s). That condition authorises and restricts how much water you can abstract when the flow in the relevant watercourse has fallen below a certain level.\n\n# What you need to do\n\nYou can continue to abstract water until further notice, if the conditions of your licence(s) allow it.\n\nWe will send you a notification if river levels fall further and restrictions on abstraction are applied. You must follow any instructions given in that notification.\n\n# How to contact us\n\nIf you have any questions about this notification, please contact {{ params.contact_name }} on {{ params.contact_details }}.\n\n\nYours faithfully\n{{ params.sender_name }}\n{{ params.sender_role }}\n{{ params.sender_address }}\n\n# Your hands off flow details\n\nLicence number: {% for licence in licences %} {{ licence.licenceNumber }} {% endfor %}\nGauging station: {{ params.gauging_station }}\nHands off flow threshold: {{ params.hof_threshold }}\n"
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
    "title" : "Send a hands off flow warning",
    "subject" : "Warning: Abstraction restrictions may happen soon",
    "variables" : [
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
        "label" : "Hands off flow threshold",
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
    "name" : "Hands off flow: levels warning"
  }'
WHERE task_config_id = 1;
