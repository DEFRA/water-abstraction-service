/* Replace with your SQL commands */

INSERT INTO "water"."task_config" (task_config_id, type, subtype, created, config)
VALUES(1, 'notification', 'hof-warning', NOW(), '{
    "name": "Hands off flow: levels warning",
    "title": "Send a hands off flow warning",
    "variables": [
        {
            "widget": "text",
            "name": "gauging_station",
            "default": "",
            "label": "Gauging station",
            "helptext": "The EA gauging station name",
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
            "name": "hof_threshold",
            "label": "Hands off flow threshold"
        },
        {
            "default": "",
            "widget": "text",
            "validation": [
                "string",
                "required"
            ],
            "name": "contact_details",
            "label": "Contact details"
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
        "default": "Our reference: {{ ref }}\n\nDate: {{ date }}\n\nWater Resources Act 1991\n\nDear licence holder,\n\nThis is an advance warning that you may be asked to stop or reduce your water abstraction soon.\n\n# Why you are receiving this notification\n\nYou have a ‘hands off flow’ condition in your water abstraction licence(s). That condition authorises and restricts how much water you can abstract when the flow in the relevant watercourse has fallen below a certain level.\n\n# What you need to do\n\nYou can continue to abstract water until further notice, if the conditions of your licence(s) allow it.\n\nWe will send you a notification if river levels fall further and restrictions on abstraction are applied. You must follow any instructions given in that notification.\n\n# How to contact us\n\nIf you have any questions about this notification, please contact {{ params.contact_details }}.\n\n\nYours faithfully\n{{ params.sender_name }}\n{{ params.sender_role }}\n{{ params.sender_address }}\n\n# Your hands off flow details\n\nLicence number: {% for licence in licences %} {{ licence.licenceNumber }} {% endfor %}\nGauging station: {{ params.gauging_station }}\nHands off flow threshold: {{ params.hof_threshold }}\n"
    },
    "prefix": "HOF-",
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
    ],
    "subject": "Warning: Abstraction restrictions may happen soon"
}')
ON CONFLICT (task_config_id) DO UPDATE SET modified=NOW(), config=EXCLUDED.config;




INSERT INTO "water"."task_config" (task_config_id, type, subtype, created, config)
VALUES(2, 'notification', 'renewal', NOW(), '{
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
        "default": "Our reference: {{ ref }}\n\nDate: {{ date }}\n\nDear licence holder,\n\nAll or part of the following abstraction licences will expire soon:\n\n{% for licence in licences %}\n{% for point in licence.points %}\n{{ licence.licenceNumber }} for {{ point.name }} expires on {{ licence.expiryDate }}\n{% endfor %}\n{% endfor %}\n\n# When to submit your renewal application(s)\n\nIf you want to continue abstracting water after the expiry date(s) included above, please send your renewal application(s) to us by {{ params.application_date }}.\n\nThis will ensure we have enough time to process your application(s) before your current licence(s) expire.\n\n\n# How to apply to renew your licence(s) with different terms\n\nIf you want to change any of the terms of your current licence(s), you need to submit a new licence application.\n\nThe application forms can be found on our website: https://www.gov.uk/guidance/water-management-apply-for-a-water-abstraction-or-impoundment-licence\n\n\n# How to apply to renew your licence(s) with exactly the same terms\n\nPlease complete this online form for each licence: [URL TBC].\n\nHow to complete your renewal form(s)\n\nYou must check that the following details are correct:\n\n* the licence holder''s name and contact details\n* the abstraction point, reach and area you take water from\n* what you use the water for\n* the abstraction period(s)\n\n\nYou must also demonstrate your need to abstract the same quantities of water as your current licence allows. To do this you need to include:\n\n* details about how you use your current abstraction quantities\n* usage information from previous years (if you have this information)\n* if you abstract water for spray irrigation, include the type and area of crops you will grow and irrigate\n\nWe cannot process your renewal application(s) if you do not provide all of this information.\n\n\n# How to submit your renewal form(s)\n\n\nWhen you submit your form, you must also include:\n\n* your £135 application fee\n* a map showing the area of land you have a right of access to, and the point, reach or area you take water from\n\nYour application form(s) must be signed by the correct person, as described below.  If you are:\n\n* an Individual then you need to sign the application\n* a number of individuals then you all need to sign the application\n* a Limited Liability Partnership then a partner, company director or company secretary need to sign the application\n* a Registered Company then the Company Director or Company Secretary need to sign the application\n* a Public Body (such as a local authority or NHS trust) then a person authorised to sign documents on behalf of the organisation needs to sign the application\n* a Partnership then one or more of the partners must sign the application\n* a Trust then all trustees or the chairman, treasurer or secretary must sign the application\n\n\n# What happens after you apply\n\nWe will consider your application and should be able to grant you a new licence provided that:\n\n* you submit the information and payment detailed in this notification\n* your abstraction is environmentally sustainable\n* you have justified the amount of water you need to abstract\n* you demonstrate that you are using water efficiently\n\nWe will contact you if we need any more information to process your renewal application(s).\n\nYou may also receive a letter from your local area team about future changes we may need to make to ensure your abstraction is sustainable.\n\n\n# How to contact us\n\nTo discuss any changes you would like to make please call us on 0114 2898 340.\n\n\n\nYours faithfully\n\n{{ params.sender_name }}\n{{ params.sender_role }}\n{{ params.sender_address }}\n"
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
    ],
    "subject": "Invitation to apply for a water abstraction licence renewal "
}')
ON CONFLICT (task_config_id) DO UPDATE SET modified=NOW(), config=EXCLUDED.config;





