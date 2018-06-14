UPDATE "water"."task_config"
SET modified = NOW(),
  config = '{
    "prefix" : "HOF-",
    "content" : {
      "default" : "Our reference: {{ ref }}\n\nDate: {{ date }}\n\nWater Resources Act 1991\n\nDear licence holder,\n\nYou can now start or increase your water abstraction, if the terms of your licence(s) allow this.\n\nWe notified you on {{ params.date_of_stop }} that we needed to enforce the hands off flow condition in your licence(s).\n\nWatercourse levels have now risen again, so you can start or increase your water abstraction if the conditions of your licence(s) allow it.\n\n# What happens next\n\nWe will notify you if river levels drop and we need to enforce your hands-off flow condition(s) again.\n\n# How to contact us\n\nIf you have any questions about this notification, please contact {{ params.contact_name }} on {{ params.contact_details }}.\n\n\nYours faithfully\n{{ params.sender_name }}\n{{ params.sender_role }}\n{{ params.sender_address }}\n\n\n# Your hands off flow details\n\nLicence number: {% for licence in licences %} {{ licence.licenceNumber }} {% endfor %}\nGauging station: {{ params.gauging_station }}\nHands off flow threshold: {{ params.hof_threshold }}\n"
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
    "title" : "Send a hands off flow resume notice",
    "subject" : "Notice of the end of restriction on abstraction",
    "variables" : [
      {
        "mapper" : "date",
        "label" : "Date of stop notice",
        "default" : "",
        "validation" : [
          "string",
          "required"
        ],
        "name" : "date_of_stop",
        "widget" : "date"
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
    "name" : "Hands off flow: resume abstraction"
  }'
WHERE task_config_id = 4;
