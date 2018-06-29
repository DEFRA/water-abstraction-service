-- Renewal Notification
UPDATE "water"."task_config"
SET modified = NOW(),
  config = '{
  "subject": "Invitation to apply for a water abstraction licence renewal",
  "name": "Expiring licence(s): invitation to renew",
  "title": "Send an invitation to renew",
  "variables": [
      {
          "mapper": "date",
          "widget": "date",
          "name": "application_date",
          "default": "",
          "label": "Renewal application deadline",
          "validation": [
              "string",
              "required"
          ]
      },
      {
          "default": "",
          "widget": "text",
          "validation": [
              "string",
              "required"
          ],
          "name": "sender_name",
          "label": "Name of sender"
      },
      {
          "default": "",
          "widget": "text",
          "validation": [
              "string",
              "required"
          ],
          "name": "sender_role",
          "label": "Job title of sender"
      },
      {
      	  "mapper": "address",
          "default": "",
          "widget": "textarea",
          "validation": [
              "string",
              "required"
          ],
          "name": "sender_address",
          "label": "Address of sender"
      }
  ],
  "content": {
  "letter": "Water Resources Act 1991  \nOur reference: {{ ref }}\n\nDear licence holder,\n\n# All or part of the following abstraction licence{{ ''s'' if pluralLicence }} will expire soon:\n\n{% for licence in licences %}\n{% for point in licence.points %}\n{{ licence.licenceNumber }} for {{ point.name }}{% if licence.expiryDate %} expires on {{ licence.expiryDate }}{% endif %}\n{% endfor %}\n{% endfor %}\n\n# When to submit your renewal application{{ ''s'' if pluralLicence }}\n\nIf you want to continue abstracting water after the expiry date{{ ''s'' if pluralLicence }} included above, please send your renewal application{{ ''s'' if pluralLicence }} to us by {{ params.application_date }}.\n\nThis will ensure we have enough time to process your application{{ ''s'' if pluralLicence }} before your current licence{{ ''s'' if pluralLicence }} expire{{ ''s'' if pluralLicence == false }}.\n\n\n# How to apply to renew your licence{{ ''s'' if pluralLicence }} with different terms\n\nIf you want to change any of the terms of your current licence{{ ''s'' if pluralLicence }}, you need to submit a new licence application.\n\nThe application forms can be found on our website: https://www.gov.uk/guidance/water-management-apply-for-a-water-abstraction-or-impoundment-licence\n\n\n# How to apply to renew your licence{{ ''s'' if pluralLicence }} with exactly the same terms\n\nPlease complete this online form for each licence: [URL TBC].\n\n# How to complete your renewal form{{ ''s'' if pluralLicence }}\n\nYou must check that the following details are correct:\n\n* the licence holder''s name and contact details\n* the abstraction point, reach and area you take water from\n* what you use the water for\n* the abstraction period{{ ''s'' if pluralLicence }}\n\n\nYou must also demonstrate your need to abstract the same quantities of water as your current licence allows. To do this you need to include:\n\n* details about how you use your current abstraction quantities\n* usage information from previous years (if you have this information)\n* if you abstract water for spray irrigation, include the type and area of crops you will grow and irrigate\n\n^We cannot process your renewal application{{ ''s'' if pluralLicence }} if you do not provide all of this information.\n\n\n# How to submit your renewal form{{ ''s'' if pluralLicence }}\n\n\nWhen you submit your form, you must also include:\n\n* your £135 application fee\n* a map showing the area of land you have a right of access to, and the point, reach or area you take water from\n\nYour application form{{ ''s'' if pluralLicence }} must be signed by the correct person, as described below.  If you are:\n\n* an Individual then you need to sign the application\n* a number of individuals then you all need to sign the application\n* a Limited Liability Partnership then a partner, company director or company secretary need to sign the application\n* a Registered Company then the Company Director or Company Secretary need to sign the application\n* a Public Body (such as a local authority or NHS trust) then a person authorised to sign documents on behalf of the organisation needs to sign the application\n* a Partnership then one or more of the partners must sign the application\n* a Trust then all trustees or the chairman, treasurer or secretary must sign the application\n\n\n# What happens after you apply\n\nWe will consider your application and should be able to grant you a new licence provided that:\n\n* you submit the information and payment detailed in this notification\n* your abstraction is environmentally sustainable\n* you have justified the amount of water you need to abstract\n* you demonstrate that you are using water efficiently\n\nWe will contact you if we need any more information to process your renewal application{{ ''s'' if pluralLicence }}.\n\nYou may also receive a letter from your local area team about future changes we may need to make to ensure your abstraction is sustainable.\n\n\n# How to contact us\n\nTo discuss any changes you would like to make please call us on 0114 2898 340.\n\n\n\nYours faithfully\n\n{{ params.sender_name }}  \n{{ params.sender_role }}  \n{{ params.sender_address }}\n",
  "email": "# {{ taskConfig.config.subject }}\nWater Resources Act 1991  \nOur reference: {{ ref }}\n\nDear licence holder,\n\n# All or part of the following abstraction licence{{ ''s'' if pluralLicence }} will expire soon:\n\n{% for licence in licences %}\n{% for point in licence.points %}\n{{ licence.licenceNumber }} for {{ point.name }}{% if licence.expiryDate %} expires on {{ licence.expiryDate }}{% endif %}\n{% endfor %}\n{% endfor %}\n\n# When to submit your renewal application{{ ''s'' if pluralLicence }}\n\nIf you want to continue abstracting water after the expiry date{{ ''s'' if pluralLicence }} included above, please send your renewal application{{ ''s'' if pluralLicence }} to us by {{ params.application_date }}.\n\nThis will ensure we have enough time to process your application{{ ''s'' if pluralLicence }} before your current licence{{ ''s'' if pluralLicence }} expire{{ ''s'' if pluralLicence == false }}.\n\n\n# How to apply to renew your licence{{ ''s'' if pluralLicence }} with different terms\n\nIf you want to change any of the terms of your current licence{{ ''s'' if pluralLicence }}, you need to submit a new licence application.\n\nThe application forms can be found on our website: https://www.gov.uk/guidance/water-management-apply-for-a-water-abstraction-or-impoundment-licence\n\n\n# How to apply to renew your licence{{ ''s'' if pluralLicence }} with exactly the same terms\n\nPlease complete this online form for each licence: [URL TBC].\n\n# How to complete your renewal form{{ ''s'' if pluralLicence }}\n\nYou must check that the following details are correct:\n\n* the licence holder''s name and contact details\n* the abstraction point, reach and area you take water from\n* what you use the water for\n* the abstraction period{{ ''s'' if pluralLicence }}\n\n\nYou must also demonstrate your need to abstract the same quantities of water as your current licence allows. To do this you need to include:\n\n* details about how you use your current abstraction quantities\n* usage information from previous years (if you have this information)\n* if you abstract water for spray irrigation, include the type and area of crops you will grow and irrigate\n\n^We cannot process your renewal application{{ ''s'' if pluralLicence }} if you do not provide all of this information.\n\n\n# How to submit your renewal form{{ ''s'' if pluralLicence }}\n\n\nWhen you submit your form, you must also include:\n\n* your £135 application fee\n* a map showing the area of land you have a right of access to, and the point, reach or area you take water from\n\nYour application form{{ ''s'' if pluralLicence }} must be signed by the correct person, as described below.  If you are:\n\n* an Individual then you need to sign the application\n* a number of individuals then you all need to sign the application\n* a Limited Liability Partnership then a partner, company director or company secretary need to sign the application\n* a Registered Company then the Company Director or Company Secretary need to sign the application\n* a Public Body (such as a local authority or NHS trust) then a person authorised to sign documents on behalf of the organisation needs to sign the application\n* a Partnership then one or more of the partners must sign the application\n* a Trust then all trustees or the chairman, treasurer or secretary must sign the application\n\n\n# What happens after you apply\n\nWe will consider your application and should be able to grant you a new licence provided that:\n\n* you submit the information and payment detailed in this notification\n* your abstraction is environmentally sustainable\n* you have justified the amount of water you need to abstract\n* you demonstrate that you are using water efficiently\n\nWe will contact you if we need any more information to process your renewal application{{ ''s'' if pluralLicence }}.\n\nYou may also receive a letter from your local area team about future changes we may need to make to ensure your abstraction is sustainable.\n\n\n# How to contact us\n\nTo discuss any changes you would like to make please call us on 0114 2898 340.\n\n\n\nYours faithfully\n\n{{ params.sender_name }}  \n{{ params.sender_role }}  \n{{ params.sender_address }}\n",
  "default": ""
  },
  "prefix": "RENEW-",
  "steps": [
      {
          "widgets": [
              {
                  "mapper": "licenceNumbers",
                  "widget": "textarea",
                  "name": "system_external_id",
                  "hint": "You can separate licence numbers using spaces, commas, or by entering them on different lines.",
                  "error_label": "licence number(s)",
                  "label": "Enter the licence number(s) you want to send a notification about",
                  "operator": "$in",
                  "validation": [
                      "array",
                      "min:1"
                  ]
              }
          ]
      }
  ],
  "formats": [
      "email",
      "letter"
  ],
  "permissions": [
      "admin:defra"
  ]
}'
WHERE task_config_id = 2;