INSERT INTO "water"."task_config" (task_config_id, type, subtype, created, config)
VALUES(3, 'notification', 'hof-stop', NOW(), '{
    "name": "Hands off flow: stop or reduce abstraction",
    "title": "Send a hands off flow restriction notice",
    "variables": [
        {
            "default": "",
            "widget": "text",
            "validation": [
                "string",
                "required"
            ],
            "name": "watercourse",
            "label": "Watercourse"
        },
        {
            "widget": "text",
            "name": "gauging_station",
            "default": "",
            "label": "Gauging station",
            "helptext": "The EA gauging station name",
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
            "name": "hof_threshold",
            "label": "Flow restriction threshold"
        },
        {
            "default": "",
            "widget": "text",
            "validation": [
                "string",
                "required"
            ],
            "name": "contact_details",
            "label": "Contact details"
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
        "default": "Our reference: {{ ref }}\n\nDate: {{ date }}\n\nWater Resources Act 1991\n\nDear licence holder,\n\nWe need to enforce the hands off flow condition of your licence(s) because river levels are very low.\n\n# Why you are receiving this notification\n\nYou have a ‘hands off flow’ condition in your water abstraction licence(s). That condition authorises and restricts how much water you can abstract when the flow in the relevant watercourse has fallen below a certain level.\n\nThe effect that the condition has on your abstraction is explained in your licence(s). You must comply with this condition and you should contact us if you are not sure how your abstraction will be affected.\n\n# What happens next\n\nWe will write to you again when the watercourse level is high enough for you to abstract without the hands off flow restriction, if the other conditions of your licence(s) allow this.   \n\n# How to contact us\n\nIf you have any questions about this notification, please contact {{ params.contact_details }}.\n\n\nYours faithfully\n{{ params.sender_name }}\n{{ params.sender_role }}\n{{ params.sender_address }}\n\n\n# Your hands off flow details\n\nWatercourse: {{ params.watercourse }}\nGauging station: {{ params.gauging_station }}\nFlow restriction threshold: {{ params.hof_threshold }}\n\nEffect of restriction:\n{% for licence in licences %}\nLicence number: {{ licence.licenceNumber }}\n{% for condition in licence.conditions %}\n  {% if (condition.code == ''CES'') and (condition.subCode == ''FLOW'' or condition.subCode == ''LEV'') %}\n    {% for point in condition.points %}\n      {% for pointCondition in point.conditions %}\n{{ condition.displayTitle }}\n{{ condition.parameter1Label }}: {{ pointCondition.parameter1 }}\n{{ condition.parameter2Label }}: {{ pointCondition.parameter2 }}\n      {% endfor %}\n    {% endfor %}\n  {% endif %}\n{% endfor %}\n{% endfor %}\n"
    },
    "prefix": "HOF-",
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
    ],
    "subject": "Notice of restriction on abstraction"
}')
ON CONFLICT (task_config_id) DO UPDATE SET modified=NOW(), config=EXCLUDED.config;



INSERT INTO "water"."task_config" (task_config_id, type, subtype, created, config)
VALUES(4, 'notification', 'hof-resume', NOW(), '{
    "name": "Hands off flow: resume abstraction",
    "title": "Send a hands off flow resume notice",
    "variables": [
        {
            "mapper": "date",
            "widget": "date",
            "name": "date_of_stop",
            "default": "",
            "label": "Date of stop notice",
            "validation": [
                "string",
                "required"
            ]
        },
        {
            "widget": "text",
            "name": "gauging_station",
            "default": "",
            "label": "Gauging station",
            "helptext": "The EA gauging station name",
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
            "name": "hof_threshold",
            "label": "Flow restriction threshold"
        },
        {
            "default": "",
            "widget": "text",
            "validation": [
                "string",
                "required"
            ],
            "name": "contact_details",
            "label": "Contact details"
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
        "default": "Our reference: {{ ref }}\n\nDate: {{ date }}\n\nWater Resources Act 1991\n\nDear licence holder,\n\nYou can now start or increase your water abstraction, if the terms of your licence(s) allow this.\n\nWe notified you on {{ params.date_of_stop }} that we needed to enforce the hands off flow condition in your licence(s).\n\nWatercourse levels have now risen again, so you can start or increase your water abstraction if the conditions of your licence(s) allow it.\n\n# What happens next\n\nWe will notify you if river levels drop and we need to enforce your hands-off flow condition(s) again.\n\n# How to contact us\n\nIf you have any questions about this notification, please contact {{ params.contact_details }}.\n\n\nYours faithfully\n{{ params.sender_name }}\n{{ params.sender_role }}\n{{ params.sender_address }}\n\n\n# Your hands off flow details\n\nLicence number: {% for licence in licences %} {{ licence.licenceNumber }} {% endfor %}\nGauging station: {{ params.gauging_station }}\nHands off flow threshold: {{ params.hof_threshold }}\n"
    },
    "prefix": "HOF-",
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
    ],
    "subject": "Notice of the end of restriction on abstraction"
}')
ON CONFLICT (task_config_id) DO UPDATE SET modified=NOW(), config=EXCLUDED.config;
